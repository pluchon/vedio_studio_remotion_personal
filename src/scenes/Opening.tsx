// 片头：书桌画卷上，「墨衡」以墨色显出，随后是两句题记与拉丁箴言
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE_OUT, FONTS } from "../theme";
import { enter } from "../components/motion";

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const titleSpacing = interpolate(frame, [30, 100], [0.7, 0.34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

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
          scale: interpolate(frame, [0, durationInFrames], [1.1, 1.0]),
          filter: `blur(${interpolate(frame, [0, 45], [6, 0], { extrapolateRight: "clamp" })}px)`,
          opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 34% 30% at 50% 47%, rgba(247, 241, 229, 0.9), rgba(247, 241, 229, 0) 72%)",
          opacity: interpolate(frame, [20, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 176,
            fontWeight: 600,
            color: COLORS.ink,
            letterSpacing: `${titleSpacing}em`,
            paddingLeft: `${titleSpacing}em`,
            opacity: interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            filter: `blur(${interpolate(frame, [30, 95], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          }}
        >
          墨衡
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: FONTS.serif,
            fontSize: 44,
            color: COLORS.text,
            letterSpacing: "0.42em",
            paddingLeft: "0.42em",
            ...enter(frame, 95, 30, 16),
          }}
        >
          以算法丈量世界 · 用代码寻找答案
        </div>
        <div
          style={{
            marginTop: 34,
            height: 2,
            backgroundColor: COLORS.cinnabar,
            width: interpolate(frame, [125, 155], [0, 140], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE_OUT,
            }),
          }}
        />
        <div
          style={{
            marginTop: 30,
            fontFamily: FONTS.latin,
            fontStyle: "italic",
            fontSize: 38,
            color: COLORS.muted,
            letterSpacing: "0.06em",
            ...enter(frame, 145, 30, 12),
          }}
        >
          Ad Algorithmum Per Aspera
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 96,
          textAlign: "center",
          fontFamily: FONTS.latin,
          fontSize: 24,
          color: COLORS.muted,
          letterSpacing: "0.62em",
          paddingLeft: "0.62em",
          ...enter(frame, 175, 30, 10),
        }}
      >
        MOHENG · ONLINE JUDGE
      </div>
    </AbsoluteFill>
  );
};
