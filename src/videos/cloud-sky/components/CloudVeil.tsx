// 穿过云层：cover 时大团的白从四周合拢把画面盖住，reveal 时从中间向四周散开，像从云里飞出来
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { EASE_IN_OUT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const PUFFS = Array.from({ length: 18 }, (_, i) => {
  const r = (k: string) => random(`veil-${i}-${k}`);
  return { x: -150 + r("x") * 2220, y: -120 + r("y") * 1320, r: 360 + r("r") * 300 };
});

export const CloudVeil: React.FC<{ from: number; to: number; mode: "cover" | "reveal"; color?: string }> = ({
  from,
  to,
  mode,
  color = "255, 253, 248",
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  // p 为云的浓度：cover 由 0 到 1，reveal 由 1 到 0
  const p = mode === "cover" ? t : 1 - t;
  if (p <= 0) return null;
  const spread = 1 + (1 - p) * 0.9;
  const solid = interpolate(p, [0.55, 1], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {PUFFS.map((c, i) => {
        const x = 960 + (c.x - 960) * spread;
        const y = 540 + (c.y - 540) * spread;
        const r = c.r * (0.45 + 0.75 * p);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              opacity: Math.min(1, p * 1.4),
              background: `radial-gradient(closest-side, rgba(${color}, 1) 0%, rgba(${color}, 0.85) 45%, rgba(${color}, 0) 100%)`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ backgroundColor: `rgb(${color})`, opacity: solid }} />
    </AbsoluteFill>
  );
};
