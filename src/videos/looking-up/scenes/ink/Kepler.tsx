// 墨 · 1576 → 1609：左边是第谷的墙象限仪；右边纸上，火星的观测点一夜夜积起来（二十多年）。
// 1609 年开普勒先试了一个圆——差了 8 角分；换成椭圆，太阳落在焦点上，所有的点都对上了
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_OUT, FONTS, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.kepler);

// 椭圆轨道（离心率放大了，好让圆和椭圆的差别看得出来）；太阳在右焦点
const O = { x: 1260, y: 400, a: 300, e: 0.36 };
const B = O.a * Math.sqrt(1 - O.e * O.e);
const C = O.a * O.e;
const SUN = { x: O.x + C, y: O.y };
const onEllipse = (th: number) => ({ x: O.x + O.a * Math.cos(th), y: O.y + B * Math.sin(th) });
const DOTS = Array.from({ length: 90 }, (_, i) => {
  const th = random(`mars-${i}`) * Math.PI * 2;
  const p = onEllipse(th);
  return { x: p.x + (random(`mx-${i}`) - 0.5) * 6, y: p.y + (random(`my-${i}`) - 0.5) * 6 };
});
const ellipsePath = `M${O.x + O.a} ${O.y} A${O.a} ${B} 0 1 1 ${O.x - O.a} ${O.y} A${O.a} ${B} 0 1 1 ${O.x + O.a} ${O.y}`;
const PERIMETER = Math.PI * (3 * (O.a + B) - Math.sqrt((3 * O.a + B) * (O.a + 3 * B)));

export const Kepler: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = Math.floor(interpolate(frame, [t(64.6), t(68.7)], [0, DOTS.length], clamp));
  const year = Math.round(interpolate(frame, [t(64.6), t(68.7)], [1576, 1597], clamp));
  const circle = interpolate(frame, [t(69.2), t(70.0)], [0, 1], { ...clamp, easing: EASE_OUT });
  const circleFade = interpolate(frame, [t(71.2), t(71.8)], [1, 0.25], clamp);
  const ellipse = interpolate(frame, [t(70.6), t(72.0)], [0, 1], { ...clamp, easing: EASE_OUT });
  // 试的那个圆以太阳为圆心
  const R = O.a;

  return (
    <AbsoluteFill>
      <Xuan />
      {/* 第谷的墙象限仪：像一张图版贴在左边 */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 110,
          width: 540,
          height: 793,
          rotate: "-1.2deg",
          mixBlendMode: "multiply",
          ...inkIn(frame, 0, 20),
        }}
      >
        <Img src={staticFile(asset("plates/tycho_quadrant.jpg"))} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) sepia(0.35) contrast(1.08)" }} />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* 太阳 */}
        <circle cx={SUN.x} cy={SUN.y} r={16} fill="none" stroke={PAPER.ink} strokeWidth={2} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={SUN.x + Math.cos(a) * 22} y1={SUN.y + Math.sin(a) * 22} x2={SUN.x + Math.cos(a) * 32} y2={SUN.y + Math.sin(a) * 32} stroke={PAPER.ink} strokeWidth={1.4} />;
        })}
        {DOTS.slice(0, shown).map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3.2} fill={PAPER.ink} opacity={0.8} />
        ))}
        {/* 先试的圆 */}
        <circle
          cx={SUN.x}
          cy={SUN.y}
          r={R}
          fill="none"
          stroke={PAPER.ink}
          strokeWidth={1.6}
          strokeDasharray={`${circle * R * Math.PI * 2} ${R * Math.PI * 2}`}
          opacity={circleFade * 0.7}
        />
        {/* 椭圆 */}
        <path d={ellipsePath} fill="none" stroke={PAPER.cinnabar} strokeWidth={2.4} strokeDasharray={`${ellipse * PERIMETER} ${PERIMETER}`} />
        {/* 另一个焦点 */}
        <circle cx={O.x - C} cy={O.y} r={4} fill="none" stroke={PAPER.cinnabar} strokeWidth={1.4} opacity={ellipse} />
      </svg>
      {/* 观测年份 */}
      <div style={{ position: "absolute", left: 930, top: 80, fontFamily: FONTS.song, fontSize: 24, letterSpacing: "0.16em", color: PAPER.inkSoft, ...inkIn(frame, t(64.6), 12) }}>
        第谷的火星记录 · <span style={{ fontFamily: FONTS.songBlack, color: PAPER.ink, fontSize: 30 }}>{year}</span>
      </div>
      <div style={{ position: "absolute", left: SUN.x - 370, top: O.y + B + 34, opacity: circleFade }}>
        <div style={{ fontFamily: FONTS.songBlack, fontSize: 34, color: PAPER.ink, whiteSpace: "nowrap", ...inkIn(frame, t(69.6), 12) }}>圆？差了 8 角分</div>
      </div>
      <div style={{ position: "absolute", left: O.x + 110, top: O.y + B + 34, fontFamily: FONTS.songBlack, fontSize: 38, color: PAPER.cinnabar, whiteSpace: "nowrap", ...inkIn(frame, t(71.6), 14) }}>
        = 椭圆，太阳在焦点上
      </div>
      <Mist tone="ink" />
      <Locator year="1576" place="汶岛 · 丹麦" at={t(64.4)} out={t(68.9)} tone="ink" />
      <Locator year="1609" place="布拉格" at={t(69.1)} tone="ink" />
      <Subtitle
        zh={["后来，有人一夜一夜地记录，有人用数学追赶它们，", "才发现天上写的不是命运，是定律。"]}
        en={["Then someone recorded them night after night, and someone chased them with mathematics,", "and found the sky was written not with fate, but with law."]}
        at={t(64.9)}
        out={t(73.0)}
        tone="ink"
      />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
