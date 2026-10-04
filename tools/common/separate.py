#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把一段音频里的人声和配乐分开（Demucs），和 ffmpeg 一样是一个共用的外部工具。

用法：python tools/common/separate.py <音频文件> [输出目录] [--keep-vocals]
输出（默认放在音频文件旁边）：
  <名字>-背景音乐.wav / .mp3   去掉了人声，响度调到约 -19.5 LUFS
  <名字>-人声.wav              只有加了 --keep-vocals 才保留

Demucs 装在仓库外的独立环境里，不污染工程和本机的 Python：
  uv venv ~/.venvs/demucs --python 3.11
  uv pip install --python ~/.venvs/demucs/Scripts/python.exe torch torchaudio --index-url https://download.pytorch.org/whl/cpu
  uv pip install --python ~/.venvs/demucs/Scripts/python.exe demucs soundfile
换了位置就设环境变量 DEMUCS_PYTHON 指向那个环境的 python。模型（htdemucs，约 80 MB）第一次运行时自动下载。
需要 PATH 上有 ffmpeg。CPU 上大约是音频时长的 0.4 倍，4 分钟的音频要一两分钟。
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def demucs_python() -> str:
    env = os.environ.get("DEMUCS_PYTHON")
    if env:
        return env
    home = Path.home() / ".venvs" / "demucs"
    for rel in ("Scripts/python.exe", "bin/python"):
        if (home / rel).exists():
            return str(home / rel)
    sys.exit("找不到 Demucs 的 Python：按本文件开头的说明装一个，或者设置 DEMUCS_PYTHON")


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    keep_vocals = "--keep-vocals" in sys.argv
    if not args:
        sys.exit(__doc__)
    src = Path(args[0]).resolve()
    out_dir = Path(args[1]).resolve() if len(args) > 1 else src.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = src.stem

    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "in.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-ar", "44100", "-ac", "2", str(wav)], check=True)
        run = subprocess.run([demucs_python(), "-m", "demucs", "-n", "htdemucs", "--two-stems=vocals", "-o", tmp, str(wav)], capture_output=True, text=True, encoding="utf-8", errors="replace")
        if run.returncode != 0:
            sys.exit(run.stderr[-2000:])
        result = Path(tmp) / "htdemucs" / "in"
        music = out_dir / f"{stem}-背景音乐.wav"
        # 分离出来的伴奏很轻（约 -28 LUFS，峰值 -6 dB），抬 9 dB 再轻轻限一下幅
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(result / "no_vocals.wav"), "-af", "volume=9dB,alimiter=limit=0.89:level=false", str(music)], check=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(music), "-codec:a", "libmp3lame", "-b:a", "320k", str(music.with_suffix(".mp3"))], check=True)
        if keep_vocals:
            shutil.copy(result / "vocals.wav", out_dir / f"{stem}-人声.wav")
    print(f"写到 {out_dir}")


if __name__ == "__main__":
    main()
