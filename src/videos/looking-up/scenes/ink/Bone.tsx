// 墨 · 约四万年前：一根刻满刻痕的骨头；上方月相一格一格排出来，由缺到圆再到缺，最后解出「= 一个月？」
// ——像参考图里一行行二进制解出字母；问号是因为刻痕记月相只是一种推测
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera, InkImage, Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_IN_OUT, EASE_OUT, FONTS, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.bone);

const MOONS = 8;
const ROW = { x0: 470, step: 118, y: 250, r: 30 };

// 月相：phase 0 新月、0.5 满月；受光部分由半个圆加半个椭圆拼成
const litPath = (phase: number, r: number) => {
  const a = phase * Math.PI * 2;
  const rx = Math.abs(Math.cos(a)) * r;
  const waxing = phase < 0.5;
  // 受光的一侧的半圆
  const side = waxing ? 1 : 0;
  // 椭圆那一半往哪边鼓：凸月时鼓到暗侧那边，蛾眉月时缩在亮侧里面
  const bulge = (phase > 0.25 && phase < 0.75) === waxing ? 1 : 0;
  return `M0 ${-r} A${r} ${r} 0 0 ${side} 0 ${r} A${rx} ${r} 0 0 ${bulge} 0 ${-r} Z`;
};

const Moon: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const phase = i / MOONS;
  const x = ROW.x0 + i * ROW.step;
  return (
    <g transform={`translate(${x} ${ROW.y})`} style={inkIn(frame, at, 12)}>
      <circle r={ROW.r} fill={PAPER.ink} opacity={0.82} />
      <path d={litPath(phase, ROW.r - 1.5)} fill={PAPER.base} />
      <circle r={ROW.r} fill="none" stroke={PAPER.ink} strokeWidth={1.6} />
    </g>
  );
};

export const Bone: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, t(37.06)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const found = interpolate(frame, [t(33.6), t(34.4)], [0, 1], { ...clamp, easing: EASE_OUT });
  const bracket = interpolate(frame, [t(33.2), t(33.8)], [0, 1], { ...clamp, easing: EASE_OUT });
  const span = (MOONS - 1) * ROW.step;

  return (
    <AbsoluteFill>
      <Xuan />
      <Camera scale={1.06 + p * 0.04} x={40 - p * 80} y={60}>
        <InkImage src={asset("engravings/bone.png")} />
      </Camera>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: MOONS }, (_, i) => (
          <Moon key={i} i={i} at={t(28.6) + i * 14} />
        ))}
        {/* 一个月的括号 */}
        <path
          d={`M${ROW.x0 - 20} ${ROW.y + 52} v12 h${(span + 40) * bracket} ${bracket >= 1 ? "v-12" : ""}`}
          fill="none"
          stroke={PAPER.cinnabar}
          strokeWidth={2}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: ROW.x0 + span + 70,
          top: ROW.y - 30,
          fontFamily: FONTS.songBlack,
          fontSize: 46,
          letterSpacing: "0.08em",
          color: PAPER.cinnabar,
          opacity: found,
          translate: `${(1 - found) * -20}px 0`,
          whiteSpace: "nowrap",
        }}
      >
        = 一个月？
      </div>
      <div
        style={{
          position: "absolute",
          left: ROW.x0 - 20,
          top: ROW.y + 82,
          fontFamily: FONTS.song,
          fontSize: 26,
          letterSpacing: "0.2em",
          color: "rgba(43, 37, 32, 0.8)",
          ...inkIn(frame, t(34.4), 18),
        }}
      >
        骨上的刻痕，也许记着月亮的圆缺
      </div>
      <Mist tone="ink" height={240} />
      <Locator year="约四万年前" place="非洲南部 · 莱邦博山" at={t(28.2)} tone="ink" />
      <Subtitle
        zh={["我们学会用星辰丈量一切：数日子，分四季，辨方向。"]}
        en={["We learned to measure everything by the stars:", "counting days, dividing seasons, finding our way."]}
        at={t(29.6)}
        out={t(36.6)}
        tone="ink"
      />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
