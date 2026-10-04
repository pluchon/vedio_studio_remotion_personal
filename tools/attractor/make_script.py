"""从 refer/巨引源/文案.md 里把念白摘出来，写成 src/videos/attractor/script.json。

文案里每一段的小标题是「## 一  入睡（约 0:00–0:45）」，念白是以「> 」开头的行。
段的顺序对应 theme.ts 里的 SCENES，所以这里的 id 要和它一致。
用法：python tools/attractor/make_script.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "refer" / "巨引源" / "文案.md"
OUT = ROOT / "src" / "videos" / "attractor" / "script.json"

IDS = ["sky", "cmb", "leaves", "paper", "zone", "norma", "laniakea", "pushpull", "maybe", "night"]


def main() -> None:
    sections = []
    for block in re.split(r"\n## ", SRC.read_text(encoding="utf8")):
        head = re.match(r"([一二三四五六七八九十]+)\s+(.+?)（约", block)
        if not head:
            continue
        lines = [l[2:].strip() for l in block.splitlines() if l.startswith("> ") and l[2:].strip()]
        sections.append({"title": head.group(2), "lines": lines})
    if len(sections) != len(IDS):
        raise SystemExit(f"文案里有 {len(sections)} 段，theme.ts 里是 {len(IDS)} 幕")
    for sec, sid in zip(sections, IDS):
        sec["id"] = sid
    OUT.write_text(json.dumps({"sections": sections}, ensure_ascii=False, indent=2) + "\n", encoding="utf8", newline="\n")
    print(OUT, sum(len(s["lines"]) for s in sections), "行")


if __name__ == "__main__":
    main()
