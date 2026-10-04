// 时间：整片的画面都按「成片秒数」（配乐的时间）安排，这里提供把每一幕接到这个时间轴上的外壳
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { DESIGN_KNOTS, FPS, REAL_KNOTS } from "./theme";

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

// 设计时间 ↔ 放映时间：按各幕在念白里的真实起止分段线性地映射（两头外推）
const piecewise = (x: number, from: number[], to: number[]) => {
  let i = 1;
  while (i < from.length - 1 && x > from[i]) i++;
  const p = (x - from[i - 1]) / (from[i] - from[i - 1]);
  return to[i - 1] + (to[i] - to[i - 1]) * p;
};
export const toReal = (design: number) => piecewise(design, DESIGN_KNOTS, REAL_KNOTS);
export const toDesign = (real: number) => piecewise(real, REAL_KNOTS, DESIGN_KNOTS);

// 当前幕从放映时间的第几秒开始
const Offset = createContext(0);

export const TimeRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => <Offset.Provider value={0}>{children}</Offset.Provider>;

// 放映时间（字幕、片名、声音用）
export const useReal = () => {
  const frame = useCurrentFrame();
  return frame / FPS + useContext(Offset);
};

// 设计时间（各幕里的动画用）
export const useT = () => toDesign(useReal());

// 一幕：从第 from 秒前 pad 秒开始，到第 to 秒后 pad 秒结束，两头淡入（叠在上一幕之上，上一幕在下面直到它淡完）
export const Scene: React.FC<{
  from: number;
  to: number;
  pad?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({ from, to, pad = 0.8, fadeIn = true, fadeOut = false, children }) => {
  const start = from - pad;
  const end = to + pad;
  const realStart = toReal(start);
  const realEnd = toReal(end);
  return (
    <Sequence from={Math.round(realStart * FPS)} durationInFrames={Math.max(1, Math.round((realEnd - realStart) * FPS))} layout="none">
      <Offset.Provider value={realStart}>
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
  const opacity = (fadeIn ? ramp(t, start, start + pad * 1.25) : 1) * (fadeOut ? 1 - ramp(t, end - pad * 1.25, end) : 1);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
