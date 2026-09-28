// 手写式字幕：中文逐字洇开浮现，写完后英文整行淡入；out 起整体淡出
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, FONTS } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 单个字的浮现：由虚到实、略微上浮
const inkIn = (frame: number, start: number, duration = 12) => {
  const p = interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing: EASE_OUT });
  return { opacity: p, filter: `blur(${(1 - p) * 5}px)`, translate: `0px ${(1 - p) * 8}px` };
};

// 中文写完所需的帧数（stagger 为每字间隔，行与行之间多停 lineGap 帧）
export const writeDuration = (lines: string[], stagger = 2.5, lineGap = 6) =>
  lines.reduce((sum, l) => sum + [...l].length * stagger + lineGap, 0);

export const Caption: React.FC<{
  zh: string[];
  en?: string[];
  at: number;
  out?: number;
  color: string;
  enColor: string;
  size?: number;
  enSize?: number;
  align?: "left" | "center";
  stagger?: number;
  style?: React.CSSProperties;
}> = ({ zh, en = [], at, out, color, enColor, size = 56, enSize = 26, align = "left", stagger = 2.5, style }) => {
  const frame = useCurrentFrame();
  const fadeOut = out === undefined ? 1 : interpolate(frame, [out, out + 14], [1, 0], clamp);
  const enAt = at + writeDuration(zh, stagger) - 4;

  let cursor = at;
  const lines = zh.map((line, i) => {
    const chars = [...line].map((ch, j) => {
      const start = cursor + j * stagger;
      return (
        <span key={j} style={{ display: "inline-block", whiteSpace: "pre", ...inkIn(frame, start) }}>
          {ch}
        </span>
      );
    });
    cursor += [...line].length * stagger + 6;
    return <div key={i}>{chars}</div>;
  });

  return (
    <div style={{ position: "absolute", textAlign: align, opacity: fadeOut, ...style }}>
      <div style={{ fontFamily: FONTS.hand, fontSize: size, lineHeight: 1.55, color, letterSpacing: "0.06em" }}>{lines}</div>
      {en.length > 0 && (
        <div
          style={{
            marginTop: size * 0.35,
            fontFamily: FONTS.latin,
            fontStyle: "italic",
            fontSize: enSize,
            lineHeight: 1.5,
            color: enColor,
            letterSpacing: "0.02em",
            ...inkIn(frame, enAt, 20),
          }}
        >
          {en.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
};
