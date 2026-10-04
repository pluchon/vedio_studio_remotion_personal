"""《那一天》的配乐：G 大调，每分钟 120 拍，轻快。
低音提琴和大提琴拨弦打「咚、嚓」的底，小提琴拨弦垫在反拍上；马林巴奏主题，后半加长笛断奏；
月亮那一段慢下来，换成卡林巴和竖琴的分解和弦；地球转圈时木琴一路往上跑，铃鼓滚奏加吊镲渐强，落在一下齐奏和拍手上。

用法：python tools/that-day/music.py [片长秒数，默认 68]
片长随留言的字数变（见 theme.ts 的 totalSeconds）：留言卡那一段按片长排小节数，收尾的三下落在片子结束前三秒。

乐器采样来自 VCSL 和 VSCO 2 CE（都是 CC0），放在 samples/ 下（整库解压，或用 tools/common/fetch_samples.py 按需下载）。
纯 Python 实现，不依赖 numpy；需要 PATH 上有 ffmpeg。输出 public/that-day/audio/bgm.wav
"""
from __future__ import annotations

import math
import operator
import os
import random
import re
import subprocess
import sys
import tempfile
import wave
from array import array
from itertools import repeat
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "that-day" / "audio" / "bgm.wav"
FILM = float(sys.argv[1]) if len(sys.argv) > 1 else 68.0
# 比片子多合成两秒，让最后一个音自然收完
DURATION = FILM + 2.0


def library(name: str) -> Path:
    """采样库的位置：整库解压出来会多一层 <库名>-master"""
    base = ROOT / "samples" / name
    nested = base / f"{name}-master"
    return nested if nested.exists() else base


VCSL = library("VCSL")
VSCO = library("VSCO-2-CE")

# 和 src/videos/that-day/theme.ts 的 PARTS 一致
SKY, MOON, YEAR, ORBIT, CARD = 6.0, 27.0, 38.0, 48.0, 57.0
# Orbit.tsx 里的两段：飞到那一天、一圈圈转到今天
ARRIVE = (ORBIT + 0.6, ORBIT + 2.8)
LAPS = (ORBIT + 4.8, ORBIT + 7.6)

SR = 44100
N = int(SR * DURATION)
random.seed(20261003)
BEAT = 0.5
BAR = BEAT * 4
# 左右声道交错存放
mix = array("f", bytes(4 * 2 * N))

PITCH = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def scan(folder: Path, pattern: str) -> dict[int, Path]:
    """把一个乐器文件夹里的采样按音高排好。这两个库的文件名都把中央 C 记作 C3，比通行的记法低一个八度"""
    found: dict[int, Path] = {}
    for path in sorted(folder.glob("*.wav")):
        hit = re.search(pattern, path.name)
        if hit:
            midi = PITCH[hit.group(1)[0]] + ("#" in hit.group(1)) + 12 * (int(hit.group(2)) + 2)
            found.setdefault(midi, path)
    if not found:
        sys.exit(f"{folder} 里没找到采样（{pattern}），先把采样库放到 samples/ 下")
    return found


NOTE = r"_([A-G]#?)(\d)_"
BASS = scan(VSCO / "Strings" / "Solo Contrabass" / "Pizz", NOTE + "v1_rr1")
CELLO = scan(VSCO / "Strings" / "Cello Section" / "pizzT", NOTE + "v1_RR1")
VIOLIN = scan(VSCO / "Strings" / "Violin Section" / "Pizz", NOTE + "v1_rr1")
FLUTE = scan(VSCO / "Woodwinds" / "Flute" / "stac", NOTE + "v2_rr1")
HARP = scan(VSCO / "Strings" / "Harp", r"_([A-G]#?)(\d)_m[fp]")
MARIMBA = scan(VCSL / "Idiophones" / "Struck Idiophones" / "Marimba", NOTE + "med")
XYLO = scan(VCSL / "Idiophones" / "Struck Idiophones" / "Xylophone" / "Medium Mallets", NOTE + "pp")
KALIMBA = scan(VCSL / "Idiophones" / "Plucked Idiophones" / "Kalimba, Kenya", NOTE + "k")
GLOCK = scan(VCSL / "Idiophones" / "Struck Idiophones" / "Glockenspiel", r"glock_soft_([A-G]#?)(\d)_")

STRUCK = VCSL / "Idiophones" / "Struck Idiophones"
PERC = {
    "down": STRUCK / "Shaker, Small" / "Mid_ShakerHighFaster_Down_rr1.wav",
    "up": STRUCK / "Shaker, Small" / "Mid_ShakerHighFaster_Up_rr1.wav",
    "clap1": STRUCK / "Claps" / "Clap_rr1.wav",
    "clap2": STRUCK / "Claps" / "Clap_rr3.wav",
    "block": STRUCK / "Woodblock" / "wood_click_mp.wav",
    "triangle": STRUCK / "Triangles" / "Triangle1_Hit_v1_rr1_Mid.wav",
    "tamb": STRUCK / "Tambourine 1" / "Tamb1_Hit_v1_rr1_Mid.wav",
    "roll": STRUCK / "Tambourine 1" / "Tamb1_Roll_v2_rr1_Mid.wav",
    "swell": VSCO / "Percussion" / "susCymb1-cresc-Median_v1.wav",
}
# 打击乐各自的音量：采样都归一到了同一个峰值，但沙锤、拍手这种一下就没的声音，同样的峰值听起来轻得多
LEVEL = {"down": 4.0, "up": 4.0, "clap1": 2.0, "clap2": 2.0, "block": 2.5, "triangle": 2.2, "tamb": 2.8, "roll": 2.2, "swell": 1.7}
# 吊镲渐强的采样在第几秒到顶
SWELL_PEAK = 3.7

cache: dict[tuple[str, int, float], array] = {}


def sample(path: Path, shift: int, seconds: float) -> array:
    """读一个采样并移调：交给 ffmpeg 变速重采样，拿回 44.1k 立体声的浮点数"""
    key = (str(path), shift, seconds)
    if key not in cache:
        if not path.exists():
            sys.exit(f"缺采样 {path}")
        rate = SR * 2 ** (shift / 12)
        raw = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(path), "-af", f"aresample={SR},asetrate={rate:.3f},aresample={SR}",
             "-t", f"{seconds:.3f}", "-ac", "2", "-f", "f32le", "-"],
            capture_output=True,
            check=True,
        ).stdout
        data = array("f")
        data.frombytes(raw)
        # 各个采样录的音量差得很远，先都拉到同一个峰值，轻重交给调用的地方
        top = max(max(data), -min(data)) or 1.0
        cache[key] = array("f", map(operator.mul, data, repeat(0.5 / top)))
    return cache[key]


def place(data: array, start: float, gain: float, pan: float, seconds: float, attack: float = 0.0, release: float = 0.12) -> None:
    """把一段声音加进总谱：按时长截断，头尾做淡入淡出，左右按声像分配"""
    frames = min(len(data) // 2, int(seconds * SR))
    pos = int(start * SR)
    if pos < 0:
        return
    frames = min(frames, N - pos)
    if frames <= 0:
        return
    a = int(attack * SR)
    r = min(frames, int(release * SR))
    env = array("f", repeat(1.0, frames))
    for i in range(min(a, frames)):
        env[i] = i / a
    for i in range(r):
        env[frames - 1 - i] *= i / r
    pan = max(-0.8, min(0.8, pan))
    for channel, side in ((0, gain * (1 - pan)), (1, gain * (1 + pan))):
        src = data[channel : frames * 2 : 2]
        shaped = map(operator.mul, map(operator.mul, src, env), repeat(side))
        span = slice(pos * 2 + channel, (pos + frames) * 2, 2)
        mix[span] = array("f", map(operator.add, mix[span], shaped))


def play(table: dict[int, Path], midi: int, start: float, gain: float, pan: float, seconds: float, loose: float = 0.008) -> None:
    base = min(table, key=lambda m: abs(m - midi))
    data = sample(table[base], midi - base, seconds)
    place(data, start + random.uniform(-loose, loose), gain * random.uniform(0.9, 1.05), pan, seconds)


def perc(name: str, start: float, gain: float, pan: float = 0.0, seconds: float = 1.5, attack: float = 0.0, release: float = 0.1) -> None:
    place(sample(PERC[name], 0, seconds), start, gain * LEVEL[name], pan, seconds, attack, release)


# 各声部的音量和左右位置
def bass(midi: int, start: float, vel: float = 1.0) -> None:
    play(BASS, midi, start, 0.36 * vel, 0.1, 1.2)


def cello(midi: int, start: float, vel: float = 1.0) -> None:
    play(CELLO, midi, start, 0.25 * vel, 0.3, 0.9)


def violin(midi: int, start: float, vel: float = 1.0) -> None:
    play(VIOLIN, midi, start, 0.22 * vel, -0.4, 0.7)


def marimba(midi: int, start: float, vel: float = 1.0) -> None:
    play(MARIMBA, midi, start, 0.5 * vel, -0.15, 1.6)


def xylo(midi: int, start: float, vel: float = 1.0) -> None:
    play(XYLO, midi, start, 0.7 * vel, 0.2, 1.2)


def flute(midi: int, start: float, vel: float = 1.0) -> None:
    play(FLUTE, midi, start, 0.34 * vel, 0.35, 0.6)


def kalimba(midi: int, start: float, vel: float = 1.0) -> None:
    play(KALIMBA, midi, start, 0.7 * vel, -0.1, 2.4)


def harp(midi: int, start: float, vel: float = 1.0) -> None:
    play(HARP, midi, start, 0.085 * vel, (midi - 67) / 40, 2.6, 0.012)


def glock(midi: int, start: float, vel: float = 1.0) -> None:
    play(GLOCK, midi, start, 0.3 * vel, 0.45, 2.6)


# 和弦：低音的根音与五音，中间的两个和弦音，上面的三个和弦音
CHORDS = {
    "G": ((43, 38), (59, 62), (67, 71, 74)),
    "Em": ((40, 47), (55, 59), (67, 71, 76)),
    "C": ((36, 43), (55, 60), (67, 72, 76)),
    "D": ((38, 45), (54, 57), (66, 69, 74)),
    "Bm": ((47, 42), (54, 59), (66, 71, 74)),
    "Am": ((45, 40), (57, 60), (69, 72, 76)),
}


def groove(start: float, chord: str, full: bool = True, claps: bool = False, vel: float = 1.0) -> None:
    """一小节的底：一三拍低音，二四拍大提琴拨弦，反拍上小提琴拨弦，沙锤打八分音符"""
    low, mid, high = CHORDS[chord]
    bass(low[0], start, vel)
    bass(low[1], start + 2 * BEAT, 0.85 * vel)
    for b in (1, 3):
        for m in mid:
            cello(m, start + b * BEAT, vel)
    for b in range(4):
        perc("down", start + b * BEAT, 0.1 * vel, -0.3, 0.3)
        perc("up", start + (b + 0.5) * BEAT, 0.07 * vel, -0.3, 0.3)
        if full:
            for m in high[1:]:
                violin(m, start + (b + 0.5) * BEAT, vel)
    if claps:
        perc("clap1", start + BEAT, 0.3 * vel, 0.25, 0.7)
        perc("clap2", start + 3 * BEAT, 0.3 * vel, 0.25, 0.7)
    else:
        perc("block", start + 3 * BEAT, 0.12 * vel, 0.4, 0.4)


Notes = list[tuple[float, int]]

# 主题：两句，各四小节
THEME: list[tuple[str, Notes]] = [
    ("G", [(0, 71), (0.5, 74), (1, 79), (2, 76), (2.5, 74), (3, 71)]),
    ("Em", [(0, 76), (1, 79), (1.5, 76), (2, 71), (3, 74)]),
    ("C", [(0, 72), (0.5, 76), (1, 79), (2, 84), (2.5, 79), (3, 76)]),
    ("D", [(0, 74), (1, 78), (1.5, 81), (2, 78), (3, 74)]),
]
ANSWER: list[tuple[str, Notes]] = [
    ("G", [(0, 83), (0.5, 81), (1, 79), (2, 74), (2.5, 79), (3, 83)]),
    ("Em", [(0, 88), (1, 83), (1.5, 79), (2, 76), (3, 79)]),
    ("C", [(0, 84), (0.5, 79), (1, 76), (2, 79), (2.5, 84), (3, 88)]),
    ("D", [(0, 86), (1, 81), (1.5, 78), (2, 74), (2.5, 78), (3, 81)]),
]

# 片头：三小节，只有低音、沙锤和几下马林巴，第三小节把人领进来
for bar, chord in enumerate(["G", "G", "D"]):
    t0 = bar * BAR
    low = CHORDS[chord][0]
    bass(low[0], t0, 0.8)
    bass(low[1], t0 + 2 * BEAT, 0.7)
    if bar:
        for b in range(4):
            perc("down", t0 + b * BEAT, 0.08, -0.3, 0.3)
            perc("up", t0 + (b + 0.5) * BEAT, 0.06, -0.3, 0.3)
for at, midi in [(0.0, 79), (1.0, 74), (2.0, 71), (4.0, 79), (5.0, 83), (5.5, 86), (8.0, 74), (9.0, 78), (10.0, 81), (11.0, 86)]:
    marimba(midi, at * BEAT, 0.8)
perc("triangle", 2 * BAR + 3 * BEAT, 0.14, 0.5, 2.0)

# 天空：主题一遍，答句一遍（加长笛），再收两小节
for i, (chord, notes) in enumerate(THEME):
    t0 = SKY + i * BAR
    groove(t0, chord, full=False)
    for at, midi in notes:
        marimba(midi, t0 + at * BEAT)
for i, (chord, notes) in enumerate(ANSWER):
    t0 = SKY + (4 + i) * BAR
    groove(t0, chord)
    for at, midi in notes:
        marimba(midi, t0 + at * BEAT)
        flute(midi, t0 + at * BEAT)
    perc("tamb", t0 + BEAT, 0.12, 0.3, 0.6)
    perc("tamb", t0 + 3 * BEAT, 0.12, 0.3, 0.6)
t0 = SKY + 8 * BAR
groove(t0, "G")
for at, midi in [(0, 83), (0.5, 86), (1, 91), (2, 86), (3, 83)]:
    marimba(midi, t0 + at * BEAT)
    flute(midi, t0 + at * BEAT)
t0 = SKY + 9 * BAR
groove(t0, "D", full=False)
for at, midi in [(0, 81), (1, 78), (2, 74), (3, 69)]:
    marimba(midi, t0 + at * BEAT)
# 入夜前的过门：低音往下走三步
for i, midi in enumerate([38, 36, 35]):
    bass(midi, SKY + 10 * BAR + i * 0.33, 0.8)
perc("triangle", SKY + 10 * BAR, 0.14, 0.5, 2.5)

# 月亮：慢下来。竖琴的分解和弦，卡林巴唱旋律，每小节第四拍一下三角铁
NIGHT: list[tuple[str, Notes]] = [
    ("Em", [(0, 76), (2, 79), (3, 83)]),
    ("C", [(0, 79), (2, 76), (3, 72)]),
    ("G", [(0, 74), (1, 79), (2, 83), (3, 81)]),
    ("D", [(0, 78), (2, 74), (3, 69)]),
    ("Em", [(0, 71), (2, 76)]),
]
for i, (chord, notes) in enumerate(NIGHT):
    t0 = MOON + i * BAR
    low, mid, high = CHORDS[chord]
    bass(low[0], t0, 0.7)
    ladder = [low[0] + 12, mid[0], mid[1], high[0], high[1], high[2], high[1], high[0]]
    for step, midi in enumerate(ladder):
        harp(midi, t0 + step * BEAT / 2, 0.9 if step else 1.1)
    for at, midi in notes:
        kalimba(midi, t0 + at * BEAT)
    perc("triangle", t0 + 3 * BEAT, 0.09, 0.5, 2.0)
    if i % 2 == 0:
        glock(high[2] + 24, t0 + 1.5 * BEAT, 0.7)
# 天亮似的过门：钟琴往上三个音
for i, midi in enumerate([91, 95, 98]):
    glock(midi, MOON + 5 * BAR + i * 0.3)
perc("up", MOON + 5 * BAR + 0.75, 0.08, -0.3, 0.3)

# 一年：全员加拍手，旋律交给木琴和长笛
SPRING: list[tuple[str, Notes]] = [
    ("C", [(0, 84), (0.5, 88), (1, 91), (2, 88), (2.5, 84), (3, 79)]),
    ("D", [(0, 86), (0.5, 90), (1, 93), (2, 90), (2.5, 86), (3, 81)]),
    ("Bm", [(0, 90), (1, 86), (1.5, 83), (2, 86), (3, 90)]),
    ("Em", [(0, 91), (0.5, 88), (1, 83), (2, 88), (3, 91)]),
    ("Am", [(0, 88), (0.5, 84), (1, 81), (2, 86), (2.5, 90), (3, 93)]),
]
for i, (chord, notes) in enumerate(SPRING):
    t0 = YEAR + i * BAR
    groove(t0, chord, claps=True)
    for at, midi in notes:
        xylo(midi, t0 + at * BEAT)
        flute(midi, t0 + at * BEAT, 0.9)
    perc("tamb", t0 + 1.5 * BEAT, 0.1, 0.3, 0.6)
    perc("tamb", t0 + 3.5 * BEAT, 0.1, 0.3, 0.6)

# 公转：马林巴沿着音阶往上跑，跟着地球飞到那一天，落在一下齐奏上
scale = [67, 69, 71, 72, 74, 76, 78, 79, 81, 83, 84, 86, 88, 90, 91]
for i, midi in enumerate(scale):
    marimba(midi, ARRIVE[0] + (ARRIVE[1] - ARRIVE[0]) * (i / len(scale)) ** 0.85, 0.7 + 0.02 * i)
for i in range(5):
    bass(38, ORBIT + i * BEAT, 0.8)
    perc("down", ORBIT + i * BEAT, 0.09, -0.3, 0.3)
    perc("up", ORBIT + (i + 0.5) * BEAT, 0.07, -0.3, 0.3)


def tutti(start: float, chord: str, vel: float = 1.0) -> None:
    low, mid, high = CHORDS[chord]
    bass(low[0], start, 1.1 * vel)
    for m in mid:
        cello(m, start, 1.1 * vel)
    for m in high:
        violin(m, start, 1.2 * vel)
    glock(high[0] + 24, start, 1.1 * vel)
    perc("clap1", start, 0.34 * vel, 0.2, 0.7)
    perc("triangle", start, 0.12 * vel, 0.5, 2.5)


tutti(ARRIVE[1], "G")
# 看读数的那两秒：只留底
groove(ARRIVE[1] + 0.2, "G", full=False, vel=0.8)
# 转圈：木琴越来越密、越来越高，铃鼓滚奏和吊镲渐强托着
steps = [67, 71, 74, 79, 83, 86, 91, 95, 98, 103]
t = LAPS[0]
k = 0
while t < LAPS[1] - 0.05:
    p = (t - LAPS[0]) / (LAPS[1] - LAPS[0])
    xylo(steps[min(len(steps) - 1, int(p * len(steps)) + (k % 3 == 2))], t, 0.6 + 0.5 * p)
    t += 0.25 - 0.18 * math.sin(p * math.pi / 2)
    k += 1
for i in range(6):
    bass(38, LAPS[0] + i * BEAT, 0.7)
perc("roll", LAPS[0], 0.16, 0.3, LAPS[1] - LAPS[0], attack=1.6, release=0.15)
perc("swell", LAPS[1] - SWELL_PEAK, 0.3, 0.0, SWELL_PEAK + 2.5, release=2.0)
tutti(LAPS[1], "G", 1.15)
perc("clap2", LAPS[1] + 0.02, 0.3, -0.2, 0.7)
for i, midi in enumerate([74, 78]):
    marimba(midi, CARD - (2 - i) * BEAT / 2, 0.8)

# 留言：主题再来一遍，钟琴高八度轻轻跟着；最后「咚、咚、锵」收住，留三秒让它响完
bars = max(1, int((FILM - CARD - 3.0) // BAR))
for i in range(bars):
    chord, notes = THEME[i % len(THEME)]
    t0 = CARD + i * BAR
    groove(t0, chord, vel=0.9)
    for at, midi in notes:
        marimba(midi, t0 + at * BEAT, 0.95)
        glock(midi + 12, t0 + at * BEAT, 0.4)
end = CARD + bars * BAR
tutti(end, "D", 0.9)
tutti(end + BEAT / 2, "D", 0.9)
tutti(end + BEAT, "G", 1.2)
for i, midi in enumerate([79, 83, 86, 91, 98]):
    harp(midi, end + BEAT + i * 0.05, 1.2)

peak = max(max(mix), -min(mix))
gain = 0.8 / peak


def write_wav(path: str, data: array, scale: float) -> None:
    pcm = array("h", (max(-32767, min(32767, int(v * scale * 32767))) for v in data))
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# 混响：一间不大的录音棚，尾巴短而亮，只带一点空间感，不拖泥带水
ir_len = int(0.9 * SR)
ir = array("f", bytes(4 * 2 * ir_len))
for channel in (0, 1):
    state = 0.0
    for i in range(int(0.012 * SR), ir_len):
        state += 0.6 * (random.gauss(0, 1) - state)
        ir[i * 2 + channel] = state * math.exp(-7.5 * i / ir_len)
    for ms, amount in ((7, 0.8), (13, 0.55), (19, 0.4)):
        ir[int((ms + channel * 2) * SR / 1000) * 2 + channel] += amount
ir_peak = max(max(ir), -min(ir))

OUT.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    dry = os.path.join(tmp, "dry.wav")
    wet = os.path.join(tmp, "ir.wav")
    write_wav(dry, mix, gain)
    write_wav(wet, ir, 1 / ir_peak)
    chain = (
        "afir=dry=10:wet=1.4,highpass=f=35,loudnorm=I=-16:TP=-1.5:LRA=11,"
        f"afade=t=in:d=0.2,afade=t=out:st={DURATION - 3:.2f}:d=3"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", dry, "-i", wet, "-filter_complex", f"[0][1]{chain}", "-ar", str(SR), str(OUT)],
        check=True,
    )
