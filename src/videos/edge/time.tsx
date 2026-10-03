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
// 先快后慢
export const easeOut = (t: number, a: number, b: number) => Easing.out(Easing.cubic)(ramp(t, a, b));
// 先慢后快
export const easeIn = (t: number, a: number, b: number) => Easing.in(Easing.cubic)(ramp(t, a, b));
export const mix = (from: number, to: number, p: number) => from + (to - from) * p;

const Offset = createContext(0);

// 整片的根：让 useT 在最外层也等于「念白开始为 0」的秒数
export const TimeRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Offset.Provider value={-LEAD}>{children}</Offset.Provider>
);

// 当前的念白秒数；片名那两秒是负数
export const useT = () => {
  const frame = useCurrentFrame();
  return frame / FPS + useContext(Offset);
};

// 一幕：从念白第 from 秒前 pad 秒开始，到第 to 秒后 pad 秒结束，两头淡入淡出（头一幕和末一幕不淡）
export const Scene: React.FC<{
  from: number;
  to: number;
  pad?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({ from, to, pad = 0.9, fadeIn = true, fadeOut = true, children }) => {
  const start = from - pad;
  const end = to + pad;
  return (
    <Sequence from={Math.round((start + LEAD) * FPS)} durationInFrames={Math.round((end - start) * FPS)} layout="none">
      <Offset.Provider value={start}>
        <SceneBody start={start} end={end} fadeIn={fadeIn} fadeOut={fadeOut}>
          {children}
        </SceneBody>
      </Offset.Provider>
    </Sequence>
  );
};

const SceneBody: React.FC<{ start: number; end: number; fadeIn: boolean; fadeOut: boolean; children: React.ReactNode }> = ({
  start,
  end,
  fadeIn,
  fadeOut,
  children,
}) => {
  const t = useT();
  const opacity = (fadeIn ? ramp(t, start, start + 1.2) : 1) * (fadeOut ? 1 - ramp(t, end - 1.2, end) : 1);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
