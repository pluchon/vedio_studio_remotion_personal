// 海报 · 1957：屋顶上的一家人指着天；一颗小亮点从天上划过，一圈圈「嘀——嘀——」的电波从它身上荡开
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera, Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { PosterImage } from "../../components/Poster";
import { Subtitle } from "../../components/Subtitle";
import { FONTS, RETRO, SEGMENTS, asset, localTime } from "../../theme";

const t = localTime(SEGMENTS.sputnik);

// 卫星在天上的路：从左边低处划到右边高处
const path = (s: number) => ({ x: 260 + 1400 * s, y: 330 - 190 * s + 60 * Math.sin(s * Math.PI) * -1 });

export const Sputnik: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, t(118.6)], [0.05, 0.95]);
  const p = path(s);
  const beepEvery = 18;

  return (
    <AbsoluteFill>
      <Camera scale={interpolate(frame, [0, t(118.6)], [1.02, 1.07])} origin="50% 80%">
        <PosterImage src={asset("posters/rooftop.jpg")} focus="50% 100%" />
      </Camera>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* 划过的轨迹 */}
        <polyline
          points={Array.from({ length: 40 }, (_, i) => path(s * (i / 39)))
            .map((q) => `${q.x},${q.y}`)
            .join(" ")}
          fill="none"
          stroke={RETRO.creamLight}
          strokeWidth={1.4}
          strokeDasharray="2 8"
          opacity={0.6}
        />
        {/* 电波：每隔一会儿荡开一圈 */}
        {[0, 1, 2].map((k) => {
          const age = ((frame + k * beepEvery) % (beepEvery * 3)) / (beepEvery * 3);
          return <circle key={k} cx={p.x} cy={p.y} r={10 + age * 90} fill="none" stroke={RETRO.creamLight} strokeWidth={1.6} opacity={(1 - age) * 0.7} />;
        })}
        <circle cx={p.x} cy={p.y} r={5} fill="#fffbea" />
        <circle cx={p.x} cy={p.y} r={14} fill="#fffbea" opacity={0.25} />
      </svg>
      <div style={{ position: "absolute", left: p.x + 24, top: p.y - 44, fontFamily: FONTS.song, fontSize: 24, letterSpacing: "0.14em", color: RETRO.creamLight, whiteSpace: "nowrap", ...inkIn(frame, t(114.6), 12) }}>
        斯普特尼克 1 号 · 嘀——嘀——
      </div>
      <Mist tone="space" strength={0.5} height={280} />
      <Locator year="1957" place="近地轨道" at={t(114.2)} tone="space" />
      <Subtitle zh={["尺度大到无法想象，我们却没有退缩。"]} en={["The scale was beyond imagining, yet we did not shrink back."]} at={t(114.6)} out={t(118.4)} tone="space" />
      <Grain opacity={0.06} vignette={0.2} />
    </AbsoluteFill>
  );
};
