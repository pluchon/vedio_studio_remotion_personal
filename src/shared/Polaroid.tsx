// 拍立得：从上方落下贴进日记，照片由暗到亮慢慢显影，底边有手写题注（字体由各视频传入）
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE_OUT } from "./motion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Polaroid: React.FC<{
  src: string;
  width: number;
  aspect: number;
  at: number;
  out?: number;
  rotate?: number;
  caption?: string;
  font: string;
  paper: string;
  ink: string;
  style?: React.CSSProperties;
}> = ({ src, width, aspect, at, out, rotate = -3, caption, font, paper, ink, style }) => {
  const frame = useCurrentFrame();
  const drop = interpolate(frame, [at, at + 20], [0, 1], { ...clamp, easing: EASE_OUT });
  const develop = interpolate(frame, [at + 8, at + 70], [0, 1], clamp);
  const captionIn = interpolate(frame, [at + 40, at + 58], [0, 1], clamp);
  const fadeOut = out === undefined ? 1 : interpolate(frame, [out, out + 14], [1, 0], clamp);
  const pad = width * 0.034;

  return (
    <div
      style={{
        position: "absolute",
        padding: `${pad}px ${pad}px 0`,
        backgroundColor: paper,
        boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.25)",
        opacity: drop * fadeOut,
        transform: `translateY(${(1 - drop) * -70}px) rotate(${rotate - (1 - drop) * 5}deg) scale(${1.06 - drop * 0.06})`,
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          display: "block",
          width,
          height: width / aspect,
          filter: `brightness(${0.2 + develop * 0.8}) sepia(${0.75 - develop * 0.7}) saturate(${0.35 + develop * 0.65}) contrast(${0.85 + develop * 0.15})`,
        }}
      />
      <div
        style={{
          height: width * 0.13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font,
          fontSize: width * 0.042,
          color: ink,
          letterSpacing: "0.08em",
          opacity: captionIn,
        }}
      >
        {caption}
      </div>
      {/* 压住照片的纸胶带 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -18,
          width: width * 0.22,
          height: 40,
          marginLeft: -width * 0.11,
          backgroundColor: "rgba(226, 212, 182, 0.78)",
          transform: "rotate(4deg)",
          clipPath: "polygon(2% 8%, 98% 0%, 100% 50%, 97% 100%, 1% 94%, 0% 50%)",
        }}
      />
    </div>
  );
};
