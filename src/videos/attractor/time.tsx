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

// 设计时间 ↔ 放映时间：每句念白一个节点，节点之间用单调三次插值（Fritsch–Carlson），
// 这样画面的快慢在节点处是连续变化的，镜头运动不会一顿一顿；两头按端点的斜率线性外推
const monotone = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i])));
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + (x - xs[0]) * m[0];
    if (x >= xs[n - 1]) return ys[n - 1] + (x - xs[n - 1]) * m[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    const h = xs[hi] - xs[lo];
    const s = (x - xs[lo]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[lo] + (s3 - 2 * s2 + s) * h * m[lo] + (-2 * s3 + 3 * s2) * ys[hi] + (s3 - s2) * h * m[hi];
  };
};
export const toDesign = monotone(REAL_KNOTS, DESIGN_KNOTS);
// 反过来求：toDesign 单调递增，二分即可
export const toReal = (design: number) => {
  let lo = -60;
  let hi = REAL_KNOTS[REAL_KNOTS.length - 1] + 60;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (toDesign(mid) < design) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

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
