// 一年里的这一天：365 根刻度围成一圈，每根的长短是那一天白昼的长短；那一天点亮，圆心用饼图画出那天的昼与夜
import React from "react";
import { makePie } from "@remotion/shapes";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Day } from "./day";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const CX = 960;
const CY = 560;
const INNER = 250;
const PIE = 170;

const span = (minutes: number) =>
  `${Math.floor(minutes / 60)} 小时 ${Math.round(minutes % 60)} 分`;

export const Year: React.FC<{ day: Day; accent: string }> = ({
  day,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const count = day.lengths.length;
  const shortest = Math.min(...day.lengths);
  const longest = Math.max(...day.lengths);
  const length = (minutes: number) =>
    34 + ((minutes - shortest) / Math.max(1, longest - shortest)) * 150;
  // 刻度从一月一日起顺时针一根根长出来
  const grown = interpolate(t, [0.4, 3.4], [0, count], clamp);
  const focus = interpolate(t, [3.6, 4.4], [0, 1], clamp);
  const pie = interpolate(t, [4.2, 5.8], [0, 1], clamp);
  const fade = interpolate(
    frame,
    [0, 0.6 * fps, durationInFrames - 0.8 * fps, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const today = day.lengths[day.index];
  const angle = (i: number) => -Math.PI / 2 + (i / count) * Math.PI * 2;
  const mark = angle(day.index);
  const tip = INNER + length(today) + 26;
  const daylight = makePie({
    radius: PIE,
    progress: (today / 1440) * pie,
    rotation: 0,
  });
  const months = Array.from({ length: 12 }, (_, m) => {
    const first = Math.round(
      (Date.UTC(day.year, m, 1) - Date.UTC(day.year, 0, 1)) / 86400000,
    );
    return { m, first, a: angle(first + 14) };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: COLORS.ink,
        opacity: fade,
      }}
    >
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        {day.lengths.map((minutes, i) => {
          if (i >= grown) return null;
          const a = angle(i);
          const r1 = INNER + length(minutes);
          const on = i === day.index;
          return (
            <line
              key={i}
              x1={CX + Math.cos(a) * INNER}
              y1={CY + Math.sin(a) * INNER}
              x2={CX + Math.cos(a) * r1}
              y2={CY + Math.sin(a) * r1}
              stroke={on ? accent : COLORS.cream}
              strokeWidth={on ? 4 : 1.6}
              strokeOpacity={on ? 0.35 + 0.65 * focus : 0.42 - 0.18 * focus}
            />
          );
        })}
        {months.map(({ m, first, a }) => (
          <text
            key={m}
            x={CX + Math.cos(a) * (INNER - 30)}
            y={CY + Math.sin(a) * (INNER - 30) + 8}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={22}
            fill={COLORS.faint}
            opacity={interpolate(grown, [first, first + 12], [0, 1], clamp)}
          >
            {m + 1}
          </text>
        ))}
        <g
          transform={`translate(${CX - PIE}, ${CY - PIE})`}
          opacity={pie > 0 ? 1 : 0}
        >
          <circle cx={PIE} cy={PIE} r={PIE} fill="rgba(241, 231, 211, 0.06)" />
          <path d={daylight.path} fill={accent} fillOpacity={0.85} />
        </g>
        <line
          x1={CX + Math.cos(mark) * (INNER + length(today) + 6)}
          y1={CY + Math.sin(mark) * (INNER + length(today) + 6)}
          x2={CX + Math.cos(mark) * tip}
          y2={CY + Math.sin(mark) * tip}
          stroke={accent}
          strokeWidth={1.5}
          opacity={focus}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: CX + Math.cos(mark) * tip - (Math.cos(mark) < 0 ? 420 : 0),
          top: CY + Math.sin(mark) * tip - 30,
          width: 420,
          textAlign: Math.cos(mark) < 0 ? "right" : "left",
          fontFamily: FONT,
          color: COLORS.cream,
          opacity: focus,
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 4 }}>{day.dateLabel}</div>
        <div
          style={{
            marginTop: 8,
            fontSize: 24,
            letterSpacing: 3,
            color: COLORS.soft,
          }}
        >
          一年里的第 {day.index + 1} 天
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 90,
          fontFamily: FONT,
          color: COLORS.cream,
          opacity: interpolate(t, [0.2, 1], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 8, color: COLORS.soft }}>
          {day.year} 年 · {day.city}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 24,
            letterSpacing: 3,
            color: COLORS.faint,
          }}
        >
          每一根是一天，越长白天越长
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 120,
          bottom: 100,
          textAlign: "right",
          fontFamily: FONT,
          opacity: pie,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 4, color: COLORS.soft }}>
          那一天
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 40,
            letterSpacing: 4,
            color: accent,
          }}
        >
          白昼 {span(today)}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 30,
            letterSpacing: 4,
            color: COLORS.soft,
          }}
        >
          黑夜 {span(1440 - today)}
        </div>
      </div>
    </div>
  );
};
