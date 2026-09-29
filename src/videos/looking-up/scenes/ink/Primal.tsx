// 墨 · 约三十万年前：火熄了，只剩几缕烟；那个人抬起头，镜头顺着他的视线往上，天上的星一颗颗点亮，
// 最后几颗被虚线连起来——第一次有人把星星连成了图
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Camera, InkImage, Mist } from "../../components/Ink";
import { InkStars } from "../../components/InkStars";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_IN_OUT, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.primal);

// 熄火后的余烟：几缕墨线慢慢往上飘、散开
const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {[0, 1, 2].map((k) => {
        const rise = ((frame * 0.9 + k * 70) % 210) / 210;
        const x0 = 925 + k * 10;
        const y0 = 890 - rise * 150;
        const w = 10 + rise * 26;
        const d = `M${x0} ${y0} c ${w} -30 ${-w} -60 0 -90 s ${-w} -60 ${w * 0.6} -100`;
        return <path key={k} d={d} fill="none" stroke={PAPER.ink} strokeWidth={1.6} opacity={(1 - rise) * 0.4} strokeLinecap="round" />;
      })}
    </svg>
  );
};

export const Primal: React.FC = () => {
  const frame = useCurrentFrame();
  // 镜头：先贴近地上的人和火，随着星星点亮慢慢升起、放开
  const p = interpolate(frame, [0, t(25)], [0, 1], { ...clamp, easing: EASE_IN_OUT });

  return (
    <AbsoluteFill>
      <Xuan />
      {/* 以画面底边为轴放大，下缘始终贴住画框，不会露出图外的纸 */}
      <Camera scale={1.4 - p * 0.38} origin="32% 100%">
        <InkImage src={asset("engravings/primal.png")} />
        <Smoke />
        <InkStars
          seed="primal"
          count={52}
          at={t(18.66)}
          span={t(25.4) - t(18.66)}
          area={{ left: 60, top: 20, width: 1800, height: 540 }}
          color={PAPER.ink}
          chain={{ near: [1380, 150], count: 6 }}
          linkAt={t(25.4)}
        />
      </Camera>
      <Mist tone="ink" />
      <Locator year="约三十万年前" place="某个没有名字的夜晚" at={t(15.9)} tone="ink" />
      <Subtitle
        zh={["火光退去之后，有一双眼睛抬了起来，", "看见了那些不会熄灭的光。"]}
        en={["When the fire died down, a pair of eyes looked up", "and saw the lights that never went out."]}
        at={t(18.9)}
        out={t(23.0)}
        tone="ink"
      />
      <Subtitle zh={["从那以后，我们再没有真正低下过头。"]} en={["From then on, we never truly lowered our gaze again."]} at={t(23.3)} out={t(27.4)} tone="ink" />
      <Grain opacity={0.05} vignette={0.2} />
    </AbsoluteFill>
  );
};
