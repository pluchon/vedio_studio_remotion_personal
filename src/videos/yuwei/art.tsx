// 海报上的插画：填色、分块、印刷感。不靠描边当主体。
import React, { useId, useMemo } from "react";
import { C, FONT_EN, FONT_NUM, FONT_ZH } from "./theme";

const mix = (a: number, b: number, p: number) => a + (b - a) * p;

const Drops: React.FC<{ t: number; n?: number; w: number; h: number; color?: string }> = ({ t, n = 70, w, h, color = C.rain }) => {
  const drops = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        x: ((i * 97 + 13) % 1000) / 1000,
        y: ((i * 53 + 29) % 1000) / 1000,
        s: 0.55 + ((i * 17) % 10) / 18,
        v: 0.22 + ((i * 11) % 8) / 24,
        fat: i % 4 === 0,
      })),
    [n],
  );
  return (
    <g>
      {drops.map((d, i) => {
        const y = ((d.y + t * d.v) % 1.15) * h - 30;
        const x = d.x * w;
        const hh = d.fat ? 46 * d.s : 26 * d.s;
        return <rect key={i} x={x} y={y} width={d.fat ? 6 : 3.2} height={hh} rx={3} fill={color} opacity={0.4 + d.s * 0.4} />;
      })}
    </g>
  );
};

const Building: React.FC<{ x: number; y: number; bw: number; bh: number; i: number; lit: number[] }> = ({ x, y, bw, bh, i, lit }) => {
  const cols = Math.max(2, Math.floor(bw / 28));
  const rows = Math.max(3, Math.floor(bh / 36));
  return (
    <g>
      <rect x={x} y={y} width={bw} height={bh} fill={i % 2 ? C.navy : "#2a3a4c"} />
      <polygon points={`${x},${y} ${x + bw / 2},${y - 36 - (i % 3) * 8} ${x + bw},${y}`} fill={i % 3 === 0 ? C.roof : C.terracotta} />
      {i % 2 === 0 ? <rect x={x + bw * 0.62} y={y - 58} width={18} height={32} fill={C.navyDeep} /> : null}
      {Array.from({ length: cols * rows }, (_, k) => {
        const cx = k % cols;
        const cy = Math.floor(k / cols);
        const on = lit.includes(k);
        return (
          <rect
            key={k}
            x={x + 8 + cx * ((bw - 12) / cols)}
            y={y + 12 + cy * ((bh - 16) / rows)}
            width={Math.max(8, (bw - 12) / cols - 8)}
            height={Math.max(10, (bh - 16) / rows - 8)}
            fill={on ? C.gold : "#151c28"}
            opacity={on ? 0.95 : 0.7}
          />
        );
      })}
    </g>
  );
};

export const WindowNight: React.FC<{ t: number; w?: number; h?: number }> = ({ t, w = 1200, h = 780 }) => (
  <svg width={w} height={h} viewBox="0 0 1200 780">
    <rect width="1200" height="780" fill={C.navyDeep} />
    <rect x="0" y="0" width="1200" height="220" fill={C.night} />
    <ellipse cx="200" cy="70" rx="160" ry="40" fill={C.slate} opacity="0.32" />
    <ellipse cx="620" cy="50" rx="240" ry="48" fill={C.slate} opacity="0.24" />
    <ellipse cx="1040" cy="80" rx="150" ry="36" fill={C.slate} opacity="0.28" />
    <Building x={20} y={210} bw={150} bh={360} i={0} lit={[4, 11]} />
    <Building x={150} y={180} bw={140} bh={400} i={1} lit={[2, 9, 16]} />
    <Building x={270} y={230} bw={170} bh={340} i={2} lit={[7]} />
    <Building x={430} y={160} bw={155} bh={430} i={3} lit={[3, 10, 18]} />
    <Building x={570} y={200} bw={145} bh={390} i={4} lit={[5]} />
    <Building x={700} y={170} bw={180} bh={420} i={5} lit={[1, 12, 20]} />
    <Building x={870} y={220} bw={150} bh={360} i={6} lit={[8, 14]} />
    <Building x={1010} y={190} bw={170} bh={400} i={7} lit={[6, 15]} />
    {/* 湿地面反光 */}
    <rect x="0" y="560" width="1200" height="220" fill="#121820" />
    <g opacity="0.35">
      <rect x="180" y="600" width="18" height="40" fill={C.gold} />
      <rect x="470" y="620" width="16" height="36" fill={C.gold} />
      <rect x="760" y="590" width="20" height="50" fill={C.gold} />
      <rect x="1040" y="630" width="14" height="30" fill={C.gold} />
    </g>
    <Drops t={t} w={1200} h={780} />
    <g fill={C.paperLight}>
      <rect x="0" y="0" width="1200" height="26" />
      <rect x="0" y="754" width="1200" height="26" />
      <rect x="0" y="0" width="26" height="780" />
      <rect x="1174" y="0" width="26" height="780" />
      <rect x="390" y="0" width="20" height="780" />
      <rect x="790" y="0" width="20" height="780" />
      <rect x="0" y="378" width="1200" height="20" />
    </g>
  </svg>
);

export const LampDraw: React.FC<{ glow?: number; w?: number; h?: number }> = ({ glow = 1, w = 360, h = 460 }) => {
  const id = useId();
  return (
    <svg width={w} height={h} viewBox="0 0 360 460">
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor={C.lamp} stopOpacity={0.95 * glow} />
          <stop offset="50%" stopColor={C.gold} stopOpacity={0.28 * glow} />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="180" cy="428" rx="150" ry="20" fill={C.gold} opacity={0.4 * glow} />
      <polygon points="70,200 290,200 250,428 110,428" fill={`url(#${id}-g)`} />
      {/* 灯罩：上窄下宽，开口朝下 */}
      <path d="M118 78 L242 78 L300 198 L60 198 Z" fill={C.goldDeep} />
      <path d="M128 88 L232 88 L278 188 L82 188 Z" fill={C.gold} />
      <ellipse cx="180" cy="78" rx="62" ry="12" fill={C.lamp} />
      <ellipse cx="180" cy="198" rx="120" ry="14" fill={C.goldDeep} />
      <ellipse cx="180" cy="194" rx="86" ry="10" fill={C.lamp} opacity="0.85" />
      <rect x="168" y="198" width="24" height="128" rx="6" fill={C.goldDeep} />
      <rect x="174" y="204" width="6" height="116" fill={C.lamp} opacity="0.45" />
      <ellipse cx="180" cy="338" rx="54" ry="14" fill={C.goldDeep} />
      <ellipse cx="180" cy="332" rx="54" ry="12" fill={C.gold} />
      <circle cx="180" cy="70" r="6" fill={C.white} opacity="0.9" />
    </svg>
  );
};

export const Spectrum: React.FC<{ kind: "white" | "rain"; t?: number }> = ({ kind, t = 0 }) => {
  const labels = ["31", "63", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];
  const white = labels.map(() => 0.82);
  const rain = [1, 0.86, 0.72, 0.58, 0.46, 0.36, 0.26, 0.18, 0.12, 0.07];
  const hs = kind === "white" ? white : rain;
  const color = kind === "white" ? C.ink : C.rain;
  const flicker = kind === "white" ? 0.05 * Math.sin(t * 28) : 0;
  const axis = kind === "white" ? C.ink : C.rain;
  return (
    <svg width="540" height="360" viewBox="0 0 540 360">
      <rect x="44" y="16" width="1.5" height="280" fill={axis} opacity="0.4" />
      <rect x="44" y="296" width="470" height="1.5" fill={axis} opacity="0.4" />
      {hs.map((hh, i) => {
        const bh = (hh + flicker * (i % 3 === 0 ? 1 : 0)) * 250;
        return (
          <g key={i}>
            <rect x={64 + i * 44} y={296 - bh} width={30} height={bh} rx={3} fill={color} opacity={0.92 - i * 0.02} />
            <text x={79 + i * 44} y={322} textAnchor="middle" fontFamily={FONT_EN} fontSize="11" fill={kind === "white" ? C.muted : C.rain}>
              {labels[i]}
            </text>
          </g>
        );
      })}
      <text x="44" y="14" fontFamily={FONT_EN} fontSize="12" fill={kind === "white" ? C.muted : C.lamp}>
        {kind === "white" ? "0 dB / oct" : "听感 ~ −3 dB / oct"}
      </text>
    </svg>
  );
};

export const SnowTV: React.FC<{ t: number; w?: number; h?: number }> = ({ t, w = 320, h = 180 }) => {
  const cols = 32;
  const rows = 18;
  const cells = useMemo(
    () => Array.from({ length: cols * rows }, (_, i) => ({ i, x: i % cols, y: Math.floor(i / cols) })),
    [],
  );
  const frame = Math.floor(t * 24);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${cols} ${rows}`}>
      <rect width={cols} height={rows} fill="#1a1a18" />
      {cells.map((c) => {
        const n = Math.sin((c.i + 1.13) * 12.9898 + frame * 0.71) * 43758.5453;
        const v = n - Math.floor(n);
        return <rect key={c.i} x={c.x} y={c.y} width="1" height="1" fill={v > 0.52 ? "#e8e2d6" : "#2c2a26"} />;
      })}
    </svg>
  );
};

export const Quilt: React.FC<{ w?: number; h?: number }> = ({ w = 480, h = 300 }) => {
  const cells = [C.terracotta, C.paperLight, C.gold, C.tealSoft, C.paperDeep, C.roof, C.lamp, C.paperLight, C.terracotta, C.gold, C.paperDeep, C.tealSoft];
  return (
    <svg width={w} height={h} viewBox="0 0 480 300">
      <rect x="28" y="248" width="430" height="28" rx="8" fill={C.ink} opacity="0.12" />
      <rect x="24" y="36" width="432" height="228" rx="18" fill={C.terracotta} />
      <rect x="36" y="48" width="408" height="204" rx="12" fill={C.paperLight} />
      {cells.map((c, i) => (
        <rect key={i} x={48 + (i % 4) * 96} y={60 + Math.floor(i / 4) * 60} width="88" height="52" rx="6" fill={c} />
      ))}
      <rect x="36" y="48" width="408" height="204" rx="12" fill="none" stroke={C.ink} strokeWidth="4" opacity="0.2" />
      <path d="M60 70 Q 240 90 420 68" fill="none" stroke={C.white} strokeWidth="7" opacity="0.35" />
    </svg>
  );
};

export const Waveform: React.FC<{ flat: number; w?: number; h?: number }> = ({ flat, w = 980, h = 220 }) => {
  const base = [0.22, 0.28, 0.24, 0.3, 0.26, 0.29, 0.25, 0.27, 0.24, 0.26, 0.23, 0.28, 0.25, 0.27, 0.24];
  const spikeAt = 8;
  return (
    <svg width={w} height={h} viewBox="0 0 980 220">
      <rect width="980" height="220" fill={C.paperDeep} />
      {base.map((b, i) => {
        const spike = i === spikeAt ? mix(0.94, 0.3, flat) : mix(b, 0.38, flat * 0.4);
        const hh = spike * 170;
        return (
          <rect
            key={i}
            x={36 + i * 62}
            y={118 - hh / 2}
            width={40}
            height={hh}
            rx={7}
            fill={i === spikeAt ? C.stamp : C.navy}
            opacity={i === spikeAt ? 0.92 : 0.6}
          />
        );
      })}
      <text x="36" y="28" fontFamily={FONT_EN} fontSize="14" fill={C.muted}>
        突发声的落差
      </text>
    </svg>
  );
};

export const DoorDraw: React.FC<{ open: number }> = ({ open }) => {
  const swing = 6 + open * 26;
  return (
    <svg width="240" height="320" viewBox="0 0 240 320">
      <rect x="18" y="14" width="204" height="292" fill={C.paperDeep} stroke={C.ink} strokeWidth="7" />
      <rect x="30" y="26" width="24" height="268" fill={C.navyDeep} />
      <g transform={`rotate(${-swing} 54 294)`}>
        <rect x="54" y="26" width="154" height="268" fill={C.terracotta} />
        <rect x="68" y="44" width="126" height="72" fill={C.roof} />
        <rect x="68" y="132" width="126" height="72" fill={C.roof} />
        <rect x="68" y="220" width="126" height="54" fill={C.roof} />
        <circle cx="184" cy="168" r="11" fill={C.gold} />
        <circle cx="184" cy="168" r="4" fill={C.goldDeep} />
      </g>
    </svg>
  );
};

export const CarDraw: React.FC = () => (
  <svg width="420" height="220" viewBox="0 0 420 220">
    <ellipse cx="210" cy="190" rx="170" ry="14" fill={C.navy} opacity="0.16" />
    <path d="M42 152 L76 108 L148 84 L274 84 L344 118 L380 152 L380 172 L42 172 Z" fill={C.navy} />
    <path d="M88 108 L146 90 L262 90 L322 118 L88 118 Z" fill={C.slate} />
    <rect x="156" y="94" width="50" height="20" fill="#9ec4d2" opacity="0.75" />
    <rect x="220" y="94" width="50" height="20" fill="#9ec4d2" opacity="0.75" />
    <circle cx="116" cy="172" r="28" fill={C.ink} />
    <circle cx="116" cy="172" r="13" fill={C.muted} />
    <circle cx="318" cy="172" r="28" fill={C.ink} />
    <circle cx="318" cy="172" r="13" fill={C.muted} />
    <rect x="368" y="140" width="18" height="14" rx="3" fill={C.lamp} />
    <g fill="none" stroke={C.gold} strokeWidth="5" strokeLinecap="round">
      <path d="M392 128 Q 420 150 392 172" opacity="0.95" />
      <path d="M406 116 Q 448 150 406 184" opacity="0.55" />
      <path d="M418 104 Q 474 150 418 196" opacity="0.28" />
    </g>
  </svg>
);

export const EyeBadge: React.FC = () => (
  <svg width="220" height="220" viewBox="0 0 220 220">
    <circle cx="110" cy="110" r="100" fill={C.navy} />
    <circle cx="110" cy="110" r="86" fill={C.night} />
    <path d="M42 104 Q110 62 178 104 Q110 88 42 104 Z" fill={C.paperLight} />
    <path d="M48 112 Q110 152 172 112" fill="none" stroke={C.gold} strokeWidth="7" strokeLinecap="round" />
    <circle cx="110" cy="104" r="6" fill={C.gold} />
  </svg>
);

export const SunDraw: React.FC<{ dim: number; size?: number }> = ({ dim, size = 200 }) => {
  const r = mix(78, 26, dim);
  return (
    <svg width={size} height={size} viewBox="0 0 220 220">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 110 + Math.cos(a) * (r + 6);
        const y1 = 110 + Math.sin(a) * (r + 6);
        const x2 = 110 + Math.cos(a) * (r + 26 * (1 - dim * 0.65));
        const y2 = 110 + Math.sin(a) * (r + 26 * (1 - dim * 0.65));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.gold} strokeWidth={6} strokeLinecap="round" opacity={0.9 - dim * 0.55} />;
      })}
      <circle cx="110" cy="110" r={r} fill={C.gold} />
      <circle cx="96" cy="98" r={r * 0.2} fill={C.lamp} opacity="0.85" />
    </svg>
  );
};

export const DuvetDraw: React.FC<{ w?: number; h?: number }> = ({ w = 720, h = 480 }) => (
  <svg width={w} height={h} viewBox="0 0 720 480">
    <ellipse cx="360" cy="420" rx="280" ry="28" fill={C.ink} opacity="0.1" />
    <rect x="60" y="110" width="600" height="280" rx="32" fill={C.paperDeep} />
    <rect x="76" y="92" width="568" height="268" rx="28" fill={C.paperLight} />
    <path d="M100 200 C 180 160, 260 220, 360 190 C 460 160, 540 210, 620 180 L 620 340 C 520 370, 400 330, 300 350 C 200 370, 120 330, 100 300 Z" fill="#efe6d0" />
    <path d="M140 250 C 240 220, 340 270, 460 240 C 540 220, 600 250, 610 280 L 600 330 C 500 350, 360 320, 240 340 C 160 350, 130 310, 140 250 Z" fill={C.cream} />
    <g fill="none" stroke={C.ink} strokeWidth="2.4" opacity="0.16">
      <path d="M120 150 L 180 340" />
      <path d="M240 140 L 280 350" />
      <path d="M360 135 L 370 355" />
      <path d="M480 140 L 460 350" />
      <path d="M580 155 L 540 340" />
      <path d="M90 200 L 630 210" />
      <path d="M90 270 L 630 280" />
    </g>
    <rect x="110" y="70" width="210" height="78" rx="22" fill={C.cream} />
    <rect x="122" y="82" width="186" height="28" rx="12" fill={C.white} opacity="0.55" />
    <path d="M160 130 Q 360 160 580 140" fill="none" stroke={C.white} strokeWidth="10" opacity="0.28" />
  </svg>
);

export const CalendarDraw: React.FC<{ cancel: number }> = ({ cancel }) => {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  return (
    <svg width="520" height="640" viewBox="0 0 520 640">
      <rect width="520" height="640" fill={C.cream} />
      <rect width="520" height="96" fill={C.navy} />
      <text x="260" y="62" textAnchor="middle" fontFamily={FONT_ZH} fontSize="38" fill={C.lamp}>
        十月
      </text>
      {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
        <text key={d} x={44 + ["日", "一", "二", "三", "四", "五", "六"].indexOf(d) * 68} y="132" textAnchor="middle" fontFamily={FONT_ZH} fontSize="16" fill={C.muted}>
          {d}
        </text>
      ))}
      {days.map((d, i) => {
        const x = 44 + (i % 7) * 68;
        const y = 186 + Math.floor(i / 7) * 90;
        const xed = d >= 12 && d <= 18 && cancel > (d - 12) / 5;
        return (
          <g key={d}>
            <rect x={x - 26} y={y - 30} width="52" height="54" rx="8" fill={xed ? "rgba(179,58,46,0.12)" : "transparent"} />
            <text x={x} y={y} textAnchor="middle" fontFamily={FONT_NUM} fontSize="22" fill={xed ? C.stamp : C.ink}>
              {d}
            </text>
            {xed ? (
              <g stroke={C.stamp} strokeWidth="4" strokeLinecap="round">
                <line x1={x - 16} y1={y - 18} x2={x + 16} y2={y + 12} />
                <line x1={x + 16} y1={y - 18} x2={x - 16} y2={y + 12} />
              </g>
            ) : null}
          </g>
        );
      })}
      <rect x="40" y="560" width="440" height="56" rx="10" fill={C.stamp} opacity="0.12" />
      <text x="260" y="596" textAnchor="middle" fontFamily={FONT_ZH} fontSize="26" fill={C.stamp}>
        RAIN CHECK
      </text>
    </svg>
  );
};

export const Breath: React.FC<{ t: number }> = ({ t }) => {
  const p = (Math.sin(t * Math.PI * 0.35) + 1) / 2;
  const r = 70 + p * 50;
  return (
    <svg width="420" height="420" viewBox="0 0 420 420">
      <circle cx="210" cy="210" r={r + 36} fill={C.teal} opacity="0.1" />
      <circle cx="210" cy="210" r={r} fill="none" stroke={C.teal} strokeWidth="10" opacity="0.35" />
      <circle cx="210" cy="210" r={r * 0.62} fill="none" stroke={C.teal} strokeWidth="10" opacity="0.55" />
      <circle cx="210" cy="210" r="34" fill={C.navy} />
      <text x="210" y="218" textAnchor="middle" fontFamily={FONT_ZH} fontSize="22" fill={C.lamp}>
        {p > 0.5 ? "吸" : "呼"}
      </text>
    </svg>
  );
};

export const EvenRain: React.FC<{ t: number }> = ({ t }) => {
  const cols = 11;
  return (
    <svg width="640" height="720" viewBox="0 0 640 720">
      <rect width="640" height="720" fill={C.navyDeep} />
      {Array.from({ length: cols }, (_, i) =>
        Array.from({ length: 10 }, (_, k) => {
          const x = 36 + i * 54;
          const y = ((k * 72 + t * 64) % 720) - 16;
          return <rect key={`${i}-${k}`} x={x} y={y} width="7" height="32" rx="3" fill={C.rain} opacity="0.85" />;
        }),
      )}
    </svg>
  );
};

export const PapersDraw: React.FC = () => (
  <svg width="620" height="760" viewBox="0 0 620 760">
    <g transform="rotate(-8 310 380)">
      <rect x="70" y="36" width="500" height="680" fill={C.paperDeep} stroke={C.ink} strokeWidth="3" />
    </g>
    <g transform="rotate(4 310 380)">
      <rect x="58" y="56" width="500" height="680" fill="#efe4c8" stroke={C.ink} strokeWidth="3" />
    </g>
    <rect x="80" y="76" width="500" height="680" fill={C.cream} stroke={C.ink} strokeWidth="4" />
    <rect x="80" y="76" width="500" height="74" fill={C.navy} />
    <text x="330" y="124" textAnchor="middle" fontFamily={FONT_EN} fontSize="16" fill={C.lamp} letterSpacing="3">
      SLEEP MEDICINE REVIEWS
    </text>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <rect key={i} x="118" y={180 + i * 48} width={i === 3 ? 260 : 420} height="11" rx="4" fill={C.ink} opacity={0.16} />
    ))}
    <rect x="118" y="324" width="360" height="36" fill={C.stamp} opacity="0.12" />
    <text x="118" y="700" fontFamily={FONT_EN} fontSize="16" fill={C.muted}>
      Riedy et al. 2021 · GRADE very low
    </text>
  </svg>
);

export const FourIcons: React.FC<{ which: "sky" | "lamp" | "window" | "duvet" }> = ({ which }) => {
  if (which === "sky") {
    return (
      <svg width="240" height="160" viewBox="0 0 240 160">
        <rect width="240" height="160" fill={C.slate} />
        <ellipse cx="70" cy="48" rx="56" ry="18" fill={C.navy} opacity="0.4" />
        <ellipse cx="160" cy="38" rx="70" ry="22" fill={C.navy} opacity="0.3" />
        <rect x="0" y="110" width="240" height="50" fill={C.navy} opacity="0.35" />
      </svg>
    );
  }
  if (which === "lamp") return <LampDraw w={200} h={160} />;
  if (which === "window") return <WindowNight t={1} w={240} h={160} />;
  return <DuvetDraw w={240} h={160} />;
};

export const WorldRoom: React.FC<{ shut: number }> = ({ shut }) => {
  const s = mix(1, 0.38, shut);
  const room = mix(0, 1, Math.max(0, shut - 0.12) / 0.88);
  const id = useId();
  return (
    <svg width="720" height="720" viewBox="0 0 720 720">
      <rect width="720" height="720" fill={C.navyDeep} />
      <defs>
        <clipPath id={id}>
          <circle cx="360" cy="360" r="248" />
        </clipPath>
      </defs>
      <g transform={`translate(360 360) scale(${s}) translate(-360 -360)`} opacity={1 - room * 0.2}>
        <circle cx="360" cy="360" r="248" fill="#1a5870" />
        <g clipPath={`url(#${id})`} fill="none" stroke={C.lamp} strokeWidth="1.6" opacity="0.28">
          {[-0.6, -0.3, 0, 0.3, 0.6].map((k) => (
            <ellipse key={k} cx="360" cy="360" rx={248 * Math.cos(k)} ry="248" />
          ))}
          {[-120, -60, 0, 60, 120].map((y) => (
            <ellipse key={y} cx="360" cy={360 + y} rx={Math.max(40, 248 * Math.cos((y / 248) * 1.2))} ry="28" />
          ))}
        </g>
        <g clipPath={`url(#${id})`} fill="#3f8f6c">
          <path d="M170 250 C 190 210 250 200 280 230 C 310 250 300 300 270 330 C 240 360 200 350 180 320 C 160 290 155 270 170 250 Z" />
          <path d="M250 360 C 270 350 290 380 280 430 C 270 470 250 490 240 470 C 230 440 230 390 250 360 Z" />
          <path d="M340 240 C 360 220 400 225 410 250 C 400 270 370 275 350 265 Z" />
          <path d="M400 240 C 470 210 560 230 580 280 C 590 320 540 340 500 330 C 460 350 430 320 420 290 C 410 260 390 250 400 240 Z" />
          <path d="M390 330 C 430 320 450 370 430 430 C 410 470 380 460 375 420 C 370 380 375 345 390 330 Z" />
          <path d="M530 430 C 555 420 575 440 560 455 C 545 468 520 450 530 430 Z" />
        </g>
        <circle cx="360" cy="360" r="248" fill="none" stroke={C.lamp} strokeWidth="6" opacity="0.5" />
        <ellipse cx="290" cy="280" rx="64" ry="28" fill={C.white} opacity="0.12" />
      </g>
      <g opacity={room}>
        <rect x="248" y="268" width="224" height="184" fill={C.paperDeep} stroke={C.ink} strokeWidth="8" />
        <rect x="268" y="290" width="72" height="100" fill={C.navy} />
        <rect x="276" y="298" width="56" height="38" fill={C.rainDeep} />
        <rect x="360" y="328" width="72" height="92" fill={C.gold} />
        <rect x="248" y="452" width="224" height="16" fill={C.terracotta} />
      </g>
    </svg>
  );
};

export const ProspectSplit: React.FC<{ t: number }> = ({ t }) => {
  const id = useId();
  return (
  <svg width="1480" height="820" viewBox="0 0 1480 820">
    <clipPath id={id}>
      <rect width="740" height="820" />
    </clipPath>
    <g clipPath={`url(#${id})`}>
      <WindowNight t={t} w={740} h={820} />
    </g>
    <g transform="translate(740 0)">
      <rect width="740" height="820" fill="#f0e2c4" />
      <rect x="0" y="430" width="740" height="390" fill={C.terracotta} />
      <rect x="0" y="410" width="740" height="28" fill={C.roof} />
      <ellipse cx="370" cy="620" rx="220" ry="80" fill={C.paperDeep} />
      <ellipse cx="370" cy="610" rx="180" ry="50" fill={C.paperLight} />
      <g transform="translate(240 40) scale(0.85)">
        <LampDraw />
      </g>
      <rect x="520" y="90" width="160" height="250" fill={C.navy} />
      <rect x="538" y="112" width="124" height="88" fill={C.rainDeep} />
      <rect x="538" y="216" width="124" height="88" fill={C.rainDeep} />
    </g>
    <rect x="728" y="0" width="24" height="820" fill={C.ink} />
    <text x="370" y="64" textAnchor="middle" fontFamily={FONT_ZH} fontSize="36" fill={C.lamp}>
      瞭望
    </text>
    <text x="1110" y="64" textAnchor="middle" fontFamily={FONT_ZH} fontSize="36" fill={C.ink}>
      庇护
    </text>
  </svg>
  );
};

export const DropSticker: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 40 56">
    <path d="M20 4 C 20 4, 36 24, 36 34 A 16 16 0 1 1 4 34 C 4 24, 20 4, 20 4 Z" fill={C.rainDeep} />
    <ellipse cx="14" cy="30" rx="5" ry="8" fill={C.white} opacity="0.35" />
  </svg>
);
