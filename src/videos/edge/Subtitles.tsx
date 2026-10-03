// 字幕：一句一页，字跟着念白一个个洇出来；底下垫一条飘带，在亮的、暗的画面上都读得清
import React, { useMemo } from "react";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { interpolate } from "remotion";
import { CAPTIONS } from "./script";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 一句念完后最多再留多久（毫秒）
const LINGER = 900;
const FADE = 260;

export const Subtitles: React.FC<{ ms: number }> = ({ ms }) => {
  const pages = useMemo(
    () => createTikTokStyleCaptions({ captions: CAPTIONS, combineTokensWithinMilliseconds: 600000 }).pages,
    [],
  );

  return (
    <>
      {pages.map((page, index) => {
        const next = pages[index + 1];
        const spoken = page.tokens[page.tokens.length - 1].toMs;
        // 下一页开口之前，这一页要先淡完；实在挤的时候，至少让最后一个字念完
        const leave = Math.max(spoken + 60, Math.min(spoken + LINGER, next ? next.startMs - 130 - FADE : Infinity));
        if (ms < page.startMs - 140 || ms > leave + FADE) return null;
        const out = interpolate(ms, [leave, leave + FADE], [1, 0], clamp);
        const into = interpolate(ms, [page.startMs - 140, page.startMs], [0, 1], clamp);

        return (
          <div
            key={page.startMs}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 92,
              display: "flex",
              justifyContent: "center",
              opacity: out * into,
              transform: `translateY(${(1 - into) * 10}px)`,
            }}
          >
            <div style={{ position: "relative" }}>
              {[-1, 1].map((side) => (
                <svg
                  key={side}
                  width={44}
                  height={64}
                  viewBox="0 0 44 64"
                  style={{ position: "absolute", top: 8, [side < 0 ? "left" : "right"]: -36, transform: side < 0 ? undefined : "scaleX(-1)" }}
                >
                  <path d="M44,0 L0,0 L14,32 L0,64 L44,64 Z" fill="#cbb98c" stroke={COLORS.ink} strokeWidth={1.6} strokeOpacity={0.55} />
                </svg>
              ))}
              <div
                style={{
                  position: "relative",
                  padding: "10px 40px 12px",
                  background: "rgba(243, 235, 210, 0.94)",
                  border: `1.6px solid rgba(58, 43, 30, 0.55)`,
                  boxShadow: "0 10px 26px -14px rgba(30, 20, 10, 0.6)",
                  fontFamily: FONT,
                  fontSize: 42,
                  letterSpacing: 5,
                  color: COLORS.ink,
                  whiteSpace: "pre",
                  lineHeight: 1.35,
                }}
              >
                {page.tokens.map((token) => {
                  const p = interpolate(ms, [token.fromMs - 40, token.fromMs + 200], [0, 1], clamp);
                  return (
                    <span key={token.fromMs} style={{ opacity: p, filter: `blur(${(1 - p) * 3}px)` }}>
                      {token.text}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
