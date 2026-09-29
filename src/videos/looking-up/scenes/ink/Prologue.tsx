// 序：黑夜里远处一堆火，火苗一点点矮下去，只剩余烬；第一声低鼓时片名落下
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Seal } from "../../components/Seal";
import { Subtitle } from "../../components/Subtitle";
import { EASE_OUT, FONTS, SEGMENTS, SPACE, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.prologue);
const FIRE = { x: 960, y: 905 };

// 一条火舌：底宽顶尖，顶端随时间左右摆
const tongue = (h: number, w: number, sway: number) =>
  `M${-w} 0 C${-w * 0.9} ${-h * 0.45} ${sway * 0.5 - w * 0.2} ${-h * 0.7} ${sway} ${-h} C${sway * 0.5 + w * 0.2} ${-h * 0.7} ${w * 0.9} ${-h * 0.45} ${w} 0 Z`;

const Fire: React.FC = () => {
  const frame = useCurrentFrame();
  // 火势：起声时燃起来，之后一路退下去
  const life = interpolate(frame, [t(0.4), t(2.2), t(6.5), t(9.6)], [0, 1, 0.55, 0.08], clamp);
  const flick = (k: number) => Math.sin(frame / (2.6 + k) + k * 1.7) * 0.5 + Math.sin(frame / (5.3 + k * 0.7) + k) * 0.5;

  return (
    <AbsoluteFill>
      {/* 火光照亮的一小块地面和四周 */}
      <AbsoluteFill
        style={{
          opacity: life * (0.9 + 0.1 * flick(0)),
          background: `radial-gradient(ellipse 26% 20% at 50% ${(FIRE.y / 1080) * 100}%, rgba(255, 168, 86, 0.42) 0%, rgba(190, 80, 36, 0.14) 45%, rgba(0, 0, 0, 0) 100%)`,
        }}
      />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="lu-flame" cx="50%" cy="85%" r="75%">
            <stop offset="0%" stopColor="#fff2c8" />
            <stop offset="35%" stopColor="#ffc267" />
            <stop offset="75%" stopColor="#e86a2c" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#b8391a" stopOpacity={0} />
          </radialGradient>
          <filter id="lu-flame-soft">
            <feGaussianBlur stdDeviation={2.2} />
          </filter>
        </defs>
        {/* 几根柴 */}
        <g stroke="#2a1a12" strokeWidth={7} strokeLinecap="round">
          <line x1={FIRE.x - 46} y1={FIRE.y + 8} x2={FIRE.x + 40} y2={FIRE.y - 4} />
          <line x1={FIRE.x - 36} y1={FIRE.y - 4} x2={FIRE.x + 50} y2={FIRE.y + 9} />
        </g>
        <g transform={`translate(${FIRE.x} ${FIRE.y})`} filter="url(#lu-flame-soft)" style={{ mixBlendMode: "screen" }}>
          {[0, 1, 2, 3].map((k) => {
            const h = (92 + k * 24) * life * (0.8 + 0.2 * flick(k));
            return (
              <path
                key={k}
                d={tongue(h, 34 - k * 4, flick(k + 2) * 18 + (k - 1.5) * 12)}
                transform={`translate(${(k - 1.5) * 18} 0)`}
                fill="url(#lu-flame)"
                opacity={0.85 - k * 0.12}
              />
            );
          })}
        </g>
        {/* 往上飘的火星 */}
        {Array.from({ length: 16 }, (_, i) => {
          const r = (k: string) => random(`spark-${i}-${k}`);
          const born = t(0.8) + r("b") * t(8);
          const age = (frame - born) / 50;
          if (age < 0 || age > 1) return null;
          return (
            <circle
              key={i}
              cx={FIRE.x + (r("x") - 0.5) * 40 + Math.sin(age * 6 + i) * 14 * age}
              cy={FIRE.y - 30 - age * (120 + r("h") * 120)}
              r={1.4 + r("s") * 1.2}
              fill="#ffd89a"
              opacity={(1 - age) * life}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// 片名：横排大字逐字洇开，朱印压在末尾，下面一道红线与英文
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [t(14.2), t(15.0)], [1, 0], clamp);
  if (frame < t(9.8) || o <= 0) return null;
  const settle = interpolate(frame, [t(9.9), t(11.5)], [1.05, 1], { ...clamp, easing: EASE_OUT });
  const chars = [..."我们一直在仰望"];
  return (
    <AbsoluteFill style={{ opacity: o, scale: `${settle}` }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 380,
          textAlign: "center",
          fontFamily: FONTS.songBlack,
          fontSize: 112,
          letterSpacing: "0.22em",
          color: SPACE.cream,
        }}
      >
        {chars.map((c, i) => (
          <span key={i} style={{ display: "inline-block", ...inkIn(frame, t(9.9) + i * 4, 24) }}>
            {c}
          </span>
        ))}
      </div>
      <Seal text="仰望" at={t(11.6)} size={64} color={SPACE.cinnabar} style={{ left: 1500, top: 406 }} />
      <div
        style={{
          position: "absolute",
          left: 960 - 60,
          top: 572,
          width: 120 * interpolate(frame, [t(11.8), t(12.6)], [0, 1], { ...clamp, easing: EASE_OUT }),
          height: 2,
          backgroundColor: SPACE.cinnabar,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 604,
          textAlign: "center",
          fontFamily: FONTS.latin,
          fontSize: 26,
          letterSpacing: "0.42em",
          color: SPACE.creamSoft,
          ...inkIn(frame, t(12.2), 30),
        }}
      >
        WE HAVE ALWAYS BEEN LOOKING UP
      </div>
    </AbsoluteFill>
  );
};

export const Prologue: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
    <Fire />
    <Subtitle zh={["最初，夜是没有名字的。"]} en={["In the beginning, the night had no name."]} at={t(2.0)} out={t(8.4)} tone="space" stagger={3.2} />
    <Title />
  </AbsoluteFill>
);
