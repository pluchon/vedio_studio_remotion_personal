// 片头：日期占满一行，字号随文字长短由 fitText 算；下面是星期和地点
import React from "react";
import { fitText } from "@remotion/layout-utils";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useFont } from "./font";
import { COLORS, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const LINE = 1320;

export const Title: React.FC<{
  date: string;
  weekday: string;
  city: string;
}> = ({ date, weekday, city }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ready = useFont();
  if (!ready) return null;
  const [y, m, d] = date.split("-").map(Number);
  const text = `${y} 年 ${m} 月 ${d} 日`;
  const { fontSize } = fitText({
    text,
    withinWidth: LINE,
    fontFamily: FONT,
    letterSpacing: "0.06em",
    validateFontIsLoaded: true,
  });
  const size = Math.min(170, fontSize);
  const leave = interpolate(
    frame,
    [durationInFrames - 0.8 * fps, durationInFrames],
    [1, 0],
    clamp,
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: leave,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          letterSpacing: "0.06em",
          color: COLORS.cream,
          whiteSpace: "pre",
          opacity: interpolate(frame, [0.3 * fps, 1.6 * fps], [0, 1], clamp),
          filter: `blur(${interpolate(frame, [0.3 * fps, 1.6 * fps], [10, 0], clamp)}px)`,
        }}
      >
        {text}
      </div>
      <div
        style={{
          marginTop: size * 0.32,
          fontFamily: FONT,
          fontSize: 38,
          letterSpacing: "0.5em",
          paddingLeft: "0.5em",
          color: COLORS.soft,
          opacity: interpolate(frame, [1.4 * fps, 2.6 * fps], [0, 1], clamp),
        }}
      >
        星期{weekday} · {city}
      </div>
    </div>
  );
};
