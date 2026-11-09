// 手帐的积木：纸、胶带、拍立得、印章、手绘线、荧光笔、便利贴、贴纸、气泡、小按钮、打字
import React from "react";
import { Img, interpolate, spring } from "remotion";
import { C, TEXT, ZH, asset } from "../theme";
import { BEAT, FPS } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const INK = "#3B4F6B";
export const INK_SOFT = "#7A8CA5";
export const RED = "#E8697D";
export const PAPER = "#FFFDF6";

export const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

// 弹出来：0 → 1 带回弹（f 是这一页的本地帧）
export const pop = (f: number, at: number, soft = false) =>
  f < at ? 0 : spring({ frame: f - at, fps: FPS, config: soft ? { damping: 14, stiffness: 150 } : { damping: 10, stiffness: 220, mass: 0.6 } });

// 拍子：本地帧落在第几拍；每拍开头鼓一下
export const thump = (g: number, amount = 0.03) => {
  const p = (((g % BEAT) + BEAT) % BEAT) / BEAT;
  return 1 + amount * Math.exp(-p * 7);
};

// 伪随机（同一个种子每帧一样）
export const rnd = (i: number, k = 0) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 手绘线条的一点抖动：每 4 帧换一次（一秒七八张的步进感）
export const wobble = (f: number, seed = 0, amp = 1) => (rnd(Math.floor(f / 4) + seed * 13, 3) - 0.5) * 2 * amp;

// ---------------------------------------------------------------- 纸
export const DotPaper: React.FC<{ style?: React.CSSProperties; tint?: string }> = ({ style, tint = PAPER }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: tint,
      backgroundImage: "radial-gradient(rgba(108,180,234,0.32) 1.8px, transparent 2px)",
      backgroundSize: "34px 34px",
      backgroundPosition: "17px 17px",
      ...style,
    }}
  />
);

// ---------------------------------------------------------------- 胶带：半透明、带条纹，两头是锯齿
const TAPE_PATTERNS: Record<string, (c: string) => string> = {
  stripe: (c) => `repeating-linear-gradient(-45deg, ${c} 0 10px, rgba(255,255,255,0.55) 10px 18px)`,
  dot: (c) => `radial-gradient(rgba(255,255,255,0.8) 3px, transparent 3.5px) 0 0 / 16px 16px, ${c}`,
  plain: (c) => c,
  grid: (c) => `linear-gradient(rgba(255,255,255,0.6) 2px, transparent 2px) 0 0 / 14px 14px, linear-gradient(90deg, rgba(255,255,255,0.6) 2px, transparent 2px) 0 0 / 14px 14px, ${c}`,
};
const zig = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 10; i++) pts.push(`${i % 2 ? 3 : 0}% ${i * 10}%`);
  for (let i = 10; i >= 0; i--) pts.push(`${i % 2 ? 97 : 100}% ${i * 10}%`);
  return `polygon(${pts.join(",")})`;
})();

export const Tape: React.FC<{ x: number; y: number; w: number; h?: number; rot?: number; color?: string; pattern?: keyof typeof TAPE_PATTERNS; f?: number; at?: number }> = ({
  x, y, w, h = 44, rot = -4, color = "rgba(244,163,188,0.75)", pattern = "stripe", f, at,
}) => {
  const s = f === undefined || at === undefined ? 1 : ramp(f, at, at + 5);
  if (s <= 0) return null;
  return (
    <div
      style={{
        position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h,
        transform: `rotate(${rot}deg) scaleX(${0.4 + 0.6 * s})`, opacity: s,
        background: TAPE_PATTERNS[pattern](color), clipPath: zig, boxShadow: "0 2px 3px rgba(0,0,0,0.06)",
      }}
    />
  );
};

// ---------------------------------------------------------------- 拍立得：从上面落下来、转正，上边两条胶带
export const Polaroid: React.FC<{
  f: number; at: number; x: number; y: number; w: number; h: number; src: string;
  pos?: string; rot?: number; caption?: string; children?: React.ReactNode; tape?: string; zoom?: number; fit?: "cover" | "contain"; bg?: string;
}> = ({ f, at, x, y, w, h, src, pos = "center", rot = -3, caption, children, tape = "rgba(142,212,181,0.8)", zoom = 1, fit = "cover", bg = "#fff" }) => {
  const s = pop(f, at, true);
  if (f < at) return null;
  const pad = 18;
  const bottom = caption ? 74 : pad;
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: w + pad * 2, height: h + pad + bottom,
        transform: `translateY(${(1 - s) * -60}px) rotate(${rot + (1 - s) * 8}deg) scale(${1.15 - 0.15 * s})`, opacity: Math.min(1, s * 1.5),
        background: "#fff", boxShadow: "0 14px 28px rgba(41,72,106,0.18), 0 2px 4px rgba(41,72,106,0.12)", borderRadius: 4,
      }}
    >
      <div style={{ position: "absolute", left: pad, top: pad, width: w, height: h, overflow: "hidden", background: bg }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: pos, transform: `scale(${zoom})`, transformOrigin: pos }} />
        {children}
      </div>
      {caption ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: ZH, fontSize: 34, color: INK }}>{caption}</div>
      ) : null}
      <Tape x={(w + pad * 2) * 0.22} y={4} w={130} rot={-14} color={tape} />
      <Tape x={(w + pad * 2) * 0.8} y={6} w={120} rot={11} color={tape} pattern="dot" />
    </div>
  );
};

// ---------------------------------------------------------------- 印章：一下子砸下来，油墨边缘毛毛的
export const Stamp: React.FC<{ f: number; at: number; x: number; y: number; text: string; sub?: string; color?: string; rot?: number; size?: number; round?: boolean }> = ({
  f, at, x, y, text, sub, color = RED, rot = -12, size = 64, round,
}) => {
  if (f < at) return null;
  const t = f - at;
  const s = interpolate(t, [0, 4, 7], [2.2, 0.94, 1], clamp);
  const o = interpolate(t, [0, 3], [0, 0.92], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: o, filter: "url(#ink)" }}>
      <div
        style={{
          border: `${size * 0.09}px solid ${color}`, outline: `${size * 0.04}px solid ${color}`, outlineOffset: size * 0.08,
          borderRadius: round ? "50%" : size * 0.22, padding: round ? `${size * 0.5}px ${size * 0.38}px` : `${size * 0.12}px ${size * 0.36}px`,
          color, fontFamily: ZH, fontSize: size, lineHeight: 1.05, textAlign: "center", whiteSpace: "nowrap",
        }}
      >
        {text}
        {sub ? <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: size * 0.32, letterSpacing: 2, marginTop: 2 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

// 油墨毛边的滤镜，整片放一份
export const InkFilter: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <filter id="ink">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" />
    </filter>
    <filter id="rough">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
    </filter>
  </svg>
);

// ---------------------------------------------------------------- 手绘线：一笔画出来
export const Draw: React.FC<{ f: number; at: number; dur?: number; d: string; color?: string; width?: number; x?: number; y?: number; w: number; h: number; fill?: string; dash?: boolean }> = ({
  f, at, dur = 12, d, color = INK, width = 5, x = 0, y = 0, w, h, fill, dash,
}) => {
  const p = ramp(f, at, at + dur);
  if (p <= 0) return null;
  return (
    <svg style={{ position: "absolute", left: x, top: y, overflow: "visible" }} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={dash ? "0.02 0.025" : "1 1"} strokeDashoffset={dash ? 0 : 1 - p} style={dash ? { clipPath: `inset(0 ${100 - p * 100}% 0 0)` } : undefined} />
      {fill && p >= 1 ? <path d={d} fill={fill} stroke="none" opacity={ramp(f, at + dur, at + dur + 6)} /> : null}
    </svg>
  );
};

// 荧光笔：从左往右刷过去
export const Marker: React.FC<{ f: number; at: number; x: number; y: number; w: number; h?: number; color?: string; rot?: number; dur?: number }> = ({
  f, at, x, y, w, h = 30, color = "rgba(246,213,126,0.7)", rot = -1.5, dur = 8,
}) => {
  const p = ramp(f, at, at + dur);
  if (p <= 0) return null;
  return <div style={{ position: "absolute", left: x, top: y, width: w * p, height: h, background: color, borderRadius: h / 2, transform: `rotate(${rot}deg)`, transformOrigin: "left center" }} />;
};

// ---------------------------------------------------------------- 页眉：编号胶带 + 手写标题 + 荧光笔
export const Header: React.FC<{ f: number; no: string; title: string; en: string; color?: string }> = ({ f, no, title, en, color = C.blue }) => {
  const s = pop(f, 2);
  const tw = title.length * 76;
  return (
    <>
      <div style={{ position: "absolute", left: 96, top: 70, transform: `rotate(-6deg) scale(${s})`, width: 112, height: 112, borderRadius: 56, background: color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 0 rgba(41,72,106,0.15)" }}>
        <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 50, color: "#fff" }}>{no}</span>
      </div>
      <Marker f={f} at={6} x={232} y={128} w={tw + 30} h={34} color={`${color}66`} />
      <div style={{ position: "absolute", left: 240, top: 66, fontFamily: ZH, fontSize: 76, color: INK, opacity: ramp(f, 3, 8), transform: `translateX(${(1 - ramp(f, 3, 10)) * -20}px)`, whiteSpace: "nowrap" }}>{title}</div>
      <div style={{ position: "absolute", left: 250 + tw + 40, top: 104, fontFamily: TEXT, fontWeight: 500, fontSize: 32, color: INK_SOFT, opacity: ramp(f, 8, 14), whiteSpace: "nowrap" }}>{en}</div>
    </>
  );
};

// ---------------------------------------------------------------- 便利贴
export const Note: React.FC<{ f: number; at: number; x: number; y: number; w: number; h: number; color?: string; rot?: number; children?: React.ReactNode }> = ({
  f, at, x, y, w, h, color = C.lemonLight, rot = 2, children,
}) => {
  const s = pop(f, at, true);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: "top center", background: color, boxShadow: "0 10px 18px rgba(41,72,106,0.14)", borderRadius: "2px 2px 18px 2px", padding: 24, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: "50%", top: -14, width: 110, height: 30, marginLeft: -55, background: "rgba(255,255,255,0.6)", transform: "rotate(-3deg)" }} />
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- 表情贴纸：白边、弹出、轻轻晃
export const Sticker: React.FC<{ f: number; at: number; x: number; y: number; size: number; name: string; rot?: number; bob?: number; out?: number }> = ({
  f, at, x, y, size, name, rot = 0, bob = 6, out,
}) => {
  const s = pop(f, at) * (out === undefined ? 1 : 1 - ramp(f, out, out + 6));
  if (s <= 0) return null;
  const beat = ((((f - at) % BEAT) + BEAT) % BEAT) / BEAT;
  const b = Math.sin((f - at) / 9 + x) * bob - (beat < 0.5 ? Math.sin(beat * 2 * Math.PI) * 10 : 0);
  return (
    <Img
      src={asset(`img/${name}.png`)}
      style={{
        position: "absolute", left: x - size / 2, top: y - size / 2 + b, width: size, height: size, objectFit: "contain",
        transform: `rotate(${rot + Math.sin((f - at) / 14 + y) * 3}deg) scale(${s})`,
        filter: "drop-shadow(0 0 0 #fff) drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 8px 10px rgba(41,72,106,0.2))",
      }}
    />
  );
};

// ---------------------------------------------------------------- 小部件
export const Card: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; s?: number; color?: string; border?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  x, y, w, h, rot = 0, s = 1, color = "#fff", border = C.blueLight, children, style,
}) =>
  s <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg) scale(${s})`, background: color, border: `4px solid ${border}`, borderRadius: 26, boxShadow: "0 10px 22px rgba(41,72,106,0.12)", boxSizing: "border-box", overflow: "hidden", ...style }}>
      {children}
    </div>
  );

export const Chip: React.FC<{ text: string; color?: string; bg?: string; size?: number; style?: React.CSSProperties }> = ({ text, color = INK, bg = C.blueLight, size = 30, style }) => (
  <span style={{ display: "inline-block", fontFamily: ZH, fontSize: size, color, background: bg, borderRadius: size, padding: `${size * 0.18}px ${size * 0.6}px`, whiteSpace: "nowrap", ...style }}>{text}</span>
);

export const Button: React.FC<{ f: number; press?: number; text: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ f, press, text, color = C.pink, size = 32, style }) => {
  const down = press !== undefined && f >= press && f < press + 6 ? 0.9 : 1;
  return (
    <span style={{ display: "inline-block", fontFamily: ZH, fontSize: size, color: "#fff", background: color, borderRadius: size, padding: `${size * 0.28}px ${size * 0.8}px`, boxShadow: `0 ${down < 1 ? 2 : 6}px 0 rgba(41,72,106,0.18)`, transform: `scale(${down}) translateY(${down < 1 ? 4 : 0}px)`, whiteSpace: "nowrap", ...style }}>{text}</span>
  );
};

// 打字：按帧一个字一个字出来，末尾一根闪的光标
export const Typer: React.FC<{ f: number; at: number; text: string; cps?: number; style?: React.CSSProperties; caret?: boolean }> = ({ f, at, text, cps = 14, style, caret = true }) => {
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - at) / FPS) * cps)));
  const done = n >= text.length;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {caret && f >= at && (!done || Math.floor(f / 10) % 2 === 0) ? <span style={{ color: C.pink }}>|</span> : null}
    </span>
  );
};

// 打勾的方框
export const Check: React.FC<{ f: number; at: number; x: number; y: number; size?: number; color?: string }> = ({ f, at, x, y, size = 46, color = C.mint }) => (
  <>
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: 10, border: `4px solid ${INK_SOFT}`, boxSizing: "border-box", background: f >= at ? `${color}55` : "#fff" }} />
    <Draw f={f} at={at} dur={6} x={x} y={y} w={size} h={size} d={`M ${size * 0.18} ${size * 0.5} L ${size * 0.42} ${size * 0.75} L ${size * 0.95} ${size * 0.05}`} color={RED} width={6} />
  </>
);

// 小星星、小爱心的闪光
export const Twinkle: React.FC<{ f: number; at: number; x: number; y: number; size?: number; color?: string; kind?: "star" | "heart" | "spark" }> = ({ f, at, x, y, size = 40, color = C.lemon, kind = "spark" }) => {
  const t = f - at;
  if (t < 0 || t > 40) return null;
  const s = interpolate(t, [0, 6, 30, 40], [0, 1.15, 1, 0], clamp);
  const d =
    kind === "heart" ? "M 0 8 C -14 -6, -30 6, -16 20 L 0 34 L 16 20 C 30 6, 14 -6, 0 8 Z" :
    kind === "star" ? "M0,-24 L7,-8 L24,-7 L11,4 L15,22 L0,12 L-15,22 L-11,4 L-24,-7 L-7,-8 Z" :
    "M 0 -22 L 5 -5 L 22 0 L 5 5 L 0 22 L -5 5 L -22 0 L -5 -5 Z";
  return (
    <svg style={{ position: "absolute", left: x - size, top: y - size, overflow: "visible" }} width={size * 2} height={size * 2} viewBox="-30 -30 60 60">
      <path d={d} fill={color} stroke="#fff" strokeWidth={3} transform={`scale(${s}) rotate(${t * 3})`} />
    </svg>
  );
};

// 手绘箭头（从 a 指到 b，中间拱起来）
export const Arrow: React.FC<{ f: number; at: number; ax: number; ay: number; bx: number; by: number; bend?: number; color?: string; width?: number }> = ({ f, at, ax, ay, bx, by, bend = 60, color = INK, width = 5 }) => {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const ang = Math.atan2(by - cy, bx - cx);
  const hx1 = bx - 22 * Math.cos(ang - 0.45);
  const hy1 = by - 22 * Math.sin(ang - 0.45);
  const hx2 = bx - 22 * Math.cos(ang + 0.45);
  const hy2 = by - 22 * Math.sin(ang + 0.45);
  return (
    <>
      <Draw f={f} at={at} dur={10} w={1920} h={1080} d={`M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`} color={color} width={width} />
      <Draw f={f} at={at + 9} dur={4} w={1920} h={1080} d={`M ${hx1} ${hy1} L ${bx} ${by} L ${hx2} ${hy2}`} color={color} width={width} />
    </>
  );
};
