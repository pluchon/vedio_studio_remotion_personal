#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""《你好，我是 Claude》的声音：游戏机风格的芯片音乐，加上小家伙开口时的一小声「叽咕」。

和前几期的拨弦、钢琴、马林巴都不一样：这里只有方波、三角波和噪声三种最简单的波形，
像老式游戏机那样一个音一个音地排。各段的起止和每句话的时刻都读自 src/videos/hello/script.json，
所以改了台词以后重新跑一遍就能对上。

用法：python tools/hello/music.py
输出：public/hello/audio/bgm.wav（配乐和音效）、public/hello/audio/voice.wav（说话声）
"""
from __future__ import annotations

import json
import math
import random
import wave
from array import array
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "src" / "videos" / "hello" / "script.json"
OUT = ROOT / "public" / "hello" / "audio"

SR = 44100
BPM = 132
BEAT = 60 / BPM
STEP = BEAT / 4
BAR = BEAT * 4

random.seed(20261003)

# ---------- 时间表 ----------
script = json.loads(SCRIPT.read_text(encoding="utf-8"))
PACE = script["pace"]
STARTS: list[float] = []
for index, chapter in enumerate(script["chapters"]):
    STARTS.append(0.0 if index == 0 else STARTS[-1] + script["chapters"][index - 1]["seconds"] - script["overlap"])
TOTAL = STARTS[-1] + script["chapters"][-1]["seconds"]
N = int(TOTAL * SR) + SR // 2

# ---------- 音高 ----------
NAMES = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
CHORDS = {
    "A": ["A", "C#", "E"],
    "F#m": ["F#", "A", "C#"],
    "D": ["D", "F#", "A"],
    "E": ["E", "G#", "B"],
    "C#m": ["C#", "E", "G#"],
    "Bm": ["B", "D", "F#"],
}


def freq(name: str, shift: int = 0) -> float:
    """C4 是中央 C，A4 = 440。"""
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + NAMES[pitch] + shift
    return 440.0 * 2 ** ((midi - 69) / 12)


# ---------- 三种波形 ----------
CACHE: dict[tuple, list[float]] = {}


def tone(hz: float, seconds: float, kind: str = "pulse", duty: float = 0.5, shape: str = "hold",
         vibrato: float = 0.0, slide: float = 0.0) -> list[float]:
    """一个音。kind：pulse 方波、tri 三角波、sine 正弦；shape 是音量的走势；slide 是这个音里滑过的半音数。"""
    key = (round(hz, 2), round(seconds, 4), kind, duty, shape, vibrato, slide)
    hit = CACHE.get(key)
    if hit is not None:
        return hit
    count = max(1, int(seconds * SR))
    out = [0.0] * count
    phase = 0.0
    attack = 0.04 if shape == "soft" else 0.002
    release = 0.06 if shape == "soft" else 0.012
    for i in range(count):
        t = i / SR
        f = hz
        if vibrato and t > 0.14:
            f *= 1 + 0.012 * vibrato * math.sin(2 * math.pi * 6 * t)
        if slide:
            f *= 2 ** (slide * (t / seconds) / 12)
        phase += f / SR
        phase -= int(phase)
        if kind == "pulse":
            v = 1.0 if phase < duty else -1.0
        elif kind == "tri":
            # 老游戏机的三角波是一级一级的台阶
            v = round((4 * abs(phase - 0.5) - 1) * 7.5) / 7.5
        else:
            v = math.sin(2 * math.pi * phase)
        if shape == "pluck":
            body = math.exp(-t / 0.13)
        elif shape == "stab":
            body = math.exp(-t / 0.05)
        elif shape == "hold":
            body = 0.72 + 0.28 * math.exp(-t / 0.09)
        else:
            body = 1.0
        out[i] = v * body * min(1.0, t / attack) * min(1.0, (seconds - t) / release)
    CACHE[key] = out
    return out


NOISE = [random.uniform(-1, 1) for _ in range(SR)]


def noise(seconds: float, hold: int, decay: float, swell: bool = False) -> list[float]:
    """噪声：hold 是每个随机值保持几个采样（越大越闷），decay 是衰减的快慢。"""
    count = int(seconds * SR)
    start = random.randrange(SR)
    out = []
    for i in range(count):
        t = i / SR
        v = NOISE[(start + i // hold) % SR]
        env = math.sin(math.pi * t / seconds) ** 2 if swell else math.exp(-t / decay)
        out.append(v * env)
    return out


def kick() -> list[float]:
    out = []
    phase = 0.0
    for i in range(int(0.16 * SR)):
        t = i / SR
        phase += (48 + 130 * math.exp(-t / 0.028)) / SR
        out.append(math.sin(2 * math.pi * phase) * math.exp(-t / 0.07))
    return out


KICK = kick()
SNARE = [a * 0.8 + b * 0.35 for a, b in zip(noise(0.14, 2, 0.045), tone(196, 0.14, "tri", shape="stab"))]
HAT = noise(0.04, 1, 0.012)

# ---------- 混音台 ----------
STEMS = ["lead", "arp", "bass", "drums", "sfx", "voice"]
MIX = {name: (array("f", bytes(4 * N)), array("f", bytes(4 * N))) for name in STEMS}


def put(stem: str, at: float, samples: list[float], gain: float = 1.0, pan: float = 0.0) -> None:
    """把一段声音放到某一轨的某个时刻。pan：-1 最左，1 最右。"""
    start = int(at * SR)
    if start < 0 or start >= N:
        return
    seg = samples[: N - start]
    end = start + len(seg)
    left, right = MIX[stem]
    gl = gain * min(1.0, 1 - pan)
    gr = gain * min(1.0, 1 + pan)
    left[start:end] = array("f", [a + b * gl for a, b in zip(left[start:end], seg)])
    right[start:end] = array("f", [a + b * gr for a, b in zip(right[start:end], seg)])


def play(stem: str, start: float, tokens: list[str], gain: float, kind: str = "pulse", duty: float = 0.25,
         shape: str = "hold", vibrato: float = 0.0, shift: int = 0, pan: float = 0.0, step: float = STEP,
         echo: float = 0.0) -> None:
    """按十六分音符的格子排一串音：音名是起音，"-" 是延长，"." 是休止。"""
    i = 0
    while i < len(tokens):
        if tokens[i] in (".", "-"):
            i += 1
            continue
        j = i + 1
        while j < len(tokens) and tokens[j] == "-":
            j += 1
        sound = tone(freq(tokens[i], shift), (j - i) * step * 0.94, kind, duty, shape, vibrato)
        put(stem, start + i * step, sound, gain, pan)
        if echo:
            put(stem, start + i * step + 3 * STEP, sound, gain * echo, -pan if pan else 0.5)
        i = j


def drums(start: float, pattern: str, gain: float = 1.0) -> None:
    for i, hit in enumerate(pattern):
        at = start + i * STEP
        if hit == "K":
            put("drums", at, KICK, 0.95 * gain)
        elif hit == "S":
            put("drums", at, SNARE, 0.6 * gain)
        elif hit == "h":
            put("drums", at, HAT, 0.3 * gain, 0.3)
        elif hit == "H":
            put("drums", at, HAT, 0.45 * gain, 0.3)


# ---------- 曲子 ----------
# 主题一（八小节，A 大调）：见面、介绍自己时用
THEME_A = [
    ("A", "E5 - C#5 - A4 - C#5 E5 F#5 - E5 - C#5 - . ."),
    ("F#m", "F#5 - C#5 - A4 - C#5 F#5 A5 - F#5 - C#5 - . ."),
    ("D", "F#5 - D5 - A4 - D5 F#5 A5 - B5 - A5 - F#5 -"),
    ("E", "G#5 - E5 - B4 - E5 G#5 B5 - - - . . E5 G#5"),
    ("A", "A5 - E5 - C#5 - E5 A5 C#6 - A5 - E5 - . ."),
    ("F#m", "A5 - F#5 - C#5 - F#5 A5 C#6 - B5 - A5 - F#5 -"),
    ("D", "F#5 - D5 - F#5 - A5 - G#5 - E5 - G#5 - B5 -"),
    ("A", "A5 - - - E5 - C#5 - A4 - - - . . . ."),
]
# 主题二（八小节）：赶路、干活时用，附点节奏
THEME_B = [
    ("D", "A5 - - F#5 - - D5 - F#5 - - A5 - - . ."),
    ("E", "B5 - - G#5 - - E5 - G#5 - - B5 - - . ."),
    ("C#m", "G#5 - - E5 - - C#5 - E5 - G#5 - E5 - C#5 -"),
    ("F#m", "F#5 - - - C#5 - A4 - C#5 - F#5 - - - . ."),
    ("D", "A5 - - F#5 - - D5 - F#5 - - A5 - - D6 -"),
    ("E", "B5 - - G#5 - - E5 - G#5 - - B5 - - E6 -"),
    ("A", "C#6 - A5 - E5 - A5 - C#6 - E6 - C#6 - A5 -"),
    ("A", "A5 - - - - - . . E5 - A5 - - - . ."),
]
# 小调的一段：灯暗下来说实话时用，音拉得很长
THEME_C = [
    ("F#m", "C#5 - - - - - - - F#5 - - - - - - -"),
    ("D", "E5 - - - - - - - D5 - - - - - - -"),
    ("A", "C#5 - - - - - - - E5 - - - - - - -"),
    ("E", "B4 - - - - - - - - - - - . . . ."),
    ("F#m", "C#5 - - - - - - - A5 - - - - - - -"),
    ("D", "F#5 - - - - - - - E5 - - - D5 - - -"),
    ("A", "C#5 - - - - - - - E5 - - - - - - -"),
    ("E", "E5 - - - - - - - G#5 - - - - - - -"),
    ("D", "A5 - - - - - - - F#5 - - - - - - -"),
    ("E", "G#5 - - - - - - - B5 - - - - - - -"),
]

GROOVE = "K.h.S.h.K.hhS.h."
LIGHT = "K.h...h.K.h...h."
BUSY = "K.hhS.hhK.hhS.hH"
TICKS = "..h...h...h...h."


def bass_bar(chord: str, style: str) -> list[str]:
    root = CHORDS[chord][0]
    fifth = CHORDS[chord][2]
    low = f"{root}2"
    high = f"{root}3"
    if style == "walk":
        return [low, "-", ".", low, high, "-", low, "-", f"{fifth}2", "-", ".", low, high, "-", f"{fifth}2", "-"]
    if style == "long":
        return [low] + ["-"] * 15
    return [low, "-", high, "-"] * 4


def arp_bar(chord: str, octave: int = 4) -> list[str]:
    a, b, c = CHORDS[chord]
    # 和弦音从低到高排，保证一路向上
    order = sorted([a, b, c], key=lambda name: (NAMES[name] - NAMES[a]) % 12)
    notes = []
    for name in order:
        up = 1 if NAMES[name] < NAMES[a] else 0
        notes.append(f"{name}{octave + up}")
    return [notes[0], notes[1], notes[2], notes[1]] * 4


def section(start: float, bars: list[tuple[str, str]], lead: float = 0.32, duty: float = 0.25, shift: int = 0,
            bass: str = "bounce", bass_gain: float = 0.62, arp: float = 0.2, beat: str = GROOVE, drum_gain: float = 1.2,
            lead_shape: str = "hold", layers: list[tuple[bool, bool, bool, bool]] | None = None) -> float:
    """把若干小节排进去，返回结束的时刻。layers 可以逐小节决定要不要旋律、分解和弦、低音、鼓。"""
    for k, (chord, melody) in enumerate(bars):
        at = start + k * BAR
        with_lead, with_arp, with_bass, with_drums = layers[k] if layers else (True, True, True, True)
        if with_lead and lead:
            play("lead", at, melody.split(), lead, "pulse", duty, lead_shape, vibrato=1.0, shift=shift)
        if with_arp and arp:
            play("arp", at, arp_bar(chord), arp, "pulse", 0.5, "stab", shift=shift, pan=-0.35, echo=0.4)
        if with_bass:
            play("bass", at, bass_bar(chord, bass), bass_gain, "tri", shape="hold" if bass == "long" else "pluck", shift=shift)
        if with_drums and beat:
            drums(at, beat, drum_gain)
    return start + len(bars) * BAR


def fill(start: float, end: float, up: bool = True) -> None:
    """两段之间的过门：一串越打越密的小鼓，加一个滑上去（或滑下来）的音。"""
    span = end - start
    if span < 0.12:
        return
    hits = max(2, int(span / STEP))
    for i in range(hits):
        put("drums", start + i * span / hits, SNARE, 0.25 + 0.4 * i / hits)
    put("sfx", start, tone(freq("A4" if up else "A5"), span, "pulse", 0.25, "soft", slide=12 if up else -19), 0.2)


# ---------- 音效 ----------
def blip(at: float, name: str, seconds: float = 0.07, slide: float = 0.0, gain: float = 0.3, duty: float = 0.25) -> None:
    put("sfx", at, tone(freq(name), seconds, "pulse", duty, "stab", slide=slide), gain)


def ding(at: float, low: str = "E6", high: str = "A6", gain: float = 0.3) -> None:
    put("sfx", at, tone(freq(low), 0.09, "tri", shape="pluck"), gain)
    put("sfx", at + 0.08, tone(freq(high), 0.32, "tri", shape="pluck"), gain)


def buzz(at: float, gain: float = 0.3) -> None:
    put("sfx", at, tone(freq("A2"), 0.26, "pulse", 0.5, "hold"), gain)
    put("sfx", at, tone(freq("D#3"), 0.26, "pulse", 0.5, "hold"), gain * 0.8)


def thud(at: float, gain: float = 0.7) -> None:
    put("sfx", at, KICK, gain)


def boing(at: float, gain: float = 0.3) -> None:
    put("sfx", at, tone(freq("A4"), 0.2, "sine", shape="soft", slide=14), gain)


def whoosh(at: float, seconds: float = 0.5, gain: float = 0.3) -> None:
    put("sfx", at, noise(seconds, 2, 0.1, swell=True), gain)


def tick(at: float, gain: float = 0.22) -> None:
    put("sfx", at, HAT, gain)


def sparkle(at: float, gain: float = 0.26) -> None:
    for i, name in enumerate(["A5", "C#6", "E6", "A6", "C#7"]):
        put("sfx", at + i * 0.055, tone(freq(name), 0.16, "tri", shape="pluck"), gain)


def compose() -> None:
    s = STARTS

    # 开场：对话框那一页只有很轻的分解和弦；火花落地、小家伙长出来的那一下，鼓和旋律才进来
    for k in range(3):
        play("arp", 0.3 + k * BAR, arp_bar("A" if k % 2 == 0 else "D", 5), 0.16, "pulse", 0.5, "stab", pan=-0.35, echo=0.4)
    tick_times = [0.95 + i * 0.17 for i in range(8)]
    for at in tick_times:
        tick(at)
    blip(0.3, "E5", slide=5)
    blip(2.75, "A5", 0.12, slide=7)
    put("sfx", 4.5, tone(freq("A4"), 0.45, "pulse", 0.25, "soft", slide=12), 0.24)
    whoosh(4.5, 0.45, 0.2)
    thud(4.95)
    sparkle(4.95)
    end = section(4.95, THEME_A[:4])
    fill(end, s[1] + 0.15)
    # 树、花、云、太阳一样一样弹起来
    for k in range(6):
        blip(4.9 + k * 0.1, ["A4", "C#5", "E5", "A5", "C#6", "E6"][k], gain=0.13, duty=0.5)
    ding(8.75)
    boing(10.75)
    sparkle(11.2, 0.2)

    # 我是什么
    at = s[1] + 0.15
    end = section(at, THEME_A)
    fill(end, s[2] + 0.15)
    buzz(s[1] + 1.35)
    buzz(s[1] + 1.95)
    thud(s[1] + 3.1, 0.5)
    whoosh(s[1] + 3.3, 2.6, 0.12)
    ding(s[1] + 6.35, "A5", "E6", 0.2)
    for k in range(3):
        blip(s[1] + 7.5 + k * 0.16, ["E5", "D5", "C#5"][k], gain=0.2)
    ding(s[1] + 9.7)
    boing(s[1] + 9.25)
    for k, moment in enumerate([10.1, 10.45, 10.85, 11.25]):
        blip(s[1] + moment, ["A5", "B5", "C#6", "E6"][k], gain=0.22)
    for k, moment in enumerate([13.15, 13.45, 14.0]):
        blip(s[1] + moment, ["E5", "A5", "C#6"][k], 0.1, gain=0.24)

    # 一路长大：换成附点节奏的主题二，低音像走路
    at = s[2] + 0.15
    end = section(at, THEME_B + THEME_B[:2], bass="walk", beat=LIGHT)
    fill(end, s[3] + 0.15)
    for k, moment in enumerate([3.3, 5.5, 8.4, 10.7, 13.0, 14.5]):
        blip(s[2] + moment + 0.15, "E5", 0.09, slide=5, gain=0.18, duty=0.5)
    # 学会的本事飞进顶上的格子：一格比一格高
    for k, moment in enumerate([4.3, 7.2, 9.5, 11.9, 13.6, 15.4]):
        ding(s[2] + moment + 0.55, "E6", ["A6", "B6", "C#7", "D7", "E7", "F#7"][k], 0.2)
    for k in range(6):
        blip(s[2] + 16.65 + k * 0.2, ["A4", "B4", "C#5", "E5", "F#5", "A5"][k], gain=0.24, duty=0.5)
    sparkle(s[2] + 17.65)

    # 一家四口：底下的鼓和低音不停，上面的旋律一人一句，各有各的声音
    at = s[3] + 0.15
    family = [("A", ""), ("F#m", ""), ("D", ""), ("E", ""), ("A", ""), ("F#m", ""), ("D", ""), ("E", ""), ("A", "")]
    end = section(at, family, lead=0, arp=0.14)
    fill(end, s[4] + 0.15)
    # Haiku：又高又快的一串
    haiku = s[3] + 3.2
    whoosh(haiku, 0.6, 0.3)
    run = ["A5", "C#6", "E6", "A6", "E6", "C#6"] * 6
    play("lead", haiku + 0.2, run[:28], 0.24, "pulse", 0.125, "stab", step=STEP / 2)
    play("lead", haiku + 1.9, "E6 . A6 . E6 . C#6 . A5 - - -".split(), 0.25, "pulse", 0.125, "stab")
    # Sonnet：不高不低，一拍一个音，稳稳的
    sonnet = s[3] + 6.5
    play("lead", sonnet, "A4 - - - C#5 - - - E5 - - - C#5 - - - D5 - - - F#5 - - - E5 - - - - - - -".split(),
         0.3, "pulse", 0.25, "hold", vibrato=1.0)
    # Fable：很低、很慢的几个长音
    fable = s[3] + 9.6
    play("lead", fable, "A2 - - - - - - - - - - - E3 - - - - - - - - - - - A3 - - - - - - -".split(),
         0.4, "pulse", 0.5, "soft", vibrato=1.6)
    # Opus：主题一的头两小节，音色最宽
    opus = s[3] + 12.5
    play("lead", opus, (THEME_A[0][1] + " " + THEME_A[1][1]).split(), 0.32, "pulse", 0.5, "hold", vibrato=1.0)
    play("lead", opus, (THEME_A[0][1] + " " + THEME_A[1][1]).split(), 0.14, "pulse", 0.25, "hold", shift=-12)
    boing(s[3] + 15.5)
    sparkle(s[3] + 15.9)

    # 我，Opus 5.5：主题一整体升高一个全音，鼓更密
    at = s[4] + 0.15
    end = section(at, THEME_A + THEME_A[:2], shift=2, beat=BUSY)
    fill(end, s[5] + 0.15, up=False)
    for k in range(9):
        tick(s[4] + 0.85 + k * 0.12, 0.2)
    thud(s[4] + 2.0, 0.5)
    blip(s[4] + 3.05, "E6", 0.1, slide=5)
    sparkle(s[4] + 7.0, 0.2)
    for k in range(5):
        thud(s[4] + 5.15 + k * 0.3 + 0.35, 0.45)
    for moment in [10.0, 10.8, 11.4]:
        for k in range(4):
            tick(s[4] + moment + k * 0.08, 0.3)
    for k, moment in enumerate([13.15, 13.85, 14.75, 15.45, 16.05]):
        ding(s[4] + moment, "E6", ["A6", "B6", "C#7", "E7", "A7"][k], 0.2)
    sparkle(s[4] + 16.05, 0.2)
    sparkle(s[4] + 18.25)

    # 老实交代：鼓停了，只留长低音、很轻的分解和弦和一条慢旋律
    at = s[5] + 0.15
    end = section(at, THEME_C, lead=0.17, duty=0.5, bass="long", bass_gain=0.3, arp=0.09, beat=TICKS, drum_gain=0.5,
                  lead_shape="soft")
    fill(end, s[6] + 0.15)
    ding(s[5] + 3.5, gain=0.2)
    buzz(s[5] + 4.75, 0.34)
    for k in range(3):
        blip(s[5] + 8.6 + k * 0.16, ["E5", "C#5", "E5"][k], gain=0.16, duty=0.5)
    blip(s[5] + 11.5, "A5", 0.1, slide=4, gain=0.2, duty=0.5)
    put("sfx", s[5] + 13.7, tone(freq("E5"), 0.18, "tri", shape="pluck"), 0.26)
    put("sfx", s[5] + 13.9, tone(freq("G#5"), 0.4, "tri", shape="pluck", slide=1), 0.26)
    ding(s[5] + 17.4, "A5", "E6", 0.22)

    # 这支片子：先只有「敲键盘」似的分解和弦，再一层一层加回低音、鼓和旋律
    at = s[6] + 0.15
    layers = [(False, True, False, True)] * 2 + [(False, True, True, True)] * 2 + [(True, True, True, True)] * 4
    end = section(at, THEME_B, bass="walk", layers=layers)
    fill(end, s[7] + 0.15)
    whoosh(s[6] + 9.7, 0.6, 0.22)
    for k, moment in enumerate([10.3, 10.6, 11.25, 11.55]):
        ding(s[6] + moment, "E6", ["A6", "B6", "C#7", "E7"][k], 0.2)
    buzz(s[6] + 10.95, 0.3)
    boing(s[6] + 13.25)
    ding(s[6] + 13.55, "E6", "A7", 0.24)
    sparkle(s[6] + 13.8)

    # 结尾：主题一的后四小节，落在主音上，再往上撒一串亮晶晶的音
    at = s[7] + 0.15
    end = section(at, THEME_A[4:])
    sparkle(s[7] + 2.5)
    for moment in [2.6, 3.0, 3.45, 8.2, 8.5]:
        put("sfx", s[7] + moment, noise(0.3, 3, 0.09), 0.3)
        sparkle(s[7] + moment + 0.05, 0.16)
    blip(s[7] + 5.3, "E5", slide=5)
    sparkle(s[7] + 6.5, 0.2)
    for name, pan in (("A3", 0.0), ("E4", -0.4), ("A4", 0.4), ("C#5", 0.0)):
        put("lead", end, tone(freq(name), 1.6, "pulse", 0.5, "pluck"), 0.22, pan)
    sparkle(end + 0.1, 0.3)
    thud(end, 0.8)


# ---------- 说话声 ----------
# 每句话开口时的一小声：三个很短的音。几种走向轮着用，免得句句一样
CHIRPS = [
    ["A4", "C#5", "E5"],
    ["E5", "C#5", "E5"],
    ["C#5", "E5", "A5"],
    ["E5", "A4", "C#5"],
    ["A4", "E5", "C#5"],
]


def speak() -> None:
    """每句话只在开口的那一刻响一小声「叽咕」；问句的最后一个音往上扬。"""
    count = 0
    for index, chapter in enumerate(script["chapters"]):
        for line in chapter["lines"]:
            notes = CHIRPS[count % len(CHIRPS)]
            asking = "？" in line["text"]
            at = STARTS[index] + line["at"]
            for i, name in enumerate(notes):
                last = i == len(notes) - 1
                sound = tone(freq(name), 0.09 if last else 0.065, "pulse", 0.5, "stab",
                             slide=5 if asking and last else 1.5)
                put("voice", at + i * 0.07, sound, 0.5)
            count += 1


# ---------- 出声 ----------
def rms(samples: array, start: float = 0.0, end: float | None = None) -> float:
    a = int(start * SR)
    b = len(samples) if end is None else int(end * SR)
    seg = samples[a:b]
    if not seg:
        return -120.0
    power = sum(v * v for v in seg) / len(seg)
    return 10 * math.log10(power) if power > 0 else -120.0


def smooth(samples: array, cutoff: float) -> array:
    """一阶低通：把方波最刺耳的那一截高频压下去。"""
    k = 1 - math.exp(-2 * math.pi * cutoff / SR)
    out = array("f", bytes(4 * len(samples)))
    y = 0.0
    for i, v in enumerate(samples):
        y += k * (v - y)
        out[i] = y
    return out


def save(path: Path, left: array, right: array, peak: float) -> None:
    top = max(max(abs(v) for v in left), max(abs(v) for v in right), 1e-9)
    scale = peak / top * 32767
    frames = array("h", bytes(4 * len(left)))
    frames[0::2] = array("h", [int(v * scale) for v in left])
    frames[1::2] = array("h", [int(v * scale) for v in right])
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes(frames.tobytes())


def main() -> None:
    compose()
    speak()
    for name in STEMS:
        left = MIX[name][0]
        print(f"{name:6s} 整体 {rms(left):6.1f} dB  峰值 {max(abs(v) for v in left):.2f}")
    music = [array("f", [a + b + c + d + e for a, b, c, d, e in zip(*(MIX[name][side] for name in STEMS[:5]))])
             for side in (0, 1)]
    music = [smooth(channel, 7500) for channel in music]
    voice = [smooth(MIX["voice"][side], 5200) for side in (0, 1)]
    for i, start in enumerate(STARTS):
        end = STARTS[i + 1] if i + 1 < len(STARTS) else TOTAL
        print(f"第 {i + 1} 段 {start:6.1f}–{end:6.1f} 秒  配乐 {rms(music[0], start, end):6.1f} dB  说话 {rms(voice[0], start, end):6.1f} dB")
    save(OUT / "bgm.wav", music[0], music[1], 0.8)
    save(OUT / "voice.wav", voice[0], voice[1], 0.6)
    print(f"已写出 {OUT / 'bgm.wav'} 和 voice.wav，共 {TOTAL:.1f} 秒")


if __name__ == "__main__":
    main()
