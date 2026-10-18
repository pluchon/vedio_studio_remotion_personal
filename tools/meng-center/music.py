"""萌部落演示片的配乐：日系可爱的「跳音」小曲，MIDI 写谱 + 真实乐器采样（VCSL、VSCO 2 CE，CC0）渲染。

    ~/.venvs/demucs/Scripts/python.exe tools/meng-center/music.py [输出 wav]

默认输出 public/meng-center/audio/bgm.wav（不入库）。要 numpy、soundfile（demucs 那个虚拟环境里有）、ffmpeg、tools/sfizz/。

E 大调，150 BPM，四拍，八分音符做摇摆（后半拍推迟，跳着走）。一小节 1.6 秒 = 48 帧，56 小节加 2.4 秒尾巴。
乐器：竖笛（主旋律，短音用断奏采样、长音用持续采样）、钟琴（叠高八度和闪光）、弹拨琴 strumstick（像尤克里里那样扫弦）、
立式钢琴（反拍的短和弦）、大号断奏（「嘭—嚓」的低音）；打击乐是大鼓、拍手、木箱鼓、沙锤、铃鼓、三角铁、木鱼、风铃。
段落（小节）：前奏 0–3 · A 4–11 · A' 12–19 · B 20–27 · 副歌 28–35 · 副歌 36–43 · 间奏 44–51 · 尾声 52–55。
副歌是王道进行（IV–V–iii–vi）。这两个采样库的文件名都把中央 C 记作 C3，实测后统一升一个八度映射。
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from midi_render import SFIZZ, VSCO, note_number, write_midi  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
VCSL = ROOT / "samples" / "VCSL" / "VCSL-master"
BPM = 150
BEAT = 60 / BPM
BARS = 56
TAIL = 2.4
TOTAL = BARS * 4 * BEAT + TAIL
SWING = 0.64  # 后半拍落在拍内 64% 处（三连音摇摆是 67%）

# ---------------------------------------------------------------- 和弦
PC = {"E": [4, 8, 11], "F#m": [6, 9, 1], "G#m": [8, 11, 3], "A": [9, 1, 4], "B": [11, 3, 6], "C#m": [1, 4, 8]}
ROOT_PC = {"E": 4, "F#m": 6, "G#m": 8, "A": 9, "B": 11, "C#m": 1}
INTRO = ["A", "B", "G#m", "C#m"]
VERSE = ["E", "C#m", "A", "B", "E", "C#m", ["F#m", "B"], "E"]
PRE = ["A", "B", "G#m", "C#m", "F#m", "G#m", "A", "B"]
CHORUS = ["A", "B", "G#m", "C#m", "A", "B", ["F#m", "B"], "E"]
BREAK = ["E", "G#m", "A", "B", "E", "G#m", "A", "B"]
OUTRO = ["A", "B", ["F#m", "B"], "E"]
SONG = INTRO + VERSE + VERSE + PRE + CHORUS + CHORUS + BREAK + OUTRO
assert len(SONG) == BARS


def segments(bar: int) -> list[tuple[str, float, float]]:
    """这一小节的和弦段：[(和弦, 起拍, 拍数)]。"""
    c = SONG[bar]
    if isinstance(c, list):
        return [(c[0], 0.0, 2.0), (c[1], 2.0, 2.0)]
    return [(c, 0.0, 4.0)]


def chord_at(bar: int, beat: float) -> str:
    for name, s, d in segments(bar):
        if s <= beat < s + d:
            return name
    return segments(bar)[-1][0]


def voice(name: str, lo: int, hi: int) -> list[int]:
    return [k for k in range(lo, hi + 1) if k % 12 in PC[name]]


# ---------------------------------------------------------------- 旋律
def melody(text: str) -> list[tuple[float, float, int | None]]:
    """「B5:.5 G#5:.5 r:1」→ [(拍内起点, 时值, 键号或 None)]，一小节必须正好 4 拍。"""
    out, t = [], 0.0
    for tok in text.split():
        n, d = tok.split(":")
        dur = float(d)
        out.append((t, dur, None if n == "r" else note_number(n)))
        t += dur
    assert abs(t - 4) < 1e-6, (text, t)
    return out


A_TUNE = [
    "B5:.5 G#5:.5 B5:.5 E6:.5 D#6:1 B5:.5 C#6:.5",
    "E6:1 C#6:.5 B5:.5 G#5:1.5 r:.5",
    "A5:.5 C#6:.5 E6:.5 F#6:.5 E6:1 C#6:.5 A5:.5",
    "B5:1.5 A5:.5 G#5:.5 F#5:1.5",
    "B5:.5 G#5:.5 B5:.5 E6:.5 D#6:1 B5:.5 C#6:.5",
    "E6:1 F#6:.5 G#6:.5 E6:1.5 C#6:.5",
    "A5:.5 C#6:.5 B5:.5 A5:.5 G#5:.5 A5:.5 B5:.5 D#6:.5",
    "E6:2 r:2",
]
B_TUNE = [
    "C#6:1.5 B5:.5 A5:1 B5:1",
    "D#6:1.5 C#6:.5 B5:2",
    "B5:1.5 C#6:.5 D#6:2",
    "E6:1.5 D#6:.5 C#6:2",
    "A5:1 C#6:1 F#6:1.5 E6:.5",
    "D#6:1 B5:1 G#5:1 B5:1",
    "C#6:1 E6:1 F#6:1 G#6:1",
    "F#6:3 r:1",
]
HOOK = [
    "E6:.5 E6:.5 F#6:.5 E6:.5 C#6:1 B5:.5 C#6:.5",
    "D#6:1.5 E6:.5 D#6:.5 C#6:.5 B5:1",
    "B5:.5 B5:.5 C#6:.5 D#6:.5 D#6:1 C#6:.5 B5:.5",
    "C#6:1.5 B5:.5 C#6:.5 E6:.5 G#6:1",
    "E6:.5 E6:.5 F#6:.5 E6:.5 C#6:1 B5:.5 C#6:.5",
    "D#6:1 E6:.5 F#6:1.5 E6:.5 D#6:.5",
    "C#6:.5 A5:.5 C#6:.5 E6:.5 D#6:.5 B5:.5 D#6:.5 F#6:.5",
    "E6:3 r:1",
]
BREAK_TUNE = [
    "B5:.5 G#5:.5 B5:.5 E6:.5 D#6:1 B5:.5 C#6:.5",
    "D#6:1 B5:.5 G#5:.5 B5:1.5 r:.5",
    "A5:.5 C#6:.5 E6:.5 F#6:.5 E6:1 C#6:.5 A5:.5",
    "B5:.5 C#6:.5 D#6:.5 E6:.5 F#6:2",
]
OUTRO_TUNE = [HOOK[0], HOOK[1], HOOK[6], "E6:3 r:1"]

# 主旋律在哪些小节：{起始小节: 乐句}
LEAD = {4: A_TUNE, 12: A_TUNE, 20: B_TUNE, 28: HOOK, 36: HOOK, 48: BREAK_TUNE, 52: OUTRO_TUNE}


def swing(t: float) -> float:
    """八分音符的后半拍往后推。"""
    beat = int(t // 1)
    frac = t - beat
    if abs(frac - 0.5) < 1e-6:
        return beat + SWING
    if abs(frac - 0.25) < 1e-6:
        return beat + SWING / 2
    if abs(frac - 0.75) < 1e-6:
        return beat + SWING + (1 - SWING) / 2
    return t


Note = tuple[float, float, int, int]


def place(bar: int, beat: float, dur: float, key: int, vel: int) -> Note:
    start = bar * 4 + swing(beat)
    return (start, max(0.05, dur * 0.92), key, max(1, min(127, vel)))


# ---------------------------------------------------------------- 编曲
def compose() -> dict[str, list[Note]]:
    t: dict[str, list[Note]] = {k: [] for k in [
        "rec_stac", "rec_sus", "glock", "strum", "piano", "tuba",
        "kick", "clap", "cajon", "shaker", "tamb", "triangle", "wood", "chimes"]}

    # 主旋律：短音走断奏，长音走持续音
    for start, tune in LEAD.items():
        for i, line in enumerate(tune):
            bar = start + i
            for beat, dur, key in melody(line):
                if key is None:
                    continue
                accent = 8 if beat % 1 == 0 else 0
                name = "rec_sus" if dur >= 1 else "rec_stac"
                t[name].append(place(bar, beat, dur, key, 82 + accent))
                # 钟琴叠高八度：A' 和副歌、尾声
                if 12 <= bar < 20 or 28 <= bar < 44 or bar >= 52:
                    t["glock"].append(place(bar, beat, min(dur, 1.5), key + 12, 70 + accent + (8 if bar >= 28 else 0)))

    # 前奏：钟琴先把副歌的头四小节叮叮当当地预告一遍
    for i in range(4):
        for beat, dur, key in melody(HOOK[i]):
            if key is not None:
                t["glock"].append(place(i, beat, dur, key + 12, 88 if beat % 1 == 0 else 76))

    for bar in range(BARS):
        sec = ("intro" if bar < 4 else "verse1" if bar < 12 else "verse2" if bar < 20 else "pre" if bar < 28
               else "chorus" if bar < 44 else "break" if bar < 52 else "outro")
        last = bar == BARS - 1

        # 大号：一拍根音、三拍五音；两拍一换的和弦只打根音
        if sec != "intro":
            for name, s, d in segments(bar):
                root = 36 + (ROOT_PC[name] - 36) % 12
                if root < 38:
                    root += 12
                t["tuba"].append(place(bar, s, 0.5, root, 92))
                if d == 4 and not last:
                    fifth = root + 7 if root + 7 <= 50 else root - 5
                    t["tuba"].append(place(bar, 2.0, 0.5, fifth, 84))
                if sec == "pre" and d == 4:
                    t["tuba"].append(place(bar, 3.5, 0.4, root + 2, 70))  # 往下一小节走的经过音
            if last:
                t["tuba"][-1] = place(bar, 0, 2.5, 40, 96)

        # 弹拨琴扫弦：下扫 0、1、3 拍，上扫 1.5、2.5、3.5
        if sec in ("verse1", "verse2", "pre", "chorus", "outro") and not last:
            for beat, down in [(0, True), (1, True), (1.5, False), (2.5, False), (3, True), (3.5, False)]:
                notes = voice(chord_at(bar, beat), 59, 71)
                if not down:
                    notes = list(reversed(notes))[:3]
                base = 62 if sec == "verse1" else 70
                vel = base + (10 if beat == 0 else 0) - (12 if not down else 0)
                for j, k in enumerate(notes):
                    s = bar * 4 + swing(beat) + j * 0.035
                    t["strum"].append((s, 0.4, k, vel))

        # 钢琴反拍的短和弦（跳音的「嚓」）
        if sec in ("intro", "verse2", "chorus", "break", "outro") and not last:
            for beat in (0.5, 1.5, 2.5, 3.5):
                hi = 83 if (sec == "chorus" and bar >= 36) else 79
                for k in voice(chord_at(bar, beat), hi - 14, hi):
                    t["piano"].append(place(bar, beat, 0.3, k, 58 if sec != "break" else 64))
        if last:
            for k in voice("E", 52, 76):
                t["piano"].append(place(bar, 0, 4, k, 70))

        # 钟琴：B 段每小节开头一颗；间奏是分解和弦的八分音符，像消息一个个跑过去
        if sec == "pre":
            top = voice(chord_at(bar, 0), 88, 100)[-1]
            t["glock"].append(place(bar, 0, 1, top, 72))
        if sec == "break":
            tones = voice(chord_at(bar, 0), 76, 96)
            pattern = tones[:4] + list(reversed(tones[:4]))
            for j in range(8):
                t["glock"].append(place(bar, j * 0.5, 0.5, pattern[j % len(pattern)], 66 if j % 2 else 74))
        if last:
            for j, k in enumerate([88, 92, 95, 100]):
                t["glock"].append((bar * 4 + j * 0.25, 3, k, 92))

        # 鼓
        if sec in ("verse1", "verse2", "pre", "outro"):
            for b in (0, 2):
                if not (last and b == 2):
                    t["kick"].append(place(bar, b, 0.5, 36, 100 if b == 0 else 88))
        if sec == "chorus":
            for b in (0, 2, 2.5):
                t["kick"].append(place(bar, b, 0.5, 36, 104 if b == 0 else 86))
        if sec == "break":
            t["kick"].append(place(bar, 0, 0.5, 36, 90))
        if sec in ("verse2", "chorus", "outro") and not last:
            for b in (1, 3):
                t["clap"].append(place(bar, b, 0.5, 60 + (bar + b) % 4, 96))
        if sec == "verse1":
            t["clap"].append(place(bar, 3, 0.5, 60 + bar % 4, 80))
        if sec == "pre":
            for b in (1, 3):
                t["cajon"].append(place(bar, b, 0.5, 60 + bar % 2, 92))
        if (bar >= 2 and sec not in ("break",) and not last) or (sec == "break" and bar >= 48):
            for j in range(8):
                t["shaker"].append(place(bar, j * 0.5, 0.5, 60 + j % 2, 92 if j % 2 == 0 else 72))
        if sec == "chorus":
            for b in (1, 3):
                t["tamb"].append(place(bar, b, 0.5, 60, 80))
        if bar in (27, 43, 51):
            t["tamb"].append(place(bar, 2, 2, 62, 96))  # 铃鼓滚奏，引进下一段
        if sec == "break":
            for j in range(4):
                t["wood"].append(place(bar, j + 0.5, 0.3, 60 + j % 2, 84 if j % 2 == 0 else 70))
        if bar == 3:
            for j in range(4):
                t["wood"].append(place(bar, 2 + j * 0.5, 0.3, 60 + j % 2, 92))
        if (sec == "chorus" and bar % 4 == 0) or bar in (4, 20, 52) or last:
            t["triangle"].append(place(bar, 0, 2, 60, 86))

    # 风铃：开头、进副歌、进尾声、最后一下
    for bar, beat, key in [(0, 0, 60), (27, 1, 61), (51, 1, 60), (55, 0, 62)]:
        t["chimes"].append((bar * 4 + beat, 4, key, 96))
    return t


# ---------------------------------------------------------------- 采样映射
def write_sfz(path: Path, regions: list[tuple[int, Path]], extra: str, keyed: bool) -> Path:
    """keyed=True：一键一个样本（打击乐），不变调；否则按键号插值铺满键盘。"""
    lines = ["<control>", "", "<group>", "loop_mode=one_shot" if keyed else "loop_mode=no_loop", extra, ""]
    regions = sorted(regions)
    for i, (key, f) in enumerate(regions):
        if keyed:
            lines.append(f'<region> sample={f.as_posix()} key={key} pitch_keytrack=0')
        else:
            lo = 0 if i == 0 else (regions[i - 1][0] + key) // 2 + 1
            hi = 127 if i == len(regions) - 1 else (key + regions[i + 1][0]) // 2
            lines.append(f"<region> sample={f.as_posix()} pitch_keycenter={key} lokey={lo} hikey={hi}")
    path.write_text("\n".join(lines) + "\n", encoding="utf8")
    return path


def by_name(folder: Path, pattern: str, shift: int = 12) -> list[tuple[int, Path]]:
    """文件名里的音名（中央 C 记作 C3）→ 实际键号。pattern 里用 {n} 代表音名。"""
    import re
    rx = re.compile(pattern.replace("{n}", r"([A-G]#?\d)"))
    out: dict[int, Path] = {}
    for f in sorted(folder.glob("*.wav")):
        m = rx.fullmatch(f.name)
        if m:
            out.setdefault(note_number(m.group(1)) + shift, f)
    if not out:
        raise SystemExit(f"{folder}：没有匹配 {pattern} 的文件")
    return sorted(out.items())


def instruments(work: Path) -> dict[str, Path]:
    idio = VCSL / "Idiophones" / "Struck Idiophones"
    rec = VCSL / "Aerophones" / "Edge-blown Aerophones" / "Baroque Soprano Recorder"
    s: dict[str, Path] = {}
    s["rec_stac"] = write_sfz(work / "rec_stac.sfz", by_name(rec / "Staccato", r"SopRecorder_Stac_{n}_rr1_Main\.wav"), "ampeg_release=0.12 amp_veltrack=50", False)
    s["rec_sus"] = write_sfz(work / "rec_sus.sfz", by_name(rec / "Sustain", r"SopRecorder_Sus_{n}_rr1_Main\.wav"), "ampeg_attack=0.01 ampeg_release=0.18 amp_veltrack=50", False)
    s["glock"] = write_sfz(work / "glock.sfz", by_name(idio / "Glockenspiel", r"glock_medium_{n}_01\.wav"), "ampeg_release=0.9 amp_veltrack=60", False)
    s["strum"] = write_sfz(work / "strum.sfz", by_name(VCSL / "Chordophones" / "Composite Chordophones" / "Strumstick" / "Finger", r"Strumstick_Finger_Str\d_Main_{n}_vl2_rr1\.wav"), "ampeg_release=0.25 amp_veltrack=60", False)
    piano = VCSL / "Chordophones" / "Zithers" / "Upright Piano, Yamaha" / "Sustains"
    s["piano"] = write_sfz(work / "piano.sfz", by_name(piano, r"Upright1_Sus_{n}_vl2_rr1\.wav"), "ampeg_release=0.18 amp_veltrack=50", False)
    s["tuba"] = write_sfz(work / "tuba.sfz", by_name(VSCO / "Brass" / "Tuba" / "stac", r"Tuba3_stac_{n}_v2_rr1_Sum\.wav"), "ampeg_release=0.15 amp_veltrack=40", False)
    bd = VCSL / "Membranophones" / "Struck Membranophones" / "Bass Drum 1"
    s["kick"] = write_sfz(work / "kick.sfz", [(36, bd / "BDrumNew_hit_v5_rr1_Sum.wav")], "ampeg_release=0.12 loop_mode=no_loop amp_veltrack=60", True)
    s["clap"] = write_sfz(work / "clap.sfz", [(60 + i, idio / "Claps" / f"Clap_rr{i + 1}.wav") for i in range(4)], "amp_veltrack=50", True)
    s["cajon"] = write_sfz(work / "cajon.sfz", [(60, idio / "Cajon" / "Cajon_hit1_mp_rr1.wav"), (61, idio / "Cajon" / "Cajon_hit1_mp_rr2.wav")], "amp_veltrack=50", True)
    sh = idio / "Shaker, Small"
    s["shaker"] = write_sfz(work / "shaker.sfz", [(60, sh / "Mid_ShakerHighFaster_Down_rr1.wav"), (61, sh / "Mid_ShakerHighFaster_Up_rr1.wav")], "amp_veltrack=70", True)
    tb = idio / "Tambourine 1"
    s["tamb"] = write_sfz(work / "tamb.sfz", [(60, tb / "Tamb1_Hit_v1_rr1_Mid.wav"), (62, tb / "Tamb1_Roll_v2_rr1_Mid.wav")], "amp_veltrack=50", True)
    s["triangle"] = write_sfz(work / "triangle.sfz", [(60, idio / "Triangles" / "Triangle3_Hit_v1_rr1_Mid.wav")], "loop_mode=no_loop ampeg_release=0.6 amp_veltrack=40", True)
    wb = idio / "Woodblock"
    s["wood"] = write_sfz(work / "wood.sfz", [(60, wb / "wood_click_f_rr1.wav"), (61, wb / "wood_click_mp.wav")], "amp_veltrack=50", True)
    mt = idio / "Mark Trees" / "Legacy"
    s["chimes"] = write_sfz(work / "chimes.sfz", [(60, mt / "windchimes_asc1.wav"), (61, mt / "windchimes_fastAsc1.wav"), (62, mt / "windchimes_slowDesc1.wav")], "amp_veltrack=30", True)
    return s


# 各轨「有声音的那些时刻」的平均响度（dBFS）、声像（-1 左，+1 右）、高通（Hz）。
# 沙锤、铃鼓、三角铁这些采样录得很轻（峰值 -30 dB 上下），要放大三四十 dB，不切低频会把录音底下的隆隆声一起放大
LEVEL = {
    "rec_stac": (-17, 0.0, 200), "rec_sus": (-17, 0.0, 200), "glock": (-23, 0.3, 400), "strum": (-24, -0.35, 120), "piano": (-27, 0.3, 150),
    "tuba": (-20, 0.0, 35), "kick": (-22, 0.0, 35), "clap": (-26, 0.1, 250), "cajon": (-28, -0.1, 150), "shaker": (-33, 0.4, 2000),
    "tamb": (-34, -0.3, 1500), "triangle": (-37, 0.2, 2000), "wood": (-27, -0.2, 300), "chimes": (-31, 0.0, 1500),
}


def active_rms(x: np.ndarray, rate: int) -> float:
    """按 50 毫秒一格算响度，只取比最响那格低 40 dB 以内的格子求平均，避开静音段。"""
    mono = x.mean(1) if x.ndim > 1 else x
    hop = rate // 20
    n = len(mono) // hop
    frames = mono[: n * hop].reshape(n, hop)
    rms = np.sqrt((frames ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms)
    keep = db > db.max() - 40
    return float(20 * np.log10(np.sqrt((rms[keep] ** 2).mean())))


def main(out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    work = out.parent / (out.stem + "_build")
    work.mkdir(exist_ok=True)
    sfz = instruments(work)
    tracks = compose()
    rate = 48000
    n = int(TOTAL * rate)
    mix = np.zeros((n, 2))
    report = {}
    for name, notes in tracks.items():
        if not notes:
            continue
        mid = write_midi(work / f"{name}.mid", BPM, [notes])
        wav = work / f"{name}.wav"
        subprocess.run([str(SFIZZ), "--sfz", str(sfz[name]), "--midi", str(mid), "--wav", str(wav),
                        "--samplerate", str(rate), "--quality", "3", "--polyphony", "128"], check=True, capture_output=True)
        level, pan, hp = LEVEL[name]
        cut = work / f"{name}_hp.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-af", f"highpass=f={hp},highpass=f={hp}", "-c:a", "pcm_f32le", str(cut)], check=True)
        x, sr = sf.read(cut)
        assert sr == rate
        if x.ndim == 1:
            x = np.stack([x, x], 1)
        x = x[:n]
        got = active_rms(x, rate)
        gain = 10 ** ((level - got) / 20)
        left, right = min(1.0, 1 - pan), min(1.0, 1 + pan)
        mix[: len(x), 0] += x[:, 0] * gain * left
        mix[: len(x), 1] += x[:, 1] * gain * right
        report[name] = {"notes": len(notes), "measured_db": round(got, 1), "gain_db": round(level - got, 1)}
    # 结尾 1.2 秒淡出
    fade = int(1.2 * rate)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    raw = work / "mix.wav"
    sf.write(raw, mix.astype(np.float32), rate, subtype="FLOAT")
    # 小房间的一点混响，再把整体响度拉到 -16 LUFS（没有念白，配乐就是主角）
    room = "aecho=0.85:0.85:45|83|131:0.2|0.14|0.08"
    measure = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", f"{room},loudnorm=I=-16:TP=-1.5:print_format=json", "-f", "null", "-"],
                             capture_output=True, text=True, encoding="utf8", errors="replace")
    err = measure.stderr
    info = json.loads(err[err.rindex("{"): err.rindex("}") + 1])
    gain_db = -16 - float(info["input_i"])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"{room},volume={gain_db:.2f}dB,alimiter=limit=0.84:level=false",
                    "-ar", str(rate), "-c:a", "pcm_s16le", str(out)], check=True)
    for f in work.iterdir():
        f.unlink()
    work.rmdir()
    print(json.dumps(report, ensure_ascii=False, indent=1))
    print(out, f"{TOTAL:.2f} s")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public" / "meng-center" / "audio" / "bgm.wav")
