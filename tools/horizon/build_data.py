# 把 refer/光速_时间/ 里的星表和巡天数据转成视频直接读的二进制：python tools/horizon/build_data.py
# 坐标都换到 three.js 用的那套：赤道坐标系，Y 朝天北极
#   stars.bin  每颗星 7 个 float32：x y z（秒差距）、绝对星等、r g b            —— HYG v4.4
#   local.bin  每个星系 4 个 float32：x y z（共动距离，百万秒差距）、红移       —— 2MRS（按其使用条款不入库）
#   cosmos.bin 同上                                                             —— SDSS DR18 抽样的星系与类星体
#   wall.bin   同上                                                             —— SDSS DR18 斯隆长城所在的那片天区，不抽样
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

# 普朗克 2018
H0 = 67.4
OMEGA_M = 0.315
OMEGA_R = 9.2e-5
OMEGA_L = 1.0 - OMEGA_M - OMEGA_R
C_KMS = 299792.458
HUBBLE_MPC = C_KMS / H0


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
    return tuple(min(max(v, 0.0), 255.0) / 255.0 for v in (r, g, b))  # type: ignore[return-value]


def write(name: str, values: array.array, count: int, note: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / name
    with target.open("wb") as out:
        values.tofile(out)
    logger.info("%s：%d 个%s，%d 字节", name, count, note, target.stat().st_size)


def build_stars() -> None:
    values = array.array("f")
    kept = 0
    with gzip.open(REFER / "hyg_v44.csv.gz", "rb") as raw:
        for row in csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8")):
            dist = float(row["dist"])
            # 太阳由视频自己摆（它相对地球的方向是片子选的），这里跳过
            if row["proper"] == "Sol" or dist >= UNKNOWN_DIST or dist <= 0.0:
                continue
            ci = float(row["ci"]) if row["ci"] else DEFAULT_CI
            r, g, b = blackbody(temperature(ci))
            x, y, z = float(row["x"]), float(row["y"]), float(row["z"])
            values.extend((x, z, -y, float(row["absmag"]), r, g, b))
            kept += 1
    write("stars.bin", values, kept, "恒星")


# 红移 → 共动距离（百万秒差距）：先把积分算成一张表，查表插值
Z_STEP = 0.0005
Z_MAX = 8.0


def comoving_table() -> list[float]:
    table = [0.0]
    inv = lambda z: 1.0 / math.sqrt(OMEGA_R * (1 + z) ** 4 + OMEGA_M * (1 + z) ** 3 + OMEGA_L)  # noqa: E731
    steps = int(Z_MAX / Z_STEP)
    for i in range(steps):
        z0 = i * Z_STEP
        table.append(table[-1] + HUBBLE_MPC * 0.5 * (inv(z0) + inv(z0 + Z_STEP)) * Z_STEP)
    return table


COMOVING = comoving_table()


def comoving(z: float) -> float:
    pos = min(max(z, 0.0), Z_MAX - Z_STEP) / Z_STEP
    i = int(pos)
    return COMOVING[i] + (COMOVING[i + 1] - COMOVING[i]) * (pos - i)


def place(values: array.array, ra: float, dec: float, z: float) -> None:
    a = math.radians(ra)
    d = math.radians(dec)
    r = comoving(z)
    values.extend((math.cos(d) * math.cos(a) * r, math.sin(d) * r, -math.cos(d) * math.sin(a) * r, z))


def read_sdss(name: str, values: array.array, z_min: float, z_max: float) -> int:
    kept = 0
    with (REFER / name).open(encoding="utf-8") as raw:
        for line in raw:
            parts = line.strip().split(",")
            if len(parts) != 3 or not parts[0][:1].isdigit():
                continue
            z = float(parts[2])
            if z_min <= z <= z_max:
                place(values, float(parts[0]), float(parts[1]), z)
                kept += 1
    return kept


def build_cosmos() -> None:
    values = array.array("f")
    galaxies = read_sdss("sdss_dr18_galaxies.csv", values, 0.003, 1.2)
    quasars = read_sdss("sdss_dr18_quasars.csv", values, 0.1, 7.2)
    write("cosmos.bin", values, galaxies + quasars, f"天体（星系 {galaxies}、类星体 {quasars}）")


def build_wall() -> None:
    values = array.array("f")
    kept = read_sdss("sdss_dr18_wall.csv", values, 0.03, 0.13)
    write("wall.bin", values, kept, "星系")


def build_local() -> None:
    values = array.array("f")
    kept = 0
    skipped = 0
    with (REFER / "catalog" / "2mrs_1175_done.dat").open(encoding="latin-1") as raw:
        for line in raw:
            if line.startswith("#"):
                continue
            parts = line.split()
            # 第 25 列是退行速度（公里每秒）
            try:
                v = float(parts[24])
            except (IndexError, ValueError):
                skipped += 1
                continue
            # 太近的星系本动速度盖过了哈勃流，退行速度换不出距离；本星系群由视频自己摆
            if v < 400.0:
                continue
            place(values, float(parts[1]), float(parts[2]), v / C_KMS)
            kept += 1
    write("local.bin", values, kept, f"星系（读不出速度的 {skipped} 行）")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    build_stars()
    build_local()
    build_cosmos()
    build_wall()
