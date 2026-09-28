// 羊皮纸底图：取自管理端首页背景，整场缓慢推近
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, asset } from "../theme";

export const Paper: React.FC<{ src?: string; children?: React.ReactNode }> = ({
  src = asset("art/paper.png"),
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames], [1.02, 1.06]),
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
