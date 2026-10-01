"""把 refer/二次元萌系/ 里的原始素材整理成视频用的文件，输出到 public/moe/

用法：python tools/moe/prepare.py
需要 PATH 上有 ffmpeg。动漫片段和配乐不入库，只在本机生成。
"""
from __future__ import annotations

import logging
import re
import subprocess
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "refer" / "二次元萌系"
OUT = ROOT / "public" / "moe"

# 底图是 1672×941，成片 1920×1080
BASE_SCALE = "scale=1920:1080:flags=lanczos"
# 卡片的底色：抠掉它，胶带、夹子、花瓣就能盖在片段上面
CARD_COLOR = "0xFCF8F0"
# 闭眼版只取脸这一块（底图坐标），其余地方两张图未必逐像素一致
BLINK = {"x": 250, "y": 440, "w": 340, "h": 220}

POSES = ["走1", "走2", "蹦1", "蹦2", "困1", "困2", "看1", "看2"]
POSE_FILES = {"走1": "walk1", "走2": "walk2", "蹦1": "jump1", "蹦2": "jump2", "困1": "sleepy1", "困2": "sleepy2", "看1": "watch1", "看2": "watch2"}

CLIP = "萌系可爱合集.mp4"
# 裁掉左上角的水印，并裁成卡片的宽高比（约 1.35）
CLIP_CROP = "crop=1404:1040:336:40,scale=1120:830:flags=lanczos"

# 合集里每个镜头的起止秒数（场景检测加人工核对；开头的对白和几处闪切不用）
SHOTS = [
    (6.767, 7.233), (7.233, 7.6), (7.6, 8.033), (8.033, 8.5), (8.5, 9.0), (9.0, 9.533), (9.533, 9.967), (9.967, 10.367),
    (10.367, 11.233), (11.233, 12.233), (12.233, 12.8), (12.8, 13.333), (13.333, 14.167), (14.167, 14.767), (14.767, 15.333),
    (15.333, 15.7), (15.7, 16.133), (16.133, 16.567), (16.567, 17.0), (17.0, 17.5), (17.5, 18.0), (18.0, 18.4), (18.4, 18.933),
    (18.933, 19.367), (19.367, 19.9), (19.9, 20.467), (20.467, 20.967), (21.0, 21.733), (21.733, 22.867), (22.867, 23.733),
    (23.733, 24.8), (24.8, 25.6), (25.6, 26.4), (26.4, 27.233), (29.167, 30.5), (30.5, 31.433), (32.3, 33.233), (33.233, 34.1),
    (34.1, 34.933), (34.933, 35.433), (35.933, 36.333), (36.333, 36.8),
]


def ffmpeg(*args: str) -> str:
    proc = subprocess.run(["ffmpeg", "-hide_banner", "-y", *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        log.error(proc.stderr)
        sys.exit(1)
    return proc.stderr


def alpha_box(path: Path) -> tuple[int, int, int, int]:
    """透明图里人物的外框：x、y、宽、高"""
    text = ffmpeg("-i", str(path), "-vf", "alphaextract,bbox=min_val=24", "-frames:v", "1", "-f", "null", "-")
    found = re.findall(r"x1:(\d+) x2:(\d+) y1:(\d+) y2:(\d+)", text)
    if not found:
        log.error("找不到外框: %s", path)
        sys.exit(1)
    x1, x2, y1, y2 = (int(v) for v in found[-1])
    return x1, y1, x2 - x1 + 1, y2 - y1 + 1


def main() -> None:
    for sub in ("img", "pose", "clips", "audio"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)

    ffmpeg("-i", str(SRC / "底图.png"), "-vf", BASE_SCALE, "-q:v", "2", str(OUT / "img" / "base.jpg"))
    ffmpeg("-i", str(SRC / "底图.png"), "-vf", f"colorkey={CARD_COLOR}:0.018:0.01,format=rgba,{BASE_SCALE}", str(OUT / "img" / "base-top.png"))
    b = BLINK
    k = 1920 / 1672
    ffmpeg(
        "-i", str(SRC / "底图闭眼.png"),
        "-vf", f"crop={b['w']}:{b['h']}:{b['x']}:{b['y']},scale={round(b['w'] * k)}:{round(b['h'] * k)}:flags=lanczos",
        "-q:v", "2", str(OUT / "img" / "blink.jpg"),
    )
    log.info("底图完成")

    for name in POSES:
        x, y, w, h = alpha_box(SRC / f"{name}.png")
        ffmpeg("-i", str(SRC / f"{name}.png"), "-vf", f"crop={w}:{h}:{x}:{y},scale=-1:{min(h, 640)}:flags=lanczos", str(OUT / "pose" / f"{POSE_FILES[name]}.png"))
        log.info("%s 外框 %dx%d", name, w, h)

    ffmpeg("-i", str(SRC / CLIP), "-an", "-vf", CLIP_CROP, "-c:v", "libx264", "-crf", "17", "-g", "6", "-pix_fmt", "yuv420p", str(OUT / "clips" / "reel.mp4"))
    for i, (_, end) in enumerate(SHOTS):
        # 每个镜头的最后一帧做成小图，贴成拍立得
        ffmpeg("-ss", f"{end - 0.1:.3f}", "-i", str(SRC / CLIP), "-frames:v", "1", "-vf", CLIP_CROP + ",scale=400:-1", "-q:v", "3", str(OUT / "clips" / f"shot-{i:02d}.jpg"))
    log.info("片段完成，共 %d 个镜头", len(SHOTS))

    ffmpeg("-i", str(SRC / "Theme of Senko.aac"), "-map", "0:a", "-c:a", "libmp3lame", "-b:a", "320k", str(OUT / "audio" / "senko.mp3"))
    log.info("配乐完成")


if __name__ == "__main__":
    main()
