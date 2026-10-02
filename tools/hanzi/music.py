"""《汉字的演变》的配乐：垫在念白底下的一层低长音，只在句子之间的空当里拨几下弦，不和人声抢

用法：python tools/hanzi/music.py
纯 Python 实现，不依赖 numpy；需要 PATH 上有 ffmpeg。输出 public/hanzi/audio/bgm.wav
"""
from __future__ import annotations

import math
import os
import random
import subprocess
import tempfile
import wave
from array import array

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "hanzi", "audio", "bgm.wav")
# 和 src/videos/hanzi/theme.ts 一致：念白前 1.5 秒，念白 82.7 秒，结尾 4 秒
LEAD = 1.5
DURATION = LEAD + 82.7 + 4.0

SR = 44100
N = int(SR * DURATION)
random.seed(20261002)
left = array("d", bytes(8 * N))
right = array("d", bytes(8 * N))


def midi_freq(m: int) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def pluck(start: float, midi: int, vel: float, pan: float, length: float = 5.0) -> None:
    """Karplus-Strong 拨弦，激励多平滑几次，音色发暗，近似古琴"""
    period = max(2, int(round(SR / midi_freq(midi))))
    buf = [random.uniform(-1, 1) for _ in range(period)]
    for _ in range(4):
        buf = [(buf[i] + buf[i - 1]) * 0.5 for i in range(period)]
    n = int(length * SR)
    s0 = int(start * SR)
    gl = vel * (1 - pan) * 0.5
    gr = vel * (1 + pan) * 0.5
    idx = 0
    prev = 0.0
    for k in range(n):
        pos = s0 + k
        if pos >= N:
            break
        cur = buf[idx]
        buf[idx] = (cur + prev) * 0.5 * 0.9975
        prev = cur
        idx += 1
        if idx == period:
            idx = 0
        tail = 1.0 if k < n - int(0.5 * SR) else (n - k) / (0.5 * SR)
        left[pos] += cur * tail * gl
        right[pos] += cur * tail * gr


def drone(start: float, length: float, midis: list[int], gain: float) -> None:
    """低长音：几条正弦慢起慢收，各自带一点很慢的起伏"""
    s0 = int(start * SR)
    n = int(length * SR)
    attack = int(3.0 * SR)
    release = int(3.5 * SR)
    for vi, m in enumerate(midis):
        w = 2 * math.pi * midi_freq(m) / SR
        beat = 2 * math.pi * (0.07 + 0.03 * vi) / SR
        phase = random.uniform(0, 6.28)
        pan = (vi / max(1, len(midis) - 1) - 0.5) * 0.5
        for k in range(n):
            pos = s0 + k
            if pos >= N:
                break
            env = min(1.0, k / attack, (n - k) / release)
            v = (math.sin(w * k + phase) + 0.12 * math.sin(2 * w * k)) * env * (0.8 + 0.2 * math.sin(beat * k + phase))
            left[pos] += v * gain * (1 - pan) * 0.5
            right[pos] += v * gain * (1 + pan) * 0.5


# 低长音：每一段对应片子里的一个段落，段与段叠着换
SECTIONS = [
    (0.0, 25.5, [38, 45, 50]),  # 象形：D
    (24.0, 13.5, [35, 42, 50]),  # 会意：B 小调
    (36.0, 14.5, [43, 50, 55]),  # 金文、小篆：G
    (49.0, 14.5, [33, 40, 52]),  # 隶变：A
    (62.0, DURATION - 62.0, [38, 45, 50, 57]),  # 楷书和结尾：回到 D
]
for start, length, midis in SECTIONS:
    drone(start, length, midis, 0.05)

# 拨弦：都落在念白的空当里（念白里的秒数），D 宫五声
PLUCKS = [
    (-1.1, 62, 0.30), (-0.5, 69, 0.22),
    (5.45, 74, 0.26), (9.45, 66, 0.24), (10.2, 69, 0.28),
    (14.3, 64, 0.24), (19.6, 62, 0.26), (20.1, 57, 0.2),
    (23.9, 66, 0.26),
    (28.9, 59, 0.24), (29.4, 66, 0.2), (35.3, 62, 0.26), (35.8, 71, 0.22),
    (40.6, 67, 0.26), (44.05, 62, 0.22), (47.5, 71, 0.26), (48.2, 67, 0.22),
    (51.95, 64, 0.2), (61.25, 57, 0.26), (61.8, 64, 0.2),
    (67.45, 62, 0.28), (68.2, 69, 0.24),
    (71.85, 66, 0.24), (72.5, 62, 0.2),
    (74.95, 69, 0.2),
    (81.0, 62, 0.3), (81.35, 66, 0.26), (81.7, 69, 0.26), (82.1, 74, 0.3),
]
for at, midi, vel in PLUCKS:
    pluck(LEAD + at, midi, vel, random.uniform(-0.35, 0.35))

peak = max(max(abs(v) for v in left), max(abs(v) for v in right))
scale = 0.8 / peak


def write_wav(path: str, chans: list[array], sr: int) -> None:
    with wave.open(path, "wb") as w:
        w.setnchannels(len(chans))
        w.setsampwidth(2)
        w.setframerate(sr)
        n = len(chans[0])
        k = len(chans)
        pcm = array("h", bytes(2 * n * k))
        for j, c in enumerate(chans):
            for i in range(n):
                v = int(c[i] * scale * 32767)
                pcm[i * k + j] = 32767 if v > 32767 else (-32767 if v < -32767 else v)
        w.writeframes(pcm.tobytes())


# 混响脉冲响应：指数衰减的噪声，三秒
ir_len = int(3.0 * SR)
ir_l = array("d", (random.gauss(0, 1) * math.exp(-5.0 * i / ir_len) for i in range(ir_len)))
ir_r = array("d", (random.gauss(0, 1) * math.exp(-5.0 * i / ir_len) for i in range(ir_len)))
ir_peak = max(max(abs(v) for v in ir_l), max(abs(v) for v in ir_r))
for i in range(ir_len):
    ir_l[i] /= ir_peak * scale
    ir_r[i] /= ir_peak * scale

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    dry = os.path.join(tmp, "dry.wav")
    ir = os.path.join(tmp, "ir.wav")
    write_wav(dry, [left, right], SR)
    write_wav(ir, [ir_l, ir_r], SR)
    # 卷积混响，切掉极低和偏高的频段（给人声让路），响度压到 -27 LUFS，首尾淡入淡出
    chain = (
        "afir=dry=8:wet=5,highpass=f=40,lowpass=f=5200,loudnorm=I=-27:TP=-3:LRA=11,"
        f"afade=t=in:d=1.2,afade=t=out:st={DURATION - 3.5:.2f}:d=3.5"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", dry, "-i", ir, "-filter_complex", f"[0][1]{chain}", "-ar", str(SR), OUT],
        check=True,
    )
