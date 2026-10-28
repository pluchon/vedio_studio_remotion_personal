#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把《雨未愁眠》念白稿和录音对上。做法同 tools/attractor/align.py：
稿子按标点拆小句，分界落在能量图的间隙上，时长贴近字数÷语速。
这一期录音短、气口清楚，不跑 Whisper。

    ~/.venvs/demucs/Scripts/python.exe tools/yuwei/align.py

输入：src/videos/yuwei/script.json、refer/雨未愁眠/雨未愁眠_念稿.mp3
输出：src/videos/yuwei/phrases.json
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ORIGINAL = ROOT / "refer" / "雨未愁眠" / "雨未愁眠_念稿.mp3"
SCRIPT = ROOT / "src" / "videos" / "yuwei" / "script.json"
OUT = ROOT / "src" / "videos" / "yuwei" / "phrases.json"

MARKS = "，。？！、；：——…"
STRIP = "，。？！、；：—…“”\"'（） \t\n"
STEP = 0.05


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


def plain_of(text: str) -> str:
    return "".join(c for c in text if c not in STRIP)


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return float(out.strip())


def energy_grid(path: Path):
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    hop = int(16000 * STEP)
    win = hop * 2
    n = len(x) // hop - 1
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * hop : i * hop + win] ** 2)) + 1e-9) for i in range(n)])
    return np.clip((db + 46.0) / 18.0, 0.0, 1.0)


def find_gaps(energy, t0: float, t1: float) -> list[tuple[float, float]]:
    gaps: list[tuple[float, float]] = []
    start = None
    for i, e in enumerate(energy):
        quiet = e < 0.48
        if quiet and start is None:
            start = i
        if not quiet and start is not None:
            if (i - start) * STEP >= 0.1:
                gaps.append((start * STEP, i * STEP))
            start = None
    if start is not None and (len(energy) - start) * STEP >= 0.1:
        gaps.append((start * STEP, len(energy) * STEP))
    return [(a, b) for a, b in gaps if a >= t0 - 0.2 and b <= t1 + 0.5]


def solve(chars: list[int], gaps: list[tuple[float, float]], t0: float, t1: float) -> list[tuple[float, float]]:
    import numpy as np

    n = len(chars)
    cand = [(t0 - 0.01, t0)] + gaps + [(t1, t1 + 0.01)]
    m = len(cand)
    length = np.array([b - a for a, b in cand])
    big = 1e9
    long_gap = np.where(length >= 0.28, length, 0.0)
    cum = np.concatenate([[0.0], np.cumsum(long_gap)])
    cut_cost = np.where(length >= 0.28, 0.0, np.where(length >= 0.16, 1.1, 2.2))
    cut_cost[0] = 0.0
    cut_cost[-1] = 0.0
    D = np.full((n + 1, m), big)
    back = np.zeros((n + 1, m), dtype=np.int32)
    D[0, 0] = 0.0
    window = 80
    for k in range(1, n + 1):
        c = chars[k - 1]
        for j in range(1, m):
            lo = max(0, j - window)
            best = big
            arg = 0
            for i in range(lo, j):
                if D[k - 1, i] >= big:
                    continue
                dur = cand[j][0] - cand[i][1]
                if dur <= 0.12:
                    continue
                rate = c / dur
                pen = 0.0
                if rate < 2.2:
                    pen = 9.0 * np.log(2.2 / rate) ** 2
                elif rate < 2.8:
                    pen = 2.2 * np.log(2.8 / rate) ** 2
                elif rate > 6.5:
                    pen = 12.0 * np.log(rate / 6.5) ** 2
                crossed = cum[j] - cum[i + 1]
                total = D[k - 1, i] + pen + 2.2 * crossed + cut_cost[j]
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
    return [(cand[seq[k]][1], cand[seq[k + 1]][0]) for k in range(n)]


def main() -> None:
    import numpy as np

    data = json.loads(SCRIPT.read_text(encoding="utf-8"))
    clauses: list[tuple[str, str]] = []
    for sec in data["sections"]:
        for line in sec["lines"]:
            for c in clauses_of(line):
                clauses.append((sec["id"], c))
    total = duration(ORIGINAL)
    energy = energy_grid(ORIGINAL)
    voiced = np.nonzero(energy > 0.5)[0]
    t0 = max(0.0, voiced[0] * STEP - 0.04)
    t1 = min(total, voiced[-1] * STEP + 0.18)
    gaps = find_gaps(energy, t0, t1)
    chars = [max(1, len(plain_of(c))) for _, c in clauses]
    spans = solve(chars, gaps, t0, t1)
    phrases = []
    for (sid, c), (s, e) in zip(clauses, spans):
        phrases.append({"start": round(float(s), 2), "end": round(float(e), 2), "text": c, "section": sid})
    sections = []
    for sec in data["sections"]:
        mine = [p for p in phrases if p["section"] == sec["id"]]
        sections.append({"id": sec["id"], "start": mine[0]["start"], "end": mine[-1]["end"]})
    OUT.write_text(
        json.dumps({"duration": round(total, 2), "sections": sections, "phrases": phrases}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    print(f"{len(phrases)} 小句，录音 {total:.1f} 秒 -> {OUT}")
    for s in sections:
        print(f"  {s['id']:8s} {s['start']:7.2f} – {s['end']:7.2f}  ({s['end'] - s['start']:.1f} s)")
    for p in phrases:
        print(f"    {p['start']:6.2f}-{p['end']:6.2f}  {p['text']}")


if __name__ == "__main__":
    main()
