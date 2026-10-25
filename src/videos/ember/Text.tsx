// 上屏的文字：片名在画面正中；正文在下边黑边里一个字一个字浮出来；资料小字和图片标注在上边黑边里；片尾
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CREDITS, LABELS, LINES, NOTES, TITLE, type Line, type Note } from "./script";
import { ease } from "./shot";
import { BAR, COLORS, FONT, FPS } from "./theme";

const useT = () => useCurrentFrame() / FPS;

const Glyph: React.FC<{ ch: string; p: number }> = ({ ch, p }) => (
  <span
    style={{
      display: "inline-block",
      opacity: p,
      filter: p < 0.999 ? `blur(${(1 - p) * 6}px)` : undefined,
      transform: `translateY(${(1 - p) * 6}px)`,
      whiteSpace: "pre",
    }}
  >
    {ch}
  </span>
);

const OneLine: React.FC<{ line: Line; t: number }> = ({ line, t }) => {
  const rows = line.text.split("/");
  const count = rows.reduce((n, r) => n + r.length, 0);
  const stagger = line.stagger ?? Math.min(0.06, 1.4 / count);
  const out = 1 - ease(t, line.t1 - 0.9, line.t1);
  let k = 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: out }}>
      {rows.map((row, r) => (
        <div key={r} style={{ marginTop: r ? 10 : 0 }}>
          {Array.from(row).map((ch) => {
            const start = line.t0 + k * stagger;
            k += 1;
            return <Glyph key={k} ch={ch} p={ease(t, start, start + 0.75)} />;
          })}
        </div>
      ))}
    </div>
  );
};

export const Lines: React.FC = () => {
  const t = useT();
  const live = LINES.filter((l) => t >= l.t0 - 0.1 && t <= l.t1 + 0.1);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: BAR,
        fontFamily: FONT,
        fontSize: 31,
        lineHeight: 1.35,
        letterSpacing: "0.16em",
        color: COLORS.text,
        pointerEvents: "none",
      }}
    >
      {live.map((l) => (
        <OneLine key={l.t0} line={l} t={t} />
      ))}
    </div>
  );
};

const fadeOf = (n: Note, t: number, edge = 0.9) => ease(t, n.t0, n.t0 + edge) * (1 - ease(t, n.t1 - edge, n.t1));

// 资料小字：上边黑边的左边，一条短线在前
export const Notes: React.FC = () => {
  const t = useT();
  const live = NOTES.filter((n) => t >= n.t0 && t <= n.t1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: FONT }}>
      {live.map((n) => (
        <div
          key={n.t0}
          style={{ position: "absolute", left: 96, top: 0, height: BAR, width: 1180, display: "flex", alignItems: "center", gap: 18, opacity: fadeOf(n, t) }}
        >
          <div style={{ width: 22, height: 1, flex: "none", background: "rgba(220, 228, 240, 0.5)" }} />
          <div style={{ fontSize: 18, lineHeight: 1.7, letterSpacing: "0.06em", color: COLORS.soft }}>{n.text}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

// 图片标注：上边黑边的右边，很淡
export const Labels: React.FC = () => {
  const t = useT();
  const live = LABELS.filter((n) => t >= n.t0 && t <= n.t1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: FONT }}>
      {live.map((n) => (
        <div
          key={n.t0}
          style={{ position: "absolute", right: 96, top: 0, height: BAR, display: "flex", alignItems: "center", fontSize: 16, letterSpacing: "0.18em", color: "rgba(214, 224, 238, 0.5)", opacity: fadeOf(n, t, 1.2) }}
        >
          {n.text}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const Title: React.FC = () => {
  const t = useT();
  const p = ease(t, TITLE.t0, TITLE.t0 + 2.0) * (1 - ease(t, TITLE.t1 - 1.6, TITLE.t1));
  if (p <= 0.002) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 74,
          letterSpacing: "0.8em",
          paddingLeft: "0.8em",
          color: COLORS.text,
          opacity: p * 0.95,
          filter: `blur(${(1 - p) * 8}px)`,
          textShadow: "0 0 36px rgba(170, 200, 255, 0.3)",
        }}
      >
        {TITLE.text}
      </div>
    </AbsoluteFill>
  );
};

export const Credits: React.FC = () => {
  const t = useT();
  const p = ease(t, CREDITS.t0, CREDITS.t0 + 1.4) * (1 - ease(t, CREDITS.t1 - 1.4, CREDITS.t1));
  if (p <= 0.002) return null;
  const head: React.CSSProperties = { fontSize: 19, letterSpacing: "0.4em", color: "rgba(214, 224, 238, 0.85)", marginBottom: 18 };
  const row: React.CSSProperties = { fontSize: 18, lineHeight: 1.9, letterSpacing: "0.04em", color: "rgba(214, 224, 238, 0.62)" };
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT, opacity: p, padding: "190px 170px", flexDirection: "row", gap: 90 }}>
      <div style={{ flex: 1.25 }}>
        <div style={head}>资料</div>
        {CREDITS.sources.map((s) => (
          <div key={s} style={row}>
            {s}
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={head}>图片</div>
        {CREDITS.images.map((s) => (
          <div key={s} style={row}>
            {s}
          </div>
        ))}
        <div style={{ ...head, marginTop: 46 }}>配乐</div>
        <div style={row}>{CREDITS.music.replace("配乐　", "")}</div>
      </div>
    </AbsoluteFill>
  );
};
