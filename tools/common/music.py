"""合成一段安静的配乐：D 宫五声音阶的拨弦（Karplus-Strong）+ 柔和铺底 + 低音，再用 FFmpeg 加混响、响度归一

用法：python tools/common/music.py <输出.wav> [时长秒数，默认 121] [随机种子，默认 20260928]
纯 Python 实现，不依赖 numpy；120 秒约需 1 分钟。需要 PATH 上有 ffmpeg。
"""
from __future__ import annotations

import math
import os
import random
import subprocess
import sys
import tempfile
import wave
from array import array

if len(sys.argv) < 2:
    sys.exit("用法：python tools/common/music.py <输出.wav> [时长秒数] [随机种子]")
OUT = sys.argv[1]
DURATION = float(sys.argv[2]) if len(sys.argv) > 2 else 121.0
SEED = int(sys.argv[3]) if len(sys.argv) > 3 else 20260928

SR = 44100
BPM = 72
BEAT = 60 / BPM
BAR = BEAT * 4
N = int(SR * DURATION)

random.seed(SEED)
left = array("d", bytes(8 * N))
right = array("d", bytes(8 * N))


def midi_freq(m: int) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def pluck(start: float, midi: int, vel: float, pan: float, length: float = 3.2) -> None:
    """Karplus-Strong 拨弦：滤过的噪声激励 + 平均反馈，音色柔和近似古琴/古筝"""
    f = midi_freq(midi)
    period = max(2, int(round(SR / f)))
    buf = [random.uniform(-1, 1) for _ in range(period)]
    # 激励先做两次平滑，去掉刺耳高频
    for _ in range(2):
        buf = [(buf[i] + buf[i - 1]) * 0.5 for i in range(period)]
    decay = 0.9965 if midi < 72 else 0.994
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
        nxt = (cur + prev) * 0.5 * decay
        prev = cur
        buf[idx] = nxt
        idx += 1
        if idx == period:
            idx = 0
        # 尾部 0.4 秒淡出，避免截断
        tail = 1.0 if k < n - int(0.4 * SR) else (n - k) / (0.4 * SR)
        v = cur * tail
        left[pos] += v * gl
        right[pos] += v * gr


def pad(start: float, length: float, midis: list[int], gain: float) -> None:
    """铺底：每个音一条正弦加少量二次谐波，慢起慢收"""
    s0 = int(start * SR)
    n = int(length * SR)
    attack = int(1.6 * SR)
    release = int(1.8 * SR)
    for vi, m in enumerate(midis):
        w = 2 * math.pi * midi_freq(m) / SR
        w2 = w * 2.003
        phase = random.uniform(0, 6.28)
        pan = (vi / max(1, len(midis) - 1) - 0.5) * 0.6
        gl = gain * (1 - pan) * 0.5
        gr = gain * (1 + pan) * 0.5
        sin = math.sin
        for k in range(n):
            pos = s0 + k
            if pos >= N:
                break
            env = min(1.0, k / attack, (n - k) / release)
            v = (sin(w * k + phase) + 0.18 * sin(w2 * k)) * env
            left[pos] += v * gl
            right[pos] += v * gr


def bass(start: float, length: float, midi: int, gain: float) -> None:
    s0 = int(start * SR)
    n = int(length * SR)
    w = 2 * math.pi * midi_freq(midi) / SR
    sin = math.sin
    for k in range(n):
        pos = s0 + k
        if pos >= N:
            break
        env = min(1.0, k / (0.8 * SR)) * math.exp(-k / (3.5 * SR))
        v = sin(w * k) * env * gain
        left[pos] += v
        right[pos] += v


def density_at(t: float) -> float:
    """段落强弱（按全曲比例）：开头稀疏，中段完整，结尾收薄"""
    p = t / DURATION
    if p < 8 / 121:
        return 0.25
    if p < 28 / 121:
        return 0.55
    if p < 98 / 121:
        return 0.8
    if p < 110 / 121:
        return 0.45
    return 0.2


# 和声：每个和弦两小节 —— D(add9) / Bm7 / G(maj7) / A(sus4)
CHORDS = [
    {"root": 38, "pad": [50, 57, 64, 66], "tones": [62, 64, 66, 69, 71, 74, 76]},
    {"root": 35, "pad": [47, 54, 57, 62], "tones": [59, 62, 64, 66, 69, 71, 74]},
    {"root": 31, "pad": [43, 50, 59, 66], "tones": [59, 62, 66, 67, 69, 71, 74]},
    {"root": 33, "pad": [45, 52, 57, 62], "tones": [57, 62, 64, 69, 71, 74, 76]},
]
MELODY_SCALE = [69, 71, 74, 76, 78, 81, 83]  # A4 B4 D5 E5 F#5 A5 B5

total_bars = int(DURATION // BAR)
for bar in range(0, total_bars, 2):
    chord = CHORDS[(bar // 2) % 4]
    t0 = bar * BAR
    last = bar >= total_bars - 2
    if last:
        chord = CHORDS[0]
    pad(t0, BAR * 2 + 1.5 if not last else DURATION - t0, chord["pad"], 0.045)
    bass(t0, BAR * 2, chord["root"], 0.10)
    density = density_at(t0)

    for b in range(2):
        bar_start = t0 + b * BAR
        # 分解和弦：八分音符
        for step in range(8):
            if random.random() > density:
                continue
            tone = chord["tones"][(step * 2 + b * 3 + random.randint(0, 2)) % len(chord["tones"])]
            vel = 0.20 + 0.10 * random.random() + (0.06 if step % 4 == 0 else 0)
            pluck(bar_start + step * BEAT / 2 + random.uniform(-0.008, 0.008), tone, vel, random.uniform(-0.45, 0.45))

# 旋律：在第 3 小节后进入，四小节一句，句末留白
t = BAR * 3
note_idx = 3
while t < DURATION - BAR * 3:
    phrase_end = t + BAR * 4
    while t < phrase_end - BEAT * 2:
        note_idx = max(0, min(len(MELODY_SCALE) - 1, note_idx + random.choice([-2, -1, -1, 0, 1, 1, 2])))
        length_beats = random.choice([1, 1, 2, 2, 3])
        pluck(t, MELODY_SCALE[note_idx], 0.34 + 0.08 * random.random(), random.uniform(-0.15, 0.15), 3.6)
        t += BEAT * length_beats
    t = phrase_end + BEAT * random.choice([0, 1])

# 结尾：D 大调主音收束
end = DURATION - BAR * 1.6
for i, m in enumerate([62, 66, 69, 74]):
    pluck(end + i * 0.12, m, 0.3, (i - 1.5) * 0.2, 5.0)

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
                v = int(c[i] * 32767)
                pcm[i * k + j] = 32767 if v > 32767 else (-32767 if v < -32767 else v)
        w.writeframes(pcm.tobytes())


for i in range(N):
    left[i] *= scale
    right[i] *= scale

# 混响脉冲响应：两声道各自的指数衰减噪声（2.6 秒），做出空间感
ir_len = int(2.6 * SR)
ir_l = array("d", (random.gauss(0, 1) * math.exp(-5.5 * i / ir_len) for i in range(ir_len)))
ir_r = array("d", (random.gauss(0, 1) * math.exp(-5.5 * i / ir_len) for i in range(ir_len)))
ir_peak = max(max(abs(v) for v in ir_l), max(abs(v) for v in ir_r))
for i in range(ir_len):
    ir_l[i] /= ir_peak
    ir_r[i] /= ir_peak

with tempfile.TemporaryDirectory() as tmp:
    dry = os.path.join(tmp, "dry.wav")
    ir = os.path.join(tmp, "ir.wav")
    write_wav(dry, [left, right], SR)
    write_wav(ir, [ir_l, ir_r], SR)
    # 卷积混响 + 去掉极低/极高频 + 响度归一到 -16 LUFS + 首尾淡入淡出
    chain = (
        "afir=dry=8:wet=4,highpass=f=35,lowpass=f=10000,loudnorm=I=-16:TP=-1.5:LRA=11,"
        f"afade=t=in:d=0.5,afade=t=out:st={DURATION - 5:.2f}:d=5"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", dry, "-i", ir, "-filter_complex", f"[0][1]{chain}", "-ar", str(SR), OUT],
        check=True,
    )
print("已生成", OUT)
