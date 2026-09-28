// 台灯下的一页日记：暗房间里一张横线纸，灯亮时纸面被暖光照出来，灯灭时整页沉进黑暗；children 画在纸上，随灯光明暗
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN_OUT, HOME } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const HomeDesk: React.FC<{ lampOn: number; dimFrom?: number; dimTo?: number; children?: React.ReactNode }> = ({
  lampOn,
  dimFrom,
  dimTo,
  children,
}) => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [lampOn, lampOn + 24], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const off = dimFrom === undefined || dimTo === undefined ? 1 : interpolate(frame, [dimFrom, dimTo], [1, 0], { ...clamp, easing: EASE_IN_OUT });
  const light = on * off;

  return (
    <AbsoluteFill style={{ backgroundColor: HOME.room }}>
      <AbsoluteFill style={{ transform: "rotate(-1.2deg) scale(1.04)" }}>
        <AbsoluteFill
          style={{
            backgroundColor: HOME.paper,
            backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 71px, rgba(120, 98, 74, 0.13) 71px, rgba(120, 98, 74, 0.13) 72px)",
          }}
        />
        {/* 纸的纤维 */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply" }}>
          <filter id="wd-paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.35" numOctaves="3" seed="11" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.55  0 0 0 0 0.46  0 0 0 0.5 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#wd-paper)" />
        </svg>
        {children}
      </AbsoluteFill>
      {/* 台灯的光：中间暖亮，四周沉进房间的暗里 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 62% 70% at 50% 42%, rgba(${HOME.lamp}, 0.16) 0%, rgba(20, 18, 16, 0) 45%, rgba(20, 18, 16, 0.8) 100%)`,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: HOME.room, opacity: 1 - light }} />
    </AbsoluteFill>
  );
};
