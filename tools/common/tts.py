"""用 ElevenLabs 把稿子逐句念成一条念白，句间停顿自己接，并给出每句的起止时间。

    python tools/common/tts.py <稿子.json> <输出目录> [--regen 3 7 ...]

稿子格式同 src/videos/attractor/script.json：{"sections": [{"id", "title", "lines": [...]}, ...]}。
输出：<输出目录>/voice.wav（单声道 44.1 kHz，-20 LUFS）、timing.json（每句、每段的起止秒）、
clips/ 里每句一个 mp3（按文字和参数取哈希缓存，重跑只补缺的和 --regen 指定的序号）。

做法（2026-11-08 试出来的，第十三期《巨引源》）：
- 模型 eleven_v4。语气提示只放在整篇开头时，念长了会慢慢变高变响，所以逐句生成、每句都带同一个提示。
- v4 不支持 <break> 和 SSML；停顿不靠标签，由这里按句子和段落插静音。speed 文档说 v4 不支持，实测 0.85 有效。
- 逐句生成约四分之一的句子会把开头几个字或整句念两遍（但其实但其实、晚安晚安），换短标签、加 previous_text
  都去不掉，是随机的。所以每句用 whisper.cpp 转写，比字数、找连续重复，不对就重念（最多 6 次）。
  句中静音不能当判据：慢速念时句号、逗号处本来就停 0.6–1 秒。
- 密钥读环境变量 ELEVENLABS_API_KEY（兼容旧名 ELEVENLAVS_APIKEY），不打印。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

import numpy as np
import requests

ROOT = Path(__file__).resolve().parents[2]
VOICE = "MI36FIkp9wRP7cpWKPTl"  # Evan Zhao - Warm, Calm and Trustworthy
MODEL = "eleven_v4"
TAG = "[softly, very slow and low, calm bedtime voice, same quiet tone throughout]"
SETTINGS = {"stability": 0.75, "similarity_boost": 0.75, "clone_strength": 0.0, "speed": 0.85}
SR = 44100
WHISPER = ROOT / "tools" / "hanzi" / "whisper.cpp"
PUNCT = re.compile(r"[\s，。、；：？！…—“”‘’\"'（）()《》,.;:?!·-]")

# 停顿（秒）
HEAD, TAIL = 0.6, 1.5
GAP_LINE, GAP_LONG, GAP_SECTION = 0.9, 1.25, 2.4


def api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVENLAVS_APIKEY")
    if not key:
        raise SystemExit("没有找到环境变量 ELEVENLABS_API_KEY")
    return key


def tts(text: str, key: str) -> bytes:
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}",
        params={"output_format": "mp3_44100_128"},
        headers={"xi-api-key": key},
        json={"text": f"{TAG} {text}", "model_id": MODEL, "language_code": "zh", "voice_settings": SETTINGS},
        timeout=300,
    )
    if r.status_code != 200:
        raise SystemExit(f"ElevenLabs 返回 {r.status_code}：{r.text[:500]}")
    return r.content


def load(p: Path, sr: int = SR) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def envelope_db(x: np.ndarray) -> np.ndarray:
    win = int(0.01 * SR)
    n = len(x) // win
    e = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(axis=1))
    return 20 * np.log10(e + 1e-9)


def trim(x: np.ndarray, thr_db: float = -45.0, pad: float = 0.08) -> np.ndarray:
    # 去掉首尾静音，留一点余量再淡入淡出
    on = np.where(envelope_db(x) > thr_db)[0]
    win = int(0.01 * SR)
    a = max(0, on[0] * win - int(pad * SR))
    b = min(len(x), (on[-1] + 1) * win + int(pad * SR))
    y = x[a:b].copy()
    f = int(0.02 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def longest_gap(x: np.ndarray, thr_db: float = -45.0) -> float:
    # 句中最长的静音：念完又重复一遍时，中间会有一段长静音
    best = run = 0
    for v in envelope_db(x):
        run = run + 1 if v <= thr_db else 0
        best = max(best, run)
    return best * 0.01


def write_wav(x: np.ndarray, p: Path) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", str(p)],
                   input=x.tobytes(), check=True)


def first_utterance(x: np.ndarray, gap: float = 0.4) -> np.ndarray:
    # 短句（巨引源。晚安。）几乎每次都念两三遍，中间隔着清楚的静音：只留第一遍
    win = int(0.01 * SR)
    loud = envelope_db(x) > -45.0
    on = np.where(loud)[0]
    run = 0
    for k in range(on[0], len(loud)):
        run = 0 if loud[k] else run + 1
        if run * 0.01 >= gap:
            return trim(x[: (k - run + 1) * win])
    return x


def transcribe(p: Path) -> str | None:
    exe, model = WHISPER / "main.exe", WHISPER / "ggml-small.bin"
    if not exe.exists() or not model.exists():
        return None
    wav = p.with_suffix(".16k.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(p), "-ar", "16000", "-ac", "1", str(wav)], check=True)
    out = subprocess.run([str(exe), "-m", str(model), "-l", "zh", "-f", str(wav), "--prompt", "简体", "-nt"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    wav.unlink()
    return PUNCT.sub("", out)


REPEAT = re.compile(r"(.{2,})\1")


def check(c: np.ndarray, p: Path, line: str) -> str | None:
    # 主要靠转写抓「开头念两遍」（但其实但其实、晚安晚安）：重复是随机的，换标签也会有，只能查出来重念
    n = len(PUNCT.sub("", line))
    gap, dur = longest_gap(c), len(c) / SR
    if gap >= 1.5:
        return f"句中静音 {gap:.2f}s"
    if n >= 5 and dur / n > 0.5:
        return f"太长 {dur:.2f}s / {n} 字"
    heard = transcribe(p)
    if heard is None:
        return None
    if len(heard) > n * 1.15 + 1:
        return f"转写多出字：{heard}"
    m = REPEAT.search(heard)
    if m and not REPEAT.search(PUNCT.sub("", line)):
        return f"转写里有重复「{m.group(0)}」：{heard}"
    return None


def gap_after(line: str) -> float:
    if line.endswith(("？", "——")) or len(line) > 30:
        return GAP_LONG
    return GAP_LINE


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--regen", type=int, nargs="*", default=[])
    a = ap.parse_args()

    sections = json.loads(Path(a.script).read_text(encoding="utf-8"))["sections"]
    out = Path(a.out)
    clips_dir = out / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)
    key = api_key()
    regen = set(a.regen)

    pieces: list[np.ndarray] = [np.zeros(int(HEAD * SR), np.float32)]
    t = HEAD
    timing = []
    idx = 0
    for si, sec in enumerate(sections):
        sec_t = {"id": sec.get("id"), "title": sec.get("title"), "start": round(t, 3), "lines": []}
        for li, line in enumerate(sec["lines"]):
            h = hashlib.sha1(json.dumps([line, TAG, MODEL, VOICE, SETTINGS], ensure_ascii=False).encode()).hexdigest()[:8]
            p = clips_dir / f"{idx:03d}_{h}.mp3"
            for attempt in range(6):
                if not p.exists() or (attempt == 0 and idx in regen) or attempt > 0:
                    p.write_bytes(tts(line, key))
                c = trim(load(p))
                probe = p
                if len(PUNCT.sub("", line)) <= 6 and not re.search(r"[，、；：]", line):
                    c = first_utterance(c)
                    probe = p.with_suffix(".cut.wav")
                    write_wav(c, probe)
                why = check(c, probe, line)
                if probe != p:
                    probe.unlink()
                if why is None:
                    break
                print(f"  第 {idx} 句重念（{why}）")
            else:
                print(f"!! 第 {idx} 句六次都没过检查，先用最后一次：{line}")
            last = li == len(sec["lines"]) - 1
            pieces.append(c)
            sec_t["lines"].append({"i": idx, "text": line, "start": round(t, 3), "end": round(t + len(c) / SR, 3)})
            t += len(c) / SR
            g = (GAP_SECTION if si < len(sections) - 1 else TAIL) if last else gap_after(line)
            pieces.append(np.zeros(int(g * SR), np.float32))
            t += g
            print(f"{idx:3d} {len(c) / SR:5.2f}s  {line}")
            idx += 1
        sec_t["end"] = sec_t["lines"][-1]["end"]
        timing.append(sec_t)

    y = np.concatenate(pieces)
    raw = out / "voice.raw.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", str(raw)],
                   input=y.tobytes(), check=True)
    # 整条只乘一个增益到 -20 LUFS（loudnorm 单遍是动态的，会把句与句的相对响度拉平或起伏）
    meter = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "ebur128", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    loud = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", meter)[-1])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"volume={-20 - loud:.2f}dB",
                    "-c:a", "pcm_s16le", str(out / "voice.wav")], check=True)
    print(f"原始 {loud:.1f} LUFS，增益 {-20 - loud:+.1f} dB")
    raw.unlink()
    (out / "timing.json").write_text(json.dumps({"duration": round(len(y) / SR, 3), "sections": timing},
                                                ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"共 {idx} 句，{len(y) / SR:.1f} 秒 -> {out / 'voice.wav'}")


if __name__ == "__main__":
    main()
