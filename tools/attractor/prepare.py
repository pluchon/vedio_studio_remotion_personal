"""《巨引源》的素材准备：把本机的原始素材整理成视频要读的文件，放进 public/attractor/。

    python tools/attractor/prepare.py images   # 图：贴图、论文页、真实照片，缩到合适的尺寸
    python tools/attractor/prepare.py videos   # 视频：截取要用的几段，转成 mp4
    python tools/attractor/prepare.py data     # 数据：2MRS 星系、Cosmicflows-4 星系群 → 二进制
    python tools/attractor/prepare.py music    # 配乐：原曲循环续长（见 loop_music.py）
    python tools/attractor/prepare.py all

原始素材在 refer/巨引源/（论文、照片、视频、数据）、refer/光速_时间/（2MRS）和 library/（地球贴图、微波背景图），
都不入库，所以 public/attractor/ 下除了 README 里说的以外全部由这个脚本生成。需要 ffmpeg。
"""
from __future__ import annotations

import array
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REFER = ROOT / "refer" / "巨引源"
OUT = ROOT / "public" / "attractor"
LIB = ROOT / "library" / "images"

H0 = 70.0  # km/s/Mpc，把红移换成距离的示意值


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


# ---------------------------------------------------------------- 图
# (输出名, 来源, 缩放滤镜)；jpg 的质量用 -q:v 3
IMAGES = [
    ("earth_day.jpg", LIB / "8k_earth_daymap.jpg", "scale=4096:-2"),
    ("earth_night.jpg", LIB / "8k_earth_nightmap.jpg", "scale=4096:-2"),
    ("milkyway.jpg", LIB / "8k_stars_milky_way.jpg", "scale=4096:-2"),
    ("cmb.jpg", LIB / "1567213932682-ESA_Planck_CMB2018_equirectangular_HR.png", "scale=4096:-2"),
    ("paper_dressler1987.jpg", REFER / "论文" / "页" / "Dressler1987_streaming_p1.png", "scale=1500:-2"),
    ("paper_stiskalek2026.jpg", REFER / "论文" / "页" / "Stiskalek2026_RevisitingGA_p1.png", "scale=1500:-2"),
    ("paper_woudt2008.jpg", REFER / "论文" / "页" / "Woudt2008_NormaCluster_p1.png", "scale=1500:-2"),
    ("paper_tully2014.jpg", REFER / "论文" / "页" / "Tully2014_Laniakea_p1.png", "scale=1500:-2"),
    ("paper_hoffman2017.jpg", REFER / "论文" / "页" / "Hoffman2017_DipoleRepeller_p1.png", "scale=1500:-2"),
    ("lss_2mass.jpg", REFER / "素材" / "图" / "2mass_lss_chart.jpg", "scale=1239:-2"),
    ("norma_decaps.jpg", REFER / "素材" / "图" / "norma_decaps.jpg", "scale=2400:-2"),
    ("norma_hubble.jpg", REFER / "素材" / "图" / "hubble_norma_busy_patch.jpg", "scale=2000:-2"),
    ("norma_chandra.jpg", REFER / "素材" / "图" / "chandra_abell3627.jpg", "scale=2400:-2"),
    ("ga_eso.jpg", REFER / "素材" / "图" / "eso9954_view_toward_GA.jpg", "scale=2125:-2"),
    ("milkyway_ir.jpg", REFER / "素材" / "图" / "milkyway_infrared.jpg", "scale=1500:-2"),
    ("obs_mayall.jpg", REFER / "素材" / "图" / "mayall_kittpeak_night.jpg", "scale=2400:-2"),
    ("obs_blanco.jpg", REFER / "素材" / "图" / "blanco_milkyway.jpg", "scale=2400:-2"),
    ("obs_hooker.jpg", REFER / "素材" / "图" / "hooker_100in.jpg", "scale=1600:-2"),
    ("radio_parkes_moon.jpg", REFER / "素材" / "图" / "parkes_csiro_moon.jpg", "scale=1500:-2"),
]


def images() -> None:
    d = OUT / "img"
    d.mkdir(parents=True, exist_ok=True)
    for name, src, vf in IMAGES:
        if not src.exists():
            print("缺", src)
            continue
        ffmpeg("-i", str(src), "-vf", vf, "-q:v", "3", str(d / name))
        print("图", name)


# ---------------------------------------------------------------- 视频
# (输出名, 来源, 起点秒, 时长秒, 滤镜)
VIDEOS = [
    # 圆形球幕：裁成正方形再缩
    ("clues.mp4", REFER / "素材" / "视频" / "clues_local_universe_sim.webm", 90, 50, "scale=1080:1080"),
    # 红外银河：去掉下面一圈图例字幕条
    ("vista.mp4", REFER / "素材" / "视频" / "vista_infrared_vs_visible.ogv", 34, 24, "scale=1920:1080"),
    ("vista_a.mp4", REFER / "素材" / "视频" / "vista_infrared_vs_visible.ogv", 7, 26, "scale=1920:1080"),
    ("night_a.mp4", REFER / "素材" / "视频" / "milkyway_joshua_tree.webm", 0, 20, "scale=1920:1080,setpts=2*PTS"),
    ("meerkat.mp4", REFER / "素材" / "视频" / "meerkat_night_timelapse.webm", 0, 14, "scale=1920:1080"),
    ("earth_iss.mp4", REFER / "素材" / "视频" / "esa_gerst_earth_clip.webm", 0, 24, "scale=1920:1080"),
    ("supercl.mp4", REFER / "素材" / "视频" / "nearby_superclusters.webm", 0, 40, "scale=1280:720"),
]


def videos() -> None:
    d = OUT / "video"
    d.mkdir(parents=True, exist_ok=True)
    for name, src, start, length, vf in VIDEOS:
        if not src.exists():
            print("缺", src)
            continue
        # 夜空延时的原片只有几秒，循环拼到够长
        loop = ["-stream_loop", "-1"] if name.startswith("night_") else []
        ffmpeg(*loop, "-ss", str(start), "-t", str(length), "-i", str(src), "-an", "-vf", vf + ",fps=30", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", str(d / name))
        print("视频", name)


# ---------------------------------------------------------------- 数据
def sph(d: float, l: float, b: float) -> tuple[float, float, float]:
    """银道坐标（度）+ 距离 → 银道直角坐标：x 朝银心，y 朝 l=90°，z 朝银北极。"""
    lr, br = math.radians(l), math.radians(b)
    return d * math.cos(br) * math.cos(lr), d * math.cos(br) * math.sin(lr), d * math.sin(br)


def write(name: str, values: array.array, note: str) -> None:
    d = OUT / "data"
    d.mkdir(parents=True, exist_ok=True)
    (d / name).write_bytes(values.tobytes())
    print("数据", name, f"{len(values) * 4 / 1e6:.1f} MB", note)


def data() -> None:
    # 2MRS：x y z（Mpc，银道直角坐标）、K 星等。红移直接换成距离，所以星团会被拉成指向我们的"手指"
    # （本动速度），这里只用来展示分布和隐匿带的缺口，不当作精确的三维位置。
    src = ROOT / "refer" / "光速_时间" / "catalog" / "2mrs_1175_done.dat"
    values = array.array("f")
    kept = 0
    with src.open(encoding="latin-1") as raw:
        for line in raw:
            if line.startswith("#"):
                continue
            p = line.split()
            try:
                v = float(p[24])
                l, b, k = float(p[3]), float(p[4]), float(p[5])
            except (IndexError, ValueError):
                continue
            if v < 600.0:
                continue
            values.extend((*sph(v / H0, l, b), k))
            kept += 1
    write("galaxies.bin", values, f"2MRS 星系 {kept} 个（x y z Mpc, K 星等）")

    # Cosmicflows-4 星系群：x y z（Mpc）、Vpec（km/s，正为远离我们）、Dist（Mpc）
    src = REFER / "数据" / "cf4_groups.tsv"
    values = array.array("f")
    kept = 0
    head: dict[str, int] = {}
    with src.open(encoding="utf8") as raw:
        for line in raw:
            if not line.strip() or line.startswith("#"):
                continue
            cells = [c.strip() for c in line.rstrip("\n").split("\t")]
            if not head:
                head = {c: i for i, c in enumerate(cells)}
                continue
            if set(cells[0]) <= {"-"}:
                continue
            try:
                l, b = float(cells[head["GLON"]]), float(cells[head["GLAT"]])
                dist, vpec = float(cells[head["Dist"]]), float(cells[head["Vpec"]])
            except (KeyError, ValueError):
                continue
            values.extend((*sph(dist, l, b), vpec, dist))
            kept += 1
    write("cf4.bin", values, f"Cosmicflows-4 星系群 {kept} 个（x y z Mpc, Vpec km/s, Dist Mpc）")


def music() -> None:
    subprocess.run([sys.executable, str(ROOT / "tools" / "attractor" / "loop_music.py")], check=True)


if __name__ == "__main__":
    steps = {"images": images, "videos": videos, "data": data, "music": music}
    want = sys.argv[1:] or ["all"]
    for w in (list(steps) if "all" in want else want):
        steps[w]()
