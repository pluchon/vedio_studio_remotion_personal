#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把念白稿和录音对上：每一小句从哪一秒念到哪一秒，以及每一幕从哪一秒到哪一秒。

做法：稿子按标点拆成小句；每一小句的分界用动态规划在整段录音上找——
  · 分界尽量落在录音里没声音的地方（用 0.05 秒一格的能量）；
  · 每个小句的时长贴近「字数 ÷ 语速」（语速 3–5.5 字/秒之间不罚）；
  · Whisper 认得出来的字给一个弱的位置约束（它认不全，所以只当参考）。
和第十二期的做法（tools/nebula/align.py，靠停顿贴近）相比，这一版在连着念、Whisper 漏听的地方不会挤成一团。
另外 --diff 把「稿子」和「Whisper 听到的」对一遍。需要 numpy。

用法：
    node tools/attractor/whisper.mjs              # 先量一遍
    python tools/attractor/align.py [--diff]
输入：src/videos/attractor/script.json（make_script.py 从文案生成）、public/attractor/audio/voice.wav
输出：src/videos/attractor/phrases.json
"""
from __future__ import annotations

import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VOICE = ROOT / "public" / "attractor" / "audio" / "voice.wav"
ORIGINAL = ROOT / "tools" / "hanzi" / "whisper.cpp" / "attractor.wav"
WHISPER = ROOT / "tools" / "attractor" / "whisper-seg.json"
WINDOWS = ROOT / "tools" / "attractor" / "whisper-words.json"
SCRIPT = ROOT / "src" / "videos" / "attractor" / "script.json"
OUT = ROOT / "src" / "videos" / "attractor" / "phrases.json"

MARKS = "，。？！、；：——…"
STRIP = "，。？！、；：—…“”\"'（） \t\n"


def clauses_of(line: str) -> list[str]:
    out: list[str] = []
    buf = ""
    for ch in line:
        buf += ch
        if ch in "，。？！；：":
            out.append(buf)
            buf = ""
    if buf:
        out.append(buf)
    return out


def silences(path: Path) -> list[tuple[float, float]]:
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "silencedetect=noise=-38dB:d=0.16", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", err)]
    pairs = list(zip(starts, ends))
    if len(starts) > len(ends):
        pairs.append((starts[-1], 9999.0))
    return pairs


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True).stdout
    return float(out)


def plain_of(text: str) -> str:
    return "".join(c for c in text if c not in STRIP)


def heard_chars() -> list[tuple[str, float]]:
    tokens = json.loads(WHISPER.read_text(encoding="utf-8"))
    heard: list[tuple[str, float]] = []
    for tok in tokens:
        for ch in tok["text"].strip():
            if ch != "�" and ch not in STRIP:
                heard.append((ch, (tok["from"] + tok["to"]) / 2))
    return heard


def char_times(plain: str, heard: list[tuple[str, float]]) -> list[float]:
    heard_text = "".join(c for c, _ in heard)
    matcher = difflib.SequenceMatcher(None, plain, heard_text, autojunk=False)
    times: list[float | None] = [None] * len(plain)
    for a, b, size in matcher.get_matching_blocks():
        for i in range(size):
            times[a + i] = heard[b + i][1]
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


def clause_windows(plain: str, first_index: list[int]) -> list[tuple[float, float] | None]:
    """用 whisper-words.json（带简体提示、每段十几个字、带起止秒的识别结果）给每个小句找一个粗窗口。"""
    if not WINDOWS.exists():
        return [None] * len(first_index)
    segs = json.loads(WINDOWS.read_text(encoding="utf-8"))["transcription"]
    heard = ""
    owner: list[tuple[float, float]] = []
    for sg in segs:
        t = plain_of(sg["text"])
        a, b = sg["offsets"]["from"] / 1000, sg["offsets"]["to"] / 1000
        heard += t
        owner += [(a, b)] * len(t)
    m = difflib.SequenceMatcher(None, plain, heard, autojunk=False)
    mapped: dict[int, int] = {}
    for a, b, size in m.get_matching_blocks():
        for i in range(size):
            mapped[a + i] = b + i
    out: list[tuple[float, float] | None] = []
    for fi in first_index:
        hits = [owner[mapped[i]] for i in range(fi, fi + 4) if i in mapped]
        out.append(hits[0] if len(hits) >= 2 else None)
    return out


def report_diff(plain: str, heard: list[tuple[str, float]]) -> None:
    heard_text = "".join(c for c, _ in heard)
    m = difflib.SequenceMatcher(None, plain, heard_text, autojunk=False)
    print(f"稿子 {len(plain)} 字，听到 {len(heard_text)} 字，相似度 {m.ratio():.3f}")
    for tag, a0, a1, b0, b1 in m.get_opcodes():
        if tag == "equal":
            continue
        t = heard[b0][1] if b0 < len(heard) else heard[-1][1]
        print(f"  {t:7.1f}s  {tag:7s} 稿：「{plain[max(0, a0 - 4):a0]}[{plain[a0:a1]}]{plain[a1:a1 + 4]}」  听：「{heard_text[b0:b1]}」")


STEP = 0.05  # 秒，能量的格子

# 结尾几句念得很轻、很快，能量图上的几个气口和字数对不上，动态规划会把它们挤歪。
# 这几句的起止是对着能量图（每个气口、每段有声的时长）手工定的，单位秒（念白时间）：
OVERRIDES = {
    "安稳地前行。": (375.65, 376.40),
    "在这样的尺度面前，": (377.50, 378.75),
    "没有什么需要你操心。": (379.20, 380.45),
    "不管前方由谁牵引，": (381.35, 382.75),
    "身后由谁推动，": (383.35, 384.45),
    "在漫长而宁静的旅途里，": (385.25, 386.85),
    "今夜都会平稳地过去。": (387.45, 388.95),
    "睡吧。": (389.60, 389.88),
    "晚安。": (389.95, 390.35),
}


def energy_grid(path: Path) -> "np.ndarray":
    """每 STEP 秒一格的能量，归一到 0（静）–1（念）；用没处理过的原声，底噪低，停顿分得清。"""
    import numpy as np

    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    hop = int(16000 * STEP)
    win = hop * 2
    n = len(x) // hop - 1
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * hop : i * hop + win] ** 2)) + 1e-9) for i in range(n)])
    return np.clip((db + 46.0) / 18.0, 0.0, 1.0)  # -46 dB 以下算静，-28 dB 以上算念


def find_gaps(energy: "np.ndarray", t0: float, t1: float) -> list[tuple[float, float]]:
    """录音里所有的间隙：能量低于 0.5 且不短于 0.1 秒。返回 (起, 止) 秒。"""
    gaps: list[tuple[float, float]] = []
    start = None
    for i, e in enumerate(energy):
        quiet = e < 0.5
        if quiet and start is None:
            start = i
        if not quiet and start is not None:
            if (i - start) * STEP >= 0.1:
                gaps.append((start * STEP, i * STEP))
            start = None
    return [(a, b) for a, b in gaps if a >= t0 - 0.2 and b <= t1 + 0.4]


def solve(chars: list[int], gaps: list[tuple[float, float]], t0: float, t1: float, windows: list[tuple[float, float] | None]) -> list[tuple[float, float]]:
    """给 N 个小句找 N+1 道分界，每道分界是一个间隙（或开头、结尾）。返回每个小句 (开口, 收声)。

    代价：小句的字数 ÷ 它占的时长，在 3–7 字/秒之间不罚；一个小句里跨过一个不短的停顿（≥0.3 秒）要罚；
    在短间隙（0.1–0.3 秒，通常是句内的换气）处切开，比在长停顿处切开多罚一点。
    windows 是语音识别给的粗位置（每个小句开口大概落在哪一段，几秒的宽度）：开口落到窗口外太远要罚，免得整体漂移。
    """
    import numpy as np

    n = len(chars)
    # 候选分界：开头（把 t0 当成一个零长间隙）、所有间隙、结尾
    cand = [(t0 - 0.01, t0)] + gaps + [(t1, t1 + 0.01)]
    m = len(cand)
    length = np.array([b - a for a, b in cand])
    big = 1e9
    # 累计「跨过的长停顿」：从候选 i 的止点到候选 j 的起点之间，所有长度 ≥0.3 的间隙的总长（i、j 自己不算）
    long_gap = np.where(length >= 0.3, length, 0.0)
    cum = np.concatenate([[0.0], np.cumsum(long_gap)])
    cut_cost = np.where(length >= 0.3, 0.0, np.where(length >= 0.18, 1.2, 2.4))
    cut_cost[0] = 0.0
    cut_cost[-1] = 0.0
    D = np.full((n + 1, m), big)
    back = np.zeros((n + 1, m), dtype=np.int32)
    D[0, 0] = 0.0
    window = 70  # 一个小句最多往后看 70 个候选
    for k in range(1, n + 1):
        c = chars[k - 1]
        win = windows[k - 1]
        for j in range(1, m):
            lo = max(0, j - window)
            best = big
            arg = 0
            for i in range(lo, j):
                if D[k - 1, i] >= big:
                    continue
                dur = cand[j][0] - cand[i][1]
                if dur <= 0.15:
                    continue
                rate = c / dur
                pen = 0.0
                if rate < 2.6:
                    pen = 8.0 * np.log(2.6 / rate) ** 2
                elif rate < 3.0:
                    pen = 2.0 * np.log(3.0 / rate) ** 2
                elif rate > 7.0:
                    pen = 14.0 * np.log(rate / 7.0) ** 2
                crossed = cum[j] - cum[i + 1]
                total = D[k - 1, i] + pen + 2.0 * crossed + cut_cost[j]
                if win is not None:
                    start = cand[i][1]
                    outside = max(0.0, (win[0] - 2.0) - start, start - (win[1] + 1.0))
                    total += 4.0 * outside
                if total < best:
                    best = total
                    arg = i
            D[k, j] = best
            back[k, j] = arg
    j = m - 1
    seq = [j]
    for k in range(n, 0, -1):
        j = int(back[k, j])
        seq.append(j)
    seq.reverse()
    out = []
    for k in range(n):
        out.append((cand[seq[k]][1], cand[seq[k + 1]][0]))
    return out


def main() -> None:
    import numpy as np

    data = json.loads(SCRIPT.read_text(encoding="utf-8"))
    clauses: list[tuple[str, str]] = []  # (幕 id, 小句)
    for sec in data["sections"]:
        for line in sec["lines"]:
            for c in clauses_of(line):
                clauses.append((sec["id"], c))
    full = "".join(c for _, c in clauses)
    plain = plain_of(full)
    heard = heard_chars()
    if "--diff" in sys.argv:
        report_diff(plain, heard)
        return

    total = duration(VOICE)
    energy = energy_grid(ORIGINAL)
    voiced = np.nonzero(energy > 0.5)[0]
    t0 = max(0.0, voiced[0] * STEP - 0.05)
    t1 = min(total, voiced[-1] * STEP + 0.2)
    gaps = find_gaps(energy, t0, t1)
    chars = [max(1, len(plain_of(c))) for _, c in clauses]
    first_index: list[int] = []
    n = 0
    for _, c in clauses:
        first_index.append(n)
        n += len(plain_of(c))
    spans = solve(chars, gaps, t0, t1, clause_windows(plain, first_index))
    phrases = []
    for (sid, c), (s, e) in zip(clauses, spans):
        if c in OVERRIDES:
            s, e = OVERRIDES[c]
        phrases.append({"start": round(s, 2), "end": round(e, 2), "text": c, "section": sid})
    sections = []
    for sec in data["sections"]:
        mine = [p for p in phrases if p["section"] == sec["id"]]
        sections.append({"id": sec["id"], "start": mine[0]["start"], "end": mine[-1]["end"]})
    OUT.write_text(json.dumps({"duration": round(total, 2), "sections": sections, "phrases": phrases}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(phrases)} 小句，{len(plain)} 字，录音 {total:.1f} 秒 -> {OUT}")
    for s in sections:
        print(f"  {s['id']:9s} {s['start']:7.2f} – {s['end']:7.2f}  ({s['end'] - s['start']:.1f} s)")


if __name__ == "__main__":
    main()
