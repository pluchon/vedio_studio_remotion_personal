"""把「深邃静谧旋律」续长：前奏 + 中段循环 N 遍 + 结尾，接缝做短交叉淡化。

曲子是 80 bpm、每小节 3.0 s、每 8 小节（≈23.96 s）一个乐句。分析见 src/videos/attractor/README.md。
前奏 0–11.97 s（4 小节），中段取 11.97–107.80 s（4 个乐句），107.80 s 之后是原曲的收尾。
所有切点都落在乐句边界上，所以接缝处相位一致。

用法：python tools/attractor/loop_music.py [中段放几个乐句，默认 15] [输出，默认 public/attractor/audio/bgm.wav]
总长 ≈ 12 + 乐句数 × 23.96 + 33.2 秒；念白 391 秒加片名 4 秒、片尾 9 秒，是 404 秒，所以用 15 个乐句。
需要 ffmpeg。原曲在 library/music/，版权属于原作者，输出不入库。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "library" / "music" / "深邃静谧旋律 (Inst.).flac"

BAR = 2.995            # 一小节的秒数（80 bpm 的 4/4）
PHRASE = 8 * BAR       # 一个乐句 23.96 s
INTRO_END = 4 * BAR    # 11.98 s，前奏结束、中段开始
BODY_END = INTRO_END + 4 * PHRASE
XFADE = 1.5            # 接缝交叉淡化秒数


# 原曲是 6 声道的 5.1：响的是 3、4、5 声道，前左右很轻。直接 -ac 2 会被自动混音压低约 8 dB，
# 所以按下面的权重手工混成立体声，再整体提到和原曲相同的响度（约 -19 LUFS）。
DOWNMIX = (
    "pan=stereo|FL=0.5*c0+0.5*c4+0.4*c3+0.3*c2|FR=0.5*c1+0.5*c5+0.4*c3+0.3*c2,"
    "volume={gain}dB,alimiter=limit=0.89"
)
GAIN_DB = 3.0


def build(phrases: int, out: Path) -> None:
    pieces = [(0.0, INTRO_END)]
    pieces += [(INTRO_END, BODY_END)] * (phrases // 4)
    if phrases % 4:
        pieces += [(INTRO_END, INTRO_END + (phrases % 4) * PHRASE)]
    pieces += [(BODY_END, None)]

    # 每一段向后多留 XFADE，让交叉淡化吃掉的是重叠而不是内容
    parts = [f"[0:a]{DOWNMIX.format(gain=GAIN_DB)},asplit={len(pieces)}" + "".join(f"[st{i}]" for i in range(len(pieces)))]
    for i, (a, b) in enumerate(pieces):
        end = "" if b is None else f":end={b + XFADE if i < len(pieces) - 1 else b}"
        parts.append(f"[st{i}]atrim=start={a}{end},asetpts=PTS-STARTPTS[p{i}]")

    chain = "p0"
    for i in range(1, len(pieces)):
        out_label = f"x{i}"
        parts.append(f"[{chain}][p{i}]acrossfade=d={XFADE}:c1=qsin:c2=qsin[{out_label}]")
        chain = out_label

    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-v", "error", "-y", "-i", str(SRC),
        "-filter_complex", ";".join(parts),
        "-map", f"[{chain}]", "-ar", "48000", "-ac", "2", str(out),
    ]
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 15
    dest = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "public" / "attractor" / "audio" / "bgm.wav"
    build(n, dest)
    print(dest)
