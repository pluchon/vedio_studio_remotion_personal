// 海报插画铺满画面：按 cover 裁切，镜头可以推移；插画本身已有纸感，这里不再叠底
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE_OUT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PosterImage: React.FC<{ src: string; focus?: string; at?: number }> = ({ src, focus = "50% 50%", at = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus }} />
    </AbsoluteFill>
  );
};
