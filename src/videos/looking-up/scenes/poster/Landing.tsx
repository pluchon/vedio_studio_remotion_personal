// 海报 · 1969：一家人围着老电视；屏幕先是一片雪花，然后跳出月面上的那只脚印——黑白、带扫描线、微微闪
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Camera, Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { PosterImage } from "../../components/Poster";
import { Subtitle } from "../../components/Subtitle";
import { SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.landing);

// 电视屏幕在画面里的位置（1536×1024 的图按 cover 铺满、上下各裁 100 之后）
const SCREEN = { left: 950, top: 356, width: 350, height: 290, radius: 36 };

const Static: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={SCREEN.width} height={SCREEN.height} style={{ position: "absolute", inset: 0 }}>
      <rect width={SCREEN.width} height={SCREEN.height} fill="#8a8a86" />
      {Array.from({ length: 260 }, (_, i) => (
        <rect
          key={i}
          x={random(`sx-${i}-${frame}`) * SCREEN.width}
          y={random(`sy-${i}-${frame}`) * SCREEN.height}
          width={2 + random(`sw-${i}`) * 6}
          height={2}
          fill={random(`sc-${i}-${frame}`) > 0.5 ? "#f2f2ee" : "#2a2a28"}
        />
      ))}
    </svg>
  );
};

export const Landing: React.FC = () => {
  const frame = useCurrentFrame();
  const picture = interpolate(frame, [t(123.6), t(123.9)], [0, 1], clamp);
  const flicker = 0.92 + 0.08 * Math.sin(frame * 1.7) * Math.sin(frame * 0.37);
  const push = interpolate(frame, [0, t(127.6)], [1.0, 1.12]);

  return (
    <AbsoluteFill>
      <Camera scale={push} origin={`${((SCREEN.left + SCREEN.width / 2) / 1920) * 100}% ${((SCREEN.top + SCREEN.height / 2) / 1080) * 100}%`}>
        <PosterImage src={asset("posters/tv.jpg")} />
        <div style={{ position: "absolute", ...SCREEN, borderRadius: SCREEN.radius, overflow: "hidden", backgroundColor: "#1a1a18" }}>
          {picture < 1 && <Static />}
          <div style={{ position: "absolute", inset: 0, opacity: picture * flicker }}>
            <Img src={staticFile(asset("plates/footprint.jpg"))} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.25) brightness(1.05)" }} />
          </div>
          {/* 扫描线与显像管的暗角 */}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,240,0.08) 0%, rgba(0,0,0,0.45) 100%)" }} />
        </div>
      </Camera>
      <Mist tone="space" strength={0.45} height={260} />
      <Locator year="1969" place="静海 · 月球" at={t(123.3)} tone="space" />
      <Subtitle zh={["人的脚印，落在了另一个天体上。"]} en={["A human footprint, on another world."]} at={t(123.9)} out={t(127.4)} tone="space" />
      <Grain opacity={0.06} vignette={0.2} />
    </AbsoluteFill>
  );
};
