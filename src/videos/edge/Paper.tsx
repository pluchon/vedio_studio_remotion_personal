// 纸和图框：羊皮纸底、旧纸的斑点，以及老地图那圈带刻度的边框（边框就是「尽头」的化身）
import React from "react";
import { AbsoluteFill } from "remotion";
import { Draw, handLine } from "./ink";
import { ease, ramp, useT } from "./time";
import { COLORS, HEIGHT, WIDTH } from "./theme";

const SPOTS = [
  [220, 180, 260, 0.1],
  [1500, 260, 320, 0.08],
  [900, 860, 380, 0.09],
  [1700, 900, 240, 0.1],
  [380, 760, 220, 0.07],
  [1180, 120, 200, 0.06],
] as const;

// 图框外的白边：和纸同一份底，只留框外一圈，盖在各幕上面，让画面看起来是裁在图框里的
export const Margin: React.FC<{ inset?: number; opacity?: number }> = ({ inset = 44, opacity = 1 }) => {
  const m = inset;
  const clip = `polygon(evenodd, 0 0, ${WIDTH}px 0, ${WIDTH}px ${HEIGHT}px, 0 ${HEIGHT}px, 0 0, ${m}px ${m}px, ${m}px ${HEIGHT - m}px, ${WIDTH - m}px ${HEIGHT - m}px, ${WIDTH - m}px ${m}px, ${m}px ${m}px)`;
  return (
    <AbsoluteFill style={{ clipPath: clip, opacity }}>
      <Paper />
    </AbsoluteFill>
  );
};

export const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 45%, ${COLORS.paperLight} 0%, ${COLORS.paper} 55%, ${COLORS.paperDeep} 100%)`,
    }}
  >
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        {SPOTS.map(([, , , a], i) => (
          <radialGradient key={i} id={`edge-spot-${i}`}>
            <stop offset="0%" stopColor="#9a7a45" stopOpacity={a} />
            <stop offset="100%" stopColor="#9a7a45" stopOpacity={0} />
          </radialGradient>
        ))}
        <filter id="edge-fibre">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves="3" seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.26  0 0 0 0 0.14  0 0 0 0.55 -0.12" />
        </filter>
      </defs>
      {SPOTS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={`url(#edge-spot-${i})`} />
      ))}
      <rect width={WIDTH} height={HEIGHT} filter="url(#edge-fibre)" opacity={0.35} />
    </svg>
  </AbsoluteFill>
);

// 图框：外粗内细两圈线，四边是刻度。inset 是离画面边的距离，reach 控制刻度画到哪（0..1）
export const Neatline: React.FC<{
  from: number;
  inset?: number;
  opacity?: number;
  color?: string;
  ticks?: boolean;
}> = ({ from, inset = 44, opacity = 1, color = COLORS.ink, ticks = true }) => {
  const t = useT();
  const p = ease(t, from, from + 2.4);
  if (p <= 0) return null;
  const a = inset;
  const b = inset + 16;
  const rect = (m: number) => `M${m},${m} L${WIDTH - m},${m} L${WIDTH - m},${HEIGHT - m} L${m},${HEIGHT - m} Z`;
  const tickLines: React.ReactNode[] = [];
  if (ticks) {
    for (let x = b + 30; x < WIDTH - b; x += 30) {
      const long = Math.round((x - b) / 30) % 5 === 0;
      const reach = ramp(x / WIDTH, 0, 1) < p;
      if (!reach) continue;
      tickLines.push(
        <line key={`t${x}`} x1={x} x2={x} y1={a} y2={a + (long ? 14 : 8)} stroke={color} strokeWidth={1.2} />,
        <line key={`b${x}`} x1={x} x2={x} y1={HEIGHT - a} y2={HEIGHT - a - (long ? 14 : 8)} stroke={color} strokeWidth={1.2} />,
      );
    }
    for (let y = b + 30; y < HEIGHT - b; y += 30) {
      const long = Math.round((y - b) / 30) % 5 === 0;
      const reach = ramp(y / HEIGHT, 0, 1) < p;
      if (!reach) continue;
      tickLines.push(
        <line key={`l${y}`} y1={y} y2={y} x1={a} x2={a + (long ? 14 : 8)} stroke={color} strokeWidth={1.2} />,
        <line key={`r${y}`} y1={y} y2={y} x1={WIDTH - a} x2={WIDTH - a - (long ? 14 : 8)} stroke={color} strokeWidth={1.2} />,
      );
    }
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity }}>
      <g filter="url(#edge-rough)">
        <Draw d={rect(a)} p={p} width={3.2} color={color} />
        <Draw d={rect(b)} p={p} width={1.2} color={color} />
        {tickLines}
      </g>
    </svg>
  );
};

export { handLine };
