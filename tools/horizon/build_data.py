# 把 refer/光速_时间/ 里的星表转成视频直接读的二进制：python tools/horizon/build_data.py
# 每颗星 7 个 float32：x y z（秒差距，已换到 three.js 的坐标：Y 朝天北极）、绝对星等、r g b
from __future__ import annotations

import array
import csv
import gzip
import io
import logging
import math
from pathlib import Path

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[2]
REFER = ROOT / "refer" / "光速_时间"
OUT = ROOT / "public" / "horizon" / "data"

# HYG 里测不出距离的星统一填了 100000 秒差距
UNKNOWN_DIST = 100000.0
DEFAULT_CI = 0.65


def temperature(ci: float) -> float:
    # Ballesteros 公式：色指数 B-V → 有效温度
    return 4600.0 * (1.0 / (0.92 * ci + 1.7) + 1.0 / (0.92 * ci + 0.62))


def blackbody(kelvin: float) -> tuple[float, float, float]:
    # 黑体颜色的常用近似（Tanner Helland），输出 0..1
    t = min(max(kelvin, 1000.0), 40000.0) / 100.0
    if t <= 66.0:
        r = 255.0
        g = 99.4708025861 * math.log(t) - 161.1195681661
        b = 0.0 if t <= 19.0 else 138.5177312231 * math.log(t - 10.0) - 305.0447927307
    else:
        r = 329.698727446 * (t - 60.0) ** -0.1332047592
        g = 288.1221695283 * (t - 60.0) ** -0.0755148492
        b = 255.0
    clip = lambda v: min(max(v, 0.0), 255.0) / 255.0  # noqa: E731
    return clip(r), clip(g), clip(b)


def build_stars() -> None:
    source = REFER / "hyg_v44.csv.gz"
    values = array.array("f")
    kept = 0
    skipped = 0
    with gzip.open(source, "rb") as raw:
        reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8"))
        for row in reader:
            dist = float(row["dist"])
            # 太阳由视频自己摆（它相对地球的方向是片子选的），这里跳过
            if row["proper"] == "Sol" or dist >= UNKNOWN_DIST or dist <= 0.0:
                skipped += 1
                continue
            ci = float(row["ci"]) if row["ci"] else DEFAULT_CI
            r, g, b = blackbody(temperature(ci))
            x, y, z = float(row["x"]), float(row["y"]), float(row["z"])
            values.extend((x, z, -y, float(row["absmag"]), r, g, b))
            kept += 1
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / "stars.bin"
    with target.open("wb") as out:
        values.tofile(out)
    logger.info("恒星 %d 颗（跳过 %d），写入 %s，%d 字节", kept, skipped, target, target.stat().st_size)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    build_stars()
