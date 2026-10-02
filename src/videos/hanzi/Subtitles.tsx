// 字幕：一句一页，字跟着念白一个个洇出来；念完停一会儿再淡掉
import React, { useMemo } from "react";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { interpolate } from "remotion";
import { CAPTIONS } from "./script";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 一句念完后最多再留多久（毫秒）
const LINGER = 1300;
const FADE = 280;

export const Subtitles: React.FC<{ ms: number }> = ({ ms }) => {
  const pages = useMemo(
    () => createTikTokStyleCaptions({ captions: CAPTIONS, combineTokensWithinMilliseconds: 60000 }).pages,
    [],
  );

  return (
    <>
      {pages.map((page, index) => {
        const next = pages[index + 1];
        const spoken = page.tokens[page.tokens.length - 1].toMs;
        const leave = Math.min(spoken + LINGER, next ? next.startMs - 120 : Infinity);
        if (ms < page.startMs - 200 || ms > leave + FADE) return null;
        const out = interpolate(ms, [leave, leave + FADE], [1, 0], clamp);

        return (
          <div
            key={page.startMs}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 938,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 40,
              letterSpacing: 5,
              color: COLORS.text,
              opacity: out,
              whiteSpace: "pre",
            }}
          >
            {page.tokens.map((token) => {
              const p = interpolate(ms, [token.fromMs - 60, token.fromMs + 240], [0, 1], clamp);
              return (
                <span key={token.fromMs} style={{ opacity: p, filter: `blur(${(1 - p) * 4}px)` }}>
                  {token.text}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
};
