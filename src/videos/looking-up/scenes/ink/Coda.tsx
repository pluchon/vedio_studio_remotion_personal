// 跋 · 今天：回到纸上。和开头同一个构图——火堆换成了屏幕的光，楼顶上的人抬着头；天上的星一颗颗点亮，
// 最后几颗又被连起来。「而我们依旧在仰望」，然后是牌记，然后黑下去
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../../shared/Caption";
import { Grain } from "../../../../shared/Grain";
import { Camera, InkImage, Mist } from "../../components/Ink";
import { InkStars } from "../../components/InkStars";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { Xuan } from "../../components/Xuan";
import { EASE_IN_OUT, FONTS, PAPER, SEGMENTS, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.coda);

const CREDITS = [
  "配乐　Marcus Warner《If I Should Return》",
  "图像　NASA · Wikimedia Commons（公有领域）　　贴图　Solar System Scope（CC BY 4.0）",
  "铜版画与海报插图　AI 绘制",
];

export const Coda: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, t(296)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const black = interpolate(frame, [t(299.0), t(300)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Xuan />
      {/* 和开头一样，从人身上慢慢放开，露出上面的天 */}
      <Camera scale={1.3 - p * 0.28} origin="30% 100%">
        <InkImage src={asset("engravings/today.png")} />
        <InkStars
          seed="today"
          count={52}
          at={t(291.2)}
          span={t(295.4) - t(291.2)}
          area={{ left: 60, top: 20, width: 1800, height: 540 }}
          color={PAPER.ink}
          chain={{ near: [1380, 150], count: 6 }}
          linkAt={t(295.4)}
        />
      </Camera>
      <Mist tone="ink" />
      <Locator year="今天" place="某个屋顶，某个夜晚" at={t(291.0)} tone="ink" />
      <Subtitle
        zh={["夜依旧很深，路依旧很长。", "而我们依旧在仰望。"]}
        en={["The night is still deep, and the road still long.", "And still, we look up."]}
        at={t(291.6)}
        out={t(296.6)}
        tone="ink"
        stagger={3.2}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 64,
          textAlign: "center",
          fontFamily: FONTS.song,
          fontSize: 20,
          lineHeight: 1.8,
          letterSpacing: "0.08em",
          color: PAPER.inkSoft,
          ...inkIn(frame, t(297.0), 24),
        }}
      >
        {CREDITS.map((c) => (
          <div key={c}>{c}</div>
        ))}
      </div>
      <Grain opacity={0.05} vignette={0.2} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: black }} />
    </AbsoluteFill>
  );
};
