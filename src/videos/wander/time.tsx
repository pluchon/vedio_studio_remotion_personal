// 时间：所有画面都按「整片的秒数」写，一幕放进 Sequence 之后也照样拿到整片的秒数
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { FPS } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
export const ease = (t: number, a: number, b: number) => {
  const p = ramp(t, a, b);
  return p * p * (3 - 2 * p);
};
export const easeIn = (t: number, a: number, b: number) => {
  const p = ramp(t, a, b);
  return p * p * p;
};
export const easeOut = (t: number, a: number, b: number) => {
  const p = 1 - ramp(t, a, b);
  return 1 - p * p * p;
};
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export type V3 = [number, number, number];
export const mix3 = (a: V3, b: V3, p: number): V3 => [mix(a[0], b[0], p), mix(a[1], b[1], p), mix(a[2], b[2], p)];

// 关键帧之间缓入缓出
export const track = (t: number, keys: [number, number][]): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      const p = (t - t0) / (t1 - t0);
      return mix(v0, v1, p * p * (3 - 2 * p));
    }
  }
  return keys[keys.length - 1][1];
};

export const track3 = (t: number, keys: [number, V3][]): V3 => [
  track(t, keys.map(([k, v]) => [k, v[0]] as [number, number])),
  track(t, keys.map(([k, v]) => [k, v[1]] as [number, number])),
  track(t, keys.map(([k, v]) => [k, v[2]] as [number, number])),
];

const Offset = createContext(0);

// 整片的秒数
export const useT = () => useCurrentFrame() / FPS + useContext(Offset);

// 一幕：从 from 秒到 to 秒挂上去，两头各用 fadeIn / fadeOut 秒淡入淡出（0 表示硬切）
export const Scene: React.FC<{ from: number; to: number; fadeIn?: number; fadeOut?: number; children: React.ReactNode }> = ({
  from,
  to,
  fadeIn = 1,
  fadeOut = 1,
  children,
}) => (
  <Sequence from={Math.round(from * FPS)} durationInFrames={Math.round((to - from) * FPS)} layout="none">
    <Offset.Provider value={Math.round(from * FPS) / FPS}>
      <Fader from={from} to={to} fadeIn={fadeIn} fadeOut={fadeOut}>
        {children}
      </Fader>
    </Offset.Provider>
  </Sequence>
);

const Fader: React.FC<{ from: number; to: number; fadeIn: number; fadeOut: number; children: React.ReactNode }> = ({
  from,
  to,
  fadeIn,
  fadeOut,
  children,
}) => {
  const t = useT();
  const a = fadeIn > 0 ? ease(t, from, from + fadeIn) : 1;
  const b = fadeOut > 0 ? 1 - ease(t, to - fadeOut, to) : 1;
  return <AbsoluteFill style={{ opacity: a * b }}>{children}</AbsoluteFill>;
};
