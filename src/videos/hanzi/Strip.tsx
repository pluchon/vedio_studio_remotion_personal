// 顶上的年代线：五种字体按先后排开，讲到哪一种，哪一种就点成朱砂色
import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT, SCRIPTS, SCRIPT_NAMES } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const GAP = 300;
const TOP = 96;

export const Strip: React.FC<{ t: number; reached: number[]; opacity: number }> = ({ t, reached, opacity }) => {
  const active = reached.filter((at) => t >= at).length - 1;
  const left = 960 - GAP * 2;
  // 线画到最新的那一种为止
  const drawn = reached.reduce((sum, at, i) => (i === 0 ? 0 : sum + interpolate(t, [at - 0.9, at], [0, 1], clamp)), 0);

  return (
    <div style={{ position: "absolute", inset: 0, opacity, fontFamily: FONT }}>
      <div style={{ position: "absolute", left, top: TOP, width: drawn * GAP, height: 1, background: COLORS.line }} />
      {SCRIPTS.map((script, i) => {
        const appear = interpolate(t, [reached[i] - 0.3, reached[i] + 0.5], [0, 1], clamp);
        if (appear <= 0) return null;
        const on = i === active ? interpolate(t, [reached[i], reached[i] + 0.6], [0, 1], clamp) : 0;
        const { name, era } = SCRIPT_NAMES[script];
        return (
          <div key={script} style={{ position: "absolute", left: left + i * GAP - 150, top: TOP - 5, width: 300, textAlign: "center", opacity: appear }}>
            <div
              style={{
                width: 11,
                height: 11,
                margin: "0 auto",
                borderRadius: "50%",
                background: on > 0.5 ? COLORS.cinnabar : COLORS.paper,
                border: `1.5px solid ${on > 0.5 ? COLORS.cinnabar : COLORS.muted}`,
              }}
            />
            <div style={{ marginTop: 14, fontSize: 30, letterSpacing: 6, paddingLeft: 6, color: on > 0.5 ? COLORS.cinnabar : COLORS.muted }}>{name}</div>
            <div style={{ marginTop: 8, fontSize: 18, letterSpacing: 2, color: COLORS.muted, opacity: on }}>{era}</div>
          </div>
        );
      })}
    </div>
  );
};
