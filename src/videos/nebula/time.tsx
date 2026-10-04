// 时间：整片的画面都按「念白里的秒数」安排，这里提供把每一幕接到这个时间轴上的外壳
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { FPS, LEAD } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 线性进度 0..1
export const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
// 缓入缓出
export const ease = (t: number, a: number, b: number) => {
  const p = ramp(t, a, b);
  return p * p * (3 - 2 * p);
};
export const easeOut = (t: number, a: number, b: number) => Easing.out(Easing.cubic)(ramp(t, a, b));
export const mix = (from: number, to: number, p: number) => from + (to - from) * p;

// 关键帧：在 [时间, 值] 之间缓入缓出地过渡
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

export type V3 = [number, number, number];
// 三维的关键帧
export const track3 = (t: number, keys: [number, V3][]): V3 => [
  track(t, keys.map(([k, v]) => [k, v[0]] as [number, number])),
  track(t, keys.map(([k, v]) => [k, v[1]] as [number, number])),
  track(t, keys.map(([k, v]) => [k, v[2]] as [number, number])),
];

// 一段「淡出再淡入」：在 t0 处最暗，两头各 half 秒
export const dip = (t: number, t0: number, half = 0.5) => 1 - Math.max(0, 1 - Math.abs(t - t0) / half);

const Offset = createContext(0);

export const TimeRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Offset.Provider value={-LEAD}>{children}</Offset.Provider>
);

// 当前的念白秒数；片名那两秒是负数
export const useT = () => {
  const frame = useCurrentFrame();
  return frame / FPS + useContext(Offset);
};

// 一幕：从念白第 from 秒前 pad 秒开始，到第 to 秒后 pad 秒结束，两头淡入（叠在上一幕之上，上一幕在下面直到它淡完）
export const Scene: React.FC<{
  from: number;
  to: number;
  pad?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({ from, to, pad = 1.2, fadeIn = true, fadeOut = false, children }) => {
  const start = from - pad;
  const end = to + pad;
  return (
    <Sequence from={Math.round((start + LEAD) * FPS)} durationInFrames={Math.round((end - start) * FPS)} layout="none">
      <Offset.Provider value={start}>
        <SceneBody start={start} end={end} pad={pad} fadeIn={fadeIn} fadeOut={fadeOut}>
          {children}
        </SceneBody>
      </Offset.Provider>
    </Sequence>
  );
};

const SceneBody: React.FC<{ start: number; end: number; pad: number; fadeIn: boolean; fadeOut: boolean; children: React.ReactNode }> = ({
  start,
  end,
  pad,
  fadeIn,
  fadeOut,
  children,
}) => {
  const t = useT();
  const opacity = (fadeIn ? ramp(t, start, start + pad * 1.6) : 1) * (fadeOut ? 1 - ramp(t, end - pad * 1.6, end) : 1);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
