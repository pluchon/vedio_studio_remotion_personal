# 把 refer/亚马逊河/ 里的高程、河网和卫星底图整理成视频直接读的文件：python tools/amazon/build_data.py
# 范围统一是西经 81° 到 45°、北纬 7° 到南纬 18°，每度 240 格（约 450 米）
#   textures/land.jpg  卫星底图 8640×6000                                  —— NASA Blue Marble 2004 年 8 月
#   data/dem.bin       高程，int16，4320×3000，单位米，海面记作 SEA        —— HydroSHEDS 15 角秒高程
#   data/rivers.bin    河网，每小段 8 个 float32：两端经纬度、流量、两端离海的距离、身份（2 主河道，1 亚马逊水系，0 别的水系） —— HydroRIVERS
#   data/water.bin     大河附近的范围，uint8，2160×1500：值越大离大河越近，着色器在这个范围里按底图的颜色认水面 —— HydroRIVERS
#   data/reach.bin     同样的格子，uint16：最近那条大河在这里离海多少公里再加 1，0 表示不属于亚马逊水系 —— HydroRIVERS
#   data/route.bin     主河道，从米斯米雪山到入海口，每个点 5 个 float32：经度、纬度、离海距离、流量、海拔
from __future__ import annotations

import array
import logging
import math
import struct
import subprocess
import zipfile
from pathlib import Path

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[2]
REFER = ROOT / "refer" / "亚马逊河"
RAW = REFER / "raw"
OUT = ROOT / "public" / "amazon"

WEST, EAST, NORTH, SOUTH = -81.0, -45.0, 7.0, -18.0
PER_DEG = 240
WIDTH = round((EAST - WEST) * PER_DEG)
HEIGHT = round((NORTH - SOUTH) * PER_DEG)

# 高程文件左上角的经纬度和瓦片边长
DEM_WEST, DEM_NORTH, TILE = -93.0, 15.0, 128
NODATA = 32767
SEA = -100

# 米斯米雪山北坡，阿普里马克河最远的源头
SOURCE = (-71.69, -15.51)
# 画进河网的最小流量（立方米每秒）
MIN_FLOW = 12.0
# 多大的河算大河（要在底图上认出水面），以及认水面的范围离河道中线多远（公里）
BIG_FLOW = 800.0
WATER_SCALE = 4


def reach_km(flow: float) -> float:
    return 4.0 + 0.028 * math.sqrt(flow)


# 主河道每隔多少公里取一个点
ROUTE_STEP = 4.0


def unpack() -> None:
    RAW.mkdir(exist_ok=True)
    wanted = {
        "hyd_sa_dem_15s.zip": ["hyd_sa_dem_15s.tif"],
        "HydroRIVERS_v10_sa_shp.zip": ["HydroRIVERS_v10_sa_shp/HydroRIVERS_v10_sa.shp", "HydroRIVERS_v10_sa_shp/HydroRIVERS_v10_sa.dbf"],
    }
    for name, members in wanted.items():
        with zipfile.ZipFile(REFER / name) as z:
            for member in members:
                target = RAW / Path(member).name
                if not target.exists():
                    target.write_bytes(z.read(member))
                    logger.info("解出 %s", target.name)


def lzw(data: bytes, expect: int) -> bytes:
    # TIFF 的 LZW：高位在前，码长提前一位增长
    out = bytearray()
    table: list[bytes] = [bytes((i,)) for i in range(256)] + [b"", b""]
    bits = 9
    buf = 0
    have = 0
    prev = b""
    for byte in data:
        buf = (buf << 8) | byte
        have += 8
        while have >= bits:
            have -= bits
            code = (buf >> have) & ((1 << bits) - 1)
            if code == 256:
                table = table[:258]
                bits = 9
                prev = b""
                continue
            if code == 257:
                return bytes(out)
            if not prev:
                entry = table[code]
            elif code < len(table):
                entry = table[code]
                table.append(prev + entry[:1])
            else:
                entry = prev + prev[:1]
                table.append(entry)
            out += entry
            prev = entry
            size = len(table)
            if size >= 2047:
                bits = 12
            elif size >= 1023:
                bits = 11
            elif size >= 511:
                bits = 10
        buf &= (1 << have) - 1
        if len(out) >= expect:
            break
    return bytes(out)


def read_dem() -> array.array:
    # 只解出范围内的瓦片，拼成 WIDTH×HEIGHT 的 int16
    x0 = round((WEST - DEM_WEST) * PER_DEG)
    y0 = round((DEM_NORTH - NORTH) * PER_DEG)
    with (RAW / "hyd_sa_dem_15s.tif").open("rb") as f:
        head = f.read(8)
        if head[:2] != b"II":
            raise ValueError("高程文件不是小端 TIFF")
        f.seek(struct.unpack("<I", head[4:8])[0])
        count = struct.unpack("<H", f.read(2))[0]
        tags = {}
        for _ in range(count):
            tag, _, cnt, val = struct.unpack("<HHII", f.read(12))
            tags[tag] = (cnt, val)
        across = (tags[256][1] & 0xFFFF) // TILE + (1 if (tags[256][1] & 0xFFFF) % TILE else 0)

        def longs(tag: int) -> array.array:
            cnt, val = tags[tag]
            f.seek(val)
            values = array.array("I")
            values.fromfile(f, cnt)
            return values

        offsets, sizes = longs(324), longs(325)
        grid = bytearray(WIDTH * HEIGHT * 2)
        for ty in range(y0 // TILE, (y0 + HEIGHT - 1) // TILE + 1):
            for tx in range(x0 // TILE, (x0 + WIDTH - 1) // TILE + 1):
                i = ty * across + tx
                f.seek(offsets[i])
                raw = lzw(f.read(sizes[i]), TILE * TILE * 2)
                if len(raw) != TILE * TILE * 2:
                    raise ValueError(f"瓦片 {tx},{ty} 解出 {len(raw)} 字节")
                gx = tx * TILE - x0
                a = max(0, -gx)
                b = min(TILE, WIDTH - gx)
                for row in range(TILE):
                    gy = ty * TILE + row - y0
                    if 0 <= gy < HEIGHT and a < b:
                        s = (row * TILE + a) * 2
                        d = (gy * WIDTH + gx + a) * 2
                        grid[d:d + (b - a) * 2] = raw[s:s + (b - a) * 2]
    dem = array.array("h")
    dem.frombytes(bytes(grid))
    return dem


def write_dem(dem: array.array) -> None:
    # 缩成一半：四格取平均，四格里有三格是海就算海
    half = array.array("h")
    for y in range(0, HEIGHT, 2):
        top = dem[y * WIDTH:(y + 1) * WIDTH]
        bottom = dem[(y + 1) * WIDTH:(y + 2) * WIDTH]
        for a, b, c, d in zip(top[0::2], top[1::2], bottom[0::2], bottom[1::2]):
            land = [v for v in (a, b, c, d) if v != NODATA]
            half.append(SEA if len(land) < 2 else round(sum(land) / len(land)))
    target = OUT / "data" / "dem.bin"
    with target.open("wb") as out:
        half.tofile(out)
    logger.info("dem.bin：%d×%d，%d 字节", WIDTH // 2, HEIGHT // 2, target.stat().st_size)


def height_at(dem: array.array, lon: float, lat: float) -> float:
    x = min(max(int((lon - WEST) * PER_DEG), 0), WIDTH - 1)
    y = min(max(int((NORTH - lat) * PER_DEG), 0), HEIGHT - 1)
    v = dem[y * WIDTH + x]
    return 0.0 if v == NODATA else float(v)


def read_rivers() -> dict[int, dict]:
    # 属性表和图形文件的记录一一对应，顺着读；只留范围内的河段
    reaches: dict[int, dict] = {}
    with (RAW / "HydroRIVERS_v10_sa.dbf").open("rb") as dbf, (RAW / "HydroRIVERS_v10_sa.shp").open("rb") as shp:
        head = dbf.read(32)
        total, head_len, rec_len = struct.unpack("<IHH", head[4:12])
        dbf.seek(head_len)
        shp.seek(100)
        for _ in range(total):
            rec = dbf.read(rec_len)
            _, words = struct.unpack(">ii", shp.read(8))
            body = shp.read(words * 2)
            xmin, ymin, xmax, ymax = struct.unpack("<4d", body[4:36])
            if xmax < WEST or xmin > EAST or ymax < SOUTH or ymin > NORTH:
                continue
            parts, npts = struct.unpack("<ii", body[36:44])
            pts = struct.unpack(f"<{npts * 2}d", body[44 + parts * 4:44 + parts * 4 + npts * 16])
            reaches[int(rec[1:10])] = {
                "next": int(rec[10:19]),
                "main": int(rec[19:28]),
                "length": float(rec[28:35]),
                "down": float(rec[35:42]),
                "up": float(rec[42:49]),
                "flow": float(rec[70:80]),
                "pts": [(pts[i], pts[i + 1]) for i in range(0, len(pts), 2)],
            }
    logger.info("范围内共 %d 个河段", len(reaches))
    return reaches


def trace_route(reaches: dict[int, dict]) -> list[int]:
    # 入海口：范围内流量最大的河段所属的那条河
    biggest = max(reaches.values(), key=lambda r: r["flow"])
    basin = biggest["main"]
    logger.info("流量最大的河段 %.0f 立方米每秒，离海 %.0f 公里", biggest["flow"], biggest["down"])
    # 源头：流域里离米斯米雪山最近的那一段
    best, best_d = 0, 1e9
    for rid, r in reaches.items():
        if r["main"] != basin:
            continue
        x, y = r["pts"][0]
        d = (x - SOURCE[0]) ** 2 + (y - SOURCE[1]) ** 2
        if d < best_d:
            best, best_d = rid, d
    if best_d > 0.05 ** 2:
        raise ValueError(f"源头附近没有找到河段，最近的离了 {math.sqrt(best_d):.3f} 度")
    route = []
    rid = best
    while rid:
        if rid not in reaches:
            raise ValueError(f"主河道在河段 {rid} 处流出了范围")
        route.append(rid)
        rid = reaches[rid]["next"]
    first = reaches[route[0]]
    logger.info("主河道 %d 段，源头 %.3f,%.3f，全长 %.0f 公里", len(route), first["pts"][0][0], first["pts"][0][1], first["down"] + first["length"])
    return route


def write_route(reaches: dict[int, dict], route: list[int], dem: array.array) -> None:
    values = array.array("f")
    count = 0
    next_at = 1e9
    for rid in route:
        r = reaches[rid]
        pts = r["pts"]
        n = len(pts)
        for i, (lon, lat) in enumerate(pts):
            down = r["down"] + r["length"] * (1 - i / max(n - 1, 1))
            if down <= next_at:
                values.extend((lon, lat, down, r["flow"], height_at(dem, lon, lat)))
                next_at = down - ROUTE_STEP
                count += 1
    last = reaches[route[-1]]
    lon, lat = last["pts"][-1]
    values.extend((lon, lat, last["down"], last["flow"], 0.0))
    target = OUT / "data" / "route.bin"
    with target.open("wb") as out:
        values.tofile(out)
    logger.info("route.bin：%d 个点，%d 字节", count + 1, target.stat().st_size)


def smooth(pts: list[tuple[float, float]]) -> list[tuple[float, float]]:
    # 河网是沿着高程格子走出来的，带着锯齿；两端不动，中间的点和左右取平均
    for _ in range(2):
        if len(pts) < 3:
            break
        inner = [((a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4) for a, b, c in zip(pts, pts[1:], pts[2:])]
        pts = [pts[0], *inner, pts[-1]]
    return pts


def write_rivers(reaches: dict[int, dict], route: list[int]) -> None:
    on_route = set(route)
    basin = reaches[route[0]]["main"]
    values = array.array("f")
    segments = 0
    for rid, r in reaches.items():
        if r["flow"] < MIN_FLOW:
            continue
        pts = smooth(r["pts"])
        # 细的河隔一个点取一个
        stride = 1 if r["flow"] > 2000 else 2 if r["flow"] > 200 else 3
        kept = pts[0:-1:stride] + [pts[-1]]
        n = len(kept)
        main = 2.0 if rid in on_route else 1.0 if r["main"] == basin else 0.0
        for i in range(n - 1):
            a, b = kept[i], kept[i + 1]
            da = r["down"] + r["length"] * (1 - i / (n - 1))
            db = r["down"] + r["length"] * (1 - (i + 1) / (n - 1))
            values.extend((a[0], a[1], b[0], b[1], r["flow"], da, db, main))
            segments += 1
    target = OUT / "data" / "rivers.bin"
    with target.open("wb") as out:
        values.tofile(out)
    logger.info("rivers.bin：%d 小段，%d 字节", segments, target.stat().st_size)


def write_water(reaches: dict[int, dict], route: list[int]) -> None:
    basin = reaches[route[0]]["main"]
    w, h = WIDTH // WATER_SCALE, HEIGHT // WATER_SCALE
    cell = 111.2 / PER_DEG * WATER_SCALE
    grid = bytearray(w * h)
    reach = array.array("H", bytes(w * h * 2))
    nearest = array.array("f", [1e9]) * (w * h)
    for r in reaches.values():
        if r["flow"] < BIG_FLOW:
            continue
        radius = reach_km(r["flow"]) / cell
        # 离海距离那张图比水面范围多铺出去一圈，免得河面的边上留下没记到的格子
        span = int(radius * 1.8) + 1
        count = len(r["pts"])
        mine = r["main"] == basin
        for n, (lon, lat) in list(enumerate(r["pts"]))[::3]:
            down = r["down"] + r["length"] * (1 - n / max(count - 1, 1))
            cx = (lon - WEST) * PER_DEG / WATER_SCALE
            cy = (NORTH - lat) * PER_DEG / WATER_SCALE
            for y in range(max(int(cy) - span, 0), min(int(cy) + span + 1, h)):
                for x in range(max(int(cx) - span, 0), min(int(cx) + span + 1, w)):
                    far = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
                    d = far / radius
                    i = y * w + x
                    if d < 1.0:
                        # 中间一大半都算满，靠边的三成渐渐淡出
                        v = int(255 * min(1.0, (1.0 - d) / 0.3))
                        if v > grid[i]:
                            grid[i] = v
                    if d < 1.8 and far < nearest[i]:
                        nearest[i] = far
                        reach[i] = round(down) + 1 if mine else 0
    target = OUT / "data" / "water.bin"
    target.write_bytes(bytes(grid))
    with (OUT / "data" / "reach.bin").open("wb") as out:
        reach.tofile(out)
    logger.info("water.bin：%d×%d，覆盖 %.1f%%", w, h, 100 * sum(1 for v in grid if v) / len(grid))


def write_land() -> None:
    # ffmpeg 读不了 21600 见方的图，交给系统自带的解码器裁，再拼起来
    target = OUT / "textures" / "land.jpg"
    if target.exists():
        return
    script = Path(__file__).with_name("crop_land.ps1")
    x = round((WEST + 90) * PER_DEG)
    north_h = round(NORTH * PER_DEG)
    south_h = round(-SOUTH * PER_DEG)
    subprocess.run(
        ["pwsh", "-NoProfile", "-File", str(script), str(REFER), str(RAW), str(x), str(WIDTH), str(north_h), str(south_h)],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(RAW / "north.png"), "-i", str(RAW / "south.png"),
         "-filter_complex", "vstack", "-q:v", "2", str(target)],
        check=True,
    )
    logger.info("land.jpg：%d 字节", target.stat().st_size)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    (OUT / "data").mkdir(parents=True, exist_ok=True)
    (OUT / "textures").mkdir(parents=True, exist_ok=True)
    unpack()
    write_land()
    dem = read_dem()
    write_dem(dem)
    reaches = read_rivers()
    route = trace_route(reaches)
    write_route(reaches, route, dem)
    write_rivers(reaches, route)
    write_water(reaches, route)


if __name__ == "__main__":
    main()
