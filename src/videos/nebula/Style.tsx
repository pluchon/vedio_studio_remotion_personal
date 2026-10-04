// 样帧：同一套体积渲染的几个时刻（0 落日的云，1 云变成星云的一半，2 发光星云，3 反射星云），每帧带一行字幕的样子
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Grain } from "../../shared/Grain";
import { loadLocalFont } from "../../shared/fonts";
import { Volume } from "./Volume";
import type { VolumeProps } from "./Volume";
import { FONT } from "./theme";

loadLocalFont(FONT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));

const SHOTS: { line: string; v: VolumeProps }[] = [
  { line: "有时像一团棉花，有时像奔跑的骏马", v: { mix: 0, time: 2, cam: [0, 0.3, 0], look: [-0.6, 0.85, -3], fov: 62, sun: 0.4, exposure: 1 } },
  { line: "虽然两者成分完全不同，但外观上却极其相似", v: { mix: 0.55, time: 3, cam: [0, 0.3, 0], look: [-0.6, 0.85, -3], cam2: [0.4, 0.5, 5.4], look2: [0, 0, 0], fov: 56, sun: 0.4, exposure: 1.1 } },
  { line: "有的发出微弱的红光，有的是娇艳的红光", v: { mix: 1, time: 4, cam: [0.4, 0.5, 5.4], look: [0, 0, 0], fov: 50, exposure: 1.1, blue: 0 } },
  { line: "有的是蓝色的光", v: { mix: 1, time: 9, cam: [-3.2, 0.4, 4.3], look: [0, 0, 0], fov: 50, exposure: 1.1, blue: 1 } },
];

export const Style: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = SHOTS[Math.min(frame, SHOTS.length - 1)];
  return (
    <AbsoluteFill style={{ background: "#02030a" }}>
      <Volume {...shot.v} />
      <Grain opacity={0.05} vignette={0.35} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 86, textAlign: "center", fontFamily: FONT, fontSize: 40, letterSpacing: 6, color: "rgba(236,232,244,0.88)", textShadow: "0 0 18px rgba(0,0,0,0.7)" }}>
        {shot.line}
      </div>
    </AbsoluteFill>
  );
};
