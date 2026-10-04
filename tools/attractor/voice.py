"""念白处理：降噪、压低、加重，让声音更沉、更适合入睡。

    python tools/attractor/voice.py <输入音频> <输出 wav> [--low 0|1.8]

--low 是再降多少个半音（音高），用 ffmpeg 的 rubberband，语速不变。0 就只做音色处理。
处理链：双声道合成单声道 → 切掉 55 Hz 以下 → 降噪 → 低频和低中频加厚、中高频收一点（少了「亮」就不会刺耳）
→ 去齿音 → 轻压缩 → 响度调到 −21 LUFS。需要 ffmpeg（带 rubberband）。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def chain(low: float) -> str:
    steps = [
        "pan=mono|c0=0.5*c0+0.5*c1",
        "highpass=f=55",
        "afftdn=nr=12:nf=-50:tn=1",
        # 低频加厚：140 Hz 以下的架子、280 Hz 的肚子
        "bass=g=5:f=140:w=0.7",
        "equalizer=f=280:t=q:w=0.9:g=2.5",
        # 收中高频：2.8 kHz 的「咬字」和 5 kHz 以上的「亮」
        "equalizer=f=2800:t=q:w=1.0:g=-2.5",
        "treble=g=-6:f=5200:w=0.7",
        "lowpass=f=11000",
        "deesser=i=0.3",
        "acompressor=threshold=-24dB:ratio=2.6:attack=20:release=300:makeup=3",
    ]
    if low > 0:
        steps.append(f"rubberband=pitch={2 ** (-low / 12):.5f}:formant=preserved")
    steps.append("loudnorm=I=-21:TP=-2:LRA=7")
    return ",".join(steps)


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    low = 0.0
    if "--low" in sys.argv:
        low = float(sys.argv[sys.argv.index("--low") + 1])
        args = [a for a in args if a != sys.argv[sys.argv.index("--low") + 1]]
    if len(args) != 2:
        raise SystemExit(__doc__)
    src, dst = Path(args[0]), Path(args[1])
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", chain(low), "-ar", "48000", "-ac", "1", str(dst)], check=True)
    print(dst)


if __name__ == "__main__":
    main()
