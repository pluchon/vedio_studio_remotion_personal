// 墨 · 约三千年前：塔顶的祭司举手指天；一颗亮星在群星间游走，走着走着忽然往回退、绕出一个圈——
// 那时人们把这当成神的旨意。这条圈下一幕会被开普勒解开
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera, InkImage, Mist } from "../../components/Ink";
import { InkStars, starPath } from "../../components/InkStars";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { FONTS, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.omens);

// 行星在天上的视路径：往前走的同时叠一个圆周，圆周转得够快时就会倒退一段、绕出一个圈
// （横向速度 820 + 1634·cos2πs，在 s 为 1/3~2/3 之间变负，往回走出一个圈）
const planet = (s: number) => ({
  x: 900 + 820 * s + 260 * Math.sin(Math.PI * 2 * s),
  y: 270 - 60 * s + 80 * Math.cos(Math.PI * 2 * s),
});

export const Omens: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [t(55.6), t(62.8)], [0, 1], clamp);
  const trail = Array.from({ length: 120 }, (_, i) => planet((i / 119) * s));
  const head = planet(s);
  const loop = planet(0.5);

  return (
    <AbsoluteFill>
      <Xuan />
      <Camera scale={interpolate(frame, [0, t(64.23)], [1.02, 1.06])} origin="35% 70%">
        <InkImage src={asset("engravings/ziggurat.png")} focus="50% 100%" />
        <InkStars seed="omens" count={40} at={t(55.3)} span={t(57) - t(55.3)} area={{ left: 700, top: 30, width: 1180, height: 420 }} color={PAPER.ink} />
      </Camera>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <polyline points={trail.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={PAPER.cinnabar} strokeWidth={1.8} strokeDasharray="2 7" opacity={0.85} />
        {s > 0 && (
          <g transform={`translate(${head.x} ${head.y})`}>
            <circle r={20} fill="none" stroke={PAPER.ink} strokeWidth={0.8} opacity={0.4} />
            <path d={starPath(15)} fill={PAPER.ink} />
          </g>
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          left: loop.x - 90,
          top: loop.y + 70,
          fontFamily: FONTS.song,
          fontSize: 26,
          letterSpacing: "0.18em",
          color: PAPER.cinnabar,
          whiteSpace: "nowrap",
          ...inkIn(frame, t(60.2), 16),
        }}
      >
        它为什么往回走？
      </div>
      <Mist tone="ink" />
      <Locator year="约三千年前" place="美索不达米亚" at={t(55.4)} tone="ink" />
      <Subtitle
        zh={["起初，我们以为星辰是神的意志，", "把命运一并托付给了它们。"]}
        en={["At first we took the stars for the will of the gods,", "and entrusted them with our fate."]}
        at={t(57.4)}
        out={t(63.9)}
        tone="ink"
      />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
