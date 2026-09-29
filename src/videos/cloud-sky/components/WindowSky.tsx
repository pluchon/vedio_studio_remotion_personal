// 窗外的天（窗内坐标）：渐变的天色、几朵各走各的积云；入夜时星星一颗一颗亮起，银河淡淡横过
import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { Cloud, Tint, cumulus } from "./Cloud";
import { WIN } from "./WindowView";

export type SkyColors = { top: string; mid: string; low: string };
export type CloudColors = { light: string; mid: string; shade: string; tint?: Tint; glow?: string; glowOpacity?: number };

// 每朵云：形状、起点、每帧飘多远；分在不同的窗格里，所以每一格都有一片不同的云
const CLOUDS = [
  { puffs: cumulus("win-a", 32, 360, 170), h: 170, x: 150, y: 250, drift: 0.34, scale: 1 },
  { puffs: cumulus("win-b", 42, 480, 230), h: 230, x: 560, y: 360, drift: 0.24, scale: 1 },
  { puffs: cumulus("win-c", 22, 240, 110), h: 110, x: 930, y: 160, drift: 0.46, scale: 1 },
  { puffs: cumulus("win-d", 18, 200, 90), h: 90, x: 360, y: 110, drift: 0.4, scale: 0.9 },
  { puffs: cumulus("win-e", 46, 620, 280), h: 280, x: 280, y: 640, drift: 0.18, scale: 1 },
  { puffs: cumulus("win-f", 16, 180, 80), h: 80, x: 860, y: 520, drift: 0.3, scale: 1 },
];

const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = (k: string) => random(`star-${i}-${k}`);
  return { x: r("x") * WIN.w, y: r("y") * WIN.h * 0.75, size: 1.2 + r("s") * 2.4, order: r("o"), phase: r("p") * 6 };
});

export const WindowSky: React.FC<{
  colors: SkyColors;
  cloud: CloudColors;
  cloudOpacity?: number;
  stars?: number;
  children?: React.ReactNode;
}> = ({ colors, cloud, cloudOpacity = 1, stars = 0, children }) => {
  // cloudOpacity 为 0 时不画那几朵各走各的云，窗里只留 children
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${colors.top} 0%, ${colors.mid} 55%, ${colors.low} 100%)` }}>
      {stars > 0 && (
        <>
          <div
            style={{
              position: "absolute",
              left: -200,
              top: 120,
              width: WIN.w + 400,
              height: 180,
              transform: "rotate(-24deg)",
              opacity: stars * 0.35,
              background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(220, 215, 255, 0.55) 0%, rgba(220, 215, 255, 0) 100%)",
            }}
          />
          {STARS.map((s, i) => {
            // 按 order 先后亮起，亮了之后轻轻闪
            const on = Math.min(1, Math.max(0, (stars - s.order * 0.85) / 0.15));
            const twinkle = 0.75 + 0.25 * Math.sin(frame / 9 + s.phase);
            return on > 0 ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: s.x,
                  top: s.y,
                  width: s.size,
                  height: s.size,
                  borderRadius: "50%",
                  backgroundColor: "#fff6df",
                  opacity: on * twinkle,
                  boxShadow: `0 0 ${s.size * 3}px rgba(255, 246, 223, 0.7)`,
                }}
              />
            ) : null;
          })}
        </>
      )}
      {cloudOpacity > 0 &&
        CLOUDS.map((c, i) => (
          <Cloud
            key={i}
            id={`win-${i}`}
            puffs={c.puffs}
            x={c.x + frame * c.drift}
            y={c.y}
            scale={c.scale}
            base={c.h * 0.1}
            tint={cloud.tint}
            light={cloud.light}
            mid={cloud.mid}
            shade={cloud.shade}
            glow={cloud.glow}
            glowOpacity={cloud.glowOpacity}
            opacity={cloudOpacity}
          />
        ))}
      {children}
    </AbsoluteFill>
  );
};
