// 字幕：中文一页一句，整行轻轻淡入、淡出；下面一行小的英文，逐句跟着念白；字小而柔，带一层暗影
import React from "react";
import { interpolate } from "remotion";
import { EN_LINES, PAGES } from "./script";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FADE_IN = 0.5;
const FADE_OUT = 0.6;
const LINGER = 0.5;

const SHADOW = "0 0 14px rgba(2,4,11,0.85), 0 0 3px rgba(2,4,11,0.9), 0 2px 24px rgba(2,4,11,0.6)";

// 一条字幕在 t 时刻的显隐：start 前淡入，end 后留一会儿再淡出，下一条开始前一定已经消失
const visibility = (t: number, start: number, end: number, nextStart: number | undefined) => {
  const gone = Math.min(end + LINGER + FADE_OUT, nextStart !== undefined ? nextStart - 0.18 : Infinity);
  const dur = Math.min(FADE_OUT, Math.max(0.14, gone - (end - 0.05)));
  const leave = gone - dur;
  if (t < start - FADE_IN || t > gone) return null;
  const into = interpolate(t, [start - 0.16, start + 0.3], [0, 1], clamp);
  const out = interpolate(t, [leave, gone], [1, 0], clamp);
  return into * out;
};

export const Subtitles: React.FC<{ t: number }> = ({ t }) => (
  <>
    {PAGES.map((page, index) => {
      const v = visibility(t, page.start, page.end, PAGES[index + 1]?.start);
      if (v === null) return null;
      return (
        <div
          key={`zh${page.start}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 122,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 40,
            letterSpacing: 6,
            color: COLORS.text,
            opacity: v * 0.92,
            transform: `translateY(${(1 - v) * 8}px)`,
            textShadow: SHADOW,
            whiteSpace: "pre",
          }}
        >
          {page.text}
        </div>
      );
    })}
    {EN_LINES.map((line, index) => {
      const v = visibility(t, line.start, line.end, EN_LINES[index + 1]?.start);
      if (v === null) return null;
      return (
        <div
          key={`en${line.start}`}
          style={{
            position: "absolute",
            left: 260,
            right: 260,
            top: 978,
            textAlign: "center",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 23,
            lineHeight: 1.35,
            letterSpacing: 0.4,
            color: COLORS.soft,
            opacity: v * 0.8,
            textShadow: SHADOW,
          }}
        >
          {line.text}
        </div>
      );
    })}
  </>
);
