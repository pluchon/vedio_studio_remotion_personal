// 纸、海报卡、贴纸、胶带、印章、镜头。颜色和字体由这一期自己定。
import React, { useEffect, useId, useState } from "react";
import { Easing, interpolate, spring, staticFile, cancelRender, continueRender, delayRender } from "remotion";
import { C, FONT_EN, FONT_ITAL, FONT_NUM, FONT_SONG, FONT_ZH, FONT_ZH_BOLD, FPS, HEIGHT, WIDTH, asset } from "./theme";

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.5, 0, 0.9, 0.4),
};

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const lerp = (t: number, a: number, b: number, from = 0, to = 1, easing = EASE.inOut) =>
  interpolate(t, [a, b], [from, to], { ...CLAMP, easing });

export const ramp = (t: number, a: number, b: number, easing = EASE.inOut) => lerp(t, a, b, 0, 1, easing);

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export const pop = (t: number, at: number, bounce = 1) =>
  t < at
    ? 0
    : spring({
        frame: (t - at) * FPS,
        fps: FPS,
        config: { damping: 12 / bounce, stiffness: 160, mass: 0.7 },
      });

export const appear = (t: number, at: number, dur = 0.55) => ramp(t, at, at + dur, EASE.out);

let loading: Promise<void> | null = null;
const loadFonts = () => {
  loading ??= Promise.all([
    new FontFace(FONT_ZH, `url('${staticFile(asset("fonts/NotoSansSC-Black.ttf"))}')`).load(),
    new FontFace(FONT_ZH_BOLD, `url('${staticFile(asset("fonts/NotoSansSC-Bold.ttf"))}')`).load(),
    new FontFace(FONT_SONG, `url('${staticFile(asset("fonts/NotoSerifSC-Regular.otf"))}')`).load(),
    new FontFace(FONT_NUM, `url('${staticFile(asset("fonts/Poppins-Black.ttf"))}')`).load(),
    new FontFace(FONT_EN, `url('${staticFile(asset("fonts/Montserrat-ExtraBold.ttf"))}')`).load(),
    new FontFace(FONT_ITAL, `url('${staticFile(asset("fonts/PlayfairDisplay-Italic-variable.ttf"))}')`).load(),
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

export type Cam = { t: number; x: number; y: number; s: number; r: number };

export const track = (t: number, keys: Cam[], pick: (k: Cam) => number) =>
  keys.length === 1
    ? pick(keys[0])
    : interpolate(
        t,
        keys.map((k) => k.t),
        keys.map(pick),
        { ...CLAMP, easing: EASE.inOut },
      );

export const PaperSheet: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const id = useId();
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id={`${id}-fiber`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.8" numOctaves="3" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.72  0 0 0 0 0.64  0 0 0 0 0.48  0 0 0 0.38 0" />
        </filter>
        <pattern id={`${id}-dot`} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="6" r="1.1" fill={C.ink} opacity="0.05" />
          <circle cx="18" cy="19" r="0.8" fill={C.ink} opacity="0.04" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={C.paper} />
      <rect width={w} height={h} fill={`url(#${id}-dot)`} />
      <rect width={w} height={h} filter={`url(#${id}-fiber)`} style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
};

export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  fill?: string;
  radius?: number;
  thick?: number;
  t: number;
  at?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, rot = 0, fill = C.cream, radius = 10, thick = 8, t, at = -1, children, style }) => {
  const k = at < 0 ? 1 : pop(t, at, 0.85);
  if (k <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: fill,
        borderRadius: radius,
        transform: `rotate(${rot}deg) scale(${0.86 + 0.14 * k})`,
        transformOrigin: "50% 50%",
        opacity: Math.min(1, k * 1.8),
        boxShadow: `${thick}px ${thick + 4}px 0 ${C.paperDeep}, 14px 22px 40px rgba(40, 28, 16, 0.22)`,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Sticker: React.FC<{
  x: number;
  y: number;
  rot?: number;
  t: number;
  at: number;
  pad?: number;
  radius?: number;
  children: React.ReactNode;
}> = ({ x, y, rot = 0, t, at, pad = 14, radius = 22, children }) => {
  const k = pop(t, at, 1.05);
  if (k <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: pad,
        background: C.white,
        borderRadius: radius,
        border: `5px solid ${C.ink}`,
        boxShadow: `0 10px 0 rgba(30, 22, 16, 0.16), 10px 18px 28px rgba(30, 22, 16, 0.18)`,
        transform: `rotate(${rot + (1 - k) * 10}deg) scale(${k})`,
        transformOrigin: "50% 50%",
        opacity: Math.min(1, k * 1.6),
      }}
    >
      {children}
    </div>
  );
};

export const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number; color?: string }> = ({
  x,
  y,
  w = 92,
  rot = 8,
  color = C.tape,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 28,
      background: color,
      transform: `rotate(${rot}deg)`,
      clipPath: "polygon(2% 10%, 98% 0%, 100% 55%, 96% 100%, 3% 92%, 0 48%)",
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  />
);

export const Stamp: React.FC<{
  x: number;
  y: number;
  t: number;
  at: number;
  rot?: number;
  label: string;
  sub?: string;
  ok?: boolean;
}> = ({ x, y, t, at, rot = -12, label, sub, ok = false }) => {
  const k = pop(t, at, 1.2);
  if (k <= 0.001) return null;
  const color = ok ? C.teal : C.stamp;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 168,
        height: 168,
        border: `6px solid ${color}`,
        borderRadius: "50%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${rot}deg) scale(${0.7 + 0.3 * k})`,
        opacity: 0.92 * Math.min(1, k * 1.4),
        mixBlendMode: "multiply",
        background: "rgba(255,250,242,0.12)",
      }}
    >
      <div style={{ fontFamily: FONT_ZH, fontSize: 28, color, letterSpacing: 2 }}>{label}</div>
      {sub ? <div style={{ fontFamily: FONT_EN, fontSize: 11, color, letterSpacing: 2, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.goldDeep }) => (
  <div
    style={{
      fontFamily: FONT_EN,
      fontSize: 15,
      letterSpacing: "0.28em",
      color,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string; tracking?: number }> = ({
  children,
  size = 64,
  color = C.ink,
  tracking = 6,
}) => (
  <div style={{ fontFamily: FONT_ZH, fontSize: size, color, letterSpacing: tracking, lineHeight: 1.05 }}>{children}</div>
);

export const Note: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.inkSoft, size = 18 }) => (
  <div style={{ fontFamily: FONT_SONG, fontSize: size, color, lineHeight: 1.45 }}>{children}</div>
);

export const Halftone: React.FC<{ color?: string; opacity?: number }> = ({ color = C.ink, opacity = 0.14 }) => {
  const id = useId();
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      <defs>
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.35" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

export const ScreenGrain: React.FC = () => {
  const id = useId();
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "multiply" }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="9" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 52%, rgba(40,28,16,0.28) 100%)",
        }}
      />
    </div>
  );
};
