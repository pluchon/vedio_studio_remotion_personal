// 叠在画面上的字：一句句旁白，和底部的三个读数（海拔、离海还有多远、这里的流量）
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Spot } from "./plan";
import { COLORS, FONT, FPS, HEIGHT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LATIN = "Georgia, serif";

export type Sentence = { zh: string; en: string; at: number; out: number };

// 一句话：字一个个从模糊里显出来，说完整句淡掉
export const Line: React.FC<{ line: Sentence }> = ({ line }) => {
  const t = useCurrentFrame() / FPS;
  if (t < line.at || t > line.out + 0.9) return null;
  const out = interpolate(t, [line.out, line.out + 0.9], [1, 0], clamp);
  const chars = [...line.zh];
  const written = line.at + chars.length * 0.08;
  const en = interpolate(t, [written + 0.2, written + 1.2], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: HEIGHT - 850,
        textAlign: "center",
        opacity: out,
        color: COLORS.cream,
        textShadow: "0 0 18px rgba(0, 8, 20, 0.85), 0 0 4px rgba(0, 8, 20, 0.6)",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 40, letterSpacing: "0.24em", paddingLeft: "0.24em", whiteSpace: "pre" }}>
        {chars.map((c, i) => {
          const p = interpolate(t, [line.at + i * 0.08, line.at + i * 0.08 + 0.6], [0, 1], clamp);
          return (
            <span key={i} style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>
              {c}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontFamily: LATIN, fontStyle: "italic", fontSize: 21, letterSpacing: "0.05em", color: COLORS.soft, opacity: en }}>{line.en}</div>
    </div>
  );
};

// 千位之间留一个窄空
const grouped = (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const flowText = (flow: number) => (flow < 10 ? flow.toFixed(1) : flow < 1000 ? Math.round(flow).toString() : grouped(Math.round(flow / 100) * 100));

const Figure: React.FC<{ label: string; value: string; unit: string }> = ({ label, value, unit }) => (
  <div style={{ width: 380, textAlign: "center" }}>
    <div style={{ fontFamily: FONT, fontSize: 16, letterSpacing: "0.5em", paddingLeft: "0.5em", color: COLORS.soft }}>{label}</div>
    <div style={{ marginTop: 6, fontFamily: LATIN, fontSize: 38, fontVariantNumeric: "tabular-nums" }}>
      {value}
      <span style={{ fontFamily: FONT, fontSize: 19, marginLeft: 10, letterSpacing: "0.14em" }}>{unit}</span>
    </div>
  </div>
);

export const Readout: React.FC<{ here: Spot; opacity?: number }> = ({ here, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 52,
      display: "flex",
      justifyContent: "center",
      color: COLORS.cream,
      opacity,
      textShadow: "0 0 16px rgba(0, 8, 20, 0.9)",
    }}
  >
    <Figure label="海拔" value={grouped(Math.max(here.elev, 0))} unit="米" />
    <Figure label="离海" value={grouped(here.down)} unit="公里" />
    <Figure label="流量" value={flowText(here.flow)} unit="立方米每秒" />
  </div>
);
