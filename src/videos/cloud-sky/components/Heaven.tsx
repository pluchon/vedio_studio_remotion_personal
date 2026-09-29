// 抬头看的那片天：「天空」和「黄昏」两段共用，按全片的秒数变化，所以跨段时能无缝接上。
// 雨停之后一朵大积云从下面升进画面；黄昏时天慢慢暗下去，把光借给云——云底被点成橘粉，天自己退成深蓝
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors } from "remotion";
import { DAY, DUSK, EASE_IN_OUT, EASE_OUT, HIGH, sec } from "../theme";
import { Cloud, cumulus, shift } from "./Cloud";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 大积云：中间一座高的，两边各靠一座矮的
const TOWER = [
  ...shift(cumulus("tower-l", 50, 440, 250, 0.55), -300, 0),
  ...shift(cumulus("tower-r", 50, 460, 290, 0.55), 310, 0),
  ...cumulus("tower", 110, 660, 460, 0.5),
];

// 高处的几缕卷云
const CIRRUS = [
  { x: 180, y: 170, w: 520, a: 0.5 },
  { x: 1180, y: 120, w: 620, a: 0.4 },
  { x: 760, y: 300, w: 380, a: 0.3 },
];

export const Heaven: React.FC<{ abs: number }> = ({ abs }) => {
  // 黄昏的进度：57 秒起，天一点点暗下去、云一点点亮起来
  const dusk = interpolate(abs, [sec(57.0), sec(66.0)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const sky = {
    top: interpolateColors(dusk, [0, 1], [HIGH.top, DUSK.top]),
    mid: interpolateColors(dusk, [0, 1], [HIGH.mid, DUSK.mid]),
    low: interpolateColors(dusk, [0, 1], [HIGH.low, DUSK.low]),
  };
  const rise = interpolate(abs, [sec(55.2), sec(57.6)], [0, 1], { ...clamp, easing: EASE_OUT });
  const lit = interpolate(abs, [sec(57.4), sec(60.5), sec(64.4)], [0, 0.55, 1], clamp);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${sky.top} 0%, ${sky.mid} 58%, ${sky.low} 100%)` }}>
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0, opacity: interpolate(abs, [sec(44.1), sec(45.8)], [0, 1], clamp) * (1 - dusk * 0.6) }}
      >
        <filter id="cs-cirrus">
          <feGaussianBlur stdDeviation={11} />
        </filter>
        {CIRRUS.map((c, i) => {
          const x = c.x + abs * 0.12 * (i + 1);
          return (
            <g key={i} filter="url(#cs-cirrus)" opacity={c.a}>
              {[0, 1, 2].map((k) => (
                <path
                  key={k}
                  d={`M${x} ${c.y + k * 16} q ${c.w * 0.4} ${-22 + k * 6} ${c.w} ${-6 + k * 10}`}
                  stroke="#ffffff"
                  strokeWidth={10 - k * 2}
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </g>
          );
        })}
      </svg>
      {/* 太阳落在右下，地平线一带发亮 */}
      <AbsoluteFill
        style={{
          opacity: dusk,
          background: `radial-gradient(ellipse 55% 45% at 82% 100%, rgba(255, 196, 140, 0.75) 0%, rgba(255, 170, 120, 0.25) 45%, rgba(255, 170, 120, 0) 100%)`,
        }}
      />
      {/* 天自己退暗，只压在云后面 */}
      <AbsoluteFill style={{ backgroundColor: "#141a33", opacity: interpolate(dusk, [0.5, 1], [0, 0.18], clamp) }} />
      {rise > 0 && (
        <Cloud
          id="tower"
          puffs={TOWER}
          x={960 + (abs - sec(57)) * 0.08}
          y={1420 - rise * 520}
          base={30}
          light={interpolateColors(lit, [0, 0.5, 1], [DAY.cloud, "#ffe6c4", DUSK.gold])}
          mid={interpolateColors(lit, [0, 0.5, 1], [DAY.cloudMid, "#f6d2bd", DUSK.orange])}
          shade={interpolateColors(lit, [0, 0.5, 1], [DAY.cloudShade, "#d99a9a", DUSK.pink])}
          tint={{ top: "#9d93bd", topOpacity: lit * 0.45, bottomOpacity: 0.45 + lit * 0.35 }}
          glow={DUSK.orange}
          glowOpacity={lit * 0.55}
          fluff={16}
          soft={2.4}
        />
      )}
    </AbsoluteFill>
  );
};
