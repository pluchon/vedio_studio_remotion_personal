"""把 ElevenLabs 念白（tools/common/tts.py 的输出）接到《巨引源》已有的画面上，写出 src/videos/attractor/narration.json。

    python tools/attractor/tts_timing.py [refer/巨引源/tts]

画面的动画按「设计时间」写，当初是对着朋友录的念白调的：每一句在旧念白里从第几秒开始（phrases-friend.json，
align.py 量的），经过旧的分幕映射就得到它在设计时间里的位置。新念白里同一句从第几秒开始，tts.py 的 timing.json 直接给出。
两者配成一对，就是一个「设计时间 ↔ 放映时间」的节点；每句一个节点，画面就跟着新念白逐句对上，幕里的代码不用改。

字幕还要更细的小句（逗号处）：旧数据里每句是怎么拆成小句的已知，新念白里小句的分界从波形里找——
在这句的范围内找静音段，按字数比例估一个位置，挑最近的静音；找不到就按字数比例切。
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src" / "videos" / "attractor"
OLD = ROOT / "tools" / "attractor" / "phrases-friend.json"
OUT = SRC / "narration.json"
SR = 16000

# 旧版 theme.ts 的常量（朋友的念白）：片名 LEAD 秒、片尾 TAIL 秒，设计时间里每一幕的起点
LEAD, OLD_TAIL, DESIGN_END = 5.5, 7.8, 428.5
SCENE_START = {"cmb": 48, "leaves": 98, "paper": 140, "zone": 186, "norma": 232, "laniakea": 282, "pushpull": 330, "maybe": 372, "night": 410}
ORDER = ["sky", "cmb", "leaves", "paper", "zone", "norma", "laniakea", "pushpull", "maybe", "night"]


def piecewise(x: float, xs: list[float], ys: list[float]) -> float:
    i = 1
    while i < len(xs) - 1 and x > xs[i]:
        i += 1
    return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1])


def old_to_design(old: dict) -> callable:
    starts = {s["id"]: s["start"] for s in old["sections"]}
    real = [0.0] + [LEAD + starts[k] for k in ORDER[1:]] + [LEAD + old["duration"] + OLD_TAIL]
    design = [0.0] + [float(SCENE_START[k]) for k in ORDER[1:]] + [DESIGN_END]
    return lambda t: piecewise(t, real, design)


def envelope(x: np.ndarray) -> np.ndarray:
    win = int(0.01 * SR)
    n = len(x) // win
    return 20 * np.log10(np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(axis=1)) + 1e-9)


def gaps_in(env: np.ndarray, a: float, b: float, min_len: float = 0.12, thr: float = -42.0) -> list[tuple[float, float]]:
    # [a, b] 秒内的静音段（起、止秒）
    out, run = [], 0
    i0, i1 = int(a * 100), min(len(env), int(b * 100))
    for i in range(i0, i1):
        if env[i] <= thr:
            run += 1
        else:
            if run * 0.01 >= min_len and i - run > i0:
                out.append(((i - run) / 100, i / 100))
            run = 0
    return out


def split_line(pieces: list[str], start: float, end: float, env: np.ndarray) -> list[tuple[float, float]]:
    # 一句里各小句的起止：分界放在离「按字数估的位置」最近的静音上，静音不够就按字数切
    if len(pieces) == 1:
        return [(start, end)]
    total = sum(len(p) for p in pieces)
    gaps = gaps_in(env, start, end)
    bounds: list[tuple[float, float]] = []
    run = 0
    lo = start
    for p in pieces[:-1]:
        run += len(p)
        guess = start + (end - start) * run / total
        cands = [g for g in gaps if g[0] > lo + 0.2 and g[1] < end - 0.2]
        if cands:
            g = min(cands, key=lambda g: abs((g[0] + g[1]) / 2 - guess))
            if abs((g[0] + g[1]) / 2 - guess) < 1.2:
                bounds.append(g)
                lo = g[1]
                gaps = [x for x in gaps if x[0] >= g[1]]
                continue
        bounds.append((guess, guess))
        lo = guess
    times, s = [], start
    for g in bounds:
        times.append((s, g[0]))
        s = g[1]
    times.append((s, end))
    return times


def main() -> None:
    tts_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "refer" / "巨引源" / "tts"
    new = json.loads((tts_dir / "timing.json").read_text(encoding="utf-8"))
    old = json.loads(OLD.read_text(encoding="utf-8"))
    to_design = old_to_design(old)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(tts_dir / "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    env = envelope(np.frombuffer(raw, np.float32))

    old_phrases = old["phrases"]
    k = 0
    phrases, lines, knots = [], [], [[0.0, 0.0]]
    for sec in new["sections"]:
        for line in sec["lines"]:
            # 旧数据里这一句由哪几个小句组成
            pieces, acc = [], ""
            while len(acc) < len(line["text"]):
                pieces.append(old_phrases[k])
                acc += old_phrases[k]["text"]
                k += 1
            assert acc == line["text"], (acc, line["text"])
            knots.append([round(to_design(LEAD + pieces[0]["start"]), 3), round(LEAD + line["start"], 3)])
            lines.append({"start": line["start"], "end": line["end"]})
            for p, (a, b) in zip(pieces, split_line([p["text"] for p in pieces], line["start"], line["end"], env)):
                phrases.append({"start": round(a, 3), "end": round(b, 3), "text": p["text"], "section": sec["id"]})
    assert k == len(old_phrases)
    data = {
        "duration": new["duration"],
        "sections": [{"id": s["id"], "start": s["start"], "end": s["end"]} for s in new["sections"]],
        "knots": knots,
        "lines": lines,
        "phrases": phrases,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    d = np.diff(np.array(knots), axis=0)
    ratio = d[:, 0] / d[:, 1]
    print(f"{len(phrases)} 个小句，{len(knots)} 个节点，念白 {new['duration']} 秒 -> {OUT}")
    print(f"设计时间 / 放映时间 的比例：{ratio.min():.2f} – {ratio.max():.2f}（中位 {np.median(ratio):.2f}）")


if __name__ == "__main__":
    main()
