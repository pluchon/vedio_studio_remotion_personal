// 海报 · 1977：旅行者号带走的金唱片。左边唱片在转；右边照唱片封面上的脉冲星地图一笔笔画出十四道线，
// 再一行行跳出唱片里装了什么
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Rows } from "../../components/Rows";
import { Subtitle } from "../../components/Subtitle";
import { EASE_OUT, RETRO, SEGMENTS, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.record);

const DISC = { x: 560, y: 470, r: 290 };
const MAP = { x: 1290, y: 300 };
// 脉冲星地图：从太阳出发的十四道线，长短、方向各不相同，线上带着表示周期的刻度
const PULSARS = Array.from({ length: 14 }, (_, i) => ({
  a: (i / 14) * Math.PI * 2 + random(`pa-${i}`) * 0.3,
  len: 90 + random(`pl-${i}`) * 170,
}));

export const Record: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = frame * 1.4;
  const draw = interpolate(frame, [t(127.8), t(129.6)], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill style={{ backgroundColor: RETRO.cream }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={0} width={180} height={1080} fill={RETRO.teal} opacity={0.55} />
        <rect x={1720} y={620} width={200} height={460} fill={RETRO.coral} opacity={0.6} />
        {/* 唱片：金色盘面、藏青的纹路、中间的标签 */}
        <g transform={`translate(${DISC.x} ${DISC.y}) rotate(${spin})`}>
          <circle r={DISC.r + 14} fill={RETRO.navy} />
          <circle r={DISC.r} fill={RETRO.mustard} />
          {Array.from({ length: 16 }, (_, k) => (
            <circle key={k} r={DISC.r - 16 - k * 13} fill="none" stroke={RETRO.brown} strokeWidth={1} opacity={0.35} />
          ))}
          <circle r={70} fill={RETRO.coral} />
          <circle r={8} fill={RETRO.navy} />
          <rect x={-3} y={-66} width={6} height={30} fill={RETRO.creamLight} opacity={0.8} />
        </g>
        {/* 脉冲星地图 */}
        <g transform={`translate(${MAP.x} ${MAP.y})`}>
          <line x1={0} y1={0} x2={380 * draw} y2={0} stroke={RETRO.navy} strokeWidth={2} />
          {PULSARS.map((p, i) => {
            const k = interpolate(draw, [i / 16, i / 16 + 0.3], [0, 1], clamp);
            const ex = Math.cos(p.a) * p.len * k;
            const ey = Math.sin(p.a) * p.len * k;
            return (
              <g key={i}>
                <line x1={0} y1={0} x2={ex} y2={ey} stroke={RETRO.navy} strokeWidth={1.6} />
                {k >= 1 &&
                  Array.from({ length: 6 }, (_, j) => {
                    const f = 0.35 + j * 0.1;
                    const nx = -Math.sin(p.a) * (j % 2 ? 7 : 4);
                    const ny = Math.cos(p.a) * (j % 2 ? 7 : 4);
                    return <line key={j} x1={ex * f - nx} y1={ey * f - ny} x2={ex * f + nx} y2={ey * f + ny} stroke={RETRO.navy} strokeWidth={1.2} />;
                  })}
              </g>
            );
          })}
          <circle r={7} fill={RETRO.red} />
        </g>
      </svg>
      <Rows
        rows={[
          { label: "图像", value: "115 幅", at: t(129.2) },
          { label: "问候", value: "55 种语言", at: t(129.9), color: RETRO.teal },
          { label: "音乐", value: "27 段", at: t(130.6), color: RETRO.coral },
        ]}
        left={1100}
        top={590}
        labelWidth={110}
        step={70}
        size={44}
        color={RETRO.ink}
        soft={RETRO.inkSoft}
      />
      <Mist tone="retro" height={220} />
      <Locator year="1977" place="卡纳维拉尔角 · 金唱片" at={t(127.7)} />
      <Subtitle zh={["旅行者号带着一张刻着地球声音的唱片，"]} en={["Voyager carried a record engraved with the sounds of Earth"]} at={t(128.0)} out={t(132.0)} tone="retro" />
      <Grain opacity={0.08} vignette={0.16} />
    </AbsoluteFill>
  );
};
