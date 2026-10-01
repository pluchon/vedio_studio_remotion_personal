// 隔着玻璃看出去：青灰的天、楼的暗影、失焦的街灯和雨丝。第一场用它，结尾水洼里映着的那扇窗也用它
import React from "react";
import { noise2D } from "@remotion/noise";
import { AbsoluteFill, random } from "remotion";
import { DUSK, HEIGHT, LIGHTS, WIDTH } from "../theme";

export const LAMPS = new Array(64).fill(0).map((_, i) => {
  // 靠前的十几盏又大又亮，其余的远而小
  const near = i < 14;
  return {
    x: random(`lamp-x-${i}`) * WIDTH,
    y: near ? 520 + random(`lamp-y-${i}`) * 460 : 300 + Math.pow(random(`lamp-y-${i}`), 0.8) * 600,
    r: near ? 58 + random(`lamp-r-${i}`) * 60 : 18 + random(`lamp-r-${i}`) * 34,
    color: LIGHTS[Math.floor(random(`lamp-c-${i}`) * LIGHTS.length)],
    alpha: near ? 0.42 + random(`lamp-a-${i}`) * 0.36 : 0.4 + random(`lamp-a-${i}`) * 0.5,
    phase: random(`lamp-p-${i}`) * 6.28,
    near,
  };
});

const BLOCKS = new Array(9).fill(0).map((_, i) => ({
  x: -80 + i * 240 + random(`block-x-${i}`) * 90,
  w: 150 + random(`block-w-${i}`) * 130,
  h: 300 + random(`block-h-${i}`) * 380,
}));

const STREAKS = 230;

// 雨丝：数量跟着雨势走，方向被一阵阵的风吹斜。clock 是雨的时钟，换气时会停住
// stretch：雨丝拉多长，雨停住时缩成一粒粒悬着的水点
export const Streaks: React.FC<{ level: number; clock: number; blur?: number; alpha?: number; stretch?: number }> = ({
  level,
  clock,
  blur = 2.2,
  alpha = 1,
  stretch = 1,
}) => {
  const wind = 0.16 + noise2D("wind", clock * 0.35, 0) * 0.1;
  const visible = Math.round(STREAKS * Math.min(1, level));
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", filter: blur ? `blur(${blur}px)` : undefined }}>
      {new Array(visible).fill(0).map((_, i) => {
        const speed = 1500 + random(`streak-v-${i}`) * 1100;
        const full = 90 + random(`streak-l-${i}`) * 150;
        const length = Math.max(5, full * stretch);
        const travel = HEIGHT + full + 200;
        const y = ((clock * speed + random(`streak-y-${i}`) * travel) % travel) - full - 100;
        const x = random(`streak-x-${i}`) * (WIDTH + 400) - 200 + y * wind;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x + length * wind}
            y2={y + length}
            stroke="rgba(226, 238, 240, 1)"
            strokeWidth={1.2 + random(`streak-w-${i}`) * 1.6}
            strokeLinecap="round"
            opacity={(0.12 + random(`streak-o-${i}`) * 0.22) * alpha * (1 + (1 - stretch) * 1.6)}
          />
        );
      })}
    </svg>
  );
};

// glow：灯有多亮；rain：雨势；kick：雨下大那一下，整个窗外晃一下
export const Outside: React.FC<{ glow: number; seconds: number; clock: number; rain: number; kick?: number }> = ({
  glow,
  seconds,
  clock,
  rain,
  kick = 0,
}) => (
  <AbsoluteFill style={{ backgroundColor: DUSK.top }}>
    <AbsoluteFill style={{ transform: `scale(${1.02 + kick * 0.02})` }}>
      <AbsoluteFill style={{ background: `linear-gradient(${DUSK.top} 0%, ${DUSK.mid} 50%, ${DUSK.low} 100%)` }} />
      {/* 地面附近被灯映暖的一片 */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 42% at 50% 86%, rgba(255, 190, 120, 0.3), rgba(255, 190, 120, 0))" }} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", filter: "blur(26px)" }}>
        {BLOCKS.map((block, i) => (
          <rect key={i} x={block.x} y={HEIGHT - block.h} width={block.w} height={block.h} fill={DUSK.block} opacity={0.55} />
        ))}
      </svg>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", filter: "blur(9px)", mixBlendMode: "screen" }}>
        {LAMPS.filter((lamp) => !lamp.near).map((lamp, i) => (
          <circle
            key={i}
            cx={lamp.x}
            cy={lamp.y}
            r={lamp.r}
            fill={lamp.color}
            opacity={lamp.alpha * glow * (0.86 + 0.14 * Math.sin(seconds * 1.3 + lamp.phase))}
          />
        ))}
      </svg>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", filter: "blur(20px)", mixBlendMode: "screen" }}>
        {LAMPS.filter((lamp) => lamp.near).map((lamp, i) => (
          <circle
            key={i}
            cx={lamp.x}
            cy={lamp.y}
            r={lamp.r}
            fill={lamp.color}
            opacity={lamp.alpha * glow * (0.86 + 0.14 * Math.sin(seconds * 1.3 + lamp.phase))}
          />
        ))}
      </svg>
      <Streaks level={rain * 1.7} clock={clock} />
    </AbsoluteFill>
    {/* 玻璃上的一层水汽 */}
    <AbsoluteFill style={{ background: `rgba(206, 224, 228, ${0.04 + rain * 0.05 + kick * 0.08})` }} />
  </AbsoluteFill>
);
