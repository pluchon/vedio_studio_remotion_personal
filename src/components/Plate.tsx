// 图版：把页面截图装裱成一幅插图，内部有可推拉平移的镜头；叠加层统一用截图坐标（1600×900 CSS 像素）
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, EASE_IN_OUT } from "../theme";
import { enter } from "./motion";

// 截图的 CSS 尺寸（按 2 倍像素截取，实际图片是 3200×1800）
export const SHOT_W = 1600;
export const SHOT_H = 900;

// 镜头关键帧：f 为帧，x/y 为镜头中心（截图坐标），s 为放大倍数
export type CameraKey = { f: number; x: number; y: number; s: number };

const track = (frame: number, keys: CameraKey[], pick: (k: CameraKey) => number) =>
  keys.length === 1
    ? pick(keys[0])
    : interpolate(
        frame,
        keys.map((k) => k.f),
        keys.map(pick),
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT },
      );

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const Plate: React.FC<{
  camera: CameraKey[];
  left?: number;
  top?: number;
  width?: number;
  children: React.ReactNode;
}> = ({ camera, left = 96, top = 225, width = 1120, children }) => {
  const frame = useCurrentFrame();
  const height = (width * SHOT_H) / SHOT_W;
  const base = width / SHOT_W;

  const s = track(frame, camera, (k) => k.s);
  const scale = base * s;
  const tx = clamp(width / 2 - track(frame, camera, (k) => k.x) * scale, width - SHOT_W * scale, 0);
  const ty = clamp(height / 2 - track(frame, camera, (k) => k.y) * scale, height - SHOT_H * scale, 0);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        padding: 14,
        backgroundColor: COLORS.plate,
        border: "1px solid rgba(120, 100, 80, 0.22)",
        boxShadow: "0 36px 70px -36px rgba(60, 45, 30, 0.55), 0 2px 6px rgba(60, 45, 30, 0.08)",
        ...enter(frame, 0, 26, 30),
      }}
    >
      <div
        style={{
          position: "relative",
          width,
          height,
          overflow: "hidden",
          outline: "1px solid rgba(92, 81, 69, 0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SHOT_W,
            height: SHOT_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// 一张截图；inAt 起淡入，outAt 起淡出（都不传则一直显示）
export const Shot: React.FC<{ src: string; inAt?: number; outAt?: number; fade?: number }> = ({
  src,
  inAt,
  outAt,
  fade = 15,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = inAt === undefined ? 1 : interpolate(frame, [inAt, inAt + fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = outAt === undefined ? 1 : interpolate(frame, [outAt, outAt + fade], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Img
      src={staticFile(src)}
      style={{ position: "absolute", left: 0, top: 0, width: SHOT_W, height: SHOT_H, opacity: fadeIn * fadeOut }}
    />
  );
};

// 手绘感的朱砂圈注：按时间描出一圈略有抖动的椭圆
const wobblyEllipse = (cx: number, cy: number, rx: number, ry: number) => {
  const points: string[] = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = -0.6 + (i / steps) * Math.PI * 2.18;
    const wobble = 1 + 0.035 * Math.sin(t * 3 + 0.8) + 0.02 * Math.cos(t * 5);
    points.push(`${(cx + rx * wobble * Math.cos(t)).toFixed(1)},${(cy + ry * wobble * Math.sin(t)).toFixed(1)}`);
  }
  return "M" + points.join(" L");
};

export const InkCircle: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  at: number;
  hideAt?: number;
  duration?: number;
}> = ({ cx, cy, rx, ry, at, hideAt, duration = 22 }) => {
  const frame = useCurrentFrame();

  return (
    <svg
      viewBox={`0 0 ${SHOT_W} ${SHOT_H}`}
      style={{
        position: "absolute",
        inset: 0,
        width: SHOT_W,
        height: SHOT_H,
        overflow: "visible",
        opacity: hideAt === undefined ? 1 : interpolate(frame, [hideAt, hideAt + 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}
    >
      <path
        d={wobblyEllipse(cx, cy, rx, ry)}
        pathLength={1}
        fill="none"
        stroke={COLORS.cinnabar}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeDasharray={1}
        strokeDashoffset={interpolate(frame, [at, at + duration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_IN_OUT,
        })}
      />
    </svg>
  );
};

// AI 生成中的流光边框（与页面里的 AiGlowBorder 同一意象），矩形用截图坐标
export const GlowRing: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  from: number;
  to: number;
  radius?: number;
}> = ({ x, y, w, h, from, to, radius = 10 }) => {
  const frame = useCurrentFrame();
  const angle = frame * 5;
  const gradient = `conic-gradient(from ${angle}deg, #c9a45c, #8b352a, #9b6bb0, #5b7fa6, #3d7a57, #c9a45c)`;
  const ring: React.CSSProperties = {
    position: "absolute",
    left: x - 2,
    top: y - 2,
    width: w + 4,
    height: h + 4,
    borderRadius: radius,
    padding: 3,
    background: gradient,
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: interpolate(frame, [from, from + 12, to - 12, to], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div style={{ ...ring, padding: 6, filter: "blur(10px)", opacity: 0.75 }} />
      <div style={ring} />
    </div>
  );
};

// 流式输出：在矩形区域内按行逐步显出另一张截图，模拟文字一段段生成
export const StreamReveal: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  from: number;
  to: number;
  lines?: number;
}> = ({ src, x, y, w, h, from, to, lines = 30 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shown = (Math.floor(progress * lines) / lines) * h;

  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: SHOT_W,
        height: SHOT_H,
        clipPath: `inset(${y}px ${SHOT_W - x - w}px ${SHOT_H - y - shown}px ${x}px)`,
      }}
    />
  );
};
