// 墨 · 约三千年前：舟在浪里起伏，船头的人指着天；一条虚线从他指尖一路画到那颗星，星亮起来，
// 再沿一道弧线标出它从海面升起的路——他们靠星星升落的方位认路
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Camera, InkImage, Mist } from "../../components/Ink";
import { starPath } from "../../components/InkStars";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_OUT, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.canoe);

// 指尖（图铺满后的位置）和要找的那颗星
const FINGER = { x: 1012, y: 578 };
const STAR = { x: 1530, y: 230 };
// 星从海面升起的弧：起点在右边海平线
const RISE = { x: 1860, y: 700 };

export const Canoe: React.FC = () => {
  const frame = useCurrentFrame();
  // 舟随浪起伏
  const rock = Math.sin(frame / 22) * 0.5;
  const bob = Math.sin(frame / 17) * 5;
  const line = interpolate(frame, [t(42.0), t(43.4)], [0, 1], { ...clamp, easing: EASE_OUT });
  const star = interpolate(frame, [t(43.2), t(43.8)], [0, 1], { ...clamp, easing: EASE_OUT });
  const arc = interpolate(frame, [t(43.8), t(45.4)], [0, 1], { ...clamp, easing: EASE_OUT });
  // 升起的弧长约 700，按比例露出
  const arcLen = 720;

  return (
    <AbsoluteFill>
      <Xuan />
      <Camera scale={1.04} y={bob} origin="50% 80%">
        <div style={{ position: "absolute", inset: 0, rotate: `${rock}deg`, transformOrigin: "50% 90%" }}>
          <InkImage src={asset("engravings/canoe.png")} />
        </div>
      </Camera>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line
          x1={FINGER.x}
          y1={FINGER.y + bob}
          x2={FINGER.x + (STAR.x - FINGER.x) * line}
          y2={FINGER.y + bob + (STAR.y - FINGER.y - bob) * line}
          stroke={PAPER.ink}
          strokeWidth={1.4}
          strokeDasharray="3 7"
          opacity={0.7}
        />
        <path
          d={`M${RISE.x} ${RISE.y} Q ${RISE.x - 60} ${STAR.y - 40} ${STAR.x} ${STAR.y}`}
          fill="none"
          stroke={PAPER.cinnabar}
          strokeWidth={1.8}
          strokeDasharray={`${arcLen * arc} ${arcLen}`}
          opacity={0.85}
        />
        {star > 0 && (
          <g transform={`translate(${STAR.x} ${STAR.y})`}>
            <circle r={34 * star} fill="none" stroke={PAPER.cinnabar} strokeWidth={1.8} opacity={star} />
            <path d={starPath(20 * star)} fill={PAPER.ink} />
          </g>
        )}
      </svg>
      <Mist tone="ink" height={220} />
      <Locator year="约三千年前" place="南太平洋" at={t(41.7)} tone="ink" />
      <Subtitle zh={["海上的舟，循着一颗星驶向看不见的岸。"]} en={["A canoe followed a single star toward a shore it could not see."]} at={t(41.9)} out={t(45.8)} tone="ink" />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
