"""《奶糖的萌部落手帐》的时间轴和配乐：按念白排每一幕占几小节，再照这张表写 MIDI，用真实乐器采样渲染。

    ~/.venvs/demucs/Scripts/python.exe tools/meng-center/journal_music.py

先跑 journal_voice.py（要它写的 voice.json）。输出：
- src/videos/meng-center/journal/plan.json：每一幕的起始小节、小节数，每句念白从第几帧开始（入库，画面按它排）
- public/meng-center/audio/journal-bgm.wav（不入库）

G 大调，150 BPM，直八分，40 帧/秒：一拍 16 帧，一小节 64 帧（1.6 秒）。每一幕从小节线开始，翻页落在强拍上。
第一版 120 BPM、只有伴奏，用户嫌平淡（2026-11-09），这一版：
- 低音提琴拨弦走八分音符的八度跳，大鼓一、三拍外加二拍后半的切分，拍手打二、四拍，主歌就有律动；
- 钟琴在高音区一直有一条稀疏的副旋律（念白在中频，钟琴在两三千赫以上，不打架），句子之间陶笛答一句；
- 每一幕最后一拍是通鼓过门 + 竖琴上刮，下一幕强拍落镲，翻页踩在上面；
- 片头先由陶笛把主旋律完整走两小节，奶糖开口后退到钟琴；「当然，还有我！」之前铃鼓滚奏推上去再全停；
  奶糖那两幕是副歌（IV–V–iii–vi，大鼓四拍都踩，加雪橇铃）；架构是间奏（木琴十六分音符跑来跑去）；
  尾声念完后主旋律完整走一遍，收在主和弦。
乐器：陶笛、马林巴、低音提琴拨弦、小提琴组拨弦、竖琴、立式钢琴、钟琴、木琴；打击乐：大鼓、军鼓、高低通鼓、
拍手、沙锤、铃鼓、雪橇铃、木鱼、吊镲、风铃。采样 VCSL、VSCO 2 CE（CC0）。
"""
from __future__ import annotations

import json
import math
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "common"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from midi_render import VSCO, note_number  # noqa: E402
from music import VCSL, by_name, mixdown, write_sfz  # noqa: E402

DIR = ROOT / "src" / "videos" / "meng-center" / "journal"
OUT = ROOT / "public" / "meng-center" / "audio" / "journal-bgm.wav"
FPS = 40
BPM = 150
BEAT = 60 / BPM  # 0.4 秒 = 16 帧
BAR = 4 * BEAT  # 1.6 秒 = 64 帧
EIGHTH = BEAT / 2

# 每幕翻页后多久开口（秒）；片头先让主旋律走两小节
LEAD = {"intro": 2 * BAR}
LEAD_DEFAULT = BEAT
TAIL = 0.4  # 最后一句念完到翻页至少留多久
OUTRO_EXTRA = 5  # 尾声念完后再走的小节：主旋律四小节 + 收尾一小节
SECTION = {"intro": "intro", "naitang": "chorus", "resilience": "chorus", "arch": "break", "outro": "outro"}


# ---------------------------------------------------------------- 时间轴
def plan() -> dict:
    voice = json.loads((DIR / "voice.json").read_text(encoding="utf-8"))
    order: list[str] = []
    by_scene: dict[str, list[dict]] = {}
    for ln in voice["lines"]:
        if ln["scene"] not in by_scene:
            order.append(ln["scene"])
            by_scene[ln["scene"]] = []
        by_scene[ln["scene"]].append(ln)

    scenes = []
    bar = 0
    for sid in order:
        start = bar * BAR
        t = start + LEAD.get(sid, LEAD_DEFAULT)
        lines = []
        for ln in by_scene[sid]:
            lines.append({"i": ln["i"], "at": round(t * FPS), "dur": math.ceil(ln["dur"] * FPS)})
            end = t + ln["dur"]
            t = math.ceil((end + 0.25) / EIGHTH) * EIGHTH
        last_end = lines[-1]["at"] / FPS + lines[-1]["dur"] / FPS
        bars = max(2, math.ceil((last_end + TAIL - start) / BAR - 1e-6))
        if sid == "outro":
            bars += OUTRO_EXTRA
        scenes.append({"id": sid, "section": SECTION.get(sid, "verse"), "bar": bar, "bars": bars,
                       "from": round(start * FPS), "frames": round(bars * BAR * FPS), "lines": lines})
        bar += bars
    return {"fps": FPS, "bpm": BPM, "beat": round(BEAT * FPS), "bar": round(BAR * FPS), "bars": bar,
            "frames": round(bar * BAR * FPS) + FPS, "scenes": scenes}


# ---------------------------------------------------------------- 和声
PC = {"G": [7, 11, 2], "Em": [4, 7, 11], "C": [0, 4, 7], "D": [2, 6, 9], "Bm": [11, 2, 6], "Am": [9, 0, 4]}
ROOT_PC = {"G": 7, "Em": 4, "C": 0, "D": 2, "Bm": 11, "Am": 9}
PROG = {
    "intro": ["G", "D", "Em", "C"],
    "verse": ["G", "D", "Em", "C"],
    "chorus": ["C", "D", "Bm", "Em", "C", "D", "G", "G"],
    "break": ["Em", "C", "G", "D"],
    "outro": ["G", "D", "Em", "C"],
}


def tones(chord: str, lo: int, hi: int) -> list[int]:
    return [k for k in range(lo, hi + 1) if k % 12 in PC[chord]]


def melody(text: str) -> list[tuple[float, float, int | None]]:
    out, t = [], 0.0
    for tok in text.split():
        n, d = tok.split(":")
        out.append((t, float(d), None if n == "r" else note_number(n)))
        t += float(d)
    assert abs(t - 4) < 1e-6, (text, t)
    return out


# 主旋律（实际音高），和弦 G D Em C
HOOK = [
    "G5:.5 B5:.5 D6:.5 G6:.5 F#6:.5 D6:.5 B5:.5 D6:.5",
    "A5:.5 D6:.5 F#6:.5 A6:.5 G6:.5 F#6:.5 D6:1",
    "E6:.5 G6:.5 B5:.5 E6:.5 D6:.5 B5:.5 G5:.5 B5:.5",
    "C6:.5 E6:.5 G6:1 F#6:.5 E6:.5 D6:1",
]
END = "G6:2 r:2"
# 钟琴副旋律：两小节一句，高八度、稀疏，念白下面一直有一点亮光
COUNTER = [
    "D7:1 r:.5 B6:.5 G6:1 r:1",
    "r:1 A6:.5 B6:.5 D7:1.5 r:.5",
]
Note = tuple[float, float, int, int]


def note(t_sec: float, dur_sec: float, key: int, vel: int) -> Note:
    """秒 → 拍。"""
    return (t_sec / BEAT, max(0.05, dur_sec / BEAT), key, max(1, min(127, vel)))


# ---------------------------------------------------------------- 编曲
def compose(p: dict) -> dict[str, list[Note]]:
    names = ["ocarina", "marimba", "bass", "pizz", "harp", "piano", "glock", "xylo",
             "kick", "snare", "tom", "clap", "shaker", "tamb", "sleigh", "wood", "crash", "chimes"]
    t: dict[str, list[Note]] = {k: [] for k in names}
    scenes = p["scenes"]
    voiced = [(ln["at"] / FPS, (ln["at"] + ln["dur"]) / FPS) for sc in scenes for ln in sc["lines"]]

    def speaking(a: float, b: float) -> bool:
        return any(s < b and a < e for s, e in voiced)

    for k, sc in enumerate(scenes):
        sec = sc["section"]
        prog = PROG[sec]
        nxt = scenes[k + 1] if k + 1 < len(scenes) else None
        hook_from = sc["bars"] - OUTRO_EXTRA if sec == "outro" else 0
        for j in range(sc["bars"]):
            b0 = (sc["bar"] + j) * BAR
            chord = prog[(j - hook_from if sec == "outro" and j >= hook_from else j) % len(prog)]
            last_bar = j == sc["bars"] - 1
            final = sec == "outro" and last_bar
            stop = sc["id"] == "naitang" and j == 0  # 「当然，还有我！」在安静里说
            cut = nxt is not None and nxt["id"] == "naitang" and last_bar  # 进那一幕前后半小节全停
            big = sec in ("chorus", "outro") or (sec == "intro" and j < 2)
            r = ROOT_PC[chord]
            root = 36 + (r - 36) % 12
            if root < 40:
                root += 12

            if final:
                for kk in tones("G", 43, 71):
                    t["piano"].append(note(b0, 3.0, kk, 76))
                t["bass"].append(note(b0, 2.5, 43, 104))
                for i, kk in enumerate(tones("G", 67, 98)):
                    t["harp"].append(note(b0 - 0.5 + i * 0.05, 2.5, kk, 84))
                t["glock"].append(note(b0, 2, 91, 90))
                t["crash"].append(note(b0, 3, 60, 110))
                t["chimes"].append(note(b0 + 0.1, 4, 62, 100))
                t["kick"].append(note(b0, 0.3, 36, 110))
                continue
            if stop:
                t["chimes"].append(note(b0, 4, 61, 104))
                t["crash"].append(note(b0, 2, 60, 96))
                t["bass"].append(note(b0, 1.2, root, 100))
                for kk in tones(chord, 72, 91):
                    t["glock"].append(note(b0, 1.2, kk, 76))
                continue

            nb = 2 if cut else 4
            # ---- 低音提琴：八分音符的八度跳（根-高八度-根-五度…），副歌更满
            pat = [0, 12, 0, 7, 0, 12, 7, 12] if big else [0, None, 12, 0, None, 12, 7, None]
            for i in range(nb * 2):
                iv = pat[i]
                if iv is None:
                    continue
                kk = root + iv
                if kk > 57:
                    kk -= 12
                t["bass"].append(note(b0 + i * EIGHTH, 0.22, kk, 96 if i % 2 == 0 else 80))

            # ---- 马林巴：3+3+2 的重音分解和弦，跳着走
            ar = tones(chord, 62, 86)
            seq = [ar[0], ar[2], ar[3], ar[1], ar[3], ar[2], ar[4] if len(ar) > 4 else ar[3], ar[2]]
            for i in range(nb * 2):
                accent = i in (0, 3, 6)
                vel = (84 if accent else 62) - (6 if speaking(b0 + i * EIGHTH, b0 + (i + 1) * EIGHTH) else 0)
                t["marimba"].append(note(b0 + i * EIGHTH, 0.25, seq[i % len(seq)], vel))

            # ---- 鼓
            if sec in ("verse", "intro", "break"):
                for b in (0, 1.5, 2):
                    if b < nb:
                        t["kick"].append(note(b0 + b * BEAT, 0.25, 36, 104 if b == 0 else 88))
            if sec in ("chorus", "outro"):
                for b in (0, 1, 2, 3):
                    if b < nb:
                        t["kick"].append(note(b0 + b * BEAT, 0.25, 36, 106 if b % 2 == 0 else 94))
            if not (sec == "intro" and j == 0):
                for b in (1, 3):
                    if b < nb:
                        t["clap"].append(note(b0 + b * BEAT, 0.25, 60 + (j + b) % 4, 96))
                        if big:
                            t["snare"].append(note(b0 + b * BEAT, 0.25, 60 + (j + b) % 2, 84))
            for i in range(nb * 2):
                t["shaker"].append(note(b0 + i * EIGHTH, 0.2, 60 + i % 2, 94 if i % 2 else 70))
            if sec in ("verse",) and j % 2 == 1:
                for b in (0.5, 1.5, 2.5, 3.5):
                    if b < nb:
                        t["tamb"].append(note(b0 + b * BEAT, 0.2, 60, 72))
            if big:
                for i in range(nb * 2):
                    t["sleigh"].append(note(b0 + i * EIGHTH, 0.2, 60 + i % 2, 88 if i % 2 == 0 else 66))
                for b in (0.5, 1.5, 2.5, 3.5):
                    if b < nb:
                        t["tamb"].append(note(b0 + b * BEAT, 0.2, 60, 80))
            if sec == "break":
                for b in (0.5, 1.75, 2.5, 3.25):
                    t["wood"].append(note(b0 + b * BEAT, 0.2, 60 + int(b * 4) % 2, 84))

            # ---- 每一幕的强拍落镲（翻页踩在上面），片头第一下也是
            if j == 0 and (k > 0 or True):
                t["crash"].append(note(b0, 2, 60, 92 if sec == "verse" else 104))

            # ---- 和声层：钢琴反拍短和弦（副歌、尾声），小提琴拨弦反拍（主歌每两幕一次）
            if big:
                for b in (0.5, 1.5, 2.5, 3.5):
                    if b < nb:
                        for kk in tones(chord, 60, 76):
                            t["piano"].append(note(b0 + b * BEAT, 0.18, kk, 64))
            elif sec == "verse" and k % 2 == 0:
                for b in (0.5, 1.5, 2.5, 3.5):
                    if b < nb:
                        for kk in tones(chord, 67, 79)[:2]:
                            t["pizz"].append(note(b0 + b * BEAT, 0.2, kk, 74))
            elif sec == "verse":
                for kk in tones(chord, 55, 71):
                    t["piano"].append(note(b0, nb * BEAT * 0.9, kk, 50))

            # ---- 钟琴副旋律（主歌、间奏），副歌换成分解和弦往上走
            if sec in ("verse", "break") or (sec == "intro" and j >= 2):
                for bt, d, kk in melody(COUNTER[j % 2]):
                    if kk is not None and bt < nb:
                        t["glock"].append(note(b0 + bt * BEAT, d * BEAT, kk, 62))
            if sec == "chorus":
                gl = tones(chord, 79, 98)
                for i, kk in enumerate(gl[:4]):
                    if i < nb:
                        t["glock"].append(note(b0 + i * BEAT, BEAT, kk, 66))
            if sec == "break":
                xs = tones(chord, 72, 96)
                sq = xs + list(reversed(xs[1:-1]))
                for i in range(16):
                    t["xylo"].append(note(b0 + i * BEAT / 4, 0.12, sq[i % len(sq)], 74 if i % 4 == 0 else 56))

            # ---- 进奶糖那一幕前：铃鼓滚奏 + 竖琴往上刮，然后停
            if cut:
                for i in range(8):
                    t["tamb"].append(note(b0 + i * BEAT / 4, 0.1, 60, 60 + i * 6))
                gl = tones("C", 60, 96)
                for i, kk in enumerate(gl):
                    t["harp"].append(note(b0 + i * (2 * BEAT / len(gl)), 0.6, kk, 70 + i))

            # ---- 翻页过门：最后一拍通鼓四下往下走，竖琴往上刮到下一幕的强拍
            if last_bar and nxt is not None and not cut:
                for i, (kk, v) in enumerate([(62, 84), (62, 78), (60, 90), (60, 96)]):
                    t["tom"].append(note(b0 + 3 * BEAT + i * BEAT / 4, 0.12, kk, v))
                nchord = PROG[nxt["section"]][0]
                gl = tones(nchord, 67, 91)
                for i, kk in enumerate(gl):
                    t["harp"].append(note(b0 + 3 * BEAT + i * (BEAT / len(gl)), 0.6, kk, 70 + i * 2))

            # ---- 主旋律：片头前两小节（念白开口前），尾声最后四小节
            mel = None
            if sec == "intro" and j < 2:
                mel = HOOK[j]
            if sec == "outro" and hook_from <= j < sc["bars"] - 1:
                mel = HOOK[(j - hook_from) % 4]
            if mel:
                for bt, d, kk in melody(mel):
                    if kk is None:
                        continue
                    t["ocarina"].append(note(b0 + bt * BEAT, d * BEAT * 0.9, kk, 92 if bt % 1 == 0 else 80))
                    t["glock"].append(note(b0 + bt * BEAT, min(d, 1) * BEAT, kk + 12, 60))
                    t["xylo"].append(note(b0 + bt * BEAT, 0.12, kk, 58))

        # 句间应答：同一幕里两句之间空出 0.8 秒以上，陶笛答三个音
        for a, b in zip(sc["lines"], sc["lines"][1:]):
            g0 = (a["at"] + a["dur"]) / FPS + 0.08
            g1 = b["at"] / FPS - 0.08
            if g1 - g0 < 0.8:
                continue
            start = math.ceil(g0 / EIGHTH) * EIGHTH
            bar_i = int(start // BAR) - sc["bar"]
            ch = prog[bar_i % len(prog)]
            ts = tones(ch, 79, 93)
            for i, idx in enumerate([0, 1, 2] if k % 2 else [2, 1, 2]):
                s = start + i * EIGHTH
                if s + 0.1 < g1:
                    t["ocarina"].append(note(s, 0.18, ts[min(idx, len(ts) - 1)], 84))
    return t


def instruments(work: Path) -> dict[str, Path]:
    idio = VCSL / "Idiophones" / "Struck Idiophones"
    memb = VCSL / "Membranophones" / "Struck Membranophones"
    oca_std = VCSL / "Aerophones" / "Edge-blown Aerophones" / "Ocarina, Typical" / "Sustains" / "Sus"
    oca_small = VCSL / "Aerophones" / "Edge-blown Aerophones" / "Ocarina, Small" / "Sustain"
    s: dict[str, Path] = {}
    # 陶笛：中音陶笛到 C#6，再往上换小陶笛
    oca = [x for x in by_name(oca_std, r"StdOcarina_Sus_{n}\.wav") if x[0] <= 85] + \
          [x for x in by_name(oca_small, r"ocarina_{n}_sustain0\.wav") if x[0] > 85]
    s["ocarina"] = write_sfz(work / "ocarina.sfz", oca, "ampeg_attack=0.01 ampeg_release=0.1 amp_veltrack=50", False)
    s["marimba"] = write_sfz(work / "marimba.sfz", by_name(idio / "Marimba", r"Marimba_hit_Outrigger_{n}_med_01\.wav"), "ampeg_release=0.4 amp_veltrack=60", False)
    s["bass"] = write_sfz(work / "bass.sfz", by_name(VSCO / "Strings" / "Solo Contrabass" / "Pizz", r"BKCtbss_Pizz_{n}_v1_rr1\.wav"), "ampeg_release=0.2 amp_veltrack=50", False)
    s["pizz"] = write_sfz(work / "pizz.sfz", by_name(VSCO / "Strings" / "Violin Section" / "Pizz", r"VlnEns_Pizz_{n}_v2_rr1\.wav"), "ampeg_release=0.2 amp_veltrack=50", False)
    s["harp"] = write_sfz(work / "harp.sfz", by_name(VSCO / "Strings" / "Harp", r"KSHarp_{n}_mf\.wav", shift=0), "ampeg_release=1.0 amp_veltrack=50", False)
    piano = VCSL / "Chordophones" / "Zithers" / "Upright Piano, Yamaha" / "Sustains"
    s["piano"] = write_sfz(work / "piano.sfz", by_name(piano, r"Upright1_Sus_{n}_vl2_rr1\.wav"), "ampeg_release=0.2 amp_veltrack=50", False)
    s["glock"] = write_sfz(work / "glock.sfz", by_name(idio / "Glockenspiel", r"glock_medium_{n}_01\.wav"), "ampeg_release=0.9 amp_veltrack=60", False)
    s["xylo"] = write_sfz(work / "xylo.sfz", by_name(idio / "Xylophone" / "Medium Mallets", r"Xylo_Medium_{n}_pp_01_far\.wav"), "ampeg_release=0.3 amp_veltrack=60", False)
    bd = memb / "Bass Drum 1"
    s["kick"] = write_sfz(work / "kick.sfz", [(36, bd / "BDrumNew_hit_v5_rr1_Sum.wav")], "ampeg_release=0.12 loop_mode=no_loop amp_veltrack=60", True)
    sn = memb / "Snare Drum, Modern 1"
    s["snare"] = write_sfz(work / "snare.sfz", [(60, sn / "Snare2_HitSN_v3_rr1_Mid.wav"), (61, sn / "Snare2_HitSN_v3_rr2_Mid.wav")], "amp_veltrack=60", True)
    s["tom"] = write_sfz(work / "tom.sfz", [(62, memb / "Tom 1" / "Stick" / "TomH_HitS_v3_rr1_Mid.wav"), (60, memb / "Tom 2" / "Stick" / "TomL_HitS_v3_rr1_Mid.wav")], "amp_veltrack=60", True)
    s["clap"] = write_sfz(work / "clap.sfz", [(60 + i, idio / "Claps" / f"Clap_rr{i + 1}.wav") for i in range(4)], "amp_veltrack=50", True)
    sh = idio / "Shaker, Small"
    s["shaker"] = write_sfz(work / "shaker.sfz", [(60, sh / "Mid_ShakerHighFaster_Down_rr1.wav"), (61, sh / "Mid_ShakerHighFaster_Up_rr1.wav")], "amp_veltrack=70", True)
    s["tamb"] = write_sfz(work / "tamb.sfz", [(60, idio / "Tambourine 1" / "Tamb1_Hit_v1_rr1_Mid.wav")], "amp_veltrack=50", True)
    sb = idio / "Sleigh Bells"
    s["sleigh"] = write_sfz(work / "sleigh.sfz", [(60, sb / "Sleighbells_Hit_rr1_Mid.wav"), (61, sb / "Sleighbells_Hit_rr2_Mid.wav")], "amp_veltrack=60", True)
    wb = idio / "Woodblock"
    s["wood"] = write_sfz(work / "wood.sfz", [(60, wb / "wood_click_f_rr1.wav"), (61, wb / "wood_click_mp.wav")], "amp_veltrack=50", True)
    s["crash"] = write_sfz(work / "crash.sfz", [(60, idio / "Suspended Cymbal 1" / "susCymb1_hit_f1.wav")], "loop_mode=no_loop ampeg_release=1.5 amp_veltrack=50", True)
    mt = idio / "Mark Trees" / "Legacy"
    s["chimes"] = write_sfz(work / "chimes.sfz", [(60, mt / "windchimes_asc1.wav"), (61, mt / "windchimes_fastAsc1.wav"), (62, mt / "windchimes_slowDesc1.wav")], "amp_veltrack=30", True)
    return s


# 各轨「有声音的时刻」的平均响度（dBFS）、声像、高通（Hz）；念白在中频，马林巴和钢琴稍低，节奏组往前提
LEVEL = {
    "ocarina": (-18, 0.0, 250), "marimba": (-23, -0.2, 120), "bass": (-19, 0.0, 35), "pizz": (-27, 0.35, 200),
    "harp": (-24, -0.3, 150), "piano": (-27, 0.25, 120), "glock": (-26, 0.3, 500), "xylo": (-25, 0.2, 400),
    "kick": (-20, 0.0, 35), "snare": (-27, 0.05, 150), "tom": (-24, -0.15, 60), "clap": (-24, 0.1, 250),
    "shaker": (-31, 0.4, 2000), "tamb": (-31, -0.3, 1500), "sleigh": (-32, -0.4, 2000), "wood": (-27, -0.2, 300),
    "crash": (-27, 0.15, 400), "chimes": (-29, 0.0, 1500),
}


def main() -> None:
    p = plan()
    (DIR / "plan.json").write_text(json.dumps(p, ensure_ascii=False, indent=1), encoding="utf-8")
    for sc in p["scenes"]:
        print(f"{sc['id']:11s} bar {sc['bar']:3d} x{sc['bars']}  lines at {[ln['at'] for ln in sc['lines']]}")
    total = p["frames"] / FPS
    OUT.parent.mkdir(parents=True, exist_ok=True)
    work = OUT.parent / "journal_build"
    work.mkdir(exist_ok=True)
    report = mixdown(compose(p), instruments(work), LEVEL, BPM, total, OUT, work, lufs=-17.0, fade=0.8)
    shutil.rmtree(work)
    print(json.dumps(report, ensure_ascii=False))
    print(OUT, f"{total:.1f} s, {p['bars']} bars")


if __name__ == "__main__":
    main()
