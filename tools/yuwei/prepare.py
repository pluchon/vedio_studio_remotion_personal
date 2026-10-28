"""《雨未愁眠》本机素材：拷字体、处理念白、铺雨声和钢琴垫底。

    python tools/yuwei/prepare.py            # 全部
    python tools/yuwei/prepare.py fonts
    python tools/yuwei/prepare.py voice
    python tools/yuwei/prepare.py mix

念白走 tools/attractor/voice.py（只做音色，不降调）。
配乐是 Kevin MacLeod《Meditation Impromptu 02》（CC BY），雨声是 Freesound CC0 预览。
成品都进 public/yuwei/audio/，不入库。
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REFER = ROOT / "refer" / "雨未愁眠"
FONTS_SRC = REFER / "资料" / "fonts"
MUSIC_SRC = REFER / "资料" / "music" / "meditation_impromptu_02.mp3"
RAIN_SRC = REFER / "资料" / "sounds" / "s1_rain_glass_indoor_nicoproson_preview.mp3"
RAIN2_SRC = REFER / "资料" / "sounds" / "s1_light_rain_shut_window_timothyd4y_preview.mp3"
VOICE_SRC = REFER / "雨未愁眠_念稿.mp3"
PUB = ROOT / "public" / "yuwei"
AUDIO = PUB / "audio"
FONTS_DST = PUB / "fonts"
SERIF_SRC = ROOT / "public" / "looking-up" / "fonts" / "NotoSerifSC-Regular.otf"
VOICE_PY = ROOT / "tools" / "attractor" / "voice.py"

# 片名 2.8 秒 + 念白约 111.5 秒 + 片尾 6 秒
LEAD = 2.8
TAIL = 6.0
VOICE_PAD = 1.0  # 念白轨前面留白，好对齐 LEAD


def run(cmd: list[str]) -> None:
    print(">", " ".join(cmd))
    subprocess.run(cmd, check=True)


def fonts() -> None:
    FONTS_DST.mkdir(parents=True, exist_ok=True)
    for f in FONTS_SRC.iterdir():
        if f.suffix.lower() in {".ttf", ".otf", ".txt"}:
            shutil.copy2(f, FONTS_DST / f.name)
            print("font", f.name)
    if SERIF_SRC.exists():
        shutil.copy2(SERIF_SRC, FONTS_DST / "NotoSerifSC-Regular.otf")
        print("font NotoSerifSC-Regular.otf")


def voice() -> None:
    AUDIO.mkdir(parents=True, exist_ok=True)
    raw = AUDIO / "voice_raw.wav"
    run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-i",
            str(VOICE_SRC),
            "-ar",
            "48000",
            "-ac",
            "1",
            str(raw),
        ]
    )
    dst = AUDIO / "voice.wav"
    run([sys.executable, str(VOICE_PY), str(raw), str(dst), "--low", "0"])
    # 片头留白：后面 Film 用 Sequence 从 LEAD 开始播，这里不再垫静音
    print("voice", dst)


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return float(out.strip())


def mix() -> None:
    AUDIO.mkdir(parents=True, exist_ok=True)
    voice_wav = AUDIO / "voice.wav"
    if not voice_wav.exists():
        voice()
    vdur = duration(voice_wav)
    total = LEAD + vdur + TAIL
    rain = AUDIO / "rain.wav"
    bgm = AUDIO / "bgm.wav"

    # 两条雨叠在一起：玻璃上的叮 + 更闷的关窗小雨，循环到片长
    rain_filter = (
        f"[0:a]aloop=loop=-1:size=2e9,atrim=0:{total:.3f},asetpts=PTS-STARTPTS,"
        "highpass=f=80,lowpass=f=9000,loudnorm=I=-23:TP=-2:LRA=8,volume=0.55[a0];"
        f"[1:a]aloop=loop=-1:size=2e9,atrim=0:{total:.3f},asetpts=PTS-STARTPTS,"
        "highpass=f=60,lowpass=f=6000,loudnorm=I=-26:TP=-2:LRA=11,volume=0.35[a1];"
        "[a0][a1]amix=inputs=2:duration=longest:normalize=0,"
        f"afade=t=in:st=0:d=1.6,afade=t=out:st={total - 3.2:.3f}:d=3.2"
    )
    run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-i",
            str(RAIN_SRC),
            "-i",
            str(RAIN2_SRC),
            "-filter_complex",
            rain_filter,
            "-ar",
            "48000",
            "-ac",
            "2",
            str(rain),
        ]
    )

    # 钢琴垫底：压到很轻，片头片尾稍响一点靠 Remotion 的 volume 曲线
    run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-i",
            str(MUSIC_SRC),
            "-af",
            f"atrim=0:{total:.3f},afade=t=in:st=0:d=2.4,afade=t=out:st={total - 4:.3f}:d=4,loudnorm=I=-23:TP=-2:LRA=8",
            "-ar",
            "48000",
            "-ac",
            "2",
            str(bgm),
        ]
    )
    print(f"mix rain+bgm  {total:.1f}s  voice {vdur:.1f}s")


def main() -> None:
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    if what in {"all", "fonts"}:
        fonts()
    if what in {"all", "voice"}:
        voice()
    if what in {"all", "mix"}:
        mix()


if __name__ == "__main__":
    main()
