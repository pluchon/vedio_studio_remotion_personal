"""用真实乐器采样把 MIDI 渲染成声音：sfizz（tools/sfizz/，命令行）+ samples/ 里的 CC0 采样（VSCO 2 CE、VCSL）。

不用自己算波形，音色来自真实录音。这里提供三样东西：

    sfz_from_notes(folder, out, pattern)   把一个文件名里带音名（A2、C#3、Db4）的采样文件夹，写成 .sfz 映射
    sfz_from_chart(folder, out)            VSCO 的钢琴那种：按 MappingChart.txt 里的编号对应键号
    write_midi(path, bpm, tracks)          写标准 MIDI 文件（纯 Python）
    render(sfz_and_midis, out_wav)         一轨一个 sfz，逐轨渲染后用 ffmpeg 混在一起，再加一点混响

命令行例子见文件末尾的 demo()：`python tools/common/midi_render.py demo exports/midi-demo.wav`。
需要 ffmpeg 在 PATH 上；sfizz 的安装见 README「通用工具」一节。
"""
from __future__ import annotations

import re
import struct
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SFIZZ = ROOT / "tools" / "sfizz" / "sfizz_render.exe"
VSCO = ROOT / "samples" / "VSCO-2-CE" / "VSCO-2-CE-master"

NOTE_BASE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def note_number(name: str) -> int:
    """音名 → MIDI 键号，C4 = 60。"""
    m = re.fullmatch(r"([A-G])([#b]?)(-?\d)", name)
    if not m:
        raise ValueError(name)
    n = NOTE_BASE[m.group(1)] + (1 if m.group(2) == "#" else -1 if m.group(2) == "b" else 0)
    return n + 12 * (int(m.group(3)) + 1)


def _regions(points: list[tuple[int, str]], extra: str) -> str:
    points = sorted(points)
    lines = ["<control>", "default_path=./", "", "<group>", "loop_mode=no_loop", extra, ""]
    for i, (key, sample) in enumerate(points):
        lo = 0 if i == 0 else (points[i - 1][0] + key) // 2 + 1
        hi = 127 if i == len(points) - 1 else (key + points[i + 1][0]) // 2
        lines.append(f"<region> sample={sample} pitch_keycenter={key} lokey={lo} hikey={hi}")
    return "\n".join(lines) + "\n"


def sfz_from_notes(folder: Path, out: Path, pattern: str = r"_([A-G][#b]?\d)_", prefer: str = "", extra: str = "ampeg_release=1.2 amp_veltrack=40") -> Path:
    """文件名里带音名的采样。同一个音有好几个力度或轮换时，用 prefer（文件名里的子串）挑一个。"""
    found: dict[int, str] = {}
    for f in sorted(folder.glob("*.wav")):
        m = re.search(pattern, f.name)
        if not m:
            continue
        key = note_number(m.group(1))
        if key not in found or (prefer and prefer in f.name):
            found[key] = f.name
    if not found:
        raise SystemExit(f"{folder} 里没有认出音名的文件")
    out.write_text(_regions([(k, v) for k, v in found.items()], extra).replace("default_path=./", f"default_path={folder.as_posix()}/"), encoding="utf8")
    return out


def sfz_from_chart(folder: Path, out: Path, prefix: str = "Player_dyn1_rr1_", extra: str = "ampeg_release=1.5 amp_veltrack=40") -> Path:
    """MappingChart.txt 里写着「编号=键号」，文件名里的编号对应它。"""
    chart: dict[str, int] = {}
    for line in (folder / "MappingChart.txt").read_text(encoding="utf8").splitlines():
        if re.fullmatch(r"\d+=\d+", line.strip()):
            a, b = line.strip().split("=")
            chart[a] = int(b)
    points = []
    for f in sorted(folder.glob(prefix + "*.wav")):
        idx = f.stem[len(prefix):]
        if idx in chart:
            points.append((chart[idx], f.name))
    out.write_text(_regions(points, extra).replace("default_path=./", f"default_path={folder.as_posix()}/"), encoding="utf8")
    return out


# ---------------------------------------------------------------- MIDI
def _vlq(n: int) -> bytes:
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(out))


def write_midi(path: Path, bpm: float, tracks: list[list[tuple[float, float, int, int]]]) -> Path:
    """tracks：每条轨是 [(起点拍, 时值拍, 键号, 力度 1–127), ...]，格式 1，480 tick 一拍。"""
    ppq = 480
    chunks = []
    meta = b"\x00\xff\x51\x03" + struct.pack(">I", int(60_000_000 / bpm))[1:] + b"\x00\xff\x2f\x00"
    chunks.append(b"MTrk" + struct.pack(">I", len(meta)) + meta)
    for notes in tracks:
        events = []
        for start, dur, key, vel in notes:
            events.append((round(start * ppq), 1, bytes([0x90, key, vel])))
            events.append((round((start + dur) * ppq), 0, bytes([0x80, key, 0])))
        events.sort(key=lambda e: (e[0], e[1]))
        data = b""
        last = 0
        for tick, _, msg in events:
            data += _vlq(tick - last) + msg
            last = tick
        data += b"\x00\xff\x2f\x00"
        chunks.append(b"MTrk" + struct.pack(">I", len(data)) + data)
    path.write_bytes(b"MThd" + struct.pack(">IHHH", 6, 1, len(chunks), ppq) + b"".join(chunks))
    return path


# ---------------------------------------------------------------- 渲染
def render(parts: list[tuple[Path, Path, float]], out: Path, reverb: bool = True, rate: int = 48000, loudness: float = -20.0) -> Path:
    """parts：[(sfz, midi, 增益 dB), ...]，每个乐器一轨；渲完混在一起。"""
    if not SFIZZ.exists():
        raise SystemExit(f"没有 {SFIZZ}，先装 sfizz（见 README）")
    tmp = out.parent / (out.stem + "_stems")
    tmp.mkdir(parents=True, exist_ok=True)
    wavs = []
    for i, (sfz, midi, gain) in enumerate(parts):
        wav = tmp / f"stem{i}.wav"
        subprocess.run([str(SFIZZ), "--sfz", str(sfz), "--midi", str(midi), "--wav", str(wav), "--samplerate", str(rate), "--quality", "3", "--polyphony", "96"], check=True, capture_output=True)
        wavs.append((wav, gain))
    inputs = []
    for w, _ in wavs:
        inputs += ["-i", str(w)]
    labels = "".join(f"[{i}:a]volume={g}dB[a{i}];" for i, (_, g) in enumerate(wavs))
    mix = "".join(f"[a{i}]" for i in range(len(wavs))) + f"amix=inputs={len(wavs)}:normalize=0,"
    tail = "aecho=0.85:0.9:90|173|287:0.28|0.2|0.14," if reverb else ""
    chain = f"{labels}{mix}{tail}loudnorm=I={loudness}:TP=-2:LRA=8,alimiter=limit=0.9"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", chain, "-ar", str(rate), str(out)], check=True)
    for w, _ in wavs:
        w.unlink()
    tmp.rmdir()
    return out


def demo(out: Path) -> None:
    """八小节：竖琴分解和弦，加一点钢琴的长音。升 F 大调，80 bpm。"""
    work = out.parent
    harp = sfz_from_notes(VSCO / "Strings" / "Harp", work / "harp.sfz", pattern=r"_([A-G][#b]?\d)_")
    piano = sfz_from_chart(VSCO / "Keys" / "Upright Piano", work / "piano.sfz")
    # 和弦：F♯ – D♯m – B – C♯（每小节 4 拍）
    chords = [(54, 61, 66, 70), (51, 58, 63, 66), (47, 54, 59, 63), (49, 56, 61, 65)]
    arp: list[tuple[float, float, int, int]] = []
    pad: list[tuple[float, float, int, int]] = []
    for bar in range(8):
        c = chords[bar % 4]
        for step in range(8):
            arp.append((bar * 4 + step * 0.5, 2.0, c[step % 4] + (12 if step % 4 == 3 else 0), 62 + (step % 4 == 0) * 10))
        pad.append((bar * 4, 3.8, c[0] - 12, 58))
        pad.append((bar * 4, 3.8, c[1], 50))
    h = write_midi(work / "harp.mid", 80, [arp])
    p = write_midi(work / "piano.mid", 80, [pad])
    render([(harp, h, 0.0), (piano, p, -4.0)], out)
    print(out)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "demo":
        demo(Path(sys.argv[2]))
    else:
        print(__doc__)
