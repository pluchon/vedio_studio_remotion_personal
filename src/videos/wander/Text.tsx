// 上屏的文字：片名、正文（一个字一个字地浮出来）、资料小字、图片标注、片尾
import React from "react";
import { AbsoluteFill } from "remotion";
import { CREDITS, LABELS, LINES, NOTES, TITLE, type Line, type Note } from "./script";
import { COLORS, FONT } from "./theme";
import { ease, useT } from "./time";

const Glyph: React.FC<{ ch: string; p: number }> = ({ ch, p }) => (
  <span
    style={{
      display: "inline-block",
      opacity: p,
      filter: p < 0.999 ? `blur(${(1 - p) * 7}px)` : undefined,
      transform: `translateY(${(1 - p) * 9}px)`,
      whiteSpace: "pre",
    }}
  >
    {ch}
  </span>
);

const OneLine: React.FC<{ line: Line; t: number }> = ({ line, t }) => {
  const rows = line.text.split("/");
  const count = rows.reduce((n, r) => n + r.length, 0);
  const stagger = line.stagger ?? Math.min(0.065, 1.5 / count);
  const out = 1 - ease(t, line.t1 - 1.0, line.t1);
  let k = 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 118, textAlign: "center", opacity: out }}>
      {rows.map((row, r) => (
        <div key={r} style={{ marginTop: r ? 14 : 0 }}>
          {Array.from(row).map((ch) => {
            const start = line.t0 + k * stagger;
            k += 1;
            return <Glyph key={k} ch={ch} p={ease(t, start, start + 0.8)} />;
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
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        fontSize: 44,
        letterSpacing: "0.16em",
        color: COLORS.text,
        textShadow: "0 0 22px rgba(160, 190, 255, 0.28), 0 0 2px rgba(0, 0, 0, 0.9)",
        pointerEvents: "none",
      }}
    >
      {live.map((l) => (
        <OneLine key={l.t0} line={l} t={t} />
      ))}
    </AbsoluteFill>
  );
};

const fadeOf = (n: Note, t: number, edge = 0.9) => ease(t, n.t0, n.t0 + edge) * (1 - ease(t, n.t1 - edge, n.t1));

// 资料小字：左下角，一条短线在上，字小而淡
export const Notes: React.FC = () => {
  const t = useT();
  const live = NOTES.filter((n) => t >= n.t0 && t <= n.t1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: FONT }}>
      {live.map((n) => (
        <div key={n.t0} style={{ position: "absolute", left: 92, top: 70, width: 640, opacity: fadeOf(n, t) }}>
          <div style={{ width: 28, height: 1, background: "rgba(220, 230, 245, 0.55)", marginBottom: 14 }} />
          <div style={{ fontSize: 21, lineHeight: 1.75, letterSpacing: "0.06em", color: COLORS.soft }}>{n.text}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

// 图片标注：右上角，很淡
export const Labels: React.FC = () => {
  const t = useT();
  const live = LABELS.filter((n) => t >= n.t0 && t <= n.t1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: FONT }}>
      {live.map((n) => (
        <div
          key={n.t0}
          style={{
            position: "absolute",
            right: 88,
            top: 72,
            fontSize: 17,
            letterSpacing: "0.18em",
            color: "rgba(214, 224, 238, 0.5)",
            opacity: fadeOf(n, t, 1.2),
          }}
        >
          {n.text}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const Title: React.FC = () => {
  const t = useT();
  const p = ease(t, TITLE.t0, TITLE.t0 + 1.8) * (1 - ease(t, TITLE.t1 - 1.4, TITLE.t1));
  if (p <= 0.002) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 88,
          letterSpacing: "0.72em",
          paddingLeft: "0.72em",
          color: COLORS.text,
          opacity: p,
          filter: `blur(${(1 - p) * 6}px)`,
          textShadow: "0 0 40px rgba(170, 200, 255, 0.35)",
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
    <AbsoluteFill style={{ background: COLORS.night, fontFamily: FONT, opacity: p, padding: "150px 170px", flexDirection: "row", gap: 90 }}>
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
