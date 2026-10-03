// 小家伙：照着 Claude Code 里那只像素小螃蟹画的。方身体、两只竖长的眼睛、两边各一只小手、四条短腿
// 家里四位用同一副骨架，只换颜色和大小；头顶的火花只在「想事情」的时候出现
import { makeStar } from "@remotion/shapes";
import React from "react";
import { C } from "./theme";

export type Kind = "haiku" | "sonnet" | "opus" | "fable";
export type Mood = "smile" | "happy" | "wow" | "flat" | "think";

// 一个姿势：除了表情都是数字，方便在两段之间平滑过渡
export type Pose = {
  x: number; // 脚底中心
  y: number;
  size: number; // 身体半宽，像素
  scale: number; // 出现、消失时的缩放
  lift: number; // 离地高度
  squash: number; // 正数压扁，负数拉长
  tilt: number; // 身体倾斜，度
  lean: number; // 头顶火花偏到哪边，-1 到 1
  lookX: number; // 眼睛看的方向，-1 到 1
  lookY: number;
  talk: number; // 说话时身体一颠一颠的幅度
  wave: number; // 右手举起来挥
  step: number; // 走路的步子：每加 1 是迈完一轮
  spin: number; // 火花转过的角度
  glow: number; // 火花发光
  sparkSize: number; // 火花的大小，0 是没有
  opacity: number;
  mood: Mood;
};

export const REST: Pose = {
  x: 960,
  y: 800,
  size: 150,
  scale: 1,
  lift: 0,
  squash: 0,
  tilt: 0,
  lean: 0,
  lookX: 0,
  lookY: 0,
  talk: 0,
  wave: 0,
  step: 0,
  spin: 0,
  glow: 0,
  sparkSize: 0,
  opacity: 1,
  mood: "smile",
};

export const SKIN: Record<Kind, string> = {
  haiku: C.lemon,
  sonnet: C.mint,
  opus: C.coral,
  fable: C.lilac,
};

// 原图是 12 格宽的像素画，每格宽 U、高 2U；这里身体半宽按 100 算
const U = 100 / 6;
const LINE = 6;
const TOP = -10 * U;

// 火花：八个角的圆头星星
const SPARK = makeStar({
  points: 8,
  innerRadius: 10.5,
  outerRadius: 17,
  cornerRadius: 3.2,
}).path;

export const Spark: React.FC<{
  x: number;
  y: number;
  size: number; // 外接圆半径，像素
  spin: number;
  glow?: number;
  color?: string;
}> = ({ x, y, size, spin, glow = 0, color = C.lemon }) => {
  const k = size / 17;
  return (
    <g transform={`translate(${x} ${y})`}>
      {glow > 0 ? (
        <circle
          r={size * (1.9 + glow * 0.9)}
          fill={color}
          opacity={0.28 * glow}
        />
      ) : null}
      <g transform={`rotate(${spin}) scale(${k}) translate(-17 -17)`}>
        <path
          d={SPARK}
          fill={color}
          stroke={C.ink}
          strokeWidth={LINE * 0.62}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};

// 每隔三秒多眨一次眼，返回眼睛睁开的程度
const eyeOpen = (t: number, offset: number) => {
  const phase = (((t + offset) % 3.4) + 3.4) % 3.4;
  if (phase > 0.16) return 1;
  return 0.1 + 0.9 * Math.abs(1 - phase / 0.08);
};

type Block = { x: number; y: number; w: number; h: number; turn?: string };

export const BuddyG: React.FC<{
  pose: Pose;
  t: number;
  kind?: Kind;
  seed?: number;
}> = ({ pose, t, kind = "opus", seed = 0 }) => {
  const fill = SKIN[kind];
  const unit = (pose.size / 100) * pose.scale;
  if (unit <= 0.001 || pose.opacity <= 0.001) return null;

  // 呼吸：身体很轻地一起一伏；说话时每个字颠一下
  const breath = Math.sin((t + seed) * 2.1) * 0.012;
  const squash = pose.squash + breath - pose.talk * 0.035;
  const bob = pose.talk * 7;

  // 四条腿：走路时一三、二四交替抬起；离地时全放下来
  const walking = pose.lift > 2 ? 0 : 1;
  const legs: Block[] = [-5, -3, 2, 4].map((col, i) => {
    const raised =
      Math.max(0, Math.sin((pose.step + (i % 2) * 0.5) * Math.PI * 2)) *
      walking;
    return { x: col * U, y: -2 * U - 2, w: U, h: (2 - 0.9 * raised) * U + 2 };
  });

  // 两只手：右手举起来挥，左手平时轻轻晃
  const swing = Math.sin(t * Math.PI * 2 * 2.4) * 16 * pose.wave;
  const rightTurn = `rotate(${-40 * pose.wave + swing} ${6 * U} ${-5 * U})`;
  const leftTurn = `rotate(${Math.sin((t + seed) * 2.1) * 3} ${-6 * U} ${-5 * U})`;
  const blocks: Block[] = [
    ...legs,
    { x: -8 * U, y: -6 * U, w: 2.4 * U, h: 2 * U, turn: leftTurn },
    {
      x: 5.6 * U,
      y: (-6 + 0.25 * pose.wave) * U,
      w: (2.4 + 1.2 * pose.wave) * U,
      h: (2 - 0.5 * pose.wave) * U,
      turn: rightTurn,
    },
    { x: -6 * U, y: TOP, w: 12 * U, h: 8 * U },
  ];

  const open = eyeOpen(t, seed * 1.3);
  const eyeX = pose.lookX * 0.55 * U;
  const eyeY = -7 * U + pose.lookY * 0.45 * U;
  const shadow = Math.max(0.35, 1 - pose.lift / 420);
  const sparkX = pose.lean * 24;
  const sparkY = TOP - 44 + Math.sin((t + seed) * 2.6) * 5;

  return (
    <g opacity={pose.opacity}>
      {/* 地上的影子不跟着跳起来，只是变小变淡 */}
      <ellipse
        cx={pose.x}
        cy={pose.y + 5 * unit}
        rx={104 * unit * shadow * (1 + squash * 0.6)}
        ry={13 * unit * shadow}
        fill={C.ink}
        opacity={0.13 * shadow}
      />
      <g
        transform={`translate(${pose.x} ${pose.y - pose.lift - bob * unit}) scale(${unit}) rotate(${pose.tilt}) scale(${1 + squash * 0.8} ${1 - squash})`}
      >
        {/* 先把每一块描一圈粗边，再整个盖上颜色：留下的只有最外面一圈轮廓 */}
        {blocks.map((b, i) => (
          <rect
            key={`edge-${i}`}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={3.5}
            transform={b.turn}
            fill={C.ink}
            stroke={C.ink}
            strokeWidth={LINE * 2}
            strokeLinejoin="round"
          />
        ))}
        {blocks.map((b, i) => (
          <rect
            key={`fill-${i}`}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={3.5}
            transform={b.turn}
            fill={fill}
          />
        ))}

        {/* 脸：两只竖长的眼睛，脸颊一点红 */}
        {[-1, 1].map((side) => (
          <rect
            key={`blush-${side}`}
            x={side * 4.75 * U - 0.7 * U + eyeX * 0.4}
            y={-5.1 * U}
            width={1.4 * U}
            height={0.62 * U}
            rx={0.3 * U}
            fill={C.blush}
            opacity={0.62}
          />
        ))}
        {[-1, 1].map((side) => {
          const cx = side * 3.5 * U + eyeX;
          if (pose.mood === "happy") {
            return (
              <path
                key={side}
                d={`M ${cx - 0.75 * U} ${eyeY + 0.5 * U} Q ${cx} ${eyeY - 1.25 * U} ${cx + 0.75 * U} ${eyeY + 0.5 * U}`}
                stroke={C.ink}
                strokeWidth={0.62 * U}
                strokeLinecap="round"
                fill="none"
              />
            );
          }
          const wide = pose.mood === "wow" ? 1.2 : 1;
          const tall = pose.mood === "wow" ? 2.5 : pose.mood === "flat" ? 1 : 2;
          const h = tall * U * (pose.mood === "wow" ? 1 : open);
          return (
            <rect
              key={side}
              x={cx - (wide * U) / 2}
              y={eyeY - h / 2 + (pose.mood === "flat" ? 0.4 * U : 0)}
              width={wide * U}
              height={h}
              rx={2.5}
              fill={C.ink}
            />
          );
        })}

        {/* 想事情的时候，火花浮在头顶；身体压扁拉长时它保持原样 */}
        {pose.sparkSize > 0.01 ? (
          <g
            transform={`translate(${sparkX} ${sparkY}) scale(${1 / (1 + squash * 0.8)} ${1 / (1 - squash)}) translate(${-sparkX} ${-sparkY})`}
          >
            <Spark
              x={sparkX}
              y={sparkY}
              size={24 * pose.sparkSize}
              spin={pose.spin}
              glow={pose.glow}
            />
          </g>
        ) : null}
      </g>
    </g>
  );
};

// 把一个姿势过渡到另一个：数字线性混合，表情在中点换
export const blend = (a: Pose, b: Pose, p: number): Pose => {
  const m = (u: number, v: number) => u + (v - u) * p;
  return {
    x: m(a.x, b.x),
    y: m(a.y, b.y),
    size: m(a.size, b.size),
    scale: m(a.scale, b.scale),
    lift: m(a.lift, b.lift),
    squash: m(a.squash, b.squash),
    tilt: m(a.tilt, b.tilt),
    lean: m(a.lean, b.lean),
    lookX: m(a.lookX, b.lookX),
    lookY: m(a.lookY, b.lookY),
    talk: m(a.talk, b.talk),
    wave: m(a.wave, b.wave),
    step: m(a.step, b.step),
    spin: m(a.spin, b.spin),
    glow: m(a.glow, b.glow),
    sparkSize: m(a.sparkSize, b.sparkSize),
    opacity: m(a.opacity, b.opacity),
    mood: p < 0.5 ? a.mood : b.mood,
  };
};
