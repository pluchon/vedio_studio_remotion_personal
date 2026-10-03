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

// 在 [from, to] 这段时间里为 1，两头各用 fade 秒过渡
export const during = (t: number, from: number, to: number, fade = 0.25) =>
  ramp(t, from, from + fade) - ramp(t, to - fade, to);

// 关键帧：一串 [时刻, 值]，相邻两个之间用缓动过渡
export const track = (
  t: number,
  keys: [number, number][],
  easing: (v: number) => number = EASE.inOut,
) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return mix(v0, v1, easing((t - t0) / (t1 - t0)));
    }
  }
  return keys[keys.length - 1][1];
};

// 镜头：z 是放大倍数（不小于 1），(fx, fy) 是放大时保持不动的那个点；sx、sy 是整个画面震一下的位移
export type Cam = {
  z: number;
  fx: number;
  fy: number;
  sx?: number;
  sy?: number;
};
export const WIDE: Cam = { z: 1, fx: 960, fy: 540 };
export const camMix = (a: Cam, b: Cam, p: number): Cam => ({
  z: mix(a.z, b.z, p),
  fx: mix(a.fx, b.fx, p),
  fy: mix(a.fy, b.fy, p),
  sx: mix(a.sx ?? 0, b.sx ?? 0, p),
  sy: mix(a.sy ?? 0, b.sy ?? 0, p),
});

// 重重落下、盖章的那一下：画面抖几下很快停住。返回位移的像素数
export const jolt = (t: number, at: number, power = 1) =>
  t < at || t > at + 0.5
    ? 0
    : Math.sin((t - at) * 70) * 7 * power * Math.exp(-(t - at) * 9);
