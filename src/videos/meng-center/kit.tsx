// 这一期的积木：字体、跟着节拍的动效、背景、浏览器窗口、胶带标题、贴纸、颜文字、小图标
import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  spring,
} from "remotion";
import { BEAT, C, FONT_EN, FONT_KAO, FONT_ZH, FPS, KAO, TEXT, ZH, asset } from "./theme";

// ---------------------------------------------------------------- 字体
let loading: Promise<void> | null = null;
const loadFonts = () => {
  loading ??= Promise.all([
    new FontFace(FONT_ZH, `url('${asset("fonts/ZCOOLKuaiLe-Regular.ttf")}')`).load(),
    new FontFace(FONT_EN, `url('${asset("fonts/Fredoka.ttf")}')`, { weight: "300 700" }).load(),
    new FontFace(FONT_KAO, `url('${asset("fonts/MPLUSRounded1c-Bold.ttf")}')`).load(),
  ]).then((faces) => faces.forEach((f) => document.fonts.add(f)));
  return loading;
};

export const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("载入字体"));
  useEffect(() => {
    loadFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return ready;
};

// ---------------------------------------------------------------- 动效
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const lerp = (f: number, a: number, b: number, from = 0, to = 1, easing = EASE) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing });

// 弹出来：0 → 1，带一点回弹
export const pop = (f: number, at: number, soft = false) =>
  f < at ? 0 : spring({ frame: f - at, fps: FPS, config: soft ? { damping: 14, stiffness: 140 } : { damping: 9, stiffness: 200, mass: 0.6 } });

// 每一拍开头跳一下：返回 0 → 1 → 0 的高度（拍内前段起、后段落）
export const hop = (f: number, offset = 0) => {
  const p = (((f - offset) % BEAT) + BEAT) % BEAT / BEAT;
  return Math.sin(Math.PI * Math.min(1, p * 1.6)) * (p < 0.625 ? 1 : 0);
};

// 每一拍开头鼓一下：1 → 1 + amount，很快回落
export const thump = (f: number, amount = 0.04, offset = 0) => {
  const p = (((f - offset) % BEAT) + BEAT) % BEAT / BEAT;
  return 1 + amount * Math.exp(-p * 7);
};

// 拍点帧：第几拍（可以是小数，0.5 是后半拍；配乐的后半拍推迟到 64%）
export const at = (beat: number) => {
  const whole = Math.floor(beat);
  const frac = beat - whole;
  return Math.round((whole + (Math.abs(frac - 0.5) < 1e-6 ? 0.64 : frac)) * BEAT);
};

// ---------------------------------------------------------------- 背景：方格纸上飘着雪花和泡泡
const flakes = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 397) % 1920,
  y: (i * 211) % 1080,
  s: 18 + ((i * 7) % 5) * 9,
  v: 0.6 + ((i * 13) % 7) * 0.18,
  kind: i % 3,
  phase: i * 1.7,
}));

export const Snowflake: React.FC<{ size: number; color: string; style?: React.CSSProperties }> = ({ size, color, style }) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24" style={style}>
    {[0, 60, 120].map((r) => (
      <g key={r} transform={`rotate(${r})`} stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none">
        <line x1={0} y1={-10} x2={0} y2={10} />
        <path d="M -3 -7 L 0 -4.5 L 3 -7 M -3 7 L 0 4.5 L 3 7" />
      </g>
    ))}
  </svg>
);

export const Background: React.FC<{ f: number; tint?: string; grid?: string; check?: boolean }> = ({ f, tint = C.paper, grid = C.grid, check }) => {
  const lines = check
    ? `repeating-linear-gradient(0deg, ${grid}88 0 40px, transparent 40px 80px), repeating-linear-gradient(90deg, ${grid}88 0 40px, transparent 40px 80px)`
    : `repeating-linear-gradient(0deg, ${grid} 0 2px, transparent 2px 56px), repeating-linear-gradient(90deg, ${grid} 0 2px, transparent 2px 56px)`;
  return (
    <AbsoluteFill style={{ background: tint }}>
      <AbsoluteFill style={{ backgroundImage: lines, backgroundPosition: `${(f * 0.6) % 56}px ${(f * 0.4) % 56}px`, opacity: 0.9 }} />
      {flakes.map((p, i) => {
        const y = ((p.y + f * p.v * 1.4) % 1180) - 60;
        const x = p.x + Math.sin(f / 40 + p.phase) * 30;
        const color = [C.blue, C.pink, C.lemon][p.kind];
        if (p.kind === 1) {
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: p.s * 0.7, height: p.s * 0.7, borderRadius: "50%", border: `3px solid ${C.pink}88`, background: `${C.white}55` }} />;
        }
        return <Snowflake key={i} size={p.s} color={`${color}aa`} style={{ position: "absolute", left: x, top: y, rotate: `${f * p.v + p.phase * 40}deg` }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 浏览器窗口：圆角、顶上三颗小圆点和地址栏，里面是网页截图
export type WindowProps = {
  f: number;
  src: string;
  // 截图本身的像素宽高（prepare.py 裁好的）
  imgW: number;
  imgH: number;
  x: number;
  y: number;
  // 窗口内容区的宽高（屏幕像素）
  w: number;
  h: number;
  enter?: number;
  from?: "bottom" | "right" | "left" | "top";
  tilt?: number;
  url?: string;
  // 镜头：放大倍数和焦点（截图像素坐标），可以是随帧变化的值
  zoom?: number;
  focus?: [number, number];
  children?: React.ReactNode;
};

export const Window: React.FC<WindowProps> = ({ f, src, imgW, imgH, x, y, w, h, enter = 0, from = "bottom", tilt = 0, url = "127.0.0.1:5173", zoom = 1, focus, children }) => {
  const p = pop(f, enter, true);
  const off = (1 - p) * 900;
  const dx = from === "right" ? off : from === "left" ? -off : 0;
  const dy = from === "bottom" ? off : from === "top" ? -off : 0;
  // 截图先按宽度铺满，再按焦点放大
  const base = w / imgW;
  const s = base * zoom;
  const [fx, fy] = focus ?? [imgW / 2, Math.min(imgH, h / base) / 2];
  let left = w / 2 - fx * s;
  let top = h / 2 - fy * s;
  left = Math.min(0, Math.max(w - imgW * s, left));
  top = Math.min(0, Math.max(h - imgH * s, top));
  const bar = 44;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2 + dx,
        top: y - (h + bar) / 2 + dy,
        width: w,
        height: h + bar,
        borderRadius: 26,
        background: C.white,
        boxShadow: `0 18px 0 ${C.blueLight}, 0 30px 60px rgba(47,100,176,0.22)`,
        border: `4px solid ${C.white}`,
        overflow: "hidden",
        rotate: `${tilt * p + (1 - p) * (from === "bottom" ? 6 : -4)}deg`,
        opacity: Math.min(1, p * 3),
      }}
    >
      <div style={{ height: bar, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: `linear-gradient(90deg, ${C.blueLight}, ${C.pinkLight})` }}>
        {[C.pink, C.lemon, C.mint].map((c) => (
          <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
        ))}
        <div style={{ marginLeft: 14, padding: "4px 18px", borderRadius: 14, background: `${C.white}cc`, fontFamily: TEXT, fontSize: 18, color: C.inkSoft }}>{url}</div>
      </div>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
        <Img src={src} style={{ position: "absolute", left, top, width: imgW * s, height: imgH * s }} />
        {children ? <div style={{ position: "absolute", left, top, width: imgW * s, height: imgH * s }}>{children}</div> : null}
      </div>
    </div>
  );
};

// 截图坐标里的圈注：一个会呼吸的圆角框，配一颗闪光
export const Ring: React.FC<{ f: number; at: number; x: number; y: number; w: number; h: number; scale: number; color?: string }> = ({ f, at: start, x, y, w, h, scale, color = C.pink }) => {
  const p = pop(f, start);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (x - w / 2) * scale,
        top: (y - h / 2) * scale,
        width: w * scale,
        height: h * scale,
        borderRadius: 999,
        border: `${5}px dashed ${color}`,
        boxShadow: `0 0 0 6px ${color}33`,
        scale: `${(0.6 + 0.4 * p) * thump(f, 0.05)}`,
        opacity: Math.min(1, p * 2),
      }}
    />
  );
};

// ---------------------------------------------------------------- 胶带标题：一条斜贴的纸胶带，上面是大字，下面一行小字
export const Tape: React.FC<{ f: number; at?: number; x: number; y: number; title: string; sub?: string; color?: string; rot?: number; size?: number; align?: "left" | "center" }> = ({ f, at: start = 0, x, y, title, sub, color = C.blue, rot = -2.5, size = 64, align = "left" }) => {
  const p = pop(f, start);
  const subP = pop(f, start + 8, true);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${align === "center" ? "-50%" : "0"})`, display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
      <div
        style={{
          padding: `${size * 0.16}px ${size * 0.5}px ${size * 0.22}px`,
          background: `repeating-linear-gradient(45deg, ${color} 0 18px, ${color}cc 18px 36px)`,
          color: C.white,
          fontFamily: ZH,
          fontSize: size,
          lineHeight: 1.1,
          rotate: `${rot}deg`,
          scale: `${p}`,
          textShadow: `0 3px 0 ${C.ink}55`,
          boxShadow: `0 8px 18px ${C.ink}22`,
          clipPath: "polygon(0 6%, 2% 0, 98% 4%, 100% 0, 99% 94%, 100% 100%, 2% 96%, 0 100%)",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 16,
            padding: "8px 22px",
            borderRadius: 18,
            background: C.white,
            border: `3px solid ${color}`,
            color: C.ink,
            fontFamily: ZH,
            fontSize: size * 0.44,
            whiteSpace: "nowrap",
            opacity: subP,
            translate: `0 ${(1 - subP) * 20}px`,
            boxShadow: `0 6px 0 ${color}55`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- 贴纸：弹出来，之后跟着拍子轻轻跳
export const Sticker: React.FC<{ f: number; src: string; at: number; x: number; y: number; size: number; rot?: number; bob?: number; flip?: boolean; out?: number }> = ({ f, src, at: start, x, y, size, rot = 0, bob = 10, flip, out }) => {
  const p = pop(f, start);
  const gone = out === undefined ? 1 : 1 - lerp(f, out, out + 8, 0, 1, EASE_IN_OUT);
  if (p <= 0 || gone <= 0) return null;
  const lift = f > start + 10 ? hop(f, start) * bob : 0;
  return (
    <Img
      src={src}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2 - lift,
        width: size,
        height: size,
        scale: `${p * gone * (flip ? -1 : 1)} ${p * gone}`,
        rotate: `${rot + Math.sin((f - start) / 9) * 4}deg`,
        filter: `drop-shadow(0 8px 0 ${C.ink}18)`,
      }}
    />
  );
};

// ---------------------------------------------------------------- 颜文字气泡
export const Kao: React.FC<{ f: number; at: number; x: number; y: number; text: string; color?: string; size?: number; rot?: number }> = ({ f, at: start, x, y, text, color = C.pink, size = 40, rot = 0 }) => {
  const p = pop(f, start);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - Math.sin((f - start) / 14) * 8,
        transform: "translate(-50%, -50%)",
        padding: `${size * 0.2}px ${size * 0.55}px`,
        borderRadius: 999,
        background: C.white,
        border: `3px solid ${color}`,
        boxShadow: `0 5px 0 ${color}66`,
        fontFamily: KAO,
        fontSize: size,
        color: C.ink,
        whiteSpace: "nowrap",
        scale: `${p}`,
        rotate: `${rot}deg`,
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------- 四角星闪光：弹出后转一下消失
export const Sparkle: React.FC<{ f: number; at: number; x: number; y: number; size?: number; color?: string }> = ({ f, at: start, x, y, size = 46, color = C.lemon }) => {
  const t = f - start;
  if (t < 0 || t > 22) return null;
  const s = Math.sin((t / 22) * Math.PI);
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, scale: `${s}`, rotate: `${t * 6}deg` }}>
      <path d="M 0 -10 Q 1.5 -1.5 10 0 Q 1.5 1.5 0 10 Q -1.5 1.5 -10 0 Q -1.5 -1.5 0 -10 Z" fill={color} stroke={C.white} strokeWidth={1.2} />
    </svg>
  );
};

// ---------------------------------------------------------------- 圆角卡片
export const Card: React.FC<{ x: number; y: number; w: number; h?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, color = C.blue, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 28,
      background: C.white,
      border: `4px solid ${color}`,
      boxShadow: `0 10px 0 ${color}55, 0 20px 40px rgba(47,100,176,0.15)`,
      fontFamily: ZH,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

// 小图标：心、星、对话泡、勾、铃铛
export const Icon: React.FC<{ kind: "heart" | "star" | "bubble" | "check" | "bell" | "search"; size: number; color: string }> = ({ kind, size, color }) => {
  const d = {
    heart: "M 0 7 C -9 0 -8 -7 -4 -7 C -2 -7 0 -5 0 -3.5 C 0 -5 2 -7 4 -7 C 8 -7 9 0 0 7 Z",
    star: "M 0 -8 L 2.4 -2.6 L 8 -2.4 L 3.6 1.2 L 5 7 L 0 3.8 L -5 7 L -3.6 1.2 L -8 -2.4 L -2.4 -2.6 Z",
    bubble: "M -8 -5 Q -8 -8 -5 -8 L 5 -8 Q 8 -8 8 -5 L 8 2 Q 8 5 5 5 L -1 5 L -5 8.5 L -4.5 5 L -5 5 Q -8 5 -8 2 Z",
    check: "M -6 0 L -2 4.5 L 6.5 -5",
    bell: "M 0 -8 C -5 -8 -6 -4 -6 0 L -7.5 4 L 7.5 4 L 6 0 C 6 -4 5 -8 0 -8 Z M -2 5.5 Q 0 8.5 2 5.5",
    search: "M 2.5 2.5 L 7.5 7.5 M 4 -2 A 6 6 0 1 1 -8 -2 A 6 6 0 1 1 4 -2 Z",
  }[kind];
  const stroke = kind === "check" || kind === "search";
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20">
      <path d={d} fill={stroke ? "none" : color} stroke={stroke ? color : C.white} strokeWidth={stroke ? 2.6 : 1} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export { C, KAO, TEXT, ZH };
