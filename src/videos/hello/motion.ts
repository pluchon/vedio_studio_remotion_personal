// 动作的小工具：全片按「秒」排时间，这里把常用的缓动、弹跳、跳跃收在一起
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./theme";

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.5, 0, 0.9, 0.4),
  soft: Easing.inOut(Easing.sin),
};

export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// t 从 from 走到 to 时，返回 0 到 1
export const ramp = (
  t: number,
  from: number,
  to: number,
  easing: (v: number) => number = EASE.inOut,
) =>
  interpolate(t, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// 在 at 秒弹出来：带一点过冲的弹簧，0 到 1
export const pop = (t: number, at: number, bounce = 1) =>
  spring({
    frame: (t - at) * FPS,
    fps: FPS,
    config: { damping: 11 / bounce, stiffness: 150, mass: 0.7 },
  });

// 不带过冲的弹簧，用在位移和展开上
export const settle = (t: number, at: number, seconds = 0.6) =>
  spring({
    frame: (t - at) * FPS,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: seconds * FPS,
  });

// 果冻式的出现：高度先冲出去，宽度慢半拍跟上，两者之差就是压扁的量
export const jelly = (t: number, at: number) => {
  const tall = spring({
    frame: (t - at) * FPS,
    fps: FPS,
    config: { damping: 8, stiffness: 160, mass: 0.6 },
  });
  const wide = spring({
    frame: (t - at - 0.05) * FPS,
    fps: FPS,
    config: { damping: 10, stiffness: 120, mass: 0.7 },
  });
  return {
    scale: (tall + wide) / 2,
    squash: clamp((wide - tall) * 0.9, -0.24, 0.24),
  };
};

// 一次跳跃：先下蹲，起跳拉长，空中走抛物线，落地压扁后弹回
// 返回水平进度 p、离地高度 lift、压扁量 squash
export const hop = (t: number, at: number, seconds: number, height: number) => {
  const crouch = 0.14;
  const air = seconds;
  const local = t - at;
  if (local <= -crouch || local >= air + 0.7) {
    return { p: local < 0 ? 0 : 1, lift: 0, squash: 0 };
  }
  if (local < 0) {
    // 下蹲
    const k = Math.sin(((local + crouch) / crouch) * Math.PI * 0.5);
    return { p: 0, lift: 0, squash: 0.2 * k };
  }
  if (local < air) {
    const k = local / air;
    const lift = height * 4 * k * (1 - k);
    // 起跳和下落时拉长，最高点恢复
    const stretch = -0.2 * Math.abs(1 - 2 * k) ** 1.5;
    const leave = interpolate(local, [0, 0.06], [0.2, stretch], {
      extrapolateRight: "clamp",
    });
    return {
      p: EASE.soft(k),
      lift,
      squash: local < 0.06 ? leave : stretch,
    };
  }
  // 落地：压扁后带着余振回到原样
  const after = local - air;
  const squash = 0.26 * Math.exp(-after * 7) * Math.cos(after * 22);
  return { p: 1, lift: 0, squash };
};
