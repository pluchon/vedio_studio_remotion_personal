// 字幕做成一条纸胶带，贴在画面下沿，跟着句子换。
import React from "react";
import { interpolate } from "remotion";
import { PAGES } from "./script";
import { C, FONT_ZH } from "./theme";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const Subtitles: React.FC<{ t: number }> = ({ t }) => (
  <>
    {PAGES.map((page, i) => {
      const next = PAGES[i + 1];
      const gone = Math.min(page.end + 0.55, next ? next.start - 0.08 : page.end + 1.4);
      if (t < page.start - 0.18 || t > gone) return null;
      const inn = interpolate(t, [page.start - 0.12, page.start + 0.22], [0, 1], clamp);
      const out = interpolate(t, [gone - 0.28, gone], [1, 0], clamp);
      return (
        <div
          key={page.start}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 42,
            transform: `translateX(-50%) rotate(-0.5deg) translateY(${(1 - inn) * 10}px)`,
            background: "rgba(236, 214, 170, 0.92)",
            padding: "10px 28px 12px",
            fontFamily: FONT_ZH,
            fontSize: 28,
            letterSpacing: 4,
            color: C.ink,
            opacity: inn * out,
            boxShadow: "0 6px 0 rgba(40, 28, 16, 0.12)",
            clipPath: "polygon(1% 8%, 99% 0%, 100% 92%, 0 100%)",
            whiteSpace: "pre",
            pointerEvents: "none",
          }}
        >
          {page.text}
        </div>
      );
    })}
  </>
);
