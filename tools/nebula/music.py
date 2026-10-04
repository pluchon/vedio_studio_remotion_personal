#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""《星云》的配乐：助眠的摇篮曲，降 B 大调，6/8 拍，一小节 3 秒。

和前几期都不一样：
- 墨衡 OJ、汉字：拨弦五声；那一天：马林巴、长笛的 G 大调；你好我是 Claude：游戏机方波；宇宙的尽头：E 利底亚的深空氛围、颂钵和玻璃音。
- 这一期：FM 电钢琴（Rhodes 一类的软音色）打分解和弦，暖暖的风琴式铺底，潮水一样慢慢起落的噪声，
  再加一点八音盒一样的高音摇出一段摇篮曲的旋律。没有鼓，没有突然的声响；越往后越简单，最后留下一个和弦慢慢散去。

画面的时刻读自念白的秒数；文件里的 0 秒是片名出现的那一刻，念白从第 LEAD 秒开始。

用法：python tools/nebula/music.py
输出：public/nebula/audio/bgm.wav（立体声，44.1 kHz；不入库）
需要 PATH 上有 ffmpeg。纯 Python 合成，约三五分钟。
"""
from __future__ import annotations

import math
import random
import re
import subprocess
import wave
from array import array
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "nebula" / "audio"

SR = 22050
LEAD = 2.0
TOTAL = 341.4 + 5.0
N = int(TOTAL * SR)

random.seed(20261005)
L = array("f", [0.0]) * N
R = array("f", [0.0]) * N


def idx(t: float) -> int:
    """念白里的第 t 秒对应的采样下标。"""
    return int((t + LEAD) * SR)


# ---------- 音高 ----------
NAMES = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name: str) -> float:
    m = re.fullmatch(r"([A-G]#?)(\d)", name)
    assert m, name
    midi = 12 * (int(m.group(2)) + 1) + NAMES[m.group(1)]
    return 440.0 * 2 ** ((midi - 69) / 12)


CHORDS = {
    "Bb": ["A#1", "A#2", "F3", "A3", "D4", "G4"],
    "Gm": ["G2", "D3", "F3", "A#3", "D4", "G4"],
    "Eb": ["D#2", "A#2", "D3", "G3", "A#3", "F4"],
    "F": ["F2", "C3", "G3", "A3", "C4", "G4"],
    "Cm": ["C2", "G2", "D#3", "G3", "A#3", "D4"],
    "Low": ["A#1", "F2"],
}

# ---------- 波表 ----------
TS = 2048


def make_table(fn) -> list[float]:
    t = [fn(i / TS) for i in range(TS)]
    peak = max(abs(v) for v in t)
    return [v / peak for v in t]


SINE = make_table(lambda x: math.sin(2 * math.pi * x))
SAW = make_table(lambda x: sum(math.sin(2 * math.pi * k * x) / k**1.15 for k in range(1, 16)))
SOFT = make_table(lambda x: sum(math.sin(2 * math.pi * k * x) / k**1.9 for k in range(1, 7)))
REED = make_table(lambda x: sum(math.sin(2 * math.pi * k * x) / k**1.0 for k in range(1, 10) if k % 2 == 1))


def gains(pan: float) -> tuple[float, float]:
    a = (pan + 1) * math.pi / 4
    return math.cos(a), math.sin(a)


# ---------- 发声器 ----------
def tone(f: float, t0: float, dur: float, amp: float, table=SAW, attack: float = 0.08, release: float = 0.4,
         pan: float = 0.0, detune: float = 0.0, vib: float = 0.0, vib_delay: float = 0.0, trem: float = 0.0,
         trem_hz: float = 0.3, glide: float = 0.0, breath: float = 0.0) -> None:
    """持续音。detune 是第二个振荡器的偏移比例（出合唱的拍频）；vib 颤音深度；glide 是滑过的八度数。"""
    start = idx(t0)
    n = int(dur * SR)
    if start >= N:
        return
    skip = 0
    if start < 0:
        skip = -start
        start = 0
    n = min(n, N - start + skip)
    gl, gr = gains(pan)
    inc0 = f / SR * TS
    ph1 = 0.0
    ph2 = 0.37 * TS
    ia = 1.0 / max(1.0, attack * SR)
    ir = 1.0 / max(1.0, release * SR)
    two = detune != 0.0
    d2 = 1.0 + detune
    gf = 2 ** (glide / n) if glide else 1.0
    vib_w = 2 * math.pi * 5.1 / SR
    trem_w = 2 * math.pi * trem_hz / SR
    mask = TS - 1
    inc = inc0
    for i in range(skip, n):
        e = min(1.0, i * ia, (n - i) * ir)
        if vib:
            m = 1.0 + vib * min(1.0, max(0.0, (i / SR - vib_delay))) * math.sin(i * vib_w)
        else:
            m = 1.0
        ph1 += inc * m
        v = table[int(ph1) & mask]
        if two:
            ph2 += inc * m * d2
            v = (v + table[int(ph2) & mask]) * 0.5
        if trem:
            e *= 1.0 - trem * (0.5 + 0.5 * math.sin(i * trem_w))
        if breath:
            v += breath * (random.random() - 0.5)
        if glide:
            inc *= gf
        o = start + i - skip
        w = v * e
        L[o] += w * gl
        R[o] += w * gr


def pad(chord: str, t0: float, t1: float, amp: float = 0.05, attack: float = 3.0, release: float = 3.5,
        table=SAW, trem: float = 0.0) -> None:
    """一组和弦的弦乐铺底：每个音两个略微走音的振荡器，左右错开。"""
    notes = CHORDS[chord]
    for k, name in enumerate(notes):
        pan = ((k % 3) - 1) * 0.55
        low = hz(name) < 100
        tone(hz(name), t0, t1 - t0, amp * (1.5 if low else 1.0) * (0.85 ** (k // 2)), table=table if not low else SOFT,
             attack=attack, release=release, pan=pan, detune=0.0035 + 0.001 * (k % 3), trem=trem, trem_hz=0.17 + 0.03 * k)


def bowl(f: float, t0: float, amp: float, decay: float = 5.0, pan: float = 0.0) -> None:
    """颂钵：几个不成整数比的泛音各自衰减，基音带一对拍频。"""
    start = idx(t0)
    if start >= N or start < 0:
        return
    n = min(int(decay * 3.2 * SR), N - start)
    gl, gr = gains(pan)
    parts = [(1.0, 1.0, 1.0), (1.004, 0.7, 1.05), (2.76, 0.42, 0.7), (5.4, 0.2, 0.45), (8.93, 0.1, 0.3)]
    rot = []
    for ratio, weight, dec in parts:
        w = 2 * math.pi * f * ratio / SR
        if f * ratio > SR / 2.2:
            continue
        rot.append([1.0, 0.0, math.cos(w), math.sin(w), weight, math.exp(-1.0 / (SR * decay * dec))])
    env = [1.0] * len(rot)
    ia = 1.0 / (0.004 * SR)
    for i in range(n):
        v = 0.0
        for k, p in enumerate(rot):
            x, y, c, s, wgt, ed = p
            nx = x * c - y * s
            ny = x * s + y * c
            p[0], p[1] = nx, ny
            env[k] *= ed
            v += ny * wgt * env[k]
        v *= amp * min(1.0, i * ia)
        o = start + i
        L[o] += v * gl
        R[o] += v * gr


def glass(f: float, t0: float, amp: float, decay: float = 2.0, pan: float = 0.0, ratio: float = 3.0, index: float = 2.0) -> None:
    """玻璃一样的调频音：调制的深度很快收下去，余下一个干净的长音。"""
    start = idx(t0)
    if start >= N or start < 0:
        return
    n = min(int(decay * 3 * SR), N - start)
    gl, gr = gains(pan)
    w = 2 * math.pi * f / SR
    wm = w * ratio
    ed = math.exp(-1.0 / (SR * decay))
    em = math.exp(-1.0 / (SR * 0.35))
    e = 1.0
    m = index
    for i in range(n):
        v = math.sin(w * i + m * math.sin(wm * i)) * e
        e *= ed
        m *= em
        if i < 40:
            v *= i / 40
        o = start + i
        L[o] += v * amp * gl
        R[o] += v * amp * gr


def svf_noise(t0: float, dur: float, f0: float, f1: float, amp: float, q: float = 0.2, shape: str = "swell",
              pan: float = 0.0, expo: bool = True) -> None:
    """噪声过一个中心频率滑动的带通：风、扫频、上升的嘶声。shape：swell 两头小，rise 越来越大，fall 越来越小。"""
    start = idx(t0)
    n = int(dur * SR)
    if start >= N:
        return
    skip = 0
    if start < 0:
        skip = -start
        start = 0
    n = min(n, N - start + skip)
    gl, gr = gains(pan)
    low = band = 0.0
    for i in range(skip, n):
        u = i / n
        fc = f0 * (f1 / f0) ** u if expo else f0 + (f1 - f0) * u
        f = 2 * math.sin(math.pi * min(fc, SR / 6.5) / SR)
        x = random.random() * 2 - 1
        low += f * band
        high = x - low - q * band
        band += f * high
        if shape == "swell":
            e = math.sin(math.pi * u) ** 2
        elif shape == "rise":
            e = u**2.2 * min(1.0, (n - i) / (0.03 * SR))
        else:
            e = (1 - u) ** 1.8 * min(1.0, i / (0.02 * SR))
        v = band * e * amp
        o = start + i - skip
        L[o] += v * gl
        R[o] += v * gr


def boom(t0: float, amp: float) -> None:
    """大爆炸那一下：低频下扫的闷响，加一团低通的噪声，和一个很久才散的次声。"""
    start = idx(t0)
    n = min(int(7.0 * SR), N - start)
    ph = 0.0
    sub = 0.0
    low = 0.0
    for i in range(n):
        t = i / SR
        f = 30 + 85 * math.exp(-t / 0.28)
        ph += 2 * math.pi * f / SR
        sub += 2 * math.pi * 41.2 / SR
        low += 0.02 * ((random.random() * 2 - 1) - low)
        v = math.sin(ph) * math.exp(-t / 2.6) + 0.5 * math.sin(sub) * math.exp(-t / 3.2) + 7.0 * low * math.exp(-t / 0.9)
        v *= min(1.0, i / (0.003 * SR))
        o = start + i
        L[o] += v * amp
        R[o] += v * amp


def knock(t0: float, amp: float, fc: float = 260.0, decay: float = 0.07, pan: float = 0.0) -> None:
    """一记短促的敲击（石头、印章、计时）：窄带噪声，快速衰减。"""
    start = idx(t0)
    if start >= N or start < 0:
        return
    n = min(int(decay * 6 * SR), N - start)
    gl, gr = gains(pan)
    f = 2 * math.sin(math.pi * fc / SR)
    low = band = 0.0
    for i in range(n):
        x = random.random() * 2 - 1
        low += f * band
        high = x - low - 0.12 * band
        band += f * high
        v = band * math.exp(-i / (SR * decay)) * amp
        o = start + i
        L[o] += v * gl
        R[o] += v * gr


def heartbeat(t0: float, t1: float, step: float, amp: float, f: float = 82.4) -> None:
    """低低的一下一下，像脉搏；音量先升后降。"""
    t = t0
    while t < t1:
        u = (t - t0) / (t1 - t0)
        a = amp * math.sin(math.pi * u) ** 0.8
        tone(f, t, 0.5, a, table=SINE, attack=0.012, release=0.42)
        t += step


def lead(notes: list[tuple[str, float]], t0: float, amp: float = 0.09, pan: float = 0.15, vib: float = 0.006) -> None:
    """长笛一样的旋律：软波表，带一点吹气声和延迟进入的颤音。"""
    t = t0
    for name, dur in notes:
        if name != "-":
            tone(hz(name), t, dur + 0.25, amp, table=SOFT, attack=0.09, release=0.35, pan=pan, vib=vib, vib_delay=0.35, breath=0.05)
        t += dur


def riser(t0: float, dur: float, f0: float, f1: float, amp: float, pitch: tuple[str, str] | None = None) -> None:
    """镜头拉远、推近时的扫频：噪声一路升上去，可以再带一条滑音。"""
    svf_noise(t0, dur, f0, f1, amp, q=0.28, shape="rise")
    if pitch:
        tone(hz(pitch[0]), t0, dur, amp * 0.5, table=SINE, attack=dur * 0.4, release=0.2, glide=math.log2(hz(pitch[1]) / hz(pitch[0])))


def faller(t0: float, dur: float, f0: float, f1: float, amp: float, pitch: tuple[str, str] | None = None) -> None:
    svf_noise(t0, dur, f0, f1, amp, q=0.28, shape="fall")
    if pitch:
        tone(hz(pitch[0]), t0, dur, amp * 0.5, table=SINE, attack=0.03, release=dur * 0.5, glide=math.log2(hz(pitch[1]) / hz(pitch[0])))



# ---------- 这一期的两种新音色 ----------
def epiano(f: float, t0: float, amp: float, decay: float = 2.6, pan: float = 0.0) -> None:
    """电钢琴：载波加同频调制（暖），再叠一个很快消失的高频调制（敲击的那一下），整体带一点慢颤音。"""
    start = idx(t0)
    if start >= N or start < 0:
        return
    n = min(int(decay * 3.0 * SR), N - start)
    gl, gr = gains(pan)
    w = 2 * math.pi * f / SR
    ed = math.exp(-1.0 / (SR * decay))
    em = math.exp(-1.0 / (SR * 0.9))
    et = math.exp(-1.0 / (SR * 0.05))
    e = 1.0
    m = 1.25
    tine = 0.9
    tw = 2 * math.pi * 4.6 / SR
    for i in range(n):
        v = math.sin(w * i + m * math.sin(w * i)) * e
        v += 0.35 * tine * math.sin(w * i * 2 + 0.8 * tine * math.sin(w * i * 14.0))
        e *= ed
        m *= em
        tine *= et
        v *= 1.0 - 0.1 * (0.5 + 0.5 * math.sin(i * tw))
        if i < 60:
            v *= i / 60
        o = start + i
        L[o] += v * amp * gl
        R[o] += v * amp * gr


def musicbox(f: float, t0: float, amp: float, decay: float = 1.8, pan: float = 0.0) -> None:
    """八音盒：一根小钢条，基音加两个不成整数比的泛音，各自很快衰减。"""
    start = idx(t0)
    if start >= N or start < 0:
        return
    n = min(int(decay * 3.0 * SR), N - start)
    gl, gr = gains(pan)
    parts = [(1.0, 1.0, 1.0), (2.76, 0.28, 0.45), (5.4, 0.12, 0.22)]
    rot = []
    for ratio, weight, dec in parts:
        w = 2 * math.pi * f * ratio / SR
        if f * ratio > SR / 2.2:
            continue
        rot.append([1.0, 0.0, math.cos(w), math.sin(w), weight, math.exp(-1.0 / (SR * decay * dec))])
    env = [1.0] * len(rot)
    for i in range(n):
        v = 0.0
        for k, p in enumerate(rot):
            x, y, c, s, wgt, ed = p
            nx = x * c - y * s
            ny = x * s + y * c
            p[0], p[1] = nx, ny
            env[k] *= ed
            v += ny * wgt * env[k]
        v *= amp * min(1.0, i / 30.0)
        o = start + i
        L[o] += v * gl
        R[o] += v * gr


def tide(t0: float, dur: float, amp: float, lo: float = 160.0, hi: float = 420.0, pan: float = 0.0) -> None:
    """潮水：低频带通噪声，一涨一落（svf_noise 的 swell 形）。"""
    svf_noise(t0, dur, lo, hi, amp, q=0.7, shape="swell", pan=pan)


BAR = 3.0  # 一小节 3 秒，六个八分音符，每个 0.5 秒
PATTERN = [0, 2, 3, 4, 3, 2]  # 分解和弦：取和弦音的下标


def arpeggio(chord: str, t0: float, bars: int, amp: float, octave_up: bool = False, density: int = 6) -> None:
    """一个和弦弹若干小节的分解和弦。density 小于 6 的时候只弹其中几下，更稀疏。"""
    notes = CHORDS[chord]
    for bar in range(bars):
        for k, pi in enumerate(PATTERN):
            if density < 6 and k not in (0, 3) and not (density >= 4 and k == 4):
                continue
            name = notes[min(pi, len(notes) - 1)]
            f = hz(name) * (2 if octave_up else 1)
            a = amp * (1.0 if k == 0 else 0.72) * (0.92 + 0.16 * random.random())
            epiano(f, t0 + bar * BAR + k * 0.5 + random.uniform(-0.012, 0.012), a, decay=2.4, pan=-0.35 + 0.12 * k)


PROG = ["Bb", "Gm", "Eb", "F"]  # 每个和弦两小节，一圈 24 秒


def progression(t0: float, t1: float, arp_amp: float, pad_amp: float, density: int = 6, start: int = 0, octave_up: bool = False) -> None:
    """从 t0 到 t1 循环四个和弦：铺底 + 分解和弦。"""
    t = t0
    k = start
    while t < t1 - 0.5:
        name = PROG[k % 4]
        end = min(t + 2 * BAR, t1)
        if pad_amp > 0:
            pad(name, t - 0.8, end + 1.0, amp=pad_amp, attack=2.6, release=3.2, table=SOFT)
        if arp_amp > 0:
            arpeggio(name, t, max(1, int(round((end - t) / BAR))), arp_amp, octave_up=octave_up, density=density)
        t = end
        k += 1


# 摇篮曲的主旋律：降 B 大调五声，每个音（名字，拍数，一拍 = 1.5 秒）
LULLABY_A = [("D5", 1), ("F5", 1), ("G5", 2), ("F5", 1), ("D5", 1), ("C5", 2)]
LULLABY_B = [("A#4", 1), ("C5", 1), ("D5", 2), ("C5", 1), ("A#4", 1), ("F4", 2)]
LULLABY_C = [("F5", 1), ("G5", 1), ("A#5", 2), ("G5", 1), ("F5", 1), ("D5", 2)]


def melody(notes: list[tuple[str, float]], t0: float, amp: float, pan: float = 0.25, box: bool = False) -> float:
    t = t0
    for name, beats in notes:
        if name != "-":
            if box:
                musicbox(hz(name) * 2, t, amp * 0.8, decay=2.0, pan=pan)
            else:
                epiano(hz(name), t, amp, decay=3.2, pan=pan)
        t += beats * 1.5
    return t


# ---------- 编曲 ----------
def arrange() -> None:
    # 整片是一次缓缓的下沉：前半段分解和弦流动，后半段越来越空，最后只剩一个和弦
    # ====== 云（0–21）：只有铺底和潮水，高处零星的几个音 ======
    pad("Bb", -2.0, 21.5, amp=0.05, attack=4.0, release=3.5, table=SOFT)
    pad("Low", -1.0, 22.0, amp=0.05, attack=4.0, release=4.0, table=SINE)
    tide(0.5, 9.0, 0.05)
    tide(9.5, 10.5, 0.05)
    for t, n in [(4.0, "F5"), (8.2, "D5"), (12.6, "G5"), (16.2, "F5")]:
        epiano(hz(n), t, 0.05, decay=3.0, pan=0.3)
    # ====== 银河与星系（21–47）：分解和弦进来 ======
    progression(21.0, 51.0, arp_amp=0.045, pad_amp=0.04, density=4, start=0)
    pad("Low", 21.0, 52.0, amp=0.05, attack=4.0, release=4.0, table=SINE)
    tide(24.0, 12.0, 0.04, pan=-0.3)
    tide(38.0, 12.0, 0.04, pan=0.3)
    # ====== 像与不像、星云们（47–76）：摇篮曲的第一次出现 ======
    progression(51.0, 78.0, arp_amp=0.05, pad_amp=0.045, density=6, start=0)
    pad("Low", 52.0, 78.0, amp=0.05, attack=4.0, release=4.0, table=SINE)
    melody(LULLABY_A, 54.0, 0.08)
    melody(LULLABY_C, 66.0, 0.08, box=True)
    tide(56.0, 14.0, 0.04)
    # ====== 梅西耶、星表（76–140）：好奇的，稍稀疏 ======
    progression(78.0, 141.0, arp_amp=0.042, pad_amp=0.04, density=4, start=1)
    pad("Low", 78.0, 141.0, amp=0.05, attack=4.0, release=4.0, table=SINE)
    melody(LULLABY_B, 84.0, 0.06, box=True)
    melody(LULLABY_A, 108.0, 0.06, box=True)
    melody(LULLABY_B, 126.0, 0.06, box=True)
    for t in (80.0, 96.0, 112.0, 130.0):
        tide(t, 12.0, 0.035, pan=0.3 if (t // 16) % 2 else -0.3)
    # ====== 争论、罗斯、行星状星云（140–200） ======
    progression(141.0, 201.0, arp_amp=0.048, pad_amp=0.045, density=6, start=0)
    pad("Low", 141.0, 201.0, amp=0.05, attack=4.0, release=4.0, table=SINE)
    melody(LULLABY_C, 146.0, 0.07)
    melody(LULLABY_A, 170.0, 0.07, box=True)
    melody(LULLABY_C, 184.0, 0.07)
    tide(160.0, 14.0, 0.04)
    tide(184.0, 16.0, 0.045, pan=-0.3)
    # ====== 光谱、哈勃（200–261）：安静的，亮一点的音 ======
    progression(201.0, 262.0, arp_amp=0.04, pad_amp=0.04, density=4, start=2, octave_up=True)
    pad("Low", 201.0, 262.0, amp=0.05, attack=4.0, release=4.0, table=SINE)
    melody(LULLABY_B, 206.0, 0.06, box=True)
    melody(LULLABY_A, 236.0, 0.065)
    tide(210.0, 14.0, 0.035)
    tide(240.0, 14.0, 0.035, pan=0.3)
    # ====== 两类星云、极光（261–317）：铺底最厚 ======
    progression(262.0, 318.0, arp_amp=0.046, pad_amp=0.055, density=6, start=0)
    pad("Low", 262.0, 318.0, amp=0.055, attack=4.0, release=4.0, table=SINE)
    melody(LULLABY_C, 266.0, 0.07, box=True)
    melody(LULLABY_A, 290.0, 0.07)
    melody(LULLABY_C, 302.0, 0.07, box=True)
    tide(268.0, 14.0, 0.04)
    tide(296.0, 14.0, 0.04, pan=-0.3)
    # ====== 春天里的花朵（317–345）：越来越空，旋律完整地唱一遍，最后一个和弦散去 ======
    progression(318.0, 330.0, arp_amp=0.038, pad_amp=0.05, density=4, start=0)
    pad("Bb", 328.0, 345.0, amp=0.06, attack=2.5, release=7.0, table=SOFT)
    pad("Low", 326.0, 346.0, amp=0.055, attack=3.0, release=7.0, table=SINE)
    t = melody(LULLABY_A, 319.0, 0.08)
    melody(LULLABY_B, t + 1.5, 0.075, box=True)
    melody([("D5", 1), ("F5", 1), ("A#5", 4)], 336.0, 0.07, box=True)
    tide(320.0, 16.0, 0.035)
    epiano(hz("A#3"), 342.0, 0.05, decay=4.0)


# ---------- 输出与混响 ----------
def write_dry(path: Path) -> None:
    peak = max(max(L), -min(L), max(R), -min(R))
    print(f"干声峰值 {peak:.3f}")
    scale = 0.5 / peak if peak > 0 else 1.0
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        chunk = 44100
        for s in range(0, N, chunk):
            frames = bytearray()
            for i in range(s, min(N, s + chunk)):
                a = max(-1.0, min(1.0, L[i] * scale))
                b = max(-1.0, min(1.0, R[i] * scale))
                frames += int(a * 32767).to_bytes(2, "little", signed=True)
                frames += int(b * 32767).to_bytes(2, "little", signed=True)
            w.writeframes(bytes(frames))


def write_ir(path: Path) -> None:
    """卧室一样的混响：2.6 秒，很暗很暖；左右两路各自的噪声。"""
    sr = 44100
    n = int(2.6 * sr)
    pre = int(0.02 * sr)
    chans = []
    for c in range(2):
        rnd = random.Random(77 + c)
        ir = [0.0] * n
        lp = 0.0
        for i in range(pre, n):
            t = (i - pre) / sr
            x = rnd.uniform(-1, 1)
            k = 0.3 * math.exp(-t / 0.9) + 0.03
            lp += k * (x - lp)
            ir[i] = lp * math.exp(-t / 0.75)
        chans.append(ir)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        peak = max(max(abs(v) for v in ch) for ch in chans)
        frames = bytearray()
        for i in range(n):
            for ch in chans:
                frames += int(ch[i] / peak * 0.9 * 32767).to_bytes(2, "little", signed=True)
        w.writeframes(bytes(frames))


def master(dry: Path, ir: Path, out: Path) -> None:
    graph = (
        "[0:a]aresample=44100,asplit=2[d][w];"
        "[w][1:a]afir=dry=0:wet=1:gtype=gn:irnorm=1[wet];"
        "[d]volume=0.6[dd];[wet]volume=2.2[ww];"
        "[dd][ww]amix=inputs=2:normalize=0,highpass=f=28,lowpass=f=9000,alimiter=limit=0.9"
    )
    tmp = out.with_suffix(".raw.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(dry), "-i", str(ir), "-filter_complex", graph, "-ar", "44100", "-t", f"{TOTAL:.2f}", str(tmp)], check=True)
    # 量一下响度，调到比念白（约 -21 LUFS）低 12 个单位
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(tmp), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", probe)
    loud = float(m[-1])
    gain = -33.0 - loud
    print(f"整体响度 {loud:.1f} LUFS，调整 {gain:+.1f} dB 到 -33 LUFS")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", f"volume={gain}dB,alimiter=limit=0.85", str(out)], check=True)
    tmp.unlink()


def report(path: Path) -> None:
    """分段打印响度，听不到声音的时候靠这些数字核对起伏。"""
    print("各段响度（念白秒数）：")
    marks = [(0, 21, "云"), (21, 52, "银河星系"), (52, 78, "星云们"), (78, 141, "梅西耶"), (141, 201, "争论"),
             (201, 262, "光谱哈勃"), (262, 318, "两类星云"), (318, 346, "花朵")]
    for a, b, name in marks:
        probe = subprocess.run(
            ["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{a + LEAD:.2f}", "-t", f"{b - a:.2f}", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
        ).stderr
        m = re.findall(r"I:\s+(-?[\d.]+) LUFS", probe)
        print(f"  {a:6.1f}–{b:6.1f} {name:6s} {m[-1] if m else '?':>7s} LUFS")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    arrange()
    dry = OUT / "bgm_dry.wav"
    ir = OUT / "ir.wav"
    write_dry(dry)
    write_ir(ir)
    out = OUT / "bgm.wav"
    master(dry, ir, out)
    dry.unlink()
    ir.unlink()
    report(out)
    print(f"写到 {out}")


if __name__ == "__main__":
    main()
