// 墨段的几样基本件：满屏铜版画（白底叠底融进宣纸）、按帧推移的镜头、托住字幕的底部薄雾
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE_OUT, PAPER, RETRO, SPACE, Tone } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 满屏铜版画：从模糊的淡墨洇成清楚的线；图片按 cover 铺满，focus 决定裁掉哪边
export const InkImage: React.FC<{ src: string; at?: number; focus?: string; tone?: "ink" | "plate" }> = ({
  src,
  at = 0,
  focus = "50% 50%",
  tone = "ink",
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 22], [0, 1], { ...clamp, easing: EASE_OUT });
  if (p <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: p, filter: `blur(${(1 - p) * 6}px)`, mixBlendMode: "multiply" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: focus,
          filter: tone === "ink" ? "sepia(0.22) contrast(1.04)" : "grayscale(1) sepia(0.35) contrast(1.08)",
        }}
      />
    </AbsoluteFill>
  );
};

// 镜头：缩放加平移，围绕 origin 推拉
export const Camera: React.FC<{ scale: number; x?: number; y?: number; origin?: string; children: React.ReactNode }> = ({
  scale,
  x = 0,
  y = 0,
  origin = "50% 50%",
  children,
}) => <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, transformOrigin: origin }}>{children}</AbsoluteFill>;

// 底部一层和底色相同的薄雾，字幕压在上面不被线稿干扰
export const Mist: React.FC<{ tone: Tone; height?: number; strength?: number }> = ({ tone, height = 360, strength = 0.9 }) => {
  const base = tone === "ink" ? "239, 228, 203" : tone === "retro" ? "249, 240, 217" : "4, 5, 11";
  return (
    <AbsoluteFill
      style={{
        // AbsoluteFill 自带 height: 100%，只改 top 会把渐变拉到画面外面去
        top: 1080 - height,
        height,
        // 两行字幕的上沿大约在 y=826，雾要在那之前就浓起来
        background: `linear-gradient(to bottom, rgba(${base}, 0) 0%, rgba(${base}, ${strength}) 42%, rgba(${base}, ${strength}) 100%)`,
      }}
    />
  );
};

// 三种底色下字的颜色
export const TONES: Record<Tone, { text: string; soft: string; rule: string }> = {
  ink: { text: PAPER.ink, soft: PAPER.inkSoft, rule: PAPER.cinnabar },
  retro: { text: RETRO.ink, soft: RETRO.inkSoft, rule: RETRO.red },
  space: { text: SPACE.cream, soft: SPACE.creamSoft, rule: SPACE.cinnabar },
};
