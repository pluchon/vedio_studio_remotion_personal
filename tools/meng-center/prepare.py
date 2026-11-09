"""萌部落演示片的素材：截图、角色图、贴纸、字体，全部放进 public/meng-center/（img/ 不入库）。

    python tools/meng-center/prepare.py [萌部落仓库路径]

页面截图是 2026-11-01 从本机站点（meng_admin 登录）用 1536×960 重拍的，存在 refer/萌部落演示/shots/（不入库）；
登录页和片尾横幅取自萌部落 README 的图床；角色头像、桌宠、海报、表情贴纸、蝴蝶结标志取自萌部落前端的 src/assets/。
这些图是琪露诺（《东方Project》）的同人二创，不进这个公开仓库。字体从第十期复制（都是 OFL）。
要 ffmpeg 在 PATH 上。
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "meng-center"
MENG = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "meng_center"
OSS = "https://zlhimage.oss-cn-guangzhou.aliyuncs.com/"

# 本机重拍的页面（已是 1536×960），原样复制
PAGES = ["home", "naitang", "detail", "editor", "search", "creator", "messages", "profile"]

# 图床上的图：名字 → (文件名, 缩放到的宽)
REMOTE = {
    "login": ("item_picture/meng_center/readme/login.webp", 1536),
    "cover": ("item_picture/meng_center/readme/banner.png", 1600),
}

# 前端素材：名字 → (src/assets/ 下的路径, 缩放到的宽)
ASSETS = {
    "logo": ("meng_logo.png", 512),
    "neko": ("companion/avatars/neko-avatar.png", 512),
    "mascot": ("editor-cirno-mascot.png", 512),
    "poster-voice": ("home-comic-voice.png", 1480),
    **{f"emo-{n}": (f"emotion-cirno-{n}.png", 512) for n in [
        "hooray", "love", "awesome", "cheer", "expert", "work", "wow", "shy", "sleepy",
        "headpat", "popsicle", "confused", "airplane", "overheated", "shake"]},
}


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def shots(work: Path) -> None:
    for name in PAGES:
        shutil.copy2(ROOT / "refer" / "萌部落演示" / "shots" / f"{name}.png", OUT / "img" / f"{name}.png")
    for name, (src, w) in REMOTE.items():
        raw = work / Path(src).name
        print("下载", src)
        subprocess.run(["curl", "-sSf", "-o", str(raw), OSS + src], check=True)
        ffmpeg("-i", str(raw), "-vf", f"scale={w}:-1:flags=lanczos", str(OUT / "img" / f"{name}.png"))


def assets() -> None:
    base = MENG / "vue_front" / "front_user" / "src" / "assets"
    for name, (rel, w) in ASSETS.items():
        ffmpeg("-i", str(base / rel), "-vf", f"scale={w}:-1:flags=lanczos", str(OUT / "img" / f"{name}.png"))


# 桌宠的分层图（275×375，叠起来就对齐）：萌部落 2026-11-07 删掉了桌宠，图从删除前的那次提交里取
PET_COMMIT = "698e9e2^"
PET = ["body", "eyes-half", "eyes-closed", *[f"mouth-{i}" for i in range(1, 7)], "pose-smile", "pose-crouch", "pose-leap", "tail-strip"]


def pet() -> None:
    (OUT / "img" / "pet").mkdir(parents=True, exist_ok=True)
    for name in PET:
        rel = f"vue_front/front_user/src/assets/companion/pet/{name}.webp"
        data = subprocess.run(["git", "-C", str(MENG), "show", f"{PET_COMMIT}:{rel}"], capture_output=True, check=True).stdout
        (OUT / "img" / "pet" / f"{name}.webp").write_bytes(data)
    for name in ["smile", "leap"]:
        ffmpeg("-i", str(OUT / "img" / "pet" / f"pose-{name}.webp"), str(OUT / "img" / f"pet-{name}.png"))


# 2026-11-07 改版后的页面：萌部落那边的 Claude 会话里浏览器截的图（800 宽），挑出来存在 refer/萌部落演示/shots-1107/（不入库）
V2 = ["register.jpg", "comments.jpg", "editor.jpg", "review.jpg", "growth.jpg", "folders.jpg", "password.jpg", "chat.png"]


def shots_v2() -> None:
    (OUT / "img" / "v2").mkdir(parents=True, exist_ok=True)
    for name in V2:
        shutil.copy2(ROOT / "refer" / "萌部落演示" / "shots-1107" / name, OUT / "img" / "v2" / name)


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
    pet()
    shots_v2()
    fonts()
    print("好了：", OUT)


if __name__ == "__main__":
    main()
