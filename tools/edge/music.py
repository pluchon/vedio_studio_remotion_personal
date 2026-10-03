#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""《宇宙的尽头》的配乐：深空氛围，没有节拍，没有拨弦和钟琴。

和前几期都不一样：
- 墨衡 OJ、汉字：拨弦加低音的五声；那一天：马林巴、长笛、弦乐拨奏的 G 大调；你好我是 Claude：游戏机方波。
- 这一期：E 调利底亚（带升 A）。主体是缓缓换和弦的弦乐铺底和低频长音，加上颂钵一样的金属余音、
  玻璃般的调频音、吹气声的长笛，和随画面推拉的噪声扫频。大爆炸前是静默，大爆炸那一下是一记低沉的闷响。

画面的时刻读自念白的秒数（和 src/videos/edge/theme.ts 的 SCENES、各幕里的 ramp/ease 对应）；
文件里的 0 秒是片名出现的那一刻，念白从第 LEAD 秒开始。

用法：python tools/edge/music.py
输出：public/edge/audio/bgm.wav（立体声，44.1 kHz；不入库）
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
OUT = ROOT / "public" / "edge" / "audio"

SR = 22050
LEAD = 2.0
TOTAL = 216.8 + 0.8
N = int(TOTAL * SR)

random.seed(20261004)
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
    "E": ["E2", "B2", "E3", "G#3", "B3", "F#4"],
    "Fs": ["F#2", "C#3", "F#3", "A#3", "C#4", "G#4"],
    "Cm": ["C#2", "G#2", "C#3", "E3", "B3", "D#4"],
    "A": ["A2", "E3", "A3", "C#4", "E4", "G#4"],
    "B": ["B2", "F#3", "B3", "D#4", "F#4", "C#5"],
    "Gm": ["G#2", "D#3", "G#3", "B3", "D#4", "F#4"],
    "Dark": ["E2", "A#2", "D#3", "F#3", "B3"],
    "Sus": ["E2", "B2", "F#3", "B3", "E4"],
    "Low": ["E1", "B1", "E2"],
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


# ---------- 编曲 ----------
def arrange() -> None:
    # ====== 片名与第一幕：海与山（0–18.7） ======
    pad("E", -2.0, 20.5, amp=0.045, attack=4.0, release=4.0, trem=0.25)
    pad("Low", -1.0, 19.5, amp=0.05, attack=4.0, release=4.0)
    bowl(hz("E4"), -1.6, 0.16, 7.0, pan=-0.3)
    bowl(hz("B4"), 3.2, 0.1, 6.0, pan=0.3)
    svf_noise(0.2, 3.5, 500, 900, 0.045, q=0.5, shape="swell", pan=-0.3)  # 海风
    lead([("B4", 1.5), ("G#4", 1.3), ("F#4", 1.5), ("E4", 2.3)], 3.4, amp=0.07)
    glass(hz("B5"), 6.3, 0.05, 2.5, pan=0.3)  # 靠岸
    lead([("E4", 1.0), ("G#4", 1.0), ("B4", 1.3), ("C#5", 1.5), ("B4", 2.0)], 9.5, amp=0.075)
    for k, n in enumerate(["E5", "G#5", "B5", "E6"]):
        glass(hz(n), 11.7 + k * 0.16, 0.05, 2.8, pan=-0.4 + k * 0.3)  # 山顶的旗
    riser(13.9, 4.4, 300, 2000, 0.06, ("E3", "E4"))
    # ====== 第二幕：地球（18.7–32.3） ======
    pad("Fs", 17.8, 33.5, amp=0.045, attack=3.0, release=3.5, trem=0.2)
    pad("Low", 19.0, 33.0, amp=0.05, attack=3.5, release=3.5)
    bowl(hz("F#3"), 19.3, 0.12, 6.0)
    bowl(hz("C#4"), 22.5, 0.13, 5.0, pan=0.25)  # 半径
    for k, n in enumerate(["F#5", "A#5", "C#6", "F#6"]):
        glass(hz(n), 28.2 + k * 0.25, 0.05, 2.4, pan=0.3 - k * 0.2)  # 体积公式
    riser(30.3, 2.4, 400, 3000, 0.05, ("C#4", "C#5"))
    # ====== 第三幕：越拉越远（32.3–54.9） ======
    pad("Cm", 32.0, 36.5, amp=0.045, attack=1.5, release=2.0)
    pad("A", 35.0, 38.8, amp=0.048, attack=1.8, release=2.0)
    pad("Fs", 37.6, 42.5, amp=0.05, attack=1.8, release=3.0)
    pad("Low", 32.5, 45.0, amp=0.05, attack=3.0, release=3.0)
    riser(34.15, 1.6, 300, 2400, 0.07, ("C#4", "G#4"))
    bowl(hz("C#4"), 35.7, 0.16, 4.0, pan=-0.2)
    riser(36.2, 1.7, 400, 2800, 0.07, ("E4", "B4"))
    bowl(hz("E4"), 37.9, 0.16, 4.5, pan=0.2)
    riser(38.6, 2.1, 500, 3200, 0.08, ("F#4", "F#5"))
    bowl(hz("F#4"), 40.7, 0.2, 7.0)
    glass(hz("C#6"), 40.9, 0.06, 3.5, pan=0.3)
    # 宇宙的边之外：漆黑
    pad("Dark", 44.0, 49.6, amp=0.05, attack=2.0, release=2.5, trem=0.3)
    svf_noise(45.3, 3.4, 90, 160, 0.16, q=0.6, shape="swell")
    tone(hz("E1"), 45.0, 5.0, 0.12, table=SINE, attack=1.5, release=2.0)
    pad("E", 48.2, 56.0, amp=0.035, attack=2.5, release=3.0)
    tone(hz("E5"), 50.4, 5.0, 0.07, table=SINE, attack=1.8, release=2.0, vib=0.003, vib_delay=1.0)  # 一条直线
    tone(hz("E5") * 1.003, 50.4, 5.0, 0.05, table=SINE, attack=1.8, release=2.0, pan=0.4)
    # ====== 第四幕：皮毛上的尘埃（54.9–78.5） ======
    pad("Sus", 55.0, 64.0, amp=0.035, attack=2.0, release=2.0, table=REED)
    for k, (n, dt) in enumerate([("E2", 0.0), ("G#2", 0.9), ("B2", 1.8), ("G#2", 2.7), ("E2", 3.6), ("F#2", 4.5), ("A#2", 5.4), ("F#2", 6.3)]):
        tone(hz(n), 55.4 + dt, 0.5, 0.11, table=REED, attack=0.03, release=0.28, pan=-0.25)  # 低音管一步一步地走
    glass(hz("B5"), 56.3, 0.03, 2.0, pan=0.4)
    knock(60.5, 0.12, 120, 0.2)
    # 睁眼、发怒
    pad("Dark", 60.7, 64.3, amp=0.06, attack=0.2, release=1.5, table=REED)
    svf_noise(60.7, 2.5, 80, 240, 0.2, q=0.5, shape="swell")
    # 抖毛发：低低的拨浪
    for k in range(18):
        knock(63.5 + k * 0.09, 0.11 * math.exp(-k * 0.12), 180 + 30 * (k % 3), 0.05, pan=(-1) ** k * 0.4)
    riser(64.45, 0.5, 400, 3000, 0.08)
    faller(65.7, 1.5, 3000, 300, 0.09, ("B5", "E3"))  # 尘埃落下去
    svf_noise(67.4, 2.0, 90, 70, 0.14, q=0.7, shape="swell")
    tone(hz("E1"), 67.3, 3.0, 0.13, table=SINE, attack=0.6, release=1.4)  # 毁灭：一声沉沉的长音
    # 盖章
    knock(70.03, 0.5, 160, 0.09)
    knock(70.03, 0.2, 1400, 0.03)
    # 古地图的怪物：暖回来
    pad("E", 70.8, 80.6, amp=0.045, attack=2.0, release=3.0, trem=0.2)
    pad("Low", 70.8, 80.6, amp=0.045, attack=2.0, release=3.0)
    for k, (n, t) in enumerate([("G#3", 72.1), ("B3", 74.4), ("F#3", 76.4)]):
        bowl(hz(n), t, 0.13, 5.0, pan=(-0.4, 0.0, 0.4)[k])
    lead([("B4", 0.9), ("C#5", 0.9), ("E5", 1.6), ("B4", 1.2), ("G#4", 2.2)], 72.4, amp=0.065)
    # ====== 第五幕：哈勃（78.5–115.5） ======
    pad("A", 78.0, 90.0, amp=0.045, attack=3.0, release=3.5, trem=0.2)
    pad("Low", 78.0, 100.0, amp=0.05, attack=3.5, release=3.5)
    for k in range(24):  # 24 个月份格
        glass(hz("G#6") * (1 + 0.0 * k), 82.2 + k * 0.15, 0.012 + 0.006 * (k % 3), 0.5, pan=-0.5 + (k % 5) * 0.25)
    riser(86.4, 3.0, 300, 3200, 0.06, ("E4", "E5"))  # 曝光
    svf_noise(89.7, 1.6, 700, 3000, 0.09, q=0.35, shape="swell", pan=-0.5)  # 处理：扫描线
    riser(91.6, 2.6, 200, 3200, 0.1, ("B3", "B4"))  # 推近
    pad("B", 92.6, 103.0, amp=0.05, attack=1.5, release=3.0)
    bowl(hz("B4"), 94.2, 0.2, 6.0)
    for k in range(18):  # 数到 137，越数越快
        glass(hz(["E5", "G#5", "B5", "C#6", "E6"][k % 5]), 95.2 + 3.4 * (k / 18) ** 0.8, 0.02 + 0.004 * k, 0.7, pan=-0.3 + 0.6 * (k / 18))
    bowl(hz("E4"), 98.7, 0.18, 6.0)
    glass(hz("B6"), 98.7, 0.05, 3.0)
    faller(100.4, 3.4, 4000, 200, 0.12, ("E5", "E3"))  # 退到整片天空
    pad("Fs", 103.5, 118.0, amp=0.05, attack=3.0, release=4.0, trem=0.2)
    for k, n in enumerate(["F#5", "A#5", "C#6", "F#6", "A#6"]):
        glass(hz(n), 107.4 + k * 0.45, 0.025, 2.0, pan=-0.5 + 0.25 * k)  # 光的虚线
    for n, t in [("E4", 110.3), ("G#4", 112.2), ("B4", 113.3)]:
        bowl(hz(n), t, 0.15, 4.5)
    # ====== 第六幕：化石（115.5–140.5） ======
    pad("Cm", 114.8, 128.0, amp=0.05, attack=2.5, release=3.0)
    pad("Low", 115.0, 131.0, amp=0.06, attack=2.5, release=3.0)
    tone(hz("C#1"), 115.0, 14.0, 0.12, table=SINE, attack=3.0, release=3.0)
    for k in range(12):  # 数年份：石头的敲击
        knock(115.9 + k * 0.33, 0.1, 200 + 20 * (k % 4), 0.06, pan=-0.5)
    svf_noise(122.6, 3.0, 70, 160, 0.13, q=0.7, shape="swell")  # 翻天覆地
    pad("Sus", 125.8, 130.4, amp=0.045, attack=1.5, release=1.0, trem=0.4)
    for k, n in enumerate(["E5", "G#5", "B5", "C#6"]):
        glass(hz(n), 129.8 + k * 0.28, 0.055, 3.0, pan=-0.4 + 0.3 * k)  # 化石一个个亮出来
    pad("E", 130.4, 142.0, amp=0.05, attack=1.2, release=3.5)
    glass(hz("G#5"), 133.2, 0.06, 3.5)
    glass(hz("E5"), 133.5, 0.05, 3.5, pan=0.3)
    riser(136.0, 2.4, 500, 3500, 0.06, ("G#4", "G#5"))
    for k, n in enumerate(["E3", "B2", "E2"]):
        bowl(hz(n), 137.8 + k * 0.5, 0.2, 5.0, pan=(-0.2, 0.0, 0.2)[k])
    # ====== 第七幕：到不了的边（140.5–159.5） ======
    pad("Dark", 140.0, 153.0, amp=0.045, attack=3.0, release=3.0, trem=0.35)
    pad("Sus", 141.0, 153.0, amp=0.04, attack=3.0, release=3.0, table=SOFT)
    svf_noise(145.6, 5.0, 900, 1400, 0.05, q=0.6, shape="swell", pan=0.3)  # 雾
    svf_noise(148.8, 3.0, 80, 130, 0.12, q=0.7, shape="swell")
    for k in range(7):  # 小船的一下一下
        tone(hz("E3"), 151.4 + k * 1.1, 0.7, 0.08, table=SINE, attack=0.03, release=0.5, pan=0.2)
    # 时空扭曲：两条越来越不齐的音
    tone(hz("A4"), 153.6, 6.0, 0.05, table=SOFT, attack=1.0, release=2.0, pan=-0.4, glide=0.04)
    tone(hz("A4") * 1.002, 153.6, 6.0, 0.05, table=SOFT, attack=1.0, release=2.0, pan=0.4, glide=0.12)
    pad("Dark", 154.0, 160.8, amp=0.045, attack=1.5, release=2.0, trem=0.5)
    # ====== 第八幕：膨胀（159.5–195） ======
    svf_noise(161.9, 2.5, 150, 1400, 0.1, q=0.4, shape="rise")  # 吸气
    boom(164.4, 0.8)
    pad("E", 164.4, 176.0, amp=0.07, attack=0.15, release=3.0)
    pad("Low", 164.4, 188.0, amp=0.08, attack=0.3, release=3.0)
    riser(164.5, 5.0, 300, 3400, 0.05, ("E4", "E5"))
    for k, n in enumerate(["E6", "G#6", "B6", "E7"]):
        glass(hz(n), 164.55 + k * 0.1, 0.05, 3.5, pan=-0.5 + 0.33 * k)
    pad("A", 171.0, 183.0, amp=0.05, attack=3.0, release=3.0)
    pad("B", 178.0, 189.0, amp=0.05, attack=3.0, release=3.0)
    heartbeat(166.5, 187.0, 1.0, 0.16)
    lead([("E5", 0.9), ("B4", 0.9), ("G#4", 1.0), ("B4", 1.0), ("E5", 1.8), ("F#5", 1.4), ("G#5", 2.2)], 172.4, amp=0.07)
    for k in range(10):  # 格子变金
        glass(hz(["B5", "E6", "G#6"][k % 3]), 177.4 + k * 0.2, 0.025, 1.4, pan=-0.6 + 0.13 * k)
    riser(180.0, 5.0, 300, 3800, 0.09, ("E3", "E5"))  # 边出了画
    pad("E", 187.0, 198.0, amp=0.07, attack=0.6, release=3.5)
    glass(hz("B6"), 188.3, 0.06, 3.5, pan=0.3)  # 小旗
    pad("Sus", 190.0, 195.5, amp=0.04, attack=1.5, release=1.5, trem=0.3)
    svf_noise(193.3, 2.0, 100, 200, 0.12, q=0.7, shape="swell")  # 墨又漫上来
    # ====== 第九幕：越走越远（195–214.8） ======
    pad("E", 194.5, 215.5, amp=0.06, attack=2.5, release=5.0, trem=0.2)
    pad("Low", 194.5, 215.5, amp=0.06, attack=2.5, release=5.0)
    pad("A", 200.0, 210.0, amp=0.04, attack=3.0, release=3.0)
    lead([("E4", 1.0), ("G#4", 1.0), ("B4", 1.4), ("E5", 2.0), ("B4", 1.0), ("C#5", 1.0), ("E5", 1.6), ("G#5", 2.4)], 195.4, amp=0.08)
    for k in range(5):  # 流星
        svf_noise(201.8 + k * 0.5, 0.6, 3500, 1500, 0.05, q=0.4, shape="fall", pan=0.5 - 0.25 * k)
    glass(hz("B5"), 204.9, 0.05, 3.0, pan=-0.4)  # 哈勃
    for k, n in enumerate(["G#5", "B5", "E6"]):
        glass(hz(n), 206.1 + k * 0.2, 0.05, 3.5, pan=0.3 - 0.2 * k)  # 韦伯
    lead([("B4", 0.9), ("E5", 1.0), ("G#5", 1.6), ("B5", 2.4)], 205.2, amp=0.075, pan=-0.1)
    riser(206.0, 2.3, 300, 3800, 0.08, ("E4", "E5"))
    boom(208.3, 0.22)
    for k, n in enumerate(["E5", "G#5", "B5", "F#6", "E6", "B6"]):
        glass(hz(n), 208.4 + k * 0.1, 0.07, 5.5, pan=-0.5 + 0.2 * k)
    pad("E", 208.3, 216.0, amp=0.09, attack=0.6, release=4.5)
    bowl(hz("E3"), 208.4, 0.22, 7.0)
    tone(hz("E1"), 208.3, 8.0, 0.14, table=SINE, attack=0.4, release=4.0)


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
    """大厅一样的混响：4.8 秒，左右两路各自的噪声；越到后面越暗。"""
    sr = 44100
    n = int(4.8 * sr)
    pre = int(0.045 * sr)
    chans = []
    for c in range(2):
        rnd = random.Random(77 + c)
        ir = [0.0] * n
        lp = 0.0
        for i in range(pre, n):
            t = (i - pre) / sr
            x = rnd.uniform(-1, 1)
            k = 0.55 * math.exp(-t / 1.6) + 0.04
            lp += k * (x - lp)
            ir[i] = lp * math.exp(-t / 1.15)
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
        "[d]volume=0.5[dd];[wet]volume=2.4[ww];"
        "[dd][ww]amix=inputs=2:normalize=0,highpass=f=28,lowpass=f=11000,alimiter=limit=0.9"
    )
    tmp = out.with_suffix(".raw.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(dry), "-i", str(ir), "-filter_complex", graph, "-ar", "44100", "-t", f"{TOTAL:.2f}", str(tmp)], check=True)
    # 量一下响度，调到比念白（约 -16 LUFS）低 11 个单位
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(tmp), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", probe)
    loud = float(m[-1])
    gain = -27.0 - loud
    print(f"整体响度 {loud:.1f} LUFS，调整 {gain:+.1f} dB 到 -27 LUFS")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", f"volume={gain}dB,alimiter=limit=0.85", str(out)], check=True)
    tmp.unlink()


def report(path: Path) -> None:
    """分段打印响度，听不到声音的时候靠这些数字核对起伏。"""
    print("各段响度（念白秒数）：")
    marks = [(0, 18.7, "海与山"), (18.7, 32.3, "地球"), (32.3, 54.9, "拉远"), (54.9, 78.5, "尘埃"), (78.5, 115.5, "哈勃"),
             (115.5, 140.5, "化石"), (140.5, 159.5, "边"), (159.5, 164.3, "大爆炸前"), (164.4, 195, "膨胀"), (195, 210.8, "走远")]
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
