// 说话的字幕：底部一个圆角条，字一个一个蹦出来；分页和每个字的时刻来自 @remotion/captions
import { measureText } from "@remotion/layout-utils";
import React from "react";
import { clamp, pop, ramp } from "./motion";
import { C, FONT_ZH, HEIGHT, TEXT, WIDTH } from "./theme";
import { lineGone, LINES, PAGES } from "./timeline";

const SIZE = 56;

export const Captions: React.FC<{ t: number }> = ({ t }) => {
  const index = LINES.findIndex(
    (line) => t >= line.at - 0.25 && t < lineGone(line) + 0.3,
  );
  if (index < 0) return null;
  const line = LINES[index];
  const page = PAGES[index];
  const shown = clamp(
    pop(t, line.at - 0.25, 0.9) -
      ramp(t, lineGone(line), lineGone(line) + 0.25),
    0,
    1.2,
  );
  // 先量出整句的宽度，圆角条一出现就是最终大小，字再往里填
  const { width } = measureText({
    text: line.text,
    fontFamily: TEXT,
    fontSize: SIZE,
    fontWeight: "600",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: WIDTH / 2,
        top: HEIGHT - 150,
        transform: `translate(-50%, 0) scale(${shown})`,
        transformOrigin: "50% 100%",
        opacity: clamp(shown * 1.6),
      }}
    >
      <div
        style={{
          width: width + 96,
          height: 96,
          borderRadius: 48,
          background: C.white,
          border: `6px solid ${C.ink}`,
          boxShadow: `0 9px 0 rgba(58, 42, 38, 0.16)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          fontFamily: TEXT,
          fontSize: SIZE,
          fontWeight: 600,
          color: C.ink,
          whiteSpace: "pre",
        }}
      >
        {page.tokens.map((token, i) => {
          const born = token.fromMs / 1000;
          const k = pop(t, born, 1.3);
          const char = token.text.trim();
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily:
                  char.charCodeAt(0) >= 0x2e80 ? `"${FONT_ZH}"` : TEXT,
                opacity: t >= born ? 1 : 0,
                transform: `translateY(${(1 - k) * 22}px) scale(${0.5 + 0.5 * k})`,
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
