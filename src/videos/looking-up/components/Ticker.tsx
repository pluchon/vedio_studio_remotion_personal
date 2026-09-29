// 越翻越快的编年：左上角的定位标变成一个计数器，一条接一条地换——年份、地点、那一年发生的事；标红的是最近的几件
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, FONTS, SPACE } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type TickerEntry = { year: string; place: string; event: string; at: number; hot?: boolean };

export const Ticker: React.FC<{ entries: TickerEntry[]; out: number }> = ({ entries, out }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [out, out + 12], [1, 0], clamp);
  const i = entries.reduce((cur, e, k) => (frame >= e.at ? k : cur), -1);
  if (i < 0 || o <= 0) return null;
  const e = entries[i];
  const p = interpolate(frame, [e.at, e.at + 7], [0, 1], { ...clamp, easing: EASE_OUT });
  const color = e.hot ? SPACE.cinnabar : SPACE.cream;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <div style={{ position: "absolute", left: 38, top: 76, width: 78, height: 2, backgroundColor: SPACE.cinnabar }} />
      <div style={{ position: "absolute", left: 140, top: 22, opacity: p, translate: `0 ${(1 - p) * 18}px`, whiteSpace: "nowrap" }}>
        <div style={{ fontFamily: FONTS.songBlack, fontSize: 64, letterSpacing: "0.08em", color }}>{e.year}</div>
        <div style={{ fontFamily: FONTS.song, fontSize: 24, letterSpacing: "0.3em", color: SPACE.creamSoft, marginTop: 4 }}>{e.place}</div>
        <div style={{ fontFamily: FONTS.song, fontSize: 32, letterSpacing: "0.08em", color, marginTop: 14 }}>{e.event}</div>
      </div>
    </div>
  );
};
