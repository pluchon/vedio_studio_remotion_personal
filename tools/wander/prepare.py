"""宇宙漫游的素材：从 refer/宇宙漫游/ 生成 public/wander/ 下的图、配乐和字体（img/、audio/ 不入库）。

    ~/.venvs/demucs/Scripts/python.exe tools/wander/prepare.py         # 全做
    ~/.venvs/demucs/Scripts/python.exe tools/wander/prepare.py audio   # 只做其中几步
（msys2 的 Python 没带根证书，下字体会失败，所以用这个虚拟环境的 Python）

只要 PATH 上的 ffmpeg。画面全是 Skia 着色器和矢量画的，真实照片只有首尾那一张哈勃超深场。
- img/hudf.jpg      哈勃超深场原图（NASA/ESA，公有领域），全片第一帧和最后一帧
- audio/bgm.wav     作者自己的曲子 + 3.4 秒寂静 + 尾声复用的引子（0:00–0:30.6，最后六秒淡出），整体提 7 dB
- fonts/NotoSerifSC-Light.otf  思源宋体细体（OFL），没有就从 notofonts 下载
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REFER = ROOT / "refer" / "宇宙漫游"
IMAGES = REFER / "资料" / "images"
OUT = ROOT / "public" / "wander"
FONT_URL = "https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Light.otf"


def hudf() -> None:
    dst = OUT / "img" / "hudf.jpg"
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(IMAGES / "hudf_hubble_ultra_deep_field.jpg", dst)


def audio() -> None:
    src = REFER / "music.ogg"
    dst = OUT / "audio" / "bgm.wav"
    dst.parent.mkdir(parents=True, exist_ok=True)
    graph = (
        "[0]atrim=0:247.6,asetpts=N/SR/TB,apad=whole_dur=251[a];"
        "[0]atrim=0:30.6,asetpts=N/SR/TB,afade=t=out:st=24.6:d=6[b];"
        "[a][b]concat=n=2:v=0:a=1,volume=7dB[o]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-filter_complex", graph, "-map", "[o]", "-ar", "48000", str(dst)], check=True)


def font() -> None:
    dst = OUT / "fonts" / "NotoSerifSC-Light.otf"
    if dst.exists():
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(FONT_URL, dst)


if __name__ == "__main__":
    steps = {f.__name__: f for f in (font, hudf, audio)}
    for name in sys.argv[1:] or list(steps):
        steps[name]()
        print("完成", name)
