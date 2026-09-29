// 纸上的星：铜版画里那种四角星，按顺序一颗颗点亮在留白的天上；可以再用虚线把其中几颗连起来
import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { EASE_OUT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Box = { left: number; top: number; width: number; height: number };

// 四角星：细长的十字，中间收腰
export const starPath = (r: number) =>
  `M0 ${-r} Q${r * 0.12} ${-r * 0.12} ${r} 0 Q${r * 0.12} ${r * 0.12} 0 ${r} Q${-r * 0.12} ${r * 0.12} ${-r} 0 Q${-r * 0.12} ${-r * 0.12} 0 ${-r} Z`;

// 第 i 颗星的位置、大小、点亮时刻（连线要用同样的位置）
const place = (seed: string, i: number, count: number, at: number, span: number, area: Box) => {
  const r = (k: string) => random(`${seed}-${i}-${k}`);
  return {
    x: area.left + r("x") * area.width,
    y: area.top + Math.pow(r("y"), 1.4) * area.height,
    size: 3 + Math.pow(r("s"), 3) * 11,
    start: at + (i / count) * span + r("jitter") * 6,
    rot: r("rot") * 20 - 10,
    phase: r("t") * 6.28,
  };
};

const chainLinks = (stars: { x: number; y: number }[], near: [number, number], count: number) => {
  const dist = (a: { x: number; y: number }, x: number, y: number) => Math.hypot(a.x - x, a.y - y);
  const used = new Set<number>();
  let cur = stars.reduce((best, s, i) => (dist(s, ...near) < dist(stars[best], ...near) ? i : best), 0);
  used.add(cur);
  const links: [number, number][] = [];
  for (let k = 1; k < count; k++) {
    let next = -1;
    stars.forEach((s, i) => {
      if (used.has(i)) return;
      if (next < 0 || dist(s, stars[cur].x, stars[cur].y) < dist(stars[next], stars[cur].x, stars[cur].y)) next = i;
    });
    if (next < 0) break;
    links.push([cur, next]);
    used.add(next);
    cur = next;
  }
  return links;
};

export const InkStars: React.FC<{
  seed: string;
  count: number;
  at: number;
  // 全部点亮用多少帧
  span: number;
  area: Box;
  color: string;
  out?: number;
  // 连成星宿：从离 near 最近的那颗起，每次连向最近的下一颗，连 count 颗；从 linkAt 起逐条画出
  chain?: { near: [number, number]; count: number };
  linkAt?: number;
}> = ({ seed, count, at, span, area, color, out, chain, linkAt = 0 }) => {
  const frame = useCurrentFrame();
  const o = out === undefined ? 1 : interpolate(frame, [out, out + 16], [1, 0], clamp);
  if (frame < at || o <= 0) return null;
  const stars = Array.from({ length: count }, (_, i) => place(seed, i, count, at, span, area));
  const links = chain ? chainLinks(stars, chain.near, chain.count) : [];

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o, overflow: "visible" }}>
      {links.map(([a, b], k) => {
        const p = interpolate(frame, [linkAt + k * 8, linkAt + k * 8 + 18], [0, 1], { ...clamp, easing: EASE_OUT });
        if (p <= 0) return null;
        const s = stars[a];
        const e = stars[b];
        return (
          <line
            key={k}
            x1={s.x}
            y1={s.y}
            x2={s.x + (e.x - s.x) * p}
            y2={s.y + (e.y - s.y) * p}
            stroke={color}
            strokeWidth={1.2}
            strokeDasharray="2 6"
            opacity={0.6}
          />
        );
      })}
      {stars.map((s, i) => {
        const p = interpolate(frame, [s.start, s.start + 14], [0, 1], { ...clamp, easing: EASE_OUT });
        if (p <= 0) return null;
        // 点亮之后轻轻闪
        const twinkle = 0.75 + 0.25 * Math.sin(frame / 9 + s.phase);
        return <path key={i} d={starPath(s.size * p)} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`} fill={color} opacity={twinkle} />;
      })}
    </svg>
  );
};
