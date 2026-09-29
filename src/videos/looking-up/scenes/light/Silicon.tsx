// 光 · 屏息：黑里一道电火花跳了几下（和序里那堆火遥遥相对）；最终爆发那一拍闪白。
// 然后一捧沙旋进来，聚成一枚晶圆，晶圆上一格格亮起来，回路从晶圆边上一路长到画面外
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Grain } from "../../../../shared/Grain";
import { Locator } from "../../components/Locator";
import { Subtitle } from "../../components/Subtitle";
import { EASE_IN_OUT, EASE_OUT, SEGMENTS, SPACE, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.silicon);
const C = { x: 960, y: 470 };
const WAFER = 250;
const WARM = "#ffcf7a";
const COOL = "#8fd3ff";

// 电火花：两点之间一条抖动的折线，每两帧换一个形状
const Spark: React.FC = () => {
  const frame = useCurrentFrame();
  const on =
    (frame > t(234.3) && frame < t(234.45)) || (frame > t(234.9) && frame < t(235.05)) || (frame > t(235.4) && frame < t(236.3));
  const flash = interpolate(frame, [t(236.29), t(236.4), t(236.9)], [0, 0.85, 0], clamp);
  const grow = interpolate(frame, [t(235.4), t(236.29)], [0.8, 1.8], clamp);
  const seed = Math.floor(frame / 2);
  const pts = Array.from({ length: 12 }, (_, i) => {
    const x = C.x - 90 * grow + (i / 11) * 180 * grow;
    const y = C.y + (i === 0 || i === 11 ? 0 : (random(`spark-${seed}-${i}`) - 0.5) * 40 * grow);
    return `${x},${y}`;
  }).join(" ");
  return (
    <AbsoluteFill>
      {on && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <filter id="lu-spark-glow">
            <feGaussianBlur stdDeviation={8} />
          </filter>
          <polyline points={pts} fill="none" stroke={COOL} strokeWidth={10} filter="url(#lu-spark-glow)" opacity={0.8} />
          <polyline points={pts} fill="none" stroke="#f4fbff" strokeWidth={2.4} />
          <circle cx={C.x - 90 * grow} cy={C.y} r={4} fill="#f4fbff" />
          <circle cx={C.x + 90 * grow} cy={C.y} r={4} fill="#f4fbff" />
        </svg>
      )}
      <AbsoluteFill style={{ backgroundColor: "#f4fbff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// 沙粒：从画面底部旋进来，落进晶圆的圆里
const SAND = Array.from({ length: 520 }, (_, i) => {
  const r = (k: string) => random(`sand-${i}-${k}`);
  const a = r("a") * Math.PI * 2;
  const d = Math.sqrt(r("d")) * (WAFER - 10);
  return {
    from: { x: r("x") * 1920, y: 1000 + r("y") * 160 },
    to: { x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d },
    delay: r("delay") * 22,
    size: 1.2 + r("s") * 2.4,
    tone: ["#d9b98a", "#c9a36e", "#efd8ae"][Math.floor(r("c") * 3)],
  };
});

// 晶圆上的一格格芯片
const DIE = 30;
const DIES = (() => {
  const list: { x: number; y: number; at: number }[] = [];
  for (let gx = -WAFER; gx < WAFER; gx += DIE + 4) {
    for (let gy = -WAFER; gy < WAFER; gy += DIE + 4) {
      if (Math.hypot(gx + DIE / 2, gy + DIE / 2) < WAFER - 24) list.push({ x: C.x + gx, y: C.y + gy, at: random(`die-${gx}-${gy}`) });
    }
  }
  return list;
})();

// 回路：从晶圆边沿径向伸出，再折成横线、竖线，一路走到画面外
const TRACES = Array.from({ length: 34 }, (_, i) => {
  const r = (k: string) => random(`trace-${i}-${k}`);
  const a = (i / 34) * Math.PI * 2 + r("a") * 0.1;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const p0 = { x: C.x + dx * (WAFER + 6), y: C.y + dy * (WAFER + 6) };
  const p1 = { x: C.x + dx * (WAFER + 60 + r("r") * 120), y: C.y + dy * (WAFER + 60 + r("r") * 120) };
  const p2 = { x: p1.x + Math.sign(dx) * (180 + r("h") * 520), y: p1.y };
  const p3 = { x: p2.x, y: p2.y + Math.sign(dy) * (60 + r("v") * 260) };
  const p4 = { x: p3.x + Math.sign(dx) * 1200, y: p3.y };
  return { d: `M${p0.x} ${p0.y} L${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y}`, at: r("at") * 40, color: i % 3 === 0 ? COOL : WARM };
});

const Chip: React.FC = () => {
  const frame = useCurrentFrame();
  const start = t(236.4);
  const wafer = interpolate(frame, [t(238.8), t(239.6)], [0, 1], { ...clamp, easing: EASE_OUT });
  const sandFade = interpolate(frame, [t(239.2), t(239.9)], [1, 0], clamp);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="lu-trace-glow">
          <feGaussianBlur stdDeviation={4} />
        </filter>
      </defs>
      {sandFade > 0 &&
        SAND.map((s, i) => {
          const k = interpolate(frame, [start + s.delay, start + s.delay + 60], [0, 1], { ...clamp, easing: EASE_IN_OUT });
          if (k <= 0) return null;
          // 旋进来：在直线插值上叠一段绕晶圆中心的转角
          const swirl = (1 - k) * 2.2;
          const bx = s.from.x + (s.to.x - s.from.x) * k - C.x;
          const by = s.from.y + (s.to.y - s.from.y) * k - C.y;
          const x = C.x + bx * Math.cos(swirl) - by * Math.sin(swirl);
          const y = C.y + bx * Math.sin(swirl) + by * Math.cos(swirl);
          return <circle key={i} cx={x} cy={y} r={s.size} fill={s.tone} opacity={sandFade} />;
        })}
      {wafer > 0 && (
        <g opacity={wafer}>
          <circle cx={C.x} cy={C.y} r={WAFER} fill="#0f131b" stroke="#d8c49a" strokeWidth={2} />
          {DIES.map((d, i) => {
            const lit = interpolate(frame, [t(239.6) + d.at * 30, t(239.6) + d.at * 30 + 6], [0, 1], clamp);
            return <rect key={i} x={d.x} y={d.y} width={DIE} height={DIE} fill={WARM} opacity={0.12 + lit * 0.55} />;
          })}
          <rect x={C.x - 14} y={C.y + WAFER - 6} width={28} height={10} fill={SPACE.bg} />
        </g>
      )}
      {TRACES.map((tr, i) => {
        const p = interpolate(frame, [t(240.9) + tr.at, t(240.9) + tr.at + 40], [0, 1], { ...clamp, easing: EASE_OUT });
        if (p <= 0) return null;
        const pulse = ((frame - t(240.9) - tr.at) / 45) % 1;
        return (
          <g key={i}>
            <path d={tr.d} fill="none" stroke={tr.color} strokeWidth={6} pathLength={1} strokeDasharray={`${p} 1`} filter="url(#lu-trace-glow)" opacity={0.5} />
            <path d={tr.d} fill="none" stroke={tr.color} strokeWidth={1.6} pathLength={1} strokeDasharray={`${p} 1`} />
            {p >= 1 && <path d={tr.d} fill="none" stroke="#ffffff" strokeWidth={3} pathLength={1} strokeDasharray="0.03 1" strokeDashoffset={-pulse} />}
          </g>
        );
      })}
    </svg>
  );
};

export const Silicon: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
    <Chip />
    <Spark />
    {/* 左上角垫一层暗，回路线从定位标底下穿过时字仍看得清 */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 30% 22% at 12% 6%, rgba(4,5,11,0.92) 0%, rgba(4,5,11,0) 100%)" }} />
    <Locator year="1947" place="贝尔实验室 · 新泽西 · 晶体管" at={t(236.5)} out={t(240.6)} tone="space" />
    <Locator year="1958" place="达拉斯 · 第一块集成电路" at={t(240.9)} tone="space" />
    <Subtitle
      zh={["我们从沙里炼出硅，在硅里刻出回路，", "让回路学会了回答。"]}
      en={["We refined silicon from sand, etched circuits into the silicon,", "and taught the circuits to answer."]}
      at={t(237.2)}
      out={t(245.0)}
      tone="space"
    />
    <Grain opacity={0.06} vignette={0.3} />
  </AbsoluteFill>
);
