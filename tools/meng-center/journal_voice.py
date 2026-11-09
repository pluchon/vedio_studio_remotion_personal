"""《奶糖的萌部落手帐》的念白：Lulu 声音逐句生成，转写查重念，每句统一响度，并算出每帧的嘴型开合。

    python tools/meng-center/journal_voice.py [--regen 3 7 ...]

稿子在 src/videos/meng-center/journal/script.json（音色、语气标签、参数也写在里面）。
输出：public/meng-center/audio/journal/NN.wav（不入库）；src/videos/meng-center/journal/voice.json（每句的
时长和 40 帧/秒的响度包络，画面用它对嘴型、排时间，入库）。
生成、修剪、查重都复用 tools/common/tts.py（缓存按文字和参数取哈希，重跑只补缺的和 --regen 指定的序号）。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "common"))
import tts  # noqa: E402

SCRIPT = ROOT / "src" / "videos" / "meng-center" / "journal" / "script.json"
DATA = ROOT / "src" / "videos" / "meng-center" / "journal" / "voice.json"
OUT = ROOT / "public" / "meng-center" / "audio" / "journal"
FPS = 40
LUFS = -18.0


def loudness(p: Path) -> float:
    meter = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "ebur128", "-f", "null", "-"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", meter)[-1])


def mouth_envelope(x: np.ndarray) -> list[float]:
    """每帧的响度映射到 0..1（-42 dB 以下算闭嘴，-14 dB 张到最大）。"""
    hop = tts.SR // FPS
    n = int(np.ceil(len(x) / hop))
    pad = np.zeros(n * hop, np.float32)
    pad[: len(x)] = x
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms)
    return [round(float(v), 2) for v in np.clip((db + 42) / 28, 0, 1)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--regen", type=int, nargs="*", default=[])
    a = ap.parse_args()

    spec = json.loads(SCRIPT.read_text(encoding="utf-8"))
    tts.VOICE, tts.TAG, tts.SETTINGS = spec["voice"], spec["tag"], spec["settings"]
    OUT.mkdir(parents=True, exist_ok=True)
    cache = OUT / "clips"
    cache.mkdir(exist_ok=True)
    key = tts.api_key()
    regen = set(a.regen)

    lines = []
    idx = 0
    for scene in spec["scenes"]:
        for text in scene["lines"]:
            h = hashlib.sha1(json.dumps([text, tts.TAG, tts.MODEL, tts.VOICE, tts.SETTINGS], ensure_ascii=False).encode()).hexdigest()[:8]
            mp3 = cache / f"{idx:02d}_{h}.mp3"
            for attempt in range(6):
                if not mp3.exists() or (attempt == 0 and idx in regen) or attempt > 0:
                    mp3.write_bytes(tts.tts(text, key))
                c = tts.trim(tts.load(mp3))
                probe = cache / f"{idx:02d}.probe.wav"
                tts.write_wav(c, probe)
                why = tts.check(c, probe, text)
                probe.unlink()
                if why is None:
                    break
                print(f"  line {idx} retry ({why})")
            else:
                print(f"!! line {idx} failed 6 checks, keeping the last take")
            raw = OUT / f"{idx:02d}.raw.wav"
            tts.write_wav(c, raw)
            gain = LUFS - loudness(raw)
            wav = OUT / f"{idx:02d}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"volume={gain:.2f}dB,alimiter=limit=0.9:level=false",
                            "-ar", str(tts.SR), "-c:a", "pcm_s16le", str(wav)], check=True)
            raw.unlink()
            dur = len(c) / tts.SR
            lines.append({"i": idx, "scene": scene["id"], "text": text, "dur": round(dur, 3), "mouth": mouth_envelope(c)})
            print(f"{idx:2d} {dur:5.2f}s gain {gain:+.1f}dB")
            idx += 1

    DATA.write_text(json.dumps({"fps": FPS, "lines": lines}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{idx} lines, {sum(x['dur'] for x in lines):.1f}s speech -> {DATA}")


if __name__ == "__main__":
    main()
