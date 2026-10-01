// 院子：水滴从窗台落下，经过屋檐的雨帘、灯笼和枝叶，换气时悬在水面上，重新起音时落进水洼。之后每个音一圈涟漪，雨渐渐停，镜头钻进水里映着的那扇窗
import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bead } from "../parts/Bead";
import { Outside, Streaks } from "../parts/Outside";
import { Plan, cameraAt, clearAt, diveAt, glowAt, heroAt, rainAt, warmAt } from "../plan";
import { Note, Score } from "../score";
import { DUSK, EAVE_Y, GROUND_Y, HEIGHT, LIP_Y, PANE, PUDDLE, WIDTH, YARD } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const frac = (value: number) => value - Math.floor(value);

// 被雨点打了一下之后的晃动：先弹出去，再晃几下停住
const kickAt = (age: number, fps: number) => {
  if (age <= 0) {
    return 0;
  }
  return (1 - spring({ frame: age * fps, fps, config: { damping: 5, stiffness: 120, mass: 0.5 } })) * Math.min(1, age * 14);
};

// 一道起伏的山脊或地面：从左到右，底下填满
const ridge = (base: number, amp: number, seed: string, scale: number, bottom: number) => {
  const points: string[] = [];
  for (let x = -40; x <= WIDTH + 40; x += 40) {
    points.push(`${x} ${(base + noise2D(seed, x / scale, 0) * amp).toFixed(1)}`);
  }
  return `M ${points.join(" L ")} L ${WIDTH + 40} ${bottom} L -40 ${bottom} Z`;
};

const FAR_RIDGES = [
  { d: ridge(640, 70, "far-1", 520, 1500), color: YARD.far, alpha: 0.5 },
  { d: ridge(760, 90, "far-2", 380, 1500), color: YARD.hill, alpha: 0.6 },
  { d: ridge(880, 60, "far-3", 300, 1500), color: YARD.roof, alpha: 0.5 },
];

// 远处的人家：屋顶两头微微翘起，前后两排，后排更淡；有几户亮着灯
const HOUSES = new Array(11).fill(0).map((_, i) => {
  const back = i % 2 === 1;
  return {
    x: -40 + i * 200 + random(`house-x-${i}`) * 110,
    w: (back ? 120 : 150) + random(`house-w-${i}`) * 80,
    h: 52 + random(`house-h-${i}`) * 38,
    y: (back ? 1395 : 1450) + random(`house-y-${i}`) * 50,
    back,
    lit: random(`house-lit-${i}`) > 0.5,
  };
});
const roofShape = (x: number, y: number, w: number, h: number) =>
  `M ${x - w - 22} ${y - 6} Q ${x - w * 0.55} ${y - h * 0.3} ${x - w * 0.16} ${y - h} L ${x + w * 0.16} ${y - h} Q ${x + w * 0.55} ${y - h * 0.3} ${x + w + 22} ${y - 6} L ${x + w} ${y + 10} L ${x - w} ${y + 10} Z`;

// 屋后的树：几团叠在一起的圆
const TREES = new Array(9).fill(0).map((_, i) => ({
  x: 30 + i * 235 + random(`tree-x-${i}`) * 120,
  y: 1400 + random(`tree-y-${i}`) * 70,
  r: 54 + random(`tree-r-${i}`) * 46,
}));

// 石头的轮廓：压扁的不规则圆
const stoneShape = (x: number, y: number, rx: number, ry: number, seed: string) => {
  const COUNT = 10;
  const points = new Array(COUNT).fill(0).map((_, k) => {
    const angle = (k / COUNT) * Math.PI * 2;
    const reach = 1 + noise2D(seed, k * 1.3, 0) * 0.2;
    return { x: x + Math.cos(angle) * rx * reach, y: y + Math.sin(angle) * ry * reach * (Math.sin(angle) > 0 ? 0.7 : 1.15) };
  });
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => `${((a.x + b.x) / 2).toFixed(1)} ${((a.y + b.y) / 2).toFixed(1)}`;
  const parts = [`M ${mid(points[COUNT - 1], points[0])}`];
  points.forEach((point, k) => {
    parts.push(`Q ${point.x.toFixed(1)} ${point.y.toFixed(1)} ${mid(point, points[(k + 1) % COUNT])}`);
  });
  return `${parts.join(" ")} Z`;
};

// 屋檐：四排瓦，越往上越淡进雾里；最下面一排瓦当，水从瓦当之间往下滴
const TILE_ROWS = [0, 1, 2, 3].map((j) => ({ y: EAVE_Y + j * 58, r: 34 + j * 5, shade: 0.5 + j * 0.16 }));
const CAP_Y = EAVE_Y + 3 * 58 + 62;
const CAP_GAP = 112;
const DRIP_Y = CAP_Y + 52;
const CAPS = new Array(Math.ceil(WIDTH / CAP_GAP) + 2).fill(0).map((_, i) => -40 + i * CAP_GAP);

const LANTERN = { x: 372, top: DRIP_Y - 6, y: 1010 };

// 从右边伸进来的一根枝条和它的叶子
const BRANCH = "M 1990 1360 C 1760 1350, 1560 1430, 1420 1540 S 1230 1640, 1160 1690";
const BRANCH_LENGTH = getLength(BRANCH);
const LEAVES = new Array(11).fill(0).map((_, i) => {
  const at = BRANCH_LENGTH * (0.2 + (i / 10) * 0.8);
  const point = getPointAtLength(BRANCH, at) ?? { x: 0, y: 0 };
  const tangent = getTangentAtLength(BRANCH, at) ?? { x: -1, y: 0 };
  const side = i % 2 === 0 ? 1 : -1;
  return {
    x: point.x,
    y: point.y,
    angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI + side * (38 + random(`leaf-a-${i}`) * 26),
    length: 96 + random(`leaf-l-${i}`) * 54,
    side,
    light: random(`leaf-c-${i}`) > 0.6,
  };
});

const leafShape = (length: number) => {
  const w = length * 0.25;
  return `M 0 0 C ${length * 0.3} ${-w}, ${length * 0.75} ${-w}, ${length} 0 C ${length * 0.75} ${w}, ${length * 0.3} ${w}, 0 0 Z`;
};

// 水洼的岸线：大致是个扁椭圆，边缘凹凸不齐
const PUDDLE_SHORE = (() => {
  const COUNT = 28;
  const points = new Array(COUNT).fill(0).map((_, k) => {
    const angle = (k / COUNT) * Math.PI * 2;
    const reach = 1 + noise2D("shore", Math.cos(angle) * 1.6, Math.sin(angle) * 1.6) * 0.09;
    return { x: PUDDLE.x + Math.cos(angle) * PUDDLE.rx * reach, y: PUDDLE.y + Math.sin(angle) * PUDDLE.ry * reach };
  });
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => `${((a.x + b.x) / 2).toFixed(1)} ${((a.y + b.y) / 2).toFixed(1)}`;
  const parts = [`M ${mid(points[COUNT - 1], points[0])}`];
  points.forEach((point, k) => {
    parts.push(`Q ${point.x.toFixed(1)} ${point.y.toFixed(1)} ${mid(point, points[(k + 1) % COUNT])}`);
  });
  return `${parts.join(" ")} Z`;
})();

const GROUND = ridge(GROUND_Y, 14, "ground", 260, GROUND_Y + 1400);
const STONES = [
  { x: 210, y: GROUND_Y + 62, rx: 120, ry: 44 },
  { x: 430, y: GROUND_Y + 44, rx: 60, ry: 26 },
  { x: 560, y: GROUND_Y + 56, rx: 84, ry: 30 },
  { x: 1170, y: GROUND_Y + 34, rx: 52, ry: 20 },
  { x: 1480, y: GROUND_Y + 50, rx: 104, ry: 38 },
  { x: 1760, y: GROUND_Y + 86, rx: 150, ry: 52 },
  { x: 120, y: PUDDLE.y + 300, rx: 170, ry: 56 },
  { x: 1830, y: PUDDLE.y + 330, rx: 190, ry: 60 },
].map((stone, i) => ({ ...stone, d: stoneShape(stone.x, stone.y, stone.rx, stone.ry, `stone-${i}`) }));
// 地上的小积水：一道道扁扁的反光
const SHEENS = new Array(14).fill(0).map((_, i) => ({
  x: 60 + random(`sheen-x-${i}`) * (WIDTH - 120),
  y: i < 7 ? GROUND_Y + 26 + random(`sheen-y-${i}`) * 60 : PUDDLE.y + PUDDLE.ry + 40 + random(`sheen-y-${i}`) * 110,
  rx: 40 + random(`sheen-r-${i}`) * 90,
}));
const TUFTS = new Array(44).fill(0).map((_, i) => {
  const u = random(`tuft-u-${i}`);
  const far = i < 26;
  return {
    x: far ? 40 + u * (WIDTH - 80) : u < 0.5 ? u * 2 * 330 : WIDTH - (u - 0.5) * 2 * 330,
    y: far ? GROUND_Y + 18 + random(`tuft-y-${i}`) * 50 : PUDDLE.y + 150 + random(`tuft-y-${i}`) * 170,
    height: far ? 26 + random(`tuft-h-${i}`) * 26 : 70 + random(`tuft-h-${i}`) * 80,
    blades: 5 + Math.floor(random(`tuft-n-${i}`) * 4),
  };
});

// 浮在水洼里的三片叶子
const FLOATERS = [
  { x: PUDDLE.x - 470, y: PUDDLE.y + 70, length: 150, angle: -12 },
  { x: PUDDLE.x - 60, y: PUDDLE.y - 120, length: 110, angle: 18 },
  { x: PUDDLE.x + 520, y: PUDDLE.y + 110, length: 130, angle: 8 },
];

type Ripple = { time: number; x: number; y: number; size: number };

// 水洼里的涟漪：主角落水那一下最大，之后每个音一圈
const makeRipples = (score: Score, plan: Plan): Ripple[] => [
  { time: plan.splash, x: plan.x, y: PUDDLE.y, size: 3 },
  ...score.notes
    .map((note, i) => ({
      time: note.time,
      x: PUDDLE.x + (frac(i * 0.75488 + 0.31) - 0.5) * 2 * PUDDLE.rx * 0.76,
      y: PUDDLE.y + (frac(i * 0.56984 + 0.13) - 0.5) * 2 * PUDDLE.ry * 0.66,
      size: 0.55 + note.strength * 0.7 + note.low * 0.5,
    }))
    .filter((ripple) => ripple.time > plan.splash + 0.05),
];

// 一圈涟漪：几道同心的椭圆往外走，落点上溅起几粒水
const RippleRings: React.FC<{ ripple: Ripple; age: number; fade: number; seed: string }> = ({ ripple, age, fade, seed }) => {
  if (age < 0 || age > 2.4) {
    return null;
  }
  const rings = ripple.size > 2 ? 5 : 3;
  return (
    <g>
      {new Array(rings).fill(0).map((_, k) => {
        const radius = (age * 190 - k * 30) * ripple.size;
        if (radius <= 0) {
          return null;
        }
        return (
          <ellipse
            key={k}
            cx={ripple.x}
            cy={ripple.y}
            rx={radius}
            ry={radius * 0.32}
            fill="none"
            stroke={YARD.ripple}
            strokeWidth={Math.max(0.6, 2.6 - age * 1.1)}
            opacity={Math.max(0, 1 - age / 2.4) * 0.6 * (1 - k * 0.17) * fade}
          />
        );
      })}
      {age < 0.5
        ? new Array(ripple.size > 2 ? 11 : 5).fill(0).map((_, n) => {
            const out = (random(`crown-x-${seed}-${n}`) - 0.5) * 150 * ripple.size;
            const up = (150 + random(`crown-y-${seed}-${n}`) * 190) * ripple.size;
            return (
              <circle
                key={n}
                cx={ripple.x + out * age * 1.6}
                cy={ripple.y - up * age + 560 * ripple.size * age * age}
                r={(1.6 + random(`crown-r-${seed}-${n}`) * 2.6) * Math.min(1.6, ripple.size)}
                fill={YARD.ripple}
                opacity={(1 - age / 0.5) * 0.85 * fade}
              />
            );
          })
        : null}
    </g>
  );
};

// 屋檐：瓦、瓦当、檐下的阴影，和一串串往下掉的水
const Eave: React.FC<{ clock: number; rain: number; notes: Note[]; clockOf: (time: number) => number }> = ({ clock, rain, notes, clockOf }) => (
  <g>
    <rect x={-10} y={EAVE_Y - 240} width={WIDTH + 20} height={260} fill="url(#yard-roof)" />
    {TILE_ROWS.map((row, j) => (
      <g key={j} opacity={row.shade}>
        {new Array(Math.ceil(WIDTH / (row.r * 2 - 6)) + 2).fill(0).map((_, i) => (
          <circle
            key={i}
            cx={-row.r + i * (row.r * 2 - 6) + (j % 2) * row.r}
            cy={row.y}
            r={row.r}
            fill={YARD.tile}
            stroke={YARD.tileEdge}
            strokeWidth={2.5}
          />
        ))}
      </g>
    ))}
    <rect x={-10} y={CAP_Y - 30} width={WIDTH + 20} height={46} fill={YARD.wood} />
    {CAPS.map((x, i) => (
      <g key={i}>
        <circle cx={x} cy={CAP_Y} r={42} fill={YARD.tile} stroke={YARD.tileEdge} strokeWidth={3} />
        <circle cx={x} cy={CAP_Y} r={27} fill="none" stroke={YARD.tileEdge} strokeWidth={2} opacity={0.7} />
        <circle cx={x} cy={CAP_Y} r={7} fill={YARD.tileEdge} opacity={0.8} />
        {/* 瓦当上沿被雨打湿的一道亮 */}
        <path d={`M ${x - 30} ${CAP_Y - 26} A 40 40 0 0 1 ${x + 30} ${CAP_Y - 26}`} fill="none" stroke="rgba(196, 220, 224, 0.35)" strokeWidth={2.5} />
      </g>
    ))}
    <rect x={-10} y={CAP_Y + 16} width={WIDTH + 20} height={120} fill="url(#yard-shade)" />
    {/* 瓦当之间一串串的水：雨越大越密 */}
    {CAPS.map((x, i) => {
      const gap = x + CAP_GAP / 2;
      const count = Math.round(2 + rain * 7);
      return new Array(count).fill(0).map((_, n) => {
        const span = 1650;
        const offset = (clock * (760 + random(`drip-v-${i}`) * 260) + random(`drip-p-${i}-${n}`) * span) % span;
        const speedUp = 0.45 + offset / span;
        return (
          <line
            key={`${i}-${n}`}
            x1={gap}
            y1={DRIP_Y + offset}
            x2={gap}
            y2={DRIP_Y + offset + 10 + 26 * speedUp}
            stroke="rgba(224, 238, 240, 1)"
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={0.3 * Math.min(1, offset / 60) * (1 - offset / span)}
          />
        );
      });
    })}
    {/* 每个音从檐口掉下一大滴 */}
    {notes.map((note, i) => {
      const age = clock - clockOf(note.time);
      if (age < 0 || age > 1.7) {
        return null;
      }
      const x = CAPS[Math.floor(random(`cap-${note.time}`) * (CAPS.length - 1))] + CAP_GAP / 2;
      const fall = 620 * age * age + 60 * age;
      const size = 5 + note.strength * 5 + note.low * 4;
      return (
        <g key={i} opacity={1 - age / 1.7}>
          <circle cx={x} cy={DRIP_Y} r={size * (1 + age * 6)} fill="none" stroke="rgba(232, 244, 244, 1)" strokeWidth={1.4} opacity={Math.max(0, 1 - age * 2.5) * 0.6} />
          <ellipse cx={x} cy={DRIP_Y + fall} rx={size} ry={size * (1.2 + age * 0.9)} fill="url(#rain-speck)" stroke="rgba(236, 246, 246, 0.6)" strokeWidth={1} />
        </g>
      );
    })}
  </g>
);

export const Yard: React.FC<{ score: Score; plan: Plan }> = ({ score, plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const ripples = useMemo(() => makeRipples(score, plan), [score, plan]);
  const fallNotes = useMemo(() => score.notes.filter((note) => note.time > plan.sill && note.time < plan.splash + 1.2), [score, plan]);

  const camera = cameraAt(plan, seconds) - LIP_Y;
  if (camera < -HEIGHT) {
    return null;
  }
  const clockOf = (time: number) => plan.clock[Math.min(plan.clock.length - 1, Math.max(0, Math.round(time * fps)))];
  const clock = clockOf(seconds);
  const flow = Math.min(1, Math.max(0.03, (plan.clock[Math.min(plan.clock.length - 1, frame + 1)] - clock) * fps));
  const hero = heroAt(plan, seconds);
  const rain = rainAt(score, plan, frame, fps);
  const clear = clearAt(plan, seconds);
  const warm = warmAt(plan, seconds);
  const dive = diveAt(plan, seconds);
  const glow = glowAt(score, frame, fps);
  const wind = noise2D("yard-wind", clock * 0.4, 0);

  // 水面的晃动：两层噪声一进一退，雨越大倒影越碎
  const wobble = 3 + rain * 20;
  // 水里那扇窗有多清楚：雨停了才不再晃
  const pane = interpolate(seconds, [plan.dive - 1.2, plan.dive + 0.9], [0, 1], clamp);
  const sinceSplash = seconds - plan.splash;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${DUSK.mid} 0%, ${DUSK.low} 70%, #8b9b96 100%)` }}>
      <AbsoluteFill style={{ background: `linear-gradient(rgba(255, 206, 150, ${0.5 * warm}) 0%, rgba(255, 226, 190, ${0.3 * warm}) 60%, rgba(255, 226, 190, 0) 100%)` }} />
      {/* 天上：雨时压着一层暗云，后来右上方云开，透出暖光 */}
      <AbsoluteFill style={{ background: `linear-gradient(rgba(20, 32, 42, ${0.5 * (1 - warm)}) 0%, rgba(20, 32, 42, 0) 34%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 62% 46% at 78% 0%, rgba(255, 232, 190, ${0.95 * warm}), rgba(255, 196, 130, ${0.4 * warm}) 45%, rgba(255, 196, 130, 0) 100%)`, opacity: 1 - dive.u }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "0 0",
          transform: `translate(${dive.toX}px, ${dive.toY}px) scale(${dive.scale}) translate(${-dive.fromX}px, ${-dive.fromY}px)`,
        }}
      >
        {/* 雾里的远山 */}
        <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", filter: "blur(5px)" }}>
          <g transform={`translate(0 ${-camera * 0.3})`}>
            {FAR_RIDGES.map((layer, i) => (
              <path key={i} d={layer.d} fill={layer.color} opacity={layer.alpha} />
            ))}
          </g>
        </svg>
        {/* 远处的屋顶，有几户亮着灯 */}
        <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", filter: "blur(2.5px)" }}>
          <g transform={`translate(0 ${-camera * 0.6})`}>
            {TREES.map((tree, i) => (
              <g key={i} opacity={0.42} fill={YARD.leafDark}>
                <circle cx={tree.x} cy={tree.y} r={tree.r} />
                <circle cx={tree.x - tree.r * 0.7} cy={tree.y + tree.r * 0.35} r={tree.r * 0.72} />
                <circle cx={tree.x + tree.r * 0.75} cy={tree.y + tree.r * 0.3} r={tree.r * 0.78} />
                <rect x={tree.x - tree.r * 1.4} y={tree.y + tree.r * 0.4} width={tree.r * 2.9} height={500} />
              </g>
            ))}
            {[...HOUSES.filter((house) => house.back), ...HOUSES.filter((house) => !house.back)].map((house, i) => (
              <g key={i} opacity={house.back ? 0.42 : 0.62}>
                <rect x={house.x - house.w * 0.86} y={house.y} width={house.w * 1.72} height={600} fill={house.back ? YARD.hill : "#51686f"} />
                <path d={roofShape(house.x, house.y, house.w, house.h)} fill={YARD.tile} />
                {house.lit ? (
                  <>
                    <circle cx={house.x - house.w * 0.3} cy={house.y + 44} r={46} fill="url(#yard-halo)" opacity={0.55 + 0.4 * (glow - 0.8) * 3} />
                    <rect x={house.x - house.w * 0.3 - 13} y={house.y + 28} width={26} height={32} fill="#ffdca6" opacity={0.9} />
                  </>
                ) : null}
              </g>
            ))}
            {/* 屋脚的一带雾 */}
            <rect x={-10} y={1470} width={WIDTH + 20} height={160} fill="url(#yard-fog)" />
          </g>
        </svg>
        <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", overflow: "visible" }}>
          <defs>
            <radialGradient id="yard-break">
              <stop offset="0%" stopColor="#ffe6bd" stopOpacity={0.95} />
              <stop offset="55%" stopColor="#ffc98c" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ffc98c" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="yard-shore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d181e" stopOpacity={0.55} />
              <stop offset="22%" stopColor="#0d181e" stopOpacity={0} />
              <stop offset="80%" stopColor="#0d181e" stopOpacity={0} />
              <stop offset="100%" stopColor="#0d181e" stopOpacity={0.4} />
            </linearGradient>
            <filter id="yard-pane">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.07" numOctaves={2} seed={5} result="one" />
              <feDisplacementMap in="SourceGraphic" in2="one" scale={wobble * 1.1 * Math.sin(clock * 2.1 + 1)} xChannelSelector="R" yChannelSelector="G" result="moved" />
              <feGaussianBlur in="moved" stdDeviation={0.3 + rain * 1.6} />
            </filter>
            <linearGradient id="yard-roof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={YARD.roof} stopOpacity={0} />
              <stop offset="100%" stopColor={YARD.roof} stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="yard-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c151a" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#0c151a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="yard-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={YARD.ground} />
              <stop offset="100%" stopColor={YARD.groundDeep} />
            </linearGradient>
            <linearGradient id="yard-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={YARD.water} />
              <stop offset="100%" stopColor={YARD.waterDeep} />
            </linearGradient>
            <linearGradient id="yard-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`rgb(${Math.round(190 + 65 * warm)}, ${Math.round(212 + 14 * warm)}, ${Math.round(210 - 26 * warm)})`} stopOpacity={0.62} />
              <stop offset="75%" stopColor="rgb(150, 180, 186)" stopOpacity={0.05 + 0.1 * warm} />
            </linearGradient>
            <linearGradient id="yard-fog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9fb2b2" stopOpacity={0} />
              <stop offset="60%" stopColor="#9fb2b2" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#9fb2b2" stopOpacity={0} />
            </linearGradient>
            <radialGradient id="yard-halo">
              <stop offset="0%" stopColor={YARD.lantern} stopOpacity={0.55} />
              <stop offset="100%" stopColor={YARD.lantern} stopOpacity={0} />
            </radialGradient>
            <clipPath id="yard-puddle">
              <path d={PUDDLE_SHORE} />
            </clipPath>
            <filter id="yard-wobble" filterUnits="userSpaceOnUse" x={PUDDLE.x - PUDDLE.rx - 60} y={PUDDLE.y - PUDDLE.ry - 60} width={PUDDLE.rx * 2 + 120} height={PUDDLE.ry * 2 + 120}>
              <feTurbulence type="fractalNoise" baseFrequency="0.004 0.022" numOctaves={2} seed={3} result="one" />
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves={2} seed={11} result="two" />
              <feDisplacementMap in="SourceGraphic" in2="one" scale={wobble * Math.sin(clock * 2.1)} xChannelSelector="R" yChannelSelector="G" result="moved" />
              <feDisplacementMap in="moved" in2="two" scale={wobble * Math.cos(clock * 2.1)} xChannelSelector="G" yChannelSelector="R" result="broken" />
              <feGaussianBlur in="broken" stdDeviation={1.2 + rain * 2.5} />
            </filter>
          </defs>
          <g transform={`translate(0 ${-camera})`}>
            {/* 窗台底下的一片阴影 */}
            <rect x={-10} y={0} width={WIDTH + 20} height={200} fill="url(#yard-shade)" />
            <Eave clock={clock} rain={rain} notes={fallNotes} clockOf={clockOf} />

            {/* 檐下挂着的灯笼，被风吹得微微晃 */}
            <g transform={`rotate(${wind * 3.5} ${LANTERN.x} ${LANTERN.top})`}>
              <circle cx={LANTERN.x} cy={LANTERN.y} r={270} fill="url(#yard-halo)" opacity={0.5 + 0.5 * (glow - 0.8) * 3} />
              <line x1={LANTERN.x} y1={LANTERN.top} x2={LANTERN.x} y2={LANTERN.y - 84} stroke={YARD.wood} strokeWidth={3} />
              <ellipse cx={LANTERN.x} cy={LANTERN.y} rx={62} ry={80} fill={YARD.lantern} />
              <ellipse cx={LANTERN.x} cy={LANTERN.y} rx={34} ry={80} fill="none" stroke="rgba(190, 110, 40, 0.5)" strokeWidth={2} />
              <ellipse cx={LANTERN.x} cy={LANTERN.y - 6} rx={30} ry={44} fill="#fff1d2" opacity={0.7} />
              <rect x={LANTERN.x - 30} y={LANTERN.y - 90} width={60} height={14} rx={4} fill={YARD.wood} />
              <rect x={LANTERN.x - 30} y={LANTERN.y + 76} width={60} height={14} rx={4} fill={YARD.wood} />
              <line x1={LANTERN.x} y1={LANTERN.y + 90} x2={LANTERN.x} y2={LANTERN.y + 150} stroke="#b9482f" strokeWidth={4} strokeLinecap="round" />
            </g>

            {/* 枝条：叶子被这个音的雨点打到，弹一下，叶尖滴下一滴 */}
            <path d={BRANCH} fill="none" stroke={YARD.leafDark} strokeWidth={9} strokeLinecap="round" />
            {LEAVES.map((leaf, i) => {
              let bounce = 0;
              let last = 99;
              fallNotes.forEach((note, n) => {
                if (n % LEAVES.length === i) {
                  const age = seconds - note.time;
                  bounce += kickAt(age, fps) * (0.5 + note.strength);
                  if (age >= 0) {
                    last = Math.min(last, clock - clockOf(note.time));
                  }
                }
              });
              const sway = noise2D(`leaf-${i}`, clock * 0.7, 0) * 4 + wind * 3;
              const angle = leaf.angle + sway + bounce * 16 * leaf.side;
              const radians = (angle * Math.PI) / 180;
              const tip = { x: leaf.x + Math.cos(radians) * leaf.length, y: leaf.y + Math.sin(radians) * leaf.length };
              return (
                <g key={i}>
                  <g transform={`translate(${leaf.x} ${leaf.y}) rotate(${angle})`}>
                    <path d={leafShape(leaf.length)} fill={leaf.light ? YARD.leafLight : YARD.leaf} />
                    <line x1={6} y1={0} x2={leaf.length - 8} y2={0} stroke={YARD.leafDark} strokeWidth={1.6} opacity={0.6} />
                    <path d={`M ${leaf.length * 0.2} ${-leaf.length * 0.12} Q ${leaf.length * 0.5} ${-leaf.length * 0.2} ${leaf.length * 0.8} ${-leaf.length * 0.08}`} fill="none" stroke="rgba(230, 246, 238, 0.4)" strokeWidth={2} />
                  </g>
                  {last > 0.12 && last < 1.3 ? (
                    <ellipse cx={tip.x} cy={tip.y + 8 + 700 * (last - 0.12) * (last - 0.12)} rx={4.5} ry={6 + last * 5} fill="url(#rain-speck)" stroke="rgba(236, 246, 246, 0.6)" strokeWidth={0.8} opacity={1 - last / 1.3} />
                  ) : null}
                </g>
              );
            })}

            {/* 地面、石头和草 */}
            <path d={GROUND} fill="url(#yard-ground)" />
            {SHEENS.map((sheen, i) => (
              <ellipse key={i} cx={sheen.x} cy={sheen.y} rx={sheen.rx} ry={5} fill={`rgba(${Math.round(196 + 59 * warm)}, ${Math.round(220 + 8 * warm)}, ${Math.round(224 - 40 * warm)}, ${0.14 + 0.16 * warm})`} />
            ))}
            {STONES.map((stone, i) => (
              <g key={i}>
                <ellipse cx={stone.x + 6} cy={stone.y + stone.ry * 0.62} rx={stone.rx * 1.05} ry={stone.ry * 0.34} fill="#0d181e" opacity={0.45} />
                <path d={stone.d} fill={YARD.stone} />
                <ellipse cx={stone.x - stone.rx * 0.12} cy={stone.y - stone.ry * 0.55} rx={stone.rx * 0.62} ry={stone.ry * 0.3} fill={`rgba(${Math.round(206 + 49 * warm)}, ${Math.round(226 + 4 * warm)}, ${Math.round(228 - 40 * warm)}, ${0.2 + 0.2 * warm})`} />
                <ellipse cx={stone.x + stone.rx * 0.2} cy={stone.y + stone.ry * 0.25} rx={stone.rx * 0.7} ry={stone.ry * 0.4} fill="#16242c" opacity={0.3} />
              </g>
            ))}

            {/* 水洼：倒影被雨打碎，雨停了才看得清 */}
            <path d={PUDDLE_SHORE} fill={YARD.groundDeep} stroke={YARD.groundDeep} strokeWidth={30} strokeLinejoin="round" transform="translate(0 8)" />
            <g clipPath="url(#yard-puddle)">
              <rect x={PUDDLE.x - PUDDLE.rx} y={PUDDLE.y - PUDDLE.ry} width={PUDDLE.rx * 2} height={PUDDLE.ry * 2} fill="url(#yard-water)" />
              <g filter="url(#yard-wobble)">
                <rect x={PUDDLE.x - PUDDLE.rx} y={PUDDLE.y - PUDDLE.ry} width={PUDDLE.rx * 2} height={PUDDLE.ry * 2} fill="url(#yard-sky)" />
                <rect x={PUDDLE.x - PUDDLE.rx} y={PUDDLE.y - PUDDLE.ry} width={PUDDLE.rx * 2} height={64} fill={YARD.tile} opacity={0.5} />
                {CAPS.map((x, i) => (
                  <circle key={i} cx={x} cy={PUDDLE.y - PUDDLE.ry + 64} r={30} fill={YARD.tile} opacity={0.5} />
                ))}
                {/* 云开处的天光映在水里 */}
                <ellipse cx={PUDDLE.x - 250} cy={PUDDLE.y + 50} rx={520} ry={150} fill="url(#yard-break)" opacity={warm * 0.85} />
                {/* 映在水里的窗光和灯笼 */}
                <ellipse cx={PANE.x} cy={PANE.y} rx={PANE.w * 0.86} ry={PANE.h * 0.95} fill="url(#yard-halo)" opacity={0.6} />
                <ellipse cx={LANTERN.x + 150} cy={PUDDLE.y - 96} rx={34} ry={86} fill={YARD.lantern} opacity={0.45 + 0.2 * (glow - 0.8) * 3} />
                <rect x={PANE.x - PANE.w / 2 - 5} y={PANE.y - PANE.h / 2 - 5} width={PANE.w + 10} height={PANE.h + 10} fill="none" stroke={YARD.wood} strokeWidth={10} opacity={0.75} />
              </g>
              {/* 细雨在水面上点出的小圈 */}
              {new Array(18).fill(0).map((_, back) => {
                const f = frame - back;
                if (f < 0) {
                  return null;
                }
                const amount = rainAt(score, plan, f, fps) * 3.2;
                const count = Math.floor(amount) + (random(`mist-n-${f}`) < amount % 1 ? 1 : 0);
                return new Array(count).fill(0).map((__, n) => {
                  const u = random(`mist-x-${f}-${n}`);
                  const v = random(`mist-y-${f}-${n}`);
                  const radius = 8 + back * 2.4;
                  return (
                    <ellipse
                      key={`${f}-${n}`}
                      cx={PUDDLE.x + (u - 0.5) * 2 * PUDDLE.rx}
                      cy={PUDDLE.y + (v - 0.5) * 2 * PUDDLE.ry}
                      rx={radius}
                      ry={radius * 0.32}
                      fill="none"
                      stroke={YARD.ripple}
                      strokeWidth={1.2}
                      opacity={(1 - back / 18) * 0.4}
                    />
                  );
                });
              })}
              {ripples.map((ripple, i) => (
                <RippleRings key={i} ripple={ripple} age={seconds - ripple.time} fade={(0.5 + 0.5 * clear) * (1 - dive.u)} seed={`${i}`} />
              ))}
              {/* 浮着的叶子：被涟漪推着一沉一浮 */}
              {FLOATERS.map((floater, i) => {
                let bob = kickAt(sinceSplash, fps) * 1.4;
                ripples.forEach((ripple, n) => {
                  if (n % FLOATERS.length === i) {
                    bob += kickAt(seconds - ripple.time - 0.25, fps) * 0.6;
                  }
                });
                return (
                  <g key={i} transform={`translate(${floater.x} ${floater.y + bob * 9}) rotate(${floater.angle + noise2D(`float-${i}`, clock * 0.3, 0) * 5 + bob * 4}) scale(1 0.5)`}>
                    <path d={leafShape(floater.length)} fill={i === 1 ? YARD.leafLight : YARD.leaf} />
                    <line x1={6} y1={0} x2={floater.length - 8} y2={0} stroke={YARD.leafDark} strokeWidth={2} opacity={0.6} />
                  </g>
                );
              })}
            </g>
            <path d={PUDDLE_SHORE} fill="url(#yard-shore)" />
            <path d={PUDDLE_SHORE} fill="none" stroke={`rgba(${Math.round(214 + 41 * warm)}, ${Math.round(234 - 4 * warm)}, ${Math.round(234 - 50 * warm)}, ${0.22 + 0.2 * warm})`} strokeWidth={3} />

            {/* 草：远岸的短，近处两角的长，随风摆 */}
            {TUFTS.map((tuft, i) =>
              new Array(tuft.blades).fill(0).map((_, b) => {
                const lean = (b - (tuft.blades - 1) / 2) * tuft.height * 0.16 + (wind * 0.5 + noise2D(`blade-${i}`, clock * 0.8, b)) * tuft.height * 0.14;
                const height = tuft.height * (0.7 + random(`blade-h-${i}-${b}`) * 0.5);
                return (
                  <path
                    key={`${i}-${b}`}
                    d={`M ${tuft.x + b * 5} ${tuft.y} Q ${tuft.x + b * 5 + lean * 0.3} ${tuft.y - height * 0.6} ${tuft.x + b * 5 + lean} ${tuft.y - height}`}
                    fill="none"
                    stroke={b % 2 ? YARD.leaf : YARD.leafDark}
                    strokeWidth={tuft.height > 60 ? 5 : 3}
                    strokeLinecap="round"
                  />
                );
              }),
            )}

            {/* 主角：往下落的那一滴 */}
            {hero.phase === "fall" ? (
              <Bead
                id="hero-fall"
                x={hero.x}
                y={hero.y - LIP_Y}
                rx={34}
                ry={34 * interpolate(seconds, [plan.drip, plan.drip + 0.5, plan.splash - 0.2, plan.splash], [1.5, 1.14, 1.1, 1.7], clamp)}
                seconds={seconds}
              />
            ) : null}
          </g>
        </svg>
        {/* 水里映着的那扇窗：就是第一帧的那块玻璃 */}
        {camera > PUDDLE.y - HEIGHT - 400 ? (
          <div
            style={{
              position: "absolute",
              left: PANE.x - PANE.w / 2,
              top: PANE.y - camera - PANE.h / 2,
              width: PANE.w,
              height: PANE.h,
              overflow: "hidden",
              opacity: 0.82 + 0.18 * pane,
              filter: pane < 1 ? "url(#yard-pane)" : undefined,
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT, transformOrigin: "0 0", transform: `scale(${PANE.w / WIDTH})` }}>
              <Outside glow={glowAt(score, 0, fps)} seconds={0} clock={0} rain={0} />
            </div>
          </div>
        ) : null}
        {/* 云开了：几道斜斜的光从右上照下来 */}
        <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", filter: "blur(22px)", mixBlendMode: "screen", opacity: warm * (1 - dive.u) }}>
          {[0, 1, 2, 3, 4].map((n) => {
            const shimmer = 0.75 + 0.25 * noise2D(`ray-${n}`, seconds * 0.5, 0);
            const left = 1780 - n * 330;
            return <path key={n} d={`M 1720 -220 L ${left} ${HEIGHT + 60} L ${left - 150 - n * 20} ${HEIGHT + 60} Z`} fill="#ffdcae" opacity={0.2 * shimmer} />;
          })}
        </svg>
      </div>
      {/* 眼前的雨：换气时停在半空 */}
      <Streaks level={rain * 1.5 * (1 - dive.u)} clock={clock} blur={0.7} alpha={0.9} stretch={flow} />
      <AbsoluteFill style={{ background: `linear-gradient(rgba(206, 220, 220, 0) 40%, rgba(206, 220, 220, ${0.14 * (1 - warm * 0.6) * (1 - dive.u)}) 100%)` }} />
    </AbsoluteFill>
  );
};
