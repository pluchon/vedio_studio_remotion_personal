// 字幕：一页一句，整行轻轻淡入、淡出；字小而柔，带一层暗影，在亮的、暗的画面上都读得清
import React from "react";
import { interpolate } from "remotion";
import { PAGES } from "./script";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FADE_IN = 0.5;
const FADE_OUT = 0.6;
// 念完之后最多再留多久
const LINGER = 0.7;

export const Subtitles: React.FC<{ t: number }> = ({ t }) => (
  <>
    {PAGES.map((page, index) => {
      const next = PAGES[index + 1];
      // 下一页开口之前，这一页要先淡完；连着念的时候，淡出就收得快一点
      const gone = Math.min(page.end + LINGER + FADE_OUT, next ? next.start - 0.18 : Infinity);
      const dur = Math.min(FADE_OUT, Math.max(0.14, gone - (page.end - 0.05)));
      const leave = gone - dur;
      if (t < page.start - FADE_IN || t > gone) return null;
      const into = interpolate(t, [page.start - 0.16, page.start + 0.3], [0, 1], clamp);
      const out = interpolate(t, [leave, gone], [1, 0], clamp);
      return (
        <div
          key={page.start}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 84,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 40,
            letterSpacing: 6,
            color: COLORS.text,
            opacity: into * out * 0.92,
            transform: `translateY(${(1 - into) * 8}px)`,
            textShadow: "0 0 14px rgba(2,3,10,0.85), 0 0 3px rgba(2,3,10,0.9), 0 2px 24px rgba(2,3,10,0.6)",
            whiteSpace: "pre",
          }}
        >
          {page.text}
        </div>
      );
    })}
  </>
);
