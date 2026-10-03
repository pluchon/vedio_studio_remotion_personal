// 地球在轨道上：从元旦飞到那一天，停一下；再从那一天一圈圈转到今天。地球那一层套运动模糊，转得快时拖出光带
import React from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Day } from "./day";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const RAD = Math.PI / 180;

const CX = 960;
const CY = 560;
const RX = 600;
// 斜着看轨道，竖向压扁
const RY = 240;

// 日心黄经换到画面上：春分点方向朝右，逆时针走（从北边往下看）
const place = (longitude: number) => ({
  x: CX + Math.cos(longitude * RAD) * RX,
  y: CY + Math.sin(longitude * RAD) * RY,
});

// 三段：飞到那一天、停下来看读数、一圈圈转到今天
const ARRIVE = [0.6, 2.8];
const LAPS = [4.8, 7.6];

const longitudeAt = (day: Day, t: number) => {
  // 地球公转的方向在画面上是逆时针，黄经增大
  const start = day.newYear.longitude;
  let to = day.earth.longitude;
  if (to < start) to += 360;
  const first = interpolate(t, ARRIVE, [start, to], {
    ...clamp,
    easing: Easing.bezier(0.6, 0, 0.3, 1),
  });
  const laps = interpolate(t, LAPS, [0, day.orbits * 360], {
    ...clamp,
    easing: Easing.bezier(0.55, 0, 0.35, 1),
  });
  return first + laps;
};

const Earth: React.FC<{ day: Day }> = ({ day }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y } = place(longitudeAt(day, frame / fps));
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080}>
        <circle cx={x} cy={y} r={26} fill="rgba(120, 170, 255, 0.18)" />
        <circle cx={x} cy={y} r={12} fill="#7fb2ff" />
      </svg>
    </AbsoluteFill>
  );
};

const dateText = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
};

export const Orbit: React.FC<{ day: Day; accent: string; asOf: string }> = ({
  day,
  accent,
  asOf,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(
    frame,
    [0, 0.6 * fps, durationInFrames - 0.8 * fps, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const start = place(day.newYear.longitude);
  const end = place(day.earth.longitude);
  const reading =
    interpolate(t, [2.9, 3.5], [0, 1], clamp) *
    interpolate(t, [4.6, 5.0], [1, 0], clamp);
  const lapCount = interpolate(t, LAPS, [0, day.orbits], {
    ...clamp,
    easing: Easing.bezier(0.55, 0, 0.35, 1),
  });
  const counting = interpolate(t, [LAPS[0] - 0.3, LAPS[0]], [0, 1], clamp);
  // 转得太快时运动模糊只剩几个淡点，另画一圈随速度亮起来的光轨，像长曝光
  const speed =
    Math.abs(longitudeAt(day, t + 1 / 60) - longitudeAt(day, t - 1 / 60)) * 30;
  const streak = interpolate(speed, [400, 2400], [0, 0.75], clamp);
  // 走过的那段轨道（元旦到那一天）
  let sweep = day.earth.longitude - day.newYear.longitude;
  if (sweep < 0) sweep += 360;
  const drawn = interpolate(t, ARRIVE, [0, sweep], {
    ...clamp,
    easing: Easing.bezier(0.6, 0, 0.3, 1),
  });
  const arc = Array.from({ length: 121 }, (_, i) => {
    const p = place(day.newYear.longitude + (drawn * i) / 120);
    return `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");

  return (
    <AbsoluteFill style={{ background: COLORS.ink, opacity: fade }}>
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          fill="none"
          stroke={COLORS.faint}
          strokeWidth={1.2}
          strokeDasharray="2 7"
        />
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          fill="none"
          stroke="#7fb2ff"
          strokeWidth={10}
          strokeOpacity={streak * 0.25}
        />
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          fill="none"
          stroke="#cfe0ff"
          strokeWidth={2.4}
          strokeOpacity={streak}
        />
        <path
          d={arc}
          fill="none"
          stroke={accent}
          strokeWidth={2.2}
          strokeOpacity={0.8}
        />
        <circle cx={CX} cy={CY} r={110} fill="rgba(255, 196, 120, 0.12)" />
        <circle cx={CX} cy={CY} r={58} fill="rgba(255, 206, 140, 0.35)" />
        <circle cx={CX} cy={CY} r={34} fill={COLORS.sun} />
        <circle cx={start.x} cy={start.y} r={4} fill={COLORS.soft} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: start.x - 80,
          top: start.y + 18,
          width: 160,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 22,
          letterSpacing: 3,
          color: COLORS.soft,
          opacity: interpolate(t, [0.2, 0.8], [0, 1], clamp) * (1 - counting),
        }}
      >
        1 月 1 日
      </div>

      <CameraMotionBlur shutterAngle={300} samples={24}>
        <Earth day={day} />
      </CameraMotionBlur>

      <div
        style={{
          position: "absolute",
          left: end.x - 160,
          top: end.y - 74,
          width: 320,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 26,
          letterSpacing: 3,
          color: COLORS.cream,
          opacity: reading,
        }}
      >
        {dateText(day.date)}
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 90,
          fontFamily: FONT,
          opacity: reading,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 6, color: COLORS.soft }}>
          那一天，地球离太阳
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 52,
            letterSpacing: 4,
            color: COLORS.cream,
          }}
        >
          {(day.distanceKm / 1e8).toFixed(3)} 亿公里
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 24,
            letterSpacing: 3,
            color: COLORS.faint,
          }}
        >
          正以每秒约 30 公里的速度往前走
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 90,
          fontFamily: FONT,
          opacity: counting,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 6, color: COLORS.soft }}>
          从那天到 {dateText(asOf)}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 52,
            letterSpacing: 4,
            color: accent,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          绕太阳 {lapCount.toFixed(lapCount >= day.orbits - 0.005 ? 2 : 1)} 圈
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 24,
            letterSpacing: 3,
            color: COLORS.faint,
            opacity: interpolate(t, [LAPS[1], LAPS[1] + 0.5], [0, 1], clamp),
          }}
        >
          一共 {day.days.toLocaleString("en-US")} 天
        </div>
      </div>
    </AbsoluteFill>
  );
};
