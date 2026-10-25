"""《宇宙漫游》重制版的素材：从 refer/宇宙漫游/ 生成 public/ember/ 下的图、配乐和字体（img/、audio/ 不入库）。

    ~/.venvs/demucs/Scripts/python.exe tools/ember/prepare.py         # 全做
    ~/.venvs/demucs/Scripts/python.exe tools/ember/prepare.py audio   # 只做其中几步

只要 PATH 上的 ffmpeg。音效另由 tools/ember/sfx.py 合成。
- img/hudf.jpg      哈勃超深场原图（NASA/ESA，公有领域），全片第一帧和最后一帧
- audio/bgm.wav     作者自己的曲子 + 3.4 秒寂静 + 尾声复用的引子（0:00–0:30.6，最后六秒淡出），整体提 7 dB
- fonts/NotoSerifSC-Light.otf  思源宋体细体（OFL），从第十五期那份复制
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REFER = ROOT / "refer" / "宇宙漫游"
OUT = ROOT / "public" / "ember"


def hudf() -> None:
    dst = OUT / "img" / "hudf.jpg"
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(REFER / "资料" / "images" / "hudf_hubble_ultra_deep_field.jpg", dst)


def audio() -> None:
    dst = OUT / "audio" / "bgm.wav"
    dst.parent.mkdir(parents=True, exist_ok=True)
    graph = (
        "[0]atrim=0:247.6,asetpts=N/SR/TB,apad=whole_dur=251[a];"
        "[0]atrim=0:30.6,asetpts=N/SR/TB,afade=t=out:st=24.6:d=6[b];"
        "[a][b]concat=n=2:v=0:a=1,volume=7dB[o]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(REFER / "music.ogg"), "-filter_complex", graph, "-map", "[o]", "-ar", "48000", str(dst)], check=True)


def font() -> None:
    dst = OUT / "fonts" / "NotoSerifSC-Light.otf"
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "public" / "wander" / "fonts" / "NotoSerifSC-Light.otf", dst)


if __name__ == "__main__":
    steps = {f.__name__: f for f in (font, hudf, audio)}
    for name in sys.argv[1:] or list(steps):
        steps[name]()
        print("完成", name)
