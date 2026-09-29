// 一阵风：若干道起伏的细线从左往右掠过画面，每道线是一小段在波形路径上滑行的笔触
import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { EASE_IN_OUT } from "./motion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Line = { d: string; delay: number; seg: number; width: number; alpha: number };

const makeLines = (seed: string, count: number, band: [number, number], lift: number): Line[] =>
  Array.from({ length: count }, (_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const y0 = band[0] + r("y") * (band[1] - band[0]);
    const amp = 14 + r("a") * 40;
    const wave = 260 + r("w") * 360;
    const phase = r("p") * Math.PI * 2;
    const points: string[] = [];
    for (let x = -240; x <= 2160; x += 40) {
      const y = y0 + amp * Math.sin(x / wave + phase) - (x / 1920) * lift;
      points.push(`${x},${y.toFixed(1)}`);
    }
    return {
      d: "M" + points.join(" L"),
      delay: r("d") * 0.35,
      seg: 0.12 + r("s") * 0.16,
      width: 1.2 + r("t") * 2.2,
      alpha: 0.35 + r("o") * 0.5,
    };
  });

export const WindLines: React.FC<{
  at: number;
  duration: number;
  color: string;
  count?: number;
  band?: [number, number];
  lift?: number;
  seed?: string;
}> = ({ at, duration, color, count = 14, band = [120, 960], lift = 120, seed = "wind" }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + duration) return null;
  const lines = makeLines(seed, count, band, lift);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      {lines.map((l, i) => {
        const start = at + l.delay * duration;
        const travel = duration * 0.65;
        const p = interpolate(frame, [start, start + travel], [0, 1], { ...clamp, easing: EASE_IN_OUT });
        if (p <= 0 || p >= 1) return null;
        return (
          <path
            key={i}
            d={l.d}
            fill="none"
            stroke={color}
            strokeWidth={l.width}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${l.seg} 2`}
            strokeDashoffset={l.seg - p * (1 + l.seg)}
            opacity={l.alpha * Math.sin(p * Math.PI)}
          />
        );
      })}
    </svg>
  );
};
