"""按需下载乐器采样：只拉某个采样库里的某一个乐器文件夹，放到 samples/<库名>/ 下的同一路径

用法：
  python tools/fetch_samples.py VCSL "Idiophones/Struck Idiophones/Glockenspiel"
  python tools/fetch_samples.py VCSL "Chordophones/Zithers/Upright Piano, Yamaha" --match vl2
  python tools/fetch_samples.py VCSL --list Idiophones        # 只列出有哪些文件夹和大小，不下载

两个库（VCSL、VSCO-2-CE）都是 Versilian Studios 以 CC0 发布的，整库有几个 GB，所以不整库下。
已经下过且大小对得上的文件会跳过。需要 PATH 上有 curl。
"""
from __future__ import annotations

import argparse
import json
import logging
import subprocess
import sys
import urllib.parse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "samples"


def home(library: str) -> Path:
    """采样库的位置：整库解压出来会多一层 <库名>-master，有的话就往那里放"""
    nested = SAMPLES / library / f"{library}-master"
    return nested if nested.exists() else SAMPLES / library

OWNER = "sgossner"
BRANCH = "master"
AGENT = "video-studio/1.0 (https://github.com/pluchon/vedio_studio_remotion_personal)"


def fetch(url: str) -> bytes:
    # 用 curl 而不是 urllib：本机的 Python 没带根证书，https 握手会失败
    done = subprocess.run(
        ["curl", "--silent", "--show-error", "--fail", "--location", "--max-time", "300", "--retry", "4", "--retry-all-errors", "--user-agent", AGENT, url],
        capture_output=True,
        check=False,
    )
    if done.returncode != 0:
        raise RuntimeError(f"下载失败 {url}：{done.stderr.decode(errors='replace').strip()}")
    return done.stdout


def tree(library: str) -> list[dict]:
    """整个库的文件清单，缓存在 samples/<库名>/.tree.json"""
    cache = SAMPLES / library / ".tree.json"
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_bytes(fetch(f"https://api.github.com/repos/{OWNER}/{library}/git/trees/{BRANCH}?recursive=1"))
    data = json.loads(cache.read_text(encoding="utf-8"))
    if data.get("truncated"):
        raise RuntimeError("文件清单被截断了")
    return [item for item in data["tree"] if item["type"] == "blob"]


def download(library: str, item: dict) -> str:
    dest = home(library) / item["path"]
    if dest.exists() and dest.stat().st_size == item["size"]:
        return "已有"
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = f"https://raw.githubusercontent.com/{OWNER}/{library}/{BRANCH}/{urllib.parse.quote(item['path'])}"
    data = fetch(url)
    if len(data) != item["size"]:
        raise RuntimeError(f"{item['path']} 大小不对：{len(data)} / {item['size']}")
    dest.write_bytes(data)
    return "下载"


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    parser = argparse.ArgumentParser()
    parser.add_argument("library", choices=["VCSL", "VSCO-2-CE"])
    parser.add_argument("folder", nargs="?", default="")
    parser.add_argument("--match", default="", help="文件名里要包含的字样，用来只取某一档力度")
    parser.add_argument("--list", dest="listing", nargs="?", const="", default=None, help="列出这个前缀下的文件夹")
    args = parser.parse_args()

    files = tree(args.library)
    if args.listing is not None:
        sizes: Counter[str] = Counter()
        for item in files:
            if item["path"].startswith(args.listing) and "/" in item["path"]:
                sizes[item["path"].rsplit("/", 1)[0]] += item["size"]
        for folder, size in sorted(sizes.items()):
            logger.info("%8.1f MB  %s", size / 1e6, folder)
        return

    if not args.folder:
        sys.exit("要给出乐器文件夹，或者用 --list 查看有哪些")
    picked = [
        item
        for item in files
        if item["path"].startswith(args.folder.rstrip("/") + "/") and args.match in item["path"].rsplit("/", 1)[1]
    ]
    if not picked:
        sys.exit(f"{args.library} 里没有 {args.folder}（或没有匹配 {args.match} 的文件）")
    total = sum(item["size"] for item in picked)
    logger.info("%d 个文件，共 %.1f MB", len(picked), total / 1e6)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = Counter(pool.map(lambda item: download(args.library, item), picked))
    logger.info("下载 %d 个，已有 %d 个", results["下载"], results["已有"])


if __name__ == "__main__":
    main()
