// 窗玻璃：每个音落一滴雨在玻璃上；低音进来后雨下大，重的水珠沿玻璃滑下去。镜头跟着其中一颗一路滑到窗框，漫过窗台，挂在下沿
import React, { useMemo } from "react";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bead, blob } from "../parts/Bead";
import { Outside } from "../parts/Outside";
import { HERO_START, Hero, Plan, cameraAt, glowAt, heroAt, rainAt, slidePath } from "../plan";
import { Note, Score } from "../score";
import { BEAD, FRAME_Y, HEIGHT, LIP_Y, RAIL, SILL, WIDTH, YARD } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 小数部分：用无理数的倍数把水珠均匀撒开，不扎堆
const frac = (value: number) => value - Math.floor(value);

type Drop = {
  note: Note;
  index: number;
  x: number;
  y: number;
  r: number;
  // 会滑落的水珠：滑落的路线、总长、开始滑的时刻、滑完要多久
  slide: { d: string; length: number; start: number; duration: number } | null;
};

const HERO_R = 46;

// 每个音一颗水珠：落在这个音响起时镜头正看着的那块玻璃上
const makeDrops = (score: Score, plan: Plan): Drop[] =>
  score.notes
    .map((note, index): Drop => {
      const top = cameraAt(plan, note.time) + (cameraAt(plan, note.time + 0.6) - cameraAt(plan, note.time)) * 1.4;
      const x = 150 + frac(index * 0.75488 + 0.17) * (WIDTH - 300);
      const y = top + 110 + frac(index * 0.56984 + 0.41) * (HEIGHT - 330);
      const r = 11 + 24 * Math.pow(note.strength, 0.7) + 20 * note.low;
      // 雨下大以后，够重的水珠停不住
      if (note.time < score.pour - 0.05 || r <= 26) {
        return { note, index, x, y, r, slide: null };
      }
      const d = slidePath(x, y, `slide-${index}`, y + 900 + random(`far-${index}`) * 700);
      return {
        note,
        index,
        x,
        y,
        r,
        slide: { d, length: getLength(d), start: note.time + 0.35 + random(`wait-${index}`) * 1.1, duration: 2.4 + random(`slow-${index}`) * 1.8 },
      };
    })
    .filter((drop) => drop.index !== plan.heroIndex && drop.note.time < plan.sill - 0.4 && drop.y < FRAME_Y - 60);

type Speck = { frame: number; x: number; y: number; r: number };

// 细碎的小水珠：低音越重，这一帧落在玻璃上的越多；雨下大的那一帧一下子打上来一片
const makeSpecks = (score: Score, plan: Plan, fps: number): Speck[] => {
  const specks: Speck[] = [];
  const burst = Math.round(score.pour * fps);
  score.bass.forEach((level, frame) => {
    if (frame / fps > plan.sill) {
      return;
    }
    const amount = Math.pow(Math.max(0, level - 0.1), 1.4) * 6 + (frame === burst ? 90 : 0);
    const count = Math.floor(amount) + (random(`speck-n-${frame}`) < amount % 1 ? 1 : 0);
    const top = cameraAt(plan, frame / fps + 0.8);
    for (let n = 0; n < count; n++) {
      const id = `${frame}-${n}`;
      specks.push({
        frame,
        x: random(`speck-x-${id}`) * WIDTH,
        y: top + random(`speck-y-${id}`) * HEIGHT * 1.3 - 100,
        r: 1.6 + Math.pow(random(`speck-r-${id}`), 2.2) * 7,
      });
    }
  });
  return specks.filter((speck) => speck.y < FRAME_Y - 8);
};

// 滑过的水痕和留在路上的残珠
const Trail: React.FC<{ d: string; length: number; progress: number; width: number; seed: string }> = ({ d, length, progress, width, seed }) => {
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);
  return (
    <>
      <path d={d} fill="none" stroke={BEAD.trail} strokeWidth={width} strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      {new Array(Math.floor((length * progress) / 58)).fill(0).map((_, n) => {
        const left = getPointAtLength(d, 30 + n * 58 + random(`left-${seed}-${n}`) * 22);
        if (!left) {
          return null;
        }
        return (
          <circle
            key={n}
            cx={left.x + (random(`left-x-${seed}-${n}`) - 0.5) * width}
            cy={left.y}
            r={1.6 + random(`left-r-${seed}-${n}`) * 3.4}
            fill="url(#rain-speck)"
            stroke={BEAD.rim}
            strokeWidth={0.6}
          />
        );
      })}
    </>
  );
};

// 落上玻璃的那一下：一圈水纹，几粒溅开的水星
const Impact: React.FC<{ x: number; y: number; r: number; age: number; seed: string }> = ({ x, y, r, age, seed }) => {
  const ring = interpolate(age, [0, 0.5], [0, 1], clamp);
  if (ring >= 1) {
    return null;
  }
  return (
    <>
      <circle cx={x} cy={y} r={r * (1 + ring * 2.4)} fill="none" stroke="rgba(236, 246, 246, 1)" strokeWidth={1.6} opacity={(1 - ring) * 0.55} />
      {new Array(6).fill(0).map((_, n) => {
        const angle = (n / 6) * 6.283 + random(`splash-a-${seed}-${n}`) * 0.9;
        const reach = r * (1.2 + ring * (1.6 + random(`splash-d-${seed}-${n}`) * 1.4));
        return (
          <circle
            key={n}
            cx={x + Math.cos(angle) * reach}
            cy={y + Math.sin(angle) * reach * 0.9}
            r={(1 - ring) * (1.4 + r * 0.06)}
            fill="rgba(236, 246, 246, 0.8)"
          />
        );
      })}
    </>
  );
};

// 一颗水珠：落上玻璃时弹一下；够重的随后滑下去，滑到头就散了
const GlassDrop: React.FC<{ drop: Drop; seconds: number }> = ({ drop, seconds }) => {
  const { fps } = useVideoConfig();
  const age = seconds - drop.note.time;
  if (age < 0) {
    return null;
  }
  const pop = spring({ frame: age * fps, fps, config: { damping: 7, stiffness: 190, mass: 0.45 } });
  const id = `drop-${drop.index}`;
  let x = drop.x;
  let y = drop.y;
  let fade = 1;
  let trail: React.ReactNode = null;
  if (drop.slide && seconds > drop.slide.start) {
    // 先慢后快地滑下去
    const progress = Math.pow(Math.min(1, (seconds - drop.slide.start) / drop.slide.duration), 1.7);
    const point = getPointAtLength(drop.slide.d, drop.slide.length * progress);
    x = point?.x ?? x;
    y = point?.y ?? y;
    fade = interpolate(progress, [0.86, 1], [1, 0], clamp);
    trail = <Trail d={drop.slide.d} length={drop.slide.length} progress={progress} width={drop.r * 0.3} seed={id} />;
  }
  return (
    <g>
      {trail}
      <Impact x={drop.x} y={drop.y} r={drop.r} age={age} seed={id} />
      <Bead id={id} x={x} y={y} rx={drop.r * 0.94 * pop} ry={drop.r * 1.04 * pop} seconds={seconds} opacity={fade} />
    </g>
  );
};

// 主角：雨下大那一声落下的大水珠。滑到窗框后漫过横档和窗台，在下沿聚成一滴
const HeroDrop: React.FC<{ plan: Plan; score: Score; hero: Hero; seconds: number }> = ({ plan, score, hero, seconds }) => {
  const { fps } = useVideoConfig();
  const age = seconds - score.notes[plan.heroIndex].time;
  if (age < 0) {
    return null;
  }
  const pop = spring({ frame: age * fps, fps, config: { damping: 6, stiffness: 150, mass: 0.6 } });
  const onGlass = hero.phase === "bead" || hero.phase === "slide";
  const slid = hero.phase === "bead" ? 0 : hero.phase === "slide" ? hero.progress : 1;
  const across = `M ${plan.x} ${FRAME_Y} L ${plan.x} ${LIP_Y}`;
  const trickle = onGlass ? 0 : hero.phase === "trickle" ? hero.progress : 1;
  const crossing = evolvePath(trickle, across);
  return (
    <g>
      {slid > 0 ? <Trail d={plan.path} length={plan.length} progress={slid} width={HERO_R * 0.34} seed="hero" /> : null}
      <Impact x={HERO_START.x} y={HERO_START.y} r={HERO_R * 1.3} age={age * 0.7} seed="hero" />
      {onGlass ? (
        <Bead id="hero" x={hero.x} y={hero.y} rx={HERO_R * 0.94 * pop} ry={HERO_R * (hero.phase === "slide" ? 1.16 : 1.04) * pop} seconds={seconds} />
      ) : null}
      {trickle > 0 ? (
        <path
          d={across}
          fill="none"
          stroke="rgba(222, 238, 240, 0.5)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={crossing.strokeDasharray}
          strokeDashoffset={crossing.strokeDashoffset}
        />
      ) : null}
      {hero.phase === "pendant" ? (
        <path
          d={blob(hero.x, LIP_Y + 4 + 22 * hero.progress, 9 + 15 * hero.progress, 8 + 26 * hero.progress, "pendant", seconds)}
          fill="url(#rain-speck)"
          stroke="url(#rain-rim)"
          strokeWidth={1.4}
        />
      ) : null}
    </g>
  );
};

export const Glass: React.FC<{ score: Score; plan: Plan }> = ({ score, plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const drops = useMemo(() => makeDrops(score, plan), [score, plan]);
  const specks = useMemo(() => makeSpecks(score, plan, fps), [score, plan, fps]);

  const camera = cameraAt(plan, seconds);
  const hero = heroAt(plan, seconds);
  const rain = rainAt(score, plan, frame, fps);
  // 雨下大的那一下：整个窗外晃一下，再弹回来
  const sincePour = seconds - score.pour;
  const kick = sincePour < 0 ? 0 : Math.max(0, 1 - spring({ frame: sincePour * fps, fps, config: { damping: 9, stiffness: 60, mass: 0.8 } }));
  // 玻璃只画到窗框上沿
  const visible = Math.max(0, Math.min(HEIGHT, FRAME_Y - camera));

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: visible, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT }}>
          <Outside glow={glowAt(score, frame, fps)} seconds={seconds} clock={plan.clock[Math.min(frame, plan.clock.length - 1)]} rain={rain} kick={kick} />
        </div>
      </div>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="rain-rail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10181d" />
            <stop offset="100%" stopColor={YARD.wood} />
          </linearGradient>
          <linearGradient id="rain-sill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#56676e" />
            <stop offset="22%" stopColor={YARD.sill} />
            <stop offset="100%" stopColor="#222e34" />
          </linearGradient>
          <clipPath id="rain-glass">
            <rect x={0} y={-200} width={WIDTH} height={FRAME_Y + 200} />
          </clipPath>
        </defs>
        <g transform={`translate(0 ${-camera})`}>
          <g clipPath="url(#rain-glass)">
            {specks.map((speck, i) => {
              const age = frame - speck.frame;
              if (age < 0 || speck.y < camera - 20 || speck.y > camera + HEIGHT + 20) {
                return null;
              }
              return (
                <circle key={i} cx={speck.x} cy={speck.y} r={speck.r * Math.min(1, 0.4 + age / 3)} fill="url(#rain-speck)" stroke={BEAD.rim} strokeWidth={0.5} />
              );
            })}
            {drops.map((drop) => (
              <GlassDrop key={drop.index} drop={drop} seconds={seconds} />
            ))}
          </g>
          {/* 窗框的横档和窗台 */}
          <rect x={-10} y={FRAME_Y} width={WIDTH + 20} height={RAIL} fill="url(#rain-rail)" />
          <rect x={-10} y={FRAME_Y} width={WIDTH + 20} height={5} fill="rgba(190, 214, 220, 0.28)" />
          <rect x={-10} y={FRAME_Y + RAIL} width={WIDTH + 20} height={SILL} fill="url(#rain-sill)" />
          <rect x={-10} y={LIP_Y - 5} width={WIDTH + 20} height={5} fill="rgba(8, 14, 18, 0.6)" />
          <HeroDrop plan={plan} score={score} hero={hero} seconds={seconds} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
