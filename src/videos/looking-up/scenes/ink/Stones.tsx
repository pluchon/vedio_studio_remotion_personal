// 墨 · 约五千年前：太阳正从两块巨石的缝里升起；刻线一样的光芒往外长，一道虚线标出日出的方向，写上「夏至」
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera, InkImage, Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_OUT, FONTS, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.stones);

// 图里石门缝中的太阳（1672×941 的图铺满 1920×1080 后的位置）
const SUN = { x: 960, y: 712 };

export const Stones: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, t(41.6)], [1.0, 1.07]);
  const rays = interpolate(frame, [t(37.3), t(39.2)], [0, 1], { ...clamp, easing: EASE_OUT });
  const axis = interpolate(frame, [t(38.2), t(39.6)], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill>
      <Xuan />
      <Camera scale={push} origin={`${(SUN.x / 1920) * 100}% ${(SUN.y / 1080) * 100}%`}>
        <InkImage src={asset("engravings/stones.png")} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* 光芒：只往地平线以上长 */}
          {Array.from({ length: 23 }, (_, i) => {
            const a = Math.PI + (i / 22) * Math.PI;
            const len = (160 + (i % 3) * 70) * rays;
            return (
              <line
                key={i}
                x1={SUN.x + Math.cos(a) * 40}
                y1={SUN.y + Math.sin(a) * 40}
                x2={SUN.x + Math.cos(a) * (40 + len)}
                y2={SUN.y + Math.sin(a) * (40 + len)}
                stroke={PAPER.ink}
                strokeWidth={1.2}
                opacity={0.5}
              />
            );
          })}
          {/* 日出的方向：从太阳穿过石门、一直拉到眼前 */}
          <line x1={SUN.x} y1={SUN.y} x2={SUN.x} y2={SUN.y + (1080 - SUN.y) * axis} stroke={PAPER.cinnabar} strokeWidth={2} strokeDasharray="10 8" />
          <circle cx={SUN.x} cy={SUN.y} r={52 * rays} fill="none" stroke={PAPER.cinnabar} strokeWidth={2} opacity={rays} />
        </svg>
      </Camera>
      <div
        style={{
          position: "absolute",
          left: SUN.x + 70,
          top: SUN.y - 380,
          fontFamily: FONTS.songBlack,
          fontSize: 40,
          letterSpacing: "0.12em",
          color: PAPER.cinnabar,
          ...inkIn(frame, t(38.8), 16),
        }}
      >
        夏至 · 日出
      </div>
      <Mist tone="ink" height={220} />
      <Locator year="约五千年前" place="英格兰 · 巨石阵" at={t(37.2)} tone="ink" />
      <Subtitle zh={["石头垒成的圈，对准日出的方向。"]} en={["Circles of stone, aligned to where the sun rises."]} at={t(37.5)} out={t(41.3)} tone="ink" />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
