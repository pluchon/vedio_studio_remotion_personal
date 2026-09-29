// 左上角的时间地点标：一道红短线先划出来，然后是粗衬线的年份，下面一行疏排的地点；三种底色各有配色
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { inkIn } from "../../../shared/Caption";
import { EASE_OUT, FONTS, Tone } from "../theme";
import { TONES } from "./Ink";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Locator: React.FC<{ year: string; place: string; at: number; out?: number; tone?: Tone }> = ({
  year,
  place,
  at,
  out,
  tone = "retro",
}) => {
  const frame = useCurrentFrame();
  const o = out === undefined ? 1 : interpolate(frame, [out, out + 14], [1, 0], clamp);
  if (frame < at || o <= 0) return null;
  const line = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: EASE_OUT });
  const c = TONES[tone];

  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <div style={{ position: "absolute", left: 38, top: 64, width: 78 * line, height: 2, backgroundColor: c.rule }} />
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 18,
          fontFamily: FONTS.songBlack,
          fontSize: 44,
          letterSpacing: "0.12em",
          color: c.text,
          whiteSpace: "nowrap",
          ...inkIn(frame, at + 6, 16),
        }}
      >
        {year}
      </div>
      <div
        style={{
          position: "absolute",
          left: 142,
          top: 80,
          fontFamily: FONTS.song,
          fontSize: 24,
          letterSpacing: "0.36em",
          color: c.soft,
          whiteSpace: "nowrap",
          ...inkIn(frame, at + 14, 18),
        }}
      >
        {place}
      </div>
    </div>
  );
};
