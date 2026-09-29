// 墨 · 1687：苹果树下的人仰头；一只苹果落下。右边天上画出一颗地球、山顶一门炮：
// 石头越打越远，第五发落不下来了，绕着地球转成一圈——月亮就在同样的一条路上「落」着。最后写下那个公式
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
const t = localTime(SEGMENTS.newton);

const EARTH = { x: 1370, y: 430, r: 118 };
const TOP = { x: EARTH.x, y: EARTH.y - EARTH.r - 26 };
const MOON_R = 270;

// 第 k 发的弹道：从山顶水平打出，落在地球上 angle 处（弧度，从正上方顺时针）
const shot = (angle: number) => {
  const end = { x: EARTH.x + Math.sin(angle) * EARTH.r, y: EARTH.y - Math.cos(angle) * EARTH.r };
  const ctrl = { x: EARTH.x + Math.sin(angle * 0.55) * (EARTH.r + 90 + angle * 20), y: EARTH.y - Math.cos(angle * 0.55) * (EARTH.r + 90 + angle * 20) };
  return `M${TOP.x} ${TOP.y} Q${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
};
const SHOTS = [0.5, 0.95, 1.5, 2.2];

const Apple: React.FC = () => {
  const frame = useCurrentFrame();
  // 自由落体：y = ½gt²，落地后轻轻弹一下
  const f = frame - t(73.7);
  if (f < 0) return <AppleShape x={612} y={392} />;
  const fall = Math.min(1, (f / 16) ** 2);
  const bounce = f > 16 ? Math.max(0, Math.sin(((f - 16) / 8) * Math.PI) * 14 * Math.exp(-(f - 16) / 10)) : 0;
  return <AppleShape x={612 + Math.min(f, 16) * 1.2} y={392 + fall * 520 - bounce} />;
};

const AppleShape: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={13} fill={PAPER.base} stroke={PAPER.ink} strokeWidth={1.6} />
    <path d="M-6 -4 q6 -6 12 0" fill="none" stroke={PAPER.ink} strokeWidth={0.9} opacity={0.6} />
    <line x1={0} y1={-13} x2={2} y2={-21} stroke={PAPER.ink} strokeWidth={1.6} />
  </g>
);

const Cannon: React.FC = () => {
  const frame = useCurrentFrame();
  const earth = interpolate(frame, [t(73.9), t(74.5)], [0, 1], { ...clamp, easing: EASE_OUT });
  const orbit = interpolate(frame, [t(76.3), t(77.2)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const moonDraw = interpolate(frame, [t(77.4), t(78.4)], [0, 1], { ...clamp, easing: EASE_OUT });
  const moonA = interpolate(frame, [t(77.4), t(82.3)], [-2.2, -0.6]);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <g opacity={earth}>
        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill={PAPER.base} stroke={PAPER.ink} strokeWidth={1.8} />
        {/* 地球上几道经线，像旧书里的插图 */}
        {[-0.5, 0, 0.5].map((k) => (
          <ellipse key={k} cx={EARTH.x} cy={EARTH.y} rx={EARTH.r * Math.abs(k) || 1} ry={EARTH.r} fill="none" stroke={PAPER.ink} strokeWidth={0.7} opacity={0.4} />
        ))}
        <line x1={EARTH.x - EARTH.r} y1={EARTH.y} x2={EARTH.x + EARTH.r} y2={EARTH.y} stroke={PAPER.ink} strokeWidth={0.7} opacity={0.4} />
        {/* 山和炮 */}
        <path d={`M${TOP.x - 26} ${TOP.y + 32} L${TOP.x} ${TOP.y} L${TOP.x + 26} ${TOP.y + 32}`} fill={PAPER.base} stroke={PAPER.ink} strokeWidth={1.6} />
        <rect x={TOP.x - 4} y={TOP.y - 8} width={18} height={7} fill={PAPER.ink} />
      </g>
      {SHOTS.map((a, k) => {
        const p = interpolate(frame, [t(74.5) + k * 13, t(74.5) + k * 13 + 12], [0, 1], { ...clamp, easing: EASE_OUT });
        return p > 0 ? <path key={k} d={shot(a)} fill="none" stroke={PAPER.ink} strokeWidth={1.3} strokeDasharray="4 5" pathLength={1} strokeDashoffset={0} opacity={0.75} style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }} /> : null;
      })}
      {/* 第五发：绕成一整圈 */}
      <circle
        cx={EARTH.x}
        cy={EARTH.y}
        r={EARTH.r + 26}
        fill="none"
        stroke={PAPER.cinnabar}
        strokeWidth={2.2}
        strokeDasharray={`${orbit * (EARTH.r + 26) * Math.PI * 2} 2000`}
        transform={`rotate(-90 ${EARTH.x} ${EARTH.y})`}
      />
      {/* 月亮的轨道和月亮 */}
      <circle cx={EARTH.x} cy={EARTH.y} r={MOON_R} fill="none" stroke={PAPER.ink} strokeWidth={1.2} strokeDasharray="3 8" opacity={moonDraw * 0.7} />
      {moonDraw > 0 && (
        <g transform={`translate(${EARTH.x + Math.cos(moonA) * MOON_R} ${EARTH.y + Math.sin(moonA) * MOON_R})`} opacity={moonDraw}>
          <circle r={24} fill={PAPER.base} stroke={PAPER.ink} strokeWidth={1.8} />
          <circle cx={-6} cy={-4} r={5} fill="none" stroke={PAPER.ink} strokeWidth={0.9} opacity={0.6} />
          <circle cx={8} cy={7} r={3.5} fill="none" stroke={PAPER.ink} strokeWidth={0.9} opacity={0.6} />
        </g>
      )}
      <text x={EARTH.x + 150} y={EARTH.y - MOON_R + 30} fontFamily={FONTS.song} fontSize={26} letterSpacing="0.16em" fill={PAPER.cinnabar} style={inkIn(frame, t(78.2), 14)}>
        月亮也在「落」
      </text>
    </svg>
  );
};

export const Newton: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Xuan />
      <Camera scale={interpolate(frame, [0, t(82.34)], [1.0, 1.04])} origin="30% 60%">
        <InkImage src={asset("engravings/newton.png")} focus="50% 40%" />
      </Camera>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Apple />
      </svg>
      <Cannon />
      <div
        style={{
          position: "absolute",
          left: EARTH.x - 190,
          top: 736,
          fontFamily: FONTS.latin,
          fontStyle: "italic",
          fontSize: 50,
          letterSpacing: "0.06em",
          color: PAPER.ink,
          whiteSpace: "nowrap",
          ...inkIn(frame, t(79.2), 24),
        }}
      >
        F = G · Mm / r<sup style={{ fontSize: 28 }}>2</sup>
      </div>
      <Mist tone="ink" />
      <Locator year="1687" place="伦敦" at={t(73.5)} tone="ink" />
      <Subtitle
        zh={["地上坠落的石块，与天上环行的月亮，服从同一条法则。"]}
        en={["The stone that falls to the ground and the moon that circles the sky obey the same law."]}
        at={t(74.0)}
        out={t(77.8)}
        tone="ink"
      />
      <Subtitle zh={["宇宙不再是需要供奉的谜，而是可以被理解的问题。"]} en={["The universe was no longer a mystery to worship, but a question to be understood."]} at={t(78.1)} out={t(82.2)} tone="ink" />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
