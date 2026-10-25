"""《宇宙漫游》重制版的音效轨：全部用 numpy 合成，按画面的秒数摆好，输出 public/ember/audio/sfx.wav（不入库）。

    ~/.venvs/demucs/Scripts/python.exe tools/ember/sfx.py

只是音效（风、水、火、呼啸、轻响），不是配乐；配乐是作者自己的曲子。音高只用 D 小调里的 D、F、G、A、C，免得和曲子打架。
做法：几种基本的声音（滤过的噪声、衰减的正弦、短促的颗粒）按事件表放到时间轴上；一部分送进一个共用的混响（合成的冲激响应）。
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
DUR = 296.0
N = int(SR * DUR)
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "ember" / "audio" / "sfx.wav"
SILENT = 247.6
# 整体提升：环境声大致比配乐低 19–26 dB，重击和铃声单独压着（作者看完说音效偏大，在原来的基础上减半，即 -6 dB）
BOOST = 10 ** (3 / 20)

rng = np.random.default_rng(20261025)
dry = np.zeros((N, 2), np.float32)
wet = np.zeros((N, 2), np.float32)  # 送进混响的


def db(x: float) -> float:
    return 10 ** (x / 20)


def tt(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def noise(dur: float) -> np.ndarray:
    return rng.standard_normal(int(dur * SR)).astype(np.float32)


def bandpass(x: np.ndarray, lo: float, hi: float, soft: float = 0.25) -> np.ndarray:
    """频域里的带通：边缘按对数频率平滑过渡。"""
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X = np.fft.rfft(x)
    lf = np.log2(np.maximum(f, 1.0))
    m = np.clip((lf - np.log2(lo)) / soft + 0.5, 0, 1) * np.clip((np.log2(hi) - lf) / soft + 0.5, 0, 1)
    return np.fft.irfft(X * m, n).astype(np.float32)


def sweep(x: np.ndarray, lo: np.ndarray, hi: np.ndarray) -> np.ndarray:
    """随时间变的带通（短时傅里叶，每帧一个通带）；lo/hi 是每个样本的上下限。"""
    W, H = 2048, 512
    win = np.hanning(W).astype(np.float32)
    pad = np.concatenate([np.zeros(W), x, np.zeros(W)]).astype(np.float32)
    out = np.zeros_like(pad)
    norm = np.zeros_like(pad)
    f = np.fft.rfftfreq(W, 1 / SR)
    lf = np.log2(np.maximum(f, 1.0))
    for s in range(0, len(pad) - W, H):
        c = min(max(s - W + W // 2, 0), len(x) - 1)
        m = np.clip((lf - np.log2(lo[c])) / 0.3 + 0.5, 0, 1) * np.clip((np.log2(hi[c]) - lf) / 0.3 + 0.5, 0, 1)
        fr = np.fft.irfft(np.fft.rfft(pad[s : s + W] * win) * m, W) * win
        out[s : s + W] += fr
        norm[s : s + W] += win * win
    return (out / np.maximum(norm, 1e-3))[W : W + len(x)].astype(np.float32)


def env(dur: float, a: float, r: float, shape: float = 1.0) -> np.ndarray:
    t = tt(dur)
    e = np.minimum(1, t / max(a, 1e-4)) * np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return (e**shape).astype(np.float32)


def place(sig: np.ndarray, t0: float, gain: float, pan: float = 0.0, send: float = 0.0) -> None:
    """放到时间轴上：pan -1 左 … 1 右；send 是送进混响的比例。sig 可以是单声道或立体声。"""
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        st = np.stack([sig * l, sig * r], 1) * np.sqrt(2)
    else:
        st = sig
    st = st[: N - i0] * gain * BOOST
    dry[i0 : i0 + len(st)] += st * (1 - send * 0.5)
    wet[i0 : i0 + len(st)] += st * send


def stereo(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    n = min(len(a), len(b))
    return np.stack([a[:n], b[:n]], 1)


# ---------- 声音的配方 ----------

def whoosh(dur: float, f0: float, f1: float, seed_pan: float = 0.0) -> np.ndarray:
    n = int(dur * SR)
    p = np.linspace(0, 1, n)
    centre = f0 * (f1 / f0) ** p
    a = sweep(noise(dur), centre / 1.8, centre * 1.8)
    b = sweep(noise(dur), centre / 1.8, centre * 1.8)
    e = np.sin(np.pi * p) ** 1.5
    pan = seed_pan + (p - 0.5) * 0.8
    return stereo(a * e * np.cos((pan + 1) * np.pi / 4), b * e * np.sin((pan + 1) * np.pi / 4))


def boom(dur: float = 3.0, f0: float = 42.0) -> np.ndarray:
    t = tt(dur)
    s = np.sin(2 * np.pi * (f0 * t - 6 * t * t)) * np.exp(-t * 1.6)
    s += bandpass(noise(dur), 30, 160) * np.exp(-t * 4) * 0.6
    return (s * np.minimum(1, t / 0.01)).astype(np.float32)


def bell(f: float, dur: float = 3.0, bright: float = 1.0) -> np.ndarray:
    t = tt(dur)
    s = np.zeros_like(t)
    for k, (ratio, amp, dec) in enumerate([(1, 1, 1.4), (2.0, 0.35, 2.2), (2.76, 0.22 * bright, 3.5), (5.4, 0.08 * bright, 6.0)]):
        s += amp * np.sin(2 * np.pi * f * ratio * t + k) * np.exp(-t * dec)
    return (s * np.minimum(1, t / 0.004)).astype(np.float32)


def tick(f: float = 3200.0) -> np.ndarray:
    t = tt(0.08)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + bandpass(noise(0.08), 2500, 9000) * np.exp(-t * 300) * 0.4
    return s.astype(np.float32)


def crackle(dur: float, rate: float, lo: float = 1200, hi: float = 7000) -> np.ndarray:
    """火的噼啪：泊松分布的小爆裂，幅度长尾分布。"""
    out = np.zeros(int(dur * SR), np.float32)
    t = 0.0
    while t < dur:
        t += rng.exponential(1 / rate)
        i = int(t * SR)
        if i >= len(out):
            break
        L = int(SR * rng.uniform(0.002, 0.012))
        burst = rng.standard_normal(L) * np.exp(-np.linspace(0, 6, L)) * min(4.0, rng.pareto(2.2) + 0.2)
        out[i : i + L] += burst[: len(out) - i]
    return bandpass(out, lo, hi)


def roar(dur: float, lo: float, hi: float, wob: float = 0.3) -> np.ndarray:
    s = bandpass(noise(dur), lo, hi)
    t = tt(dur)
    m = 1 + wob * bandpass(noise(dur), 0.3, 4) * 3
    return (s * m[: len(s)]).astype(np.float32) if len(m) >= len(s) else s


def waves(dur: float, period: float = 6.5) -> np.ndarray:
    """海浪：一下下冲上来、退下去，退的时候带一点沙沙声。"""
    t = tt(dur)
    ph = (t / period + rng.uniform()) % 1.0
    swell = np.where(ph < 0.35, ph / 0.35, np.exp(-(ph - 0.35) * 4.0)) ** 1.5
    body = bandpass(noise(dur), 120, 1800) * swell
    fizz = bandpass(noise(dur), 2500, 9000) * np.clip(np.exp(-(ph - 0.45) * 3) * (ph > 0.35), 0, 1) * 0.35
    rumble = bandpass(noise(dur), 30, 160) * (0.5 + 0.5 * swell) * 0.8
    return (body + fizz + rumble).astype(np.float32)


def drip() -> np.ndarray:
    """水滴：很快往上滑的正弦，接一点余音。"""
    t = tt(0.25)
    f = 700 + 900 * (1 - np.exp(-t * 60))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    return s.astype(np.float32)


def grains(dur: float, count: int, flo: float, fhi: float, length: float = 0.05) -> np.ndarray:
    """一团细碎的小亮声（一千颗灯一起亮、符号散成光点）。"""
    out = np.zeros(int(dur * SR), np.float32)
    notes = np.array([293.66, 349.23, 392.0, 440.0, 523.25])
    for _ in range(count):
        i = int(rng.uniform(0, dur - length) * SR)
        f = notes[rng.integers(len(notes))] * 2 ** rng.integers(int(np.log2(flo / 293.66)) + 1, int(np.log2(fhi / 293.66)) + 1)
        L = int(length * SR * rng.uniform(0.6, 1.6))
        tl = np.arange(L) / SR
        g = np.sin(2 * np.pi * f * tl) * np.exp(-tl * 40) * rng.uniform(0.2, 1.0)
        out[i : i + L] += g[: len(out) - i]
    return out


def hum(dur: float, f: float, partials: int = 6) -> np.ndarray:
    t = tt(dur)
    s = sum(np.sin(2 * np.pi * f * k * t * (1 + 0.0007 * k) + k) / k**1.2 for k in range(1, partials + 1))
    return (s * (1 + 0.15 * np.sin(2 * np.pi * 0.3 * t))).astype(np.float32)


def over(*sigs: np.ndarray) -> np.ndarray:
    """几段单声道叠在一起，短的补零。"""
    out = np.zeros(max(len(x) for x in sigs), np.float32)
    for x in sigs:
        out[: len(x)] += x
    return out


def fade(sig: np.ndarray, a: float, r: float) -> np.ndarray:
    n = len(sig)
    e = env(n / SR, a, r)
    return (sig * (e[:, None] if sig.ndim == 2 else e)).astype(np.float32)


# ---------- 事件表（秒数对着画面） ----------

# 序：开场只有一点很远很低的「空气」
place(fade(bandpass(noise(30), 40, 400), 6, 8), 1.0, db(-48), send=0.3)

# 0:31 冲进星系：先吸一口气，然后一声低沉的落地和长长的呼啸；恒星亮起时一层高处的闪光
place(fade(whoosh(1.4, 300, 2400), 1.0, 0.1), 29.7, db(-30))
place(boom(4.0, 40), 31.0, db(-23), send=0.25)
place(whoosh(4.6, 2400, 220, -0.3), 31.1, db(-22), send=0.2)
place(fade(bandpass(noise(2.5), 5000, 14000), 1.2, 1.0), 35.0, db(-36), pan=-0.2, send=0.5)

# 海里的分子：闷闷的水声；副本的横档一格格扣上去，一下下很轻的玻璃声
place(fade(roar(6.4, 60, 500, 0.4), 0.8, 1.0), 41.4, db(-30))
for k in range(0, 28, 2):
    place(tick(2600 + 600 * (k % 3)), 42.3 + k * 0.19, db(-34 + 2 * np.sin(k)), pan=-0.6 + k * 0.045, send=0.6)

# 水下往上浮：气泡、闷响，然后破水而出
under = roar(3.4, 50, 420, 0.5)
for _ in range(14):
    bt = rng.uniform(0, 3.2)
    b = drip() * 0.5
    i = int(bt * SR)
    under[i : i + len(b)] += bandpass(b, 200, 2000)[: len(under) - i]
place(fade(under, 0.5, 0.2), 46.6, db(-28))
place(fade(bandpass(noise(0.9), 400, 7000) * np.exp(-tt(0.9) * 5), 0.01, 0.2), 49.55, db(-24), send=0.2)

# 岸边：浪
place(fade(stereo(waves(12.5, 6.2), waves(12.5, 6.9)), 0.6, 2.5), 49.6, db(-26))
place(fade(bandpass(noise(12), 200, 2000), 4, 4), 49.6, db(-42), pan=0.3)

# 火：两下打火石的火星，火苗呼地窜起来，然后一直噼啪
for tk in (61.65, 62.3):
    place(over(tick(4200) * 2, bandpass(noise(0.25), 3000, 9000) * np.exp(-tt(0.25) * 18) * 0.6), tk, db(-24), pan=0.05, send=0.3)
place(fade(whoosh(1.0, 150, 900), 0.4, 0.4), 62.7, db(-22))
place(fade(stereo(crackle(5.0, 18), crackle(5.0, 18)) + roar(5.0, 60, 500, 0.4)[:, None] * 0.5, 0.6, 0.5), 63.0, db(-20))
# 旷野里远远的一堆火：轻一点，加风
place(fade(stereo(crackle(5.8, 10), crackle(5.8, 10)), 0.5, 0.5), 65.4, db(-31))
place(fade(stereo(bandpass(noise(5.8), 150, 1200), bandpass(noise(5.8), 150, 1200)), 1.5, 1.5), 65.4, db(-34))
# 洞里：火声带混响
place(fade(stereo(crackle(14.6, 14, 800, 5000), crackle(14.6, 14, 800, 5000)), 0.8, 1.0), 70.6, db(-21), send=0.5)
# 远处聚落的夜：浪
place(fade(stereo(waves(7.2, 7.0), waves(7.2, 7.6)), 1.0, 1.5), 84.8, db(-32))

# 发射：低沉的轰鸣越来越响，一阵撕裂一样的噼啪，再慢慢远去
la = roar(6.2, 25, 260, 0.5) + crackle(6.2, 40, 300, 3000) * 0.6
la *= np.concatenate([np.linspace(0, 1, int(1.6 * SR)), np.ones(int(1.2 * SR)), np.linspace(1, 0, int(3.4 * SR))])[: len(la)] ** 1.3
place(la, 103.8, db(-24), send=0.3)
place(boom(3.0, 36), 104.2, db(-30))

# 四：空里一艘船低低地嗡着；回信的光环出现时一声铃，写信的灯暗下去时一声低的
place(fade(hum(5.8, 55) * 0.4 + bandpass(noise(5.8), 40, 300) * 0.5, 1.5, 2.0), 125.4, db(-30), pan=0.2)
place(bell(587.33, 4.0, 0.6), 136.2, db(-34), pan=0.5, send=0.8)
place(bell(220.0, 4.0, 0.3), 139.1, db(-36), pan=-0.5, send=0.8)
place(fade(bandpass(noise(5.4), 3000, 12000), 2.0, 2.0), 141.2, db(-44), send=0.5)

# 五：船队出发，一道道远远的呼啸；一颗、十颗、一千颗：一声铃、十声细碎的、一千颗时一片亮晶晶的
for k in range(4):
    place(fade(whoosh(1.6, 400, 3200, rng.uniform(-0.8, 0.8)), 0.3, 0.6), 154.9 + k * 0.9 + rng.uniform(0, 0.2), db(-34))
place(bell(587.33, 3.0), 159.4, db(-30), send=0.7)
for k in range(10):
    place(bell(float(rng.choice([1174.66, 880.0, 1046.5, 783.99, 698.46])), 1.5, 0.5), 160.12 + k * 0.06, db(-36), pan=rng.uniform(-0.7, 0.7), send=0.7)
place(fade(stereo(grains(2.6, 260, 1500, 5000), grains(2.6, 260, 1500, 5000)), 0.1, 1.5), 160.9, db(-30), send=0.6)
# 戴森云：越来越满的低嗡
dy = hum(6.0, 36.71, 8) * 0.5 + hum(6.0, 55.0, 5) * 0.3 + bandpass(noise(6.0), 30, 220) * 0.4
dy *= np.linspace(0.3, 1.0, len(dy))
place(fade(dy, 1.0, 1.2), 169.8, db(-26))
place(fade(stereo(bandpass(noise(6.4), 300, 3000), bandpass(noise(6.4), 300, 3000)), 2.0, 2.0), 175.2, db(-40), send=0.5)

# 六：暗的液面，一滴滴落下去；意识之海的潮声里有一层高处的闪光；两个世界连起来时往上走的长音；
# 两点光合一时一声柔和的；符号散开时一片细碎；曼陀罗时一层很亮的闪；光路时风慢慢停
for i in range(5):
    place(drip(), 186.2 + i * 1.1, db(-26), pan=rng.uniform(-0.5, 0.5), send=0.8)
place(fade(stereo(waves(6.6, 5.0), waves(6.6, 5.6)) * 0.6, 2.0, 2.0), 192.4, db(-30), send=0.3)
rise_t = tt(5.0)
rise = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (rise_t / 5.0)) / SR) * env(5.0, 2.5, 1.5) * 0.4
place(rise.astype(np.float32), 198.6, db(-34), send=0.8)
place(bell(293.66, 5.0, 0.4), 216.0, db(-32), send=0.9)
place(fade(stereo(grains(4.0, 220, 1200, 4500), grains(4.0, 220, 1200, 4500)), 0.5, 1.5), 216.6, db(-34), send=0.6)
place(fade(stereo(bandpass(noise(6), 4000, 14000), bandpass(noise(6), 4000, 14000)), 2.5, 2.5), 220.4, db(-38), send=0.6)
place(fade(stereo(bandpass(noise(7.2), 150, 1500), bandpass(noise(7.2), 150, 1500)), 2.0, 5.0), 225.6, db(-38))

# 七：所有的灯一起闪、越来越慢，每闪一下一声很低的「咚」；最后一点火苗噼啪几下，在静下来那一刻轻轻一嘶，然后什么都没有
tp = 232.8
k = 0
while tp < 237.2:
    place(boom(1.2, 48) * 0.5, tp, db(-30))
    tp += 1 / (0.7 * (1.6 + (0.3 - 1.6) * min(1, (tp - 232.6) / 4.6)))
    k += 1
place(fade(stereo(crackle(2.0, 6), crackle(2.0, 6)), 0.3, 0.8), 245.6, db(-32))
hiss = bandpass(noise(0.9), 2500, 12000) * np.exp(-tt(0.9) * 5)
place(hiss, SILENT, db(-36), send=0.5)

# 尾：只剩很远很低的空气，和开头一样
place(fade(bandpass(noise(30), 40, 400), 8, 8), 252.0, db(-48), send=0.3)


# ---------- 混响：合成的冲激响应（指数衰减的噪声，越往后越暗），左右不相关 ----------

def impulse(sec: float) -> np.ndarray:
    t = tt(sec)
    chans = []
    for _ in range(2):
        n = rng.standard_normal(len(t)) * np.exp(-t * 6.9 / sec)
        # 越往后高频越少
        lp = bandpass(n * np.exp(-t * 2), 80, 6000) + bandpass(n, 80, 1500) * 0.5
        chans.append(lp)
    ir = np.stack(chans, 1)
    return (ir / np.sqrt(np.sum(ir**2, 0, keepdims=True))).astype(np.float32)


def convolve(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    L = len(x) + len(ir) - 1
    nfft = 1 << (L - 1).bit_length()
    out = np.zeros((len(x), 2), np.float32)
    for c in range(2):
        y = np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[: len(x)]
        out[:, c] = y
    return out


mix = dry + convolve(wet, impulse(3.2)) * 0.6
# 软限幅：偶尔特别响的一下（噼啪的长尾）压进 -3 dBFS 以内，不整体降音量
lim = db(-3)
mix = np.tanh(mix / lim) * lim
peak = float(np.max(np.abs(mix)))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, mix, SR, subtype="PCM_16")
print("完成", OUT, f"峰值 {20 * np.log10(max(peak, 1e-9)):.1f} dBFS")
