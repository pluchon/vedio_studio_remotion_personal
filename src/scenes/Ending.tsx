// 片尾：回到书桌画卷，署名、技术栈与仓库地址，最后淡出
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE_OUT, FONTS } from "../theme";
import { enter } from "../components/motion";

export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Img
        src={staticFile("art/desk.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames], [1.0, 1.06]),
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 36% 34% at 50% 48%, rgba(247, 241, 229, 0.92), rgba(247, 241, 229, 0) 72%)",
        }}
      />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(frame, [durationInFrames - 45, durationInFrames - 5], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 140,
            fontWeight: 600,
            color: COLORS.ink,
            letterSpacing: "0.3em",
            paddingLeft: "0.3em",
            ...enter(frame, 10, 36, 20),
          }}
        >
          墨衡
          <span style={{ fontFamily: FONTS.latin, fontWeight: 400, letterSpacing: "0.04em" }}>OJ</span>
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: FONTS.serif,
            fontSize: 42,
            color: COLORS.text,
            letterSpacing: "0.4em",
            paddingLeft: "0.4em",
            ...enter(frame, 30),
          }}
        >
          以算法丈量世界 · 用代码寻找答案
        </div>
        <div
          style={{
            marginTop: 36,
            height: 2,
            backgroundColor: COLORS.cinnabar,
            width: interpolate(frame, [50, 80], [0, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT }),
          }}
        />
        <div
          style={{
            marginTop: 36,
            fontFamily: FONTS.serif,
            fontSize: 30,
            color: COLORS.text,
            letterSpacing: "0.12em",
            ...enter(frame, 70),
          }}
        >
          Vue 3 · Spring Cloud Alibaba · RabbitMQ · Docker 沙箱 · 通义大模型
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: FONTS.latin,
            fontStyle: "italic",
            fontSize: 28,
            color: COLORS.muted,
            letterSpacing: "0.04em",
            ...enter(frame, 88),
          }}
        >
          github.com/pluchon/online_oj · github.com/pluchon/online_oj_vue
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
