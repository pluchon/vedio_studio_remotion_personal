// 字形数据：每个字形是一张 384 见方的表，记着每一格离笔画边缘多远（外正内负，单位 1/64 格）；载好之前挡住渲染
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { asset } from "./theme";

export type Glyphs = {
  size: number;
  get: (name: string) => Int16Array;
};

type Part = { name: string; x: number; y: number; scale: number };

// 两个字并排摆在一格里，会意字合体之前用：「人木」「月日」
const PAIRS: Record<string, Part[]> = {
  人木: [
    { name: "人-oracle", x: 0.27, y: 0.5, scale: 0.56 },
    { name: "木-oracle", x: 0.73, y: 0.5, scale: 0.56 },
  ],
  月日: [
    { name: "月-oracle", x: 0.25, y: 0.5, scale: 0.56 },
    { name: "日-oracle", x: 0.72, y: 0.5, scale: 0.5 },
  ],
};

// 把几个字形缩小、挪开后拼成一张新表：每一格取离得最近的那个字
const compose = (size: number, parts: { field: Int16Array; part: Part }[]) => {
  const out = new Int16Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let best = 32767;
      for (const { field, part } of parts) {
        const sx = (x + 0.5 - part.x * size) / part.scale + size / 2 - 0.5;
        const sy = (y + 0.5 - part.y * size) / part.scale + size / 2 - 0.5;
        const cx = Math.min(size - 1, Math.max(0, Math.round(sx)));
        const cy = Math.min(size - 1, Math.max(0, Math.round(sy)));
        // 落在原表外面的格子，再加上离表边的距离
        const beyond = Math.hypot(sx - cx, sy - cy);
        const d = (field[cy * size + cx] + beyond * 64) * part.scale;
        if (d < best) best = d;
      }
      out[y * size + x] = Math.min(32767, Math.round(best));
    }
  }
  return out;
};

let cache: Promise<Glyphs> | null = null;

const load = () => {
  if (!cache) {
    cache = Promise.all([
      fetch(staticFile(asset("data/glyphs.json"))).then((res) => res.json() as Promise<{ size: number; names: string[] }>),
      fetch(staticFile(asset("data/glyphs.bin"))).then((res) => res.arrayBuffer()),
    ]).then(([index, buffer]) => {
      const cells = index.size * index.size;
      const all = new Int16Array(buffer);
      const table = new Map(index.names.map((name, i) => [name, all.subarray(i * cells, (i + 1) * cells)]));
      const get = (name: string) => {
        const hit = table.get(name);
        if (!hit) throw new Error(`没有字形 ${name}`);
        return hit;
      };
      for (const [name, parts] of Object.entries(PAIRS)) {
        table.set(
          name,
          compose(
            index.size,
            parts.map((part) => ({ field: get(part.name), part })),
          ),
        );
      }
      return { size: index.size, get };
    });
  }
  return cache;
};

export const useGlyphs = () => {
  const [glyphs, setGlyphs] = useState<Glyphs | null>(null);
  const [handle] = useState(() => delayRender("加载字形"));

  useEffect(() => {
    load()
      .then((loaded) => {
        setGlyphs(loaded);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);

  return glyphs;
};
