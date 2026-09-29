// 海报 · 1969：海滩上的人看着土星五号升空；一条虚线从火箭头一路画到右上角的月亮，标上三十八万公里
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { PosterImage } from "../../components/Poster";
import { EASE_OUT, FONTS, RETRO, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.launch);

// 图里的火箭头（1672×941 铺满后的位置）与右上角的月亮
const ROCKET = { x: 1011, y: 170 };
const MOON = { x: 1720, y: 120 };
const CTRL = { x: 1260, y: -60 };

export const Launch: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, t(123.11)], [1.0, 1.08]);
  const rise = interpolate(frame, [0, t(123.11)], [0, 30]);
  const line = interpolate(frame, [t(119.2), t(121.2)], [0, 1], { ...clamp, easing: EASE_OUT });
  const moon = interpolate(frame, [t(120.8), t(121.4)], [0, 1], { ...clamp, easing: EASE_OUT });
  const len = 900;

  return (
    <AbsoluteFill>
      {/* 虚线和月亮跟着画面一起推，才能始终接在火箭头上 */}
      <Camera scale={push} y={rise} origin="53% 40%">
        <PosterImage src={asset("posters/launch.jpg")} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path
          d={`M${ROCKET.x} ${ROCKET.y} Q${CTRL.x} ${CTRL.y} ${MOON.x} ${MOON.y}`}
          fill="none"
          stroke={RETRO.creamLight}
          strokeWidth={2}
          strokeDasharray={`${len * line} ${len}`}
          opacity={0.9}
        />
        <g transform={`translate(${MOON.x} ${MOON.y}) scale(${moon})`}>
          <circle r={38} fill={RETRO.creamLight} />
          <circle cx={-10} cy={-8} r={8} fill={RETRO.sand} />
          <circle cx={12} cy={10} r={6} fill={RETRO.sand} />
          <circle cx={8} cy={-16} r={4} fill={RETRO.sand} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: MOON.x - 260, top: MOON.y + 56, fontFamily: FONTS.song, fontSize: 26, letterSpacing: "0.14em", color: RETRO.creamLight, whiteSpace: "nowrap", ...inkIn(frame, t(121.3), 12) }}>
        月球 · 约三十八万公里
      </div>
      </Camera>
      <Locator year="1969" place="肯尼迪航天中心" at={t(118.8)} tone="space" />
      <Grain opacity={0.06} vignette={0.2} />
    </AbsoluteFill>
  );
};
