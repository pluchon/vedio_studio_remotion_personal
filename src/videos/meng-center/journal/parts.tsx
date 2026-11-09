// 第二版加的积木：手画小图标（代替 emoji）、带圈注和推镜的截图拍立得、关键词大字、会动的奶糖（GIF 补帧抠图）
import React from "react";
import { Img, Loop, OffthreadVideo, interpolate } from "remotion";
import { C, ZH, asset } from "../theme";
import { INK, RED, Tape, pop, ramp } from "./paper";
import { BAR, BEAT } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// ---------------------------------------------------------------- 小图标：24×24 的线稿
const ICONS: Record<string, string> = {
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M15.5 15.5 L21 21",
  image: "M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15.5 9.5a1.2 1.2 0 1 0 0.01 0",
  video: "M3 6h13v12H3z M16 10l5-3v10l-5-3",
  smile: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 14c1.2 1.6 2.4 2.2 4 2.2s2.8-.6 4-2.2 M9 9.5v.5 M15 9.5v.5",
  at: "M16 12a4 4 0 1 1-1.2-2.9 M16 8v5.5c0 1.6 1 2.5 2.2 2.5 1.6 0 2.8-1.8 2.8-4a9 9 0 1 0-3.5 7.1",
  mail: "M3 6h18v12H3z M3 7l9 6 9-6",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3.2 3 14.8 0 18 M12 3c-3 3.2-3 14.8 0 18",
  doc: "M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7",
  wand: "M4 20L15 9 M13 7l4 4 M17 3v3 M20 6h-3 M19 9.5l1.5 1.5 M10 4.5L11.5 6",
  play: "M8 5l11 7-11 7z",
  undo: "M9 7L4 12l5 5 M4 12h10a6 6 0 0 1 0 12",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  chat: "M4 5h16v11H9l-5 4z",
  lock: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  phone: "M8 3h8v18H8z M11 18h2",
  check: "M5 12.5l4.5 4.5L19 7",
  memo: "M5 4h14v16H5z M8 9h8 M8 13h8 M8 17h5",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
  folder: "M3 6h7l2 2h9v11H3z",
  eye: "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  refresh: "M20 7a8 8 0 1 0 1 6 M20 3v4h-4",
  wifiOff: "M3 3l18 18 M8.5 16.5a5 5 0 0 1 7 0 M5 12.5a10 10 0 0 1 4-2.3 M12 20h.01",
  cup: "M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z M16 10h2a2 2 0 0 1 0 4h-2",
};

export const Ico: React.FC<{ name: keyof typeof ICONS; size?: number; color?: string; width?: number; style?: React.CSSProperties }> = ({ name, size = 30, color = INK, width = 2.2, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "middle", flex: "none", ...style }}>
    <path d={ICONS[name]} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------- 截图拍立得：镜头从全图推到重点，圈注用截图像素坐标
type Rect = { x: number; y: number; w: number; h: number };
export type Mark = { at: number; x: number; y: number; w: number; h: number; color?: string; label?: string; side?: "top" | "bottom" };

export const Shot: React.FC<{
  f: number; at: number; src: string; imgW: number; imgH: number; x: number; y: number; w: number;
  from?: Rect; to?: Rect; move?: [number, number]; rot?: number; marks?: Mark[]; tape?: string; caption?: string; children?: React.ReactNode;
}> = ({ f, at, src, imgW, imgH, x, y, w, from, to, move, rot = -2, marks = [], tape = "rgba(142,212,181,0.85)", caption, children }) => {
  if (f < at) return null;
  const a = from ?? { x: 0, y: 0, w: imgW, h: imgH };
  const b = to ?? a;
  const [m0, m1] = move ?? [at + 10, at + 70];
  const k = ease(ramp(f, m0, m1));
  const v = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k };
  const h = (w * a.h) / a.w; // 画框比例跟起始取景一致
  const s = w / v.w;
  const sy = h / v.h;
  const sc = Math.min(s, sy);
  const e = pop(f, at, true);
  const pad = 16;
  const bottom = caption ? 64 : pad;
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: w + pad * 2, height: h + pad + bottom,
        transform: `translateY(${(1 - e) * -70}px) rotate(${rot + (1 - e) * 9}deg) scale(${1.18 - 0.18 * e})`, opacity: Math.min(1, e * 1.6),
        background: "#fff", borderRadius: 6, boxShadow: "0 16px 30px rgba(41,72,106,0.2), 0 2px 5px rgba(41,72,106,0.12)",
      }}
    >
      <div style={{ position: "absolute", left: pad, top: pad, width: w, height: h, overflow: "hidden", background: "#F4F8FB" }}>
        <div style={{ position: "absolute", left: -v.x * sc + (w - v.w * sc) / 2, top: -v.y * sc + (h - v.h * sc) / 2, width: imgW * sc, height: imgH * sc }}>
          <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
          {marks.map((m, i) => {
            const p = ramp(f, m.at, m.at + 9);
            if (p <= 0) return null;
            const rx = (m.w * sc) / 2 + 10;
            const ry = (m.h * sc) / 2 + 10;
            const cx = m.x * sc + (m.w * sc) / 2;
            const cy = m.y * sc + (m.h * sc) / 2;
            const d = `M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx * 0.96} ${cy - ry * 0.3}`;
            return (
              <React.Fragment key={i}>
                <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
                  <path d={d} pathLength={1} fill="none" stroke={m.color ?? RED} strokeWidth={6} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - p} />
                </svg>
                {m.label ? (
                  <div style={{ position: "absolute", left: cx, top: m.side === "bottom" ? cy + ry + 8 : cy - ry - 52, transform: `translateX(-50%) scale(${pop(f, m.at + 6)})`, whiteSpace: "nowrap", fontFamily: ZH, fontSize: 30, color: "#fff", background: m.color ?? RED, borderRadius: 18, padding: "4px 16px", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                    {m.label}
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
        {children}
      </div>
      {caption ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", fontFamily: ZH, fontSize: 32, color: INK }}>{caption}</div> : null}
      <Tape x={(w + pad * 2) * 0.2} y={4} w={130} rot={-13} color={tape} />
      <Tape x={(w + pad * 2) * 0.82} y={6} w={120} rot={10} color="rgba(246,213,126,0.85)" pattern="dot" />
    </div>
  );
};

// ---------------------------------------------------------------- 关键词大字：放射线 + 一下子弹出来，停一会儿缩走
export const Burst: React.FC<{ f: number; at: number; x: number; y: number; text: string; color?: string; size?: number; hold?: number; rot?: number }> = ({
  f, at, x, y, text, color = C.pink, size = 92, hold = 40, rot = -6,
}) => {
  const t = f - at;
  if (t < 0 || t > hold + 10) return null;
  const s = pop(f, at) * interpolate(t, [hold, hold + 10], [1, 0], clamp);
  const ray = ramp(f, at, at + 10);
  const w = text.length * size + 80;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - size, width: w, height: size * 2, transform: `rotate(${rot}deg) scale(${s})`, pointerEvents: "none" }}>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={w} height={size * 2}>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const r0 = w * 0.36;
          const r1 = w * (0.46 + 0.1 * (i % 2)) * ray;
          return <line key={i} x1={w / 2 + Math.cos(a) * r0} y1={size + Math.sin(a) * r0 * 0.42} x2={w / 2 + Math.cos(a) * Math.max(r0, r1)} y2={size + Math.sin(a) * Math.max(r0, r1) * 0.42} stroke={i % 2 ? C.lemon : color} strokeWidth={8} strokeLinecap="round" />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: size * 0.45, textAlign: "center", fontFamily: ZH, fontSize: size, color, WebkitTextStroke: "14px #fff", paintOrder: "stroke", whiteSpace: "nowrap", filter: "drop-shadow(0 6px 0 rgba(41,72,106,0.18))" }}>{text}</div>
    </div>
  );
};

// ---------------------------------------------------------------- 会动的奶糖：ElevenLabs GIF 动图 → sprite_gif.py 补到 40 帧、抠成透明 webm（64 帧正好一小节）
export const Gif: React.FC<{ f: number; name: "wave" | "sleepy" | "star"; x: number; feet: number; height: number; from: number; to: number; flip?: boolean }> = ({
  f, name, x, feet, height, from, to, flip,
}) => {
  if (f < from - 2 || f > to + 12) return null;
  const inn = ramp(f, from, from + 12);
  const out = ramp(f, to, to + 10);
  const jump = Math.sin(inn * Math.PI) * 70;
  const w = (height * 512) / 912;
  return (
    <div
      style={{
        position: "absolute", left: x - w / 2, top: feet - height, width: w, height,
        transform: `translateY(${(1 - inn) * 420 + out * 420 - jump}px) scaleX(${flip ? -1 : 1})`,
        filter: "drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff) drop-shadow(0 14px 16px rgba(41,72,106,0.25))",
      }}
    >
      <Loop durationInFrames={BAR}>
        <OffthreadVideo src={asset(`naitang/${name}.webm`)} transparent muted style={{ width: "100%", height: "100%" }} />
      </Loop>
    </div>
  );
};

// 节拍：这一帧离上一拍过了多少（0..1），用来让东西每拍跳一下
export const beatPhase = (g: number) => (((g % BEAT) + BEAT) % BEAT) / BEAT;
export const hopAmt = (g: number) => {
  const p = beatPhase(g);
  return p < 0.5 ? Math.sin(p * 2 * Math.PI) : 0;
};
