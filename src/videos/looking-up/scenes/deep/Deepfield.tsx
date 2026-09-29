// 深空 · 2022：镜子接住的光。四面八方的细光线往中间一收，显出韦布的第一张深空场；镜头慢慢推进那一片星系里
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Camera, Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Rows } from "../../components/Rows";
import { EASE_OUT, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.deepfield);

export const Deepfield: React.FC = () => {
  const frame = useCurrentFrame();
  const gather = interpolate(frame, [0, t(205.5)], [0, 1], { ...clamp, easing: (x) => x * x });
  const photo = interpolate(frame, [t(205.2), t(206.2)], [0, 1], { ...clamp, easing: EASE_OUT });
  const push = interpolate(frame, [t(205.2), t(213.7)], [1.05, 1.25], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      <Camera scale={push} origin="54% 46%">
        <AbsoluteFill style={{ opacity: photo }}>
          <Img src={staticFile(asset("plates/webb_deep_field.jpg"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Camera>
      {/* 光往镜子里收 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - photo }}>
        {Array.from({ length: 90 }, (_, i) => {
          const a = random(`ray-${i}`) * Math.PI * 2;
          const far = 1300;
          const start = far * (1 - gather);
          const len = 120 + random(`rl-${i}`) * 260;
          return (
            <line
              key={i}
              x1={960 + Math.cos(a) * start}
              y1={540 + Math.sin(a) * start}
              x2={960 + Math.cos(a) * (start + len)}
              y2={540 + Math.sin(a) * (start + len)}
              stroke={i % 3 === 0 ? "#ffd8a0" : "#dfe8ff"}
              strokeWidth={1.2}
              opacity={0.7}
            />
          );
        })}
      </svg>
      <Mist tone="space" strength={0.6} height={280} />
      <Rows rows={[{ label: "有的光，已经走了", value: "一百三十多亿年", at: t(207.0), color: SPACE.cream }]} left={660} top={900} labelWidth={260} size={42} color={SPACE.cream} soft={SPACE.creamSoft} />
      <Locator year="2022" place="SMACS 0723 · 韦布的第一张深空场" at={t(205.0)} tone="space" />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
