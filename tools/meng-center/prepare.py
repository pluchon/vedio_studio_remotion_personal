"""萌部落演示片的素材：截图、角色图、贴纸、字体，全部放进 public/meng-center/（img/ 不入库）。

    python tools/meng-center/prepare.py [萌部落仓库路径]

截图是萌部落 README 里的那十几张（图床上的原图，每张外面一圈「项目手账」的边框，这里裁掉只留网页本身），
成长中心那张在萌部落仓库的 docs/images/growth.png；角色大头照、表情贴纸、蝴蝶结标志取自萌部落前端的 src/assets/。
这些图是琪露诺（《东方Project》）的同人二创，不进这个公开仓库。字体从第十期复制（都是 OFL）。
要 ffmpeg 在 PATH 上。
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "meng-center"
MENG = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "meng_center"
OSS = "https://zlhimage.oss-cn-guangzhou.aliyuncs.com/"

# 名字: (图床文件名或仓库内路径, 裁剪 x, y, 宽, 高)：裁掉外圈的标题和页脚
SHOTS = {
    "cover": ("20261018120137852.png", 0, 0, 1600, 800),
    "login": ("20261018120139667.png", 32, 104, 1536, 900),
    "home": ("20261018120141979.png", 32, 104, 1536, 908),
    "detail": ("20261018120143381.png", 32, 104, 1536, 956),
    "editor": ("20261018120145635.png", 32, 104, 1536, 908),
    "search": ("20261018120147912.png", 32, 104, 1536, 908),
    "creator": ("20261018120152683.png", 32, 104, 1536, 956),
    "profile": ("20261018120157288.png", 32, 104, 1536, 908),
    "meng-home": ("20261018120159934.png", 32, 104, 1536, 908),
    "meng-chat": ("20261018120202763.png", 32, 104, 1536, 908),
    "memory": ("20261018120205445.png", 32, 104, 1536, 722),
    "personality": ("20261018120207726.png", 32, 104, 1536, 684),
    "messages": ("20261018121851354.png", 32, 104, 1536, 908),
    "growth": ("docs/images/growth.png", 32, 104, 1536, 908),
}

# 前端素材：名字 → src/assets/ 下的路径
ASSETS = {
    "logo": "meng_logo.png",
    "rin": "companion/avatars/tsundere-avatar.png",
    "aoi": "companion/avatars/genki-avatar.png",
    "neko": "companion/avatars/neko-avatar.png",
    "mascot": "editor-cirno-mascot.png",
    **{f"emo-{n}": f"emotion-cirno-{n}.png" for n in [
        "hooray", "love", "awesome", "cheer", "expert", "work", "wow", "shy", "sleepy",
        "headpat", "popsicle", "confused", "airplane", "overheated", "shake"]},
}


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def shots(work: Path) -> None:
    for name, (src, x, y, w, h) in SHOTS.items():
        if src.startswith("docs/"):
            raw = MENG / src
        else:
            raw = work / src
            if not raw.exists():
                print("下载", src)
                urllib.request.urlretrieve(OSS + src, raw)
        ffmpeg("-i", str(raw), "-vf", f"crop={w}:{h}:{x}:{y}", str(OUT / "img" / f"{name}.png"))


def assets() -> None:
    base = MENG / "vue_front" / "front_user" / "src" / "assets"
    for name, rel in ASSETS.items():
        # 贴纸原图 1254 见方，缩到 512 够用
        ffmpeg("-i", str(base / rel), "-vf", "scale=512:-1:flags=lanczos", str(OUT / "img" / f"{name}.png"))


def fonts() -> None:
    (OUT / "fonts").mkdir(parents=True, exist_ok=True)
    for f in ["ZCOOLKuaiLe-Regular.ttf", "Fredoka.ttf", "MPLUSRounded1c-Bold.ttf"]:
        shutil.copy2(ROOT / "public" / "hello" / "fonts" / f, OUT / "fonts" / f)


def main() -> None:
    (OUT / "img").mkdir(parents=True, exist_ok=True)
    work = OUT / "img" / "_raw"
    work.mkdir(exist_ok=True)
    shots(work)
    shutil.rmtree(work)
    assets()
    fonts()
    print("好了：", OUT)


if __name__ == "__main__":
    main()
