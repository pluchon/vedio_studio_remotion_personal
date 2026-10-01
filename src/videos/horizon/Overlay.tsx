// 叠在画面上的字：片名、一句句旁白、底部的三个读数
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, Figure as FigureData, TITLE_END } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LATIN = "Georgia, serif";

// 在 [from, to] 之间显示，两头各用 fade 秒淡入淡出
export const during = (t: number, from: number, to: number, fade = 0.6) => interpolate(t, [from, from + fade, to - fade, to], [0, 1, 1, 0], clamp);

// 片名：配乐最安静的头几秒，字从黑里浮出来
export const Title: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t > TITLE_END + 0.2) return null;
  const show = during(t, 0.5, TITLE_END - 0.1, 1.3);
  const rule = interpolate(t, [1.0, 2.6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center", color: COLORS.cream }}>
      <div style={{ opacity: show, textAlign: "center", filter: `blur(${(1 - show) * 6}px)` }}>
        <div style={{ fontFamily: FONT, fontSize: 84, letterSpacing: "0.34em", paddingLeft: "0.34em" }}>光到不了的地方</div>
        <div style={{ margin: "34px auto 0", width: 260 * rule, height: 1, background: COLORS.rule }} />
        <div style={{ marginTop: 30, fontFamily: LATIN, fontSize: 22, letterSpacing: "0.5em", paddingLeft: "0.5em", color: COLORS.soft }}>WHERE LIGHT CANNOT REACH</div>
      </div>
    </AbsoluteFill>
  );
};

export type Sentence = { zh: string[]; en: string; at: number; out: number; note?: string };

// 一句话：字一个个从模糊里显出来，说完整句淡掉。写在画面下方、读数的上面
export const Line: React.FC<{ line: Sentence }> = ({ line }) => {
  const t = useCurrentFrame() / FPS;
  if (t < line.at || t > line.out + 0.8) return null;
  const out = interpolate(t, [line.out, line.out + 0.8], [1, 0], clamp);
  let count = 0;
  const rows = line.zh.map((row) => {
    const start = count;
    count += [...row].length;
    return { row, start };
  });
  const written = line.at + count * 0.07;
  const en = interpolate(t, [written + 0.2, written + 1.1], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 1080 - 870, textAlign: "center", opacity: out, color: COLORS.cream }}>
      {rows.map(({ row, start }) => (
        <div key={start} style={{ fontFamily: FONT, fontSize: 44, lineHeight: 1.5, letterSpacing: "0.22em", whiteSpace: "pre" }}>
          {[...row].map((c, i) => {
            const p = interpolate(t, [line.at + (start + i) * 0.07, line.at + (start + i) * 0.07 + 0.55], [0, 1], clamp);
            return (
              <span key={i} style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)` }}>
                {c}
              </span>
            );
          })}
        </div>
      ))}
      <div style={{ marginTop: 10, fontFamily: LATIN, fontStyle: "italic", fontSize: 23, letterSpacing: "0.04em", color: COLORS.soft, opacity: en }}>
        {line.en}
        {line.note && <span style={{ fontStyle: "normal", marginLeft: 28, letterSpacing: "0.12em", color: COLORS.cream }}>{line.note}</span>}
      </div>
    </div>
  );
};

const Figure: React.FC<{ label: string; figure: FigureData; color?: string }> = ({ label, figure, color = COLORS.cream }) => (
  <div style={{ width: 430, textAlign: "center" }}>
    <div style={{ fontFamily: FONT, fontSize: 18, letterSpacing: "0.5em", paddingLeft: "0.5em", color: COLORS.soft }}>{label}</div>
    <div style={{ marginTop: 8, fontFamily: LATIN, fontSize: 46, fontVariantNumeric: "tabular-nums", color }}>
      {figure.value}
      <span style={{ fontFamily: FONT, fontSize: 23, marginLeft: 12, letterSpacing: "0.16em" }}>{figure.unit}</span>
    </div>
  </div>
);

// 底部并排的读数。一路上是：有多远、看到的是多久以前、镜头退得多快（超过光速就变成朱砂色）
export const Readout: React.FC<{ figures: { label: string; figure: FigureData; hot?: boolean }[]; opacity?: number }> = ({ figures, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center", color: COLORS.cream, opacity }}>
    {figures.map((f) => (
      <Figure key={f.label} label={f.label} figure={f.figure} color={f.hot ? COLORS.rule : COLORS.cream} />
    ))}
  </div>
);
