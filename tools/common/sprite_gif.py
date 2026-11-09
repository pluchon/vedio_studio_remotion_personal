"""把 GPT Image 2.6 生成的绿幕 GIF 补帧、抠图，变成能放进 Remotion 的透明视频。

    python tools/common/sprite_gif.py <输入.gif> <输出.webm> [--fps 40] [--preview 预览.mp4] [--src-fps 10]

做法（2026-11-09 第一次做奶糖动图时摸出来的）：
- GIF 在 ElevenLabs「图片生成/GIF动图生成」工作流里出：先定静图（纯绿底），再让「最终产出(动图版)」把它动起来，
  16 帧、每帧 100ms。动图约束里要写明 "borderless, no grid / gutters / separator lines"——不写的话 GPT 2.6 在
  精灵图上画格子缝，切出来的帧左边有一条暗绿竖线、人物逐帧左右跳。
- 补帧用 RIFE（tools/common/rife/，不入库；从 github.com/nihui/rife-ncnn-vulkan 的 releases 下 windows 包，只留
  rife-ncnn-vulkan.exe、vcomp140.dll 和 rife-v4.6 目录），核显上 Vulkan 能跑，要加 -j 1:1:1，否则时不时
  vkAllocateMemory failed 后崩。首帧补在末尾一起插，循环接缝也顺。没有 RIFE 才退回 ffmpeg minterpolate，
  跳跃这种大动作会糊出重影。
- 抠图自己算，不用 ffmpeg 的 chromakey + despill：despill 会把所有偏绿的颜色压掉，黄色星星变成橙色。
  这里按"绿比红蓝高多少"给透明度，只对半透明的边缘像素把背景绿按比例减掉（反混合），主体颜色不动。
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np

RIFE = Path(__file__).resolve().parent / "rife"


def probe(gif: Path) -> tuple[int, int, float]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
         "-show_entries", "stream=width,height,nb_read_frames,duration", "-of", "csv=p=0", str(gif)],
        capture_output=True, text=True, check=True).stdout.strip().split(",")
    w, h, dur, n = int(out[0]), int(out[1]), float(out[2]), int(out[3])
    return w, h, n / dur


def read_frames(src: list[str], w: int, h: int) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", *src, "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def write_png(img: np.ndarray, path: Path, fmt: str) -> None:
    h, w = img.shape[:2]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", fmt, "-s", f"{w}x{h}",
                    "-i", "-", str(path)], input=img.tobytes(), check=True)


def background(f: np.ndarray) -> np.ndarray:
    # 四角 12×12 的中位色当背景色
    s = 12
    corners = np.concatenate([f[:s, :s], f[:s, -s:], f[-s:, :s], f[-s:, -s:]]).reshape(-1, 3)
    return np.median(corners, axis=0)


def matte(f: np.ndarray, bg: np.ndarray, lo: float = 40.0) -> np.ndarray:
    # 绿幕抠图：greenness = G - max(R, B)；背景处约等于背景自己的 greenness，主体处 ≤ lo
    p = f.astype(np.float32)
    g = p[..., 1] - np.maximum(p[..., 0], p[..., 2])
    hi = float(bg[1] - max(bg[0], bg[2])) * 0.85
    a = np.clip((hi - g) / (hi - lo), 0.0, 1.0)
    # 半透明边缘：p = a*c + (1-a)*bg → c = (p - (1-a)*bg) / a，把背景绿减掉
    edge = (a > 0.02) & (a < 0.98)
    c = p.copy()
    c[edge] = (p[edge] - (1 - a[edge, None]) * bg) / a[edge, None]
    # 剩下一点绿边再压一下（只压边缘，不碰主体）
    gmax = np.maximum(c[..., 0], c[..., 2])
    c[..., 1] = np.where(edge, np.minimum(c[..., 1], gmax + 10), c[..., 1])
    out = np.concatenate([np.clip(c, 0, 255), (a * 255)[..., None]], axis=-1)
    return out.astype(np.uint8)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("gif", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--fps", type=int, default=40)
    ap.add_argument("--preview", type=Path)
    ap.add_argument("--src-fps", type=float, help="按多少帧/秒播放原帧（默认读 GIF 里的帧时长）")
    a = ap.parse_args()

    w, h, src_fps = probe(a.gif)
    src_fps = a.src_fps or src_fps
    fs = read_frames(["-i", str(a.gif)], w, h)
    bg = background(fs[0])
    tmp = Path(tempfile.mkdtemp(prefix="sprite_gif_"))
    try:
        rife = (RIFE / "rife-ncnn-vulkan.exe").exists()
        n = len(fs)
        mult = max(1, round(a.fps / src_fps))
        fps = src_fps * mult
        (tmp / "in").mkdir()
        (tmp / "seq").mkdir()
        for i, f in enumerate([*fs, fs[0]] if rife else fs):  # RIFE：首帧补在末尾，循环处也插帧
            write_png(f, tmp / "in" / f"{i + 1:08d}.png", "rgb24")
        if rife:
            win = lambda p: str(p).replace("/", "\\")
            r = subprocess.run([win(RIFE / "rife-ncnn-vulkan.exe"), "-i", win(tmp / "in"), "-o", win(tmp / "seq"),
                                "-n", str(n * mult + 1), "-m", win(RIFE / "rife-v4.6"), "-j", "1:1:1"], capture_output=True)
            if r.returncode != 0:
                raise SystemExit(f"RIFE 失败（{r.returncode}）：{r.stderr.decode(errors='replace')[-400:]}")
            (tmp / "seq" / f"{n * mult + 1:08d}.png").unlink()  # 最后一帧就是首帧，去掉免得循环时停一下
        else:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", f"{src_fps:.4f}", "-i", str(tmp / "in" / "%08d.png"),
                            "-vf", f"minterpolate=fps={fps:.4f}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
                            str(tmp / "seq" / "%08d.png")], check=True)
        seq = read_frames(["-i", str(tmp / "seq" / "%08d.png")], w, h)
        (tmp / "rgba").mkdir()
        for i, f in enumerate(seq):
            write_png(matte(f, bg), tmp / "rgba" / f"{i + 1:08d}.png", "rgba")
        src = ["-framerate", f"{fps:.4f}", "-i", str(tmp / "rgba" / "%08d.png")]
        subprocess.run(["ffmpeg", "-v", "error", "-y", *src, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                        "-b:v", "0", "-crf", "28", str(a.out)], check=True)
        if a.preview:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-stream_loop", "3", *src, "-filter_complex",
                            f"color=c=0x101a2e:s={w}x{h}:r={fps:.4f}[bg];[bg][0:v]overlay=shortest=1,format=yuv420p",
                            "-c:v", "libx264", "-crf", "18", str(a.preview)], check=True)
        print(f"{n} 帧，原 {src_fps:.1f} 帧/秒 → {fps:.0f}（{'RIFE' if rife else 'minterpolate'}），共 {len(seq)} 帧；"
              f"背景色 {bg.astype(int).tolist()}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
