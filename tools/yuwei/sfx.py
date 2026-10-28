"""《雨未愁眠》音效轨：纸张、贴纸拍上、关门、远喇叭、台灯开关。雨声在 prepare.py 里另铺。

    ~/.venvs/demucs/Scripts/python.exe tools/yuwei/sfx.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
ROOT = Path(__file__).resolve().parents[2]
PHRASES = ROOT / "src" / "videos" / "yuwei" / "phrases.json"
OUT = ROOT / "public" / "yuwei" / "audio" / "sfx.wav"

LEAD = 2.8
TAIL = 6.0
rng = np.random.default_rng(20261027)


def db(x: float) -> float:
    return 10 ** (x / 20)


def tt(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def env(dur: float, a: float, r: float, shape: float = 1.4) -> np.ndarray:
    t = tt(dur)
    e = np.minimum(1, t / max(a, 1e-4)) * np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return (e**shape).astype(np.float32)


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n).astype(np.float32)


def band(x: np.ndarray, lo: float, hi: float, soft: float = 0.3) -> np.ndarray:
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X = np.fft.rfft(x)
    lf = np.log2(np.maximum(f, 1.0))
    m = np.clip((lf - np.log2(lo)) / soft + 0.5, 0, 1) * np.clip((np.log2(hi) - lf) / soft + 0.5, 0, 1)
    return np.fft.irfft(X * m, n).astype(np.float32)


def place(buf: np.ndarray, sig: np.ndarray, t0: float, pan: float = 0.0, gain: float = 1.0) -> None:
    i0 = int(t0 * SR)
    if i0 >= len(buf):
        return
    n = min(len(sig), len(buf) - i0)
    gL = gain * (1 - pan) * 0.5 * np.sqrt(2)
    gR = gain * (1 + pan) * 0.5 * np.sqrt(2)
    buf[i0 : i0 + n, 0] += sig[:n] * gL
    buf[i0 : i0 + n, 1] += sig[:n] * gR


def paper(dur: float = 0.42) -> np.ndarray:
    x = band(noise(int(dur * SR)), 180, 4200, 0.4) * env(dur, 0.008, 0.28, 2.2)
    return x * 0.9


def slap() -> np.ndarray:
    dur = 0.18
    click = band(noise(int(dur * SR)), 400, 2800, 0.25) * env(dur, 0.002, 0.09, 2.8)
    thump = np.sin(2 * np.pi * 92 * tt(dur)).astype(np.float32) * env(dur, 0.001, 0.11, 2.0)
    return click * 0.7 + thump * 0.35


def door() -> np.ndarray:
    dur = 0.55
    wood = band(noise(int(dur * SR)), 80, 900, 0.35) * env(dur, 0.004, 0.22, 2.4)
    latch = band(noise(int(0.08 * SR)), 2000, 7000, 0.2) * env(0.08, 0.001, 0.05, 2.0)
    out = wood * 0.85
    out[: len(latch)] += latch * 0.4
    return out


def horn() -> np.ndarray:
    dur = 0.62
    t = tt(dur)
    a = np.sin(2 * np.pi * 392 * t)
    b = np.sin(2 * np.pi * 494 * t)
    tone = ((a + 0.7 * b) * env(dur, 0.03, 0.18, 1.3)).astype(np.float32)
    tone = band(tone, 280, 1800, 0.4)
    return tone * 0.55


def click() -> np.ndarray:
    dur = 0.12
    x = band(noise(int(dur * SR)), 1200, 8000, 0.2) * env(dur, 0.001, 0.04, 3.0)
    return x * 0.8


def main() -> None:
    data = json.loads(PHRASES.read_text(encoding="utf-8"))
    total = LEAD + float(data["duration"]) + TAIL
    buf = np.zeros((int(total * SR) + SR, 2), np.float32)
    phrases = data["phrases"]
    sections = {s["id"]: s for s in data["sections"]}

    def T(sec: float) -> float:
        return LEAD + sec

    # 镜头走到新一叠海报时，纸轻轻响一下
    for sid, pan in [("window", -0.2), ("sound", 0.15), ("light", -0.1), ("refuge", 0.2), ("permit", -0.15), ("tempo", 0.1), ("truth", 0.0), ("close", -0.05)]:
        place(buf, paper(0.5), T(sections[sid]["start"]) - 0.35, pan=pan, gain=db(-16))

    # 贴纸拍上：白噪音卡、毯子、日历、晚安
    for text, g, pan in [
        ("很多人说，", db(-14), -0.3),
        ("其实不是。", db(-15), 0.25),
        ("像一层毯子。", db(-13), 0.1),
        ("一声关门，", db(-11), -0.4),
        ("一声喇叭。", db(-12), 0.45),
        ("计划取消了。", db(-14), 0.2),
        ("晚安。", db(-15), 0.0),
    ]:
        hit = next((p for p in phrases if p["text"].startswith(text[:4])), None)
        if hit:
            place(buf, slap(), T(hit["start"]) - 0.04, pan=pan, gain=g)

    door_p = next((p for p in phrases if "关门" in p["text"]), None)
    horn_p = next((p for p in phrases if "喇叭" in p["text"]), None)
    if door_p:
        place(buf, door(), T(door_p["start"]) + 0.08, pan=-0.55, gain=db(-10))
    if horn_p:
        place(buf, horn(), T(horn_p["start"]) + 0.12, pan=0.6, gain=db(-13))

    night = next((p for p in phrases if p["text"].startswith("晚安")), None)
    if night:
        place(buf, click(), T(night["start"]) + 0.55, pan=0.0, gain=db(-9))

    peak = float(np.max(np.abs(buf))) + 1e-9
    buf *= min(1.0, 0.35 / peak)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sf.write(OUT, buf, SR)
    print(OUT, f"{total:.1f}s")


if __name__ == "__main__":
    main()
