// 成片之外另导出的两样：透明底的日期角标（导出成带透明通道的视频），和一个循环的月相小动画（导出成动图）
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { phaseName } from "./astro";
import { readDay } from "./day";
import { useFont } from "./font";
import { litShape } from "./skia";
import { COLORS, FONT } from "./theme";
import type { Props } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 一个小月亮：暗面一层淡色，亮面按比例画，亮的一侧朝 angle（度）
const MoonIcon: React.FC<{
  x: number;
  y: number;
  r: number;
  illuminated: number;
  angle: number;
}> = ({ x, y, r, illuminated, angle }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="rgba(241, 231, 211, 0.12)" />
    <path
      d={litShape(x, y, r, illuminated)}
      fill={COLORS.moon}
      transform={`rotate(${angle} ${x} ${y})`}
    />
  </g>
);

export const Badge: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const day = useMemo(() => readDay(props), [props]);
  const ready = useFont();
  if (!ready) return null;
  const fade = interpolate(
    frame,
    [0, 0.6 * fps, durationInFrames - 0.6 * fps, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const [y, m, d] = props.date.split("-");
  const daylight = day.lengths[day.index];

  return (
    <AbsoluteFill
      style={{ opacity: fade, fontFamily: FONT, color: COLORS.cream }}
    >
      <svg
        width={260}
        height={260}
        style={{ position: "absolute", left: 10, top: 0 }}
      >
        <MoonIcon
          x={130}
          y={130}
          r={70}
          illuminated={day.moon.illuminated}
          angle={day.moon.waxing ? 0 : 180}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 280,
          top: 58,
          fontSize: 76,
          letterSpacing: 6,
          textShadow: "0 2px 12px rgba(0,0,0,0.45)",
        }}
      >
        {y}.{m}.{d}
      </div>
      <div
        style={{
          position: "absolute",
          left: 284,
          top: 160,
          fontSize: 28,
          letterSpacing: 5,
          color: COLORS.soft,
          textShadow: "0 2px 10px rgba(0,0,0,0.45)",
        }}
      >
        {props.city} · {phaseName(day.moon.illuminated, day.moon.waxing)} · 白昼{" "}
        {Math.floor(daylight / 60)} 小时 {Math.round(daylight % 60)} 分
      </div>
    </AbsoluteFill>
  );
};

// 一个朔望月压成一圈：月亮从新月走到满月再回去，外圈的小点标出那一天在这一圈里的位置
export const Phases: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const day = useMemo(() => readDay(props), [props]);
  const ready = useFont();
  if (!ready) return null;
  const turn = frame / durationInFrames;
  // 0 是新月，0.5 是满月
  const illuminated = (1 - Math.cos(turn * Math.PI * 2)) / 2;
  const waxing = turn < 0.5;
  const mark = day.moon.elongation / 360;
  const angle = (p: number) => -Math.PI / 2 + p * Math.PI * 2;
  const near = Math.min(Math.abs(turn - mark), 1 - Math.abs(turn - mark));
  const hit = interpolate(near, [0, 0.06], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: COLORS.ink, fontFamily: FONT }}>
      <svg width={480} height={480}>
        <circle
          cx={240}
          cy={230}
          r={176}
          fill="none"
          stroke={COLORS.faint}
          strokeWidth={1.5}
          strokeDasharray="2 6"
        />
        <circle
          cx={240 + Math.cos(angle(mark)) * 176}
          cy={230 + Math.sin(angle(mark)) * 176}
          r={7 + 5 * hit}
          fill={props.accent}
        />
        <circle
          cx={240 + Math.cos(angle(turn)) * 176}
          cy={230 + Math.sin(angle(turn)) * 176}
          r={4}
          fill={COLORS.cream}
        />
        <MoonIcon
          x={240}
          y={230}
          r={110}
          illuminated={illuminated}
          angle={waxing ? 0 : 180}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 22,
          textAlign: "center",
          fontSize: 26,
          letterSpacing: 6,
          color: props.accent,
          opacity: 0.4 + 0.6 * hit,
        }}
      >
        {day.dateLabel} · {phaseName(day.moon.illuminated, day.moon.waxing)}
      </div>
    </AbsoluteFill>
  );
};
