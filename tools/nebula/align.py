#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把朗读稿和录音对上：每一小句从哪一秒念到哪一秒。

做法：
1. 稿子按逗号、句号拆成小句；
2. Whisper 的逐字时间不准，但认得出来的字能给每个小句一个大概的位置（tools/nebula/whisper-seg.json）；
3. 用 ffmpeg 的 silencedetect 量出录音里所有的停顿；
4. 每个小句之间的分界，贴到离大概位置最近的停顿中间，没有停顿的地方（连着念的）就用大概位置。

用法：python tools/nebula/align.py
输出：src/videos/nebula/script.json
"""
from __future__ import annotations

import difflib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VOICE = ROOT / "public" / "nebula" / "audio" / "voice.wav"
WHISPER = ROOT / "tools" / "nebula" / "whisper-seg.json"
DRAFT = ROOT / "tools" / "nebula" / "script.md"
OUT = ROOT / "src" / "videos" / "nebula" / "script.json"

# 转写软件把「46亿年」写成了阿拉伯数字串，字幕里按录音里念的写
FIXES = {"4600000000年": "46亿年"}

MARKS = "，。？！、"


def read_text() -> str:
    """取校对稿里横线以上、标题以外的段落；去掉 ⚠ 记号和括号里的说明，几个要照字幕写的地方在这里换掉。"""
    parts: list[str] = []
    started = False
    for line in DRAFT.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("## "):
            started = True
        if line == "---":
            break
        if not started:
            continue
        if not line or line.startswith("#") or line.startswith(">"):
            continue
        parts.append(line)
    text = "".join(parts)
    text = re.sub(r"（[^）]*）", "", text)
    text = text.replace("NGC⚠223", "NGC 224").replace("⚠", "")
    return text.replace(",", "，").replace("?", "？")


def split_clauses(text: str) -> list[str]:
    """按标点拆成小句，标点留在句尾。"""
    out: list[str] = []
    buf = ""
    for ch in text:
        buf += ch
        if ch in MARKS:
            out.append(buf)
            buf = ""
    if buf:
        out.append(buf)
    return out


def silences(path: Path) -> list[tuple[float, float]]:
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "silencedetect=noise=-36dB:d=0.16", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", err)]
    pairs = list(zip(starts, ends))
    # 末尾没有结束的静音：用整段时长补上
    if len(starts) > len(ends):
        pairs.append((starts[-1], 9999.0))
    return pairs


def speech_end(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True,
    ).stdout
    return float(out)


def char_times(text_chars: str) -> list[float | None]:
    """用 Whisper 里认得出来的字，给稿子里的每个字一个大概的时刻。"""
    tokens = json.loads(WHISPER.read_text(encoding="utf-8"))
    heard: list[tuple[str, float]] = []
    for tok in tokens:
        t = tok["text"].strip()
        for ch in t:
            if ch != "�" and ch.strip():
                heard.append((ch, (tok["from"] + tok["to"]) / 2))
    heard_text = "".join(c for c, _ in heard)
    matcher = difflib.SequenceMatcher(None, text_chars, heard_text, autojunk=False)
    times: list[float | None] = [None] * len(text_chars)
    for a, b, size in matcher.get_matching_blocks():
        for i in range(size):
            times[a + i] = heard[b + i][1]
    # 没对上的字：前后已知的时刻之间线性补
    known = [i for i, t in enumerate(times) if t is not None]
    for i in range(len(times)):
        if times[i] is not None:
            continue
        before = max((k for k in known if k < i), default=None)
        after = min((k for k in known if k > i), default=None)
        if before is None:
            times[i] = times[after]
        elif after is None:
            times[i] = times[before]
        else:
            r = (i - before) / (after - before)
            times[i] = times[before] + r * (times[after] - times[before])
    return times  # type: ignore[return-value]


def main() -> None:
    text = read_text()
    clauses = split_clauses(text)
    # 不含标点的字，用来对 Whisper
    plain = "".join(c for c in text if c not in MARKS)
    times = char_times(plain)
    total = speech_end(VOICE)

    pauses = [(s, e) for s, e in silences(VOICE) if e < 9000]
    # 开头和结尾的静音不当分界
    lead = pauses[0][1] if pauses and pauses[0][0] < 0.05 else 0.0

    # 每个小句的第一个字在 plain 里的下标
    first_index: list[int] = []
    n = 0
    for c in clauses:
        first_index.append(n)
        n += sum(1 for ch in c if ch not in MARKS)

    # 小句 k 开口的大概时刻：它第一个字的时刻往前挪 0.12 秒
    guess = [max(lead, times[i] - 0.12) for i in first_index]
    guess[0] = lead

    starts: list[float] = []
    ends: list[float] = []
    prev = 0.0
    for k, g in enumerate(guess):
        if k == 0:
            starts.append(lead)
            continue
        # 找离大概位置最近、且在上一个分界之后的停顿
        best = None
        for s, e in pauses:
            if s <= prev + 0.3:
                continue
            centre = (s + e) / 2
            dist = abs(centre - g)
            if dist < 0.9 and (best is None or dist - (e - s) * 0.4 < best[0]):
                best = (dist - (e - s) * 0.4, s, e)
        if best:
            _, s, e = best
            ends.append(s)
            starts.append(e)
            prev = e
        else:
            ends.append(g)
            starts.append(g)
            prev = g
    ends.append(total - 0.5)
    # 最后一句的结尾：找最后一个停顿的开始
    tail = [s for s, e in silences(VOICE) if e > 9000]
    if tail:
        ends[-1] = tail[0]

    phrases = []
    for c, s, e in zip(clauses, starts, ends):
        phrases.append({"start": round(s, 2), "end": round(max(e, s + 0.2), 2), "text": c})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"duration": round(total, 2), "phrases": phrases}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(phrases)} 小句，{len(plain)} 字，录音 {total:.1f} 秒 -> {OUT}")
    for p in phrases:
        print(f"{p['start']:7.2f} {p['end']:7.2f}  {p['text']}")


if __name__ == "__main__":
    main()
