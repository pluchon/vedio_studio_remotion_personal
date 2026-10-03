// 一家四口：名字都是写东西的体裁。Haiku 带着拖影冲进来，Sonnet 稳稳走来，Fable 慢慢踱来，最后轮到 Opus
import { Trail } from "@remotion/motion-blur";
import { makeStar } from "@remotion/shapes";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BuddyG, Kind, Pose, REST } from "../Buddy";
import { clamp, EASE, hop, mix, pop, ramp } from "../motion";
import { Paper } from "../Paper";
import { Pop, sticker } from "../stickers";
import { C, FPS, GROUND, HEIGHT, WIDTH } from "../theme";

// 这一段底下要放名牌，大家站得高一些
const LINE_Y = GROUND - 96;
const T = { haiku: 3.2, sonnet: 6.5, fable: 9.6, opus: 12.5, me: 15.5 };
const SPOT: Record<Kind, { x: number; size: number }> = {
  haiku: { x: 300, size: 84 },
  sonnet: { x: 640, size: 116 },
  opus: { x: 1070, size: 150 },
  fable: { x: 1620, size: 182 },
};
const NAMES: { kind: Kind; name: string; form: string; at: number }[] = [
  { kind: "haiku", name: "Haiku", form: "俳句", at: T.haiku + 1.35 },
  { kind: "sonnet", name: "Sonnet", form: "十四行诗", at: T.sonnet + 1.1 },
  { kind: "fable", name: "Fable", form: "寓言", at: T.fable + 1.7 },
  { kind: "opus", name: "Opus", form: "大部头", at: T.opus + 0.2 },
];
const RAYS = makeStar({
  points: 14,
  innerRadius: 190,
  outerRadius: 300,
  cornerRadius: 10,
}).path;

const top = (kind: Kind) => LINE_Y - SPOT[kind].size * (10 / 6);

// 说到谁，大家就看向谁
const lookAt = (t: number, from: number) => {
  const target =
    t >= T.me
      ? SPOT.opus.x
      : t >= T.opus
        ? SPOT.opus.x
        : t >= T.fable
          ? SPOT.fable.x
          : t >= T.sonnet
            ? SPOT.sonnet.x
            : t >= T.haiku
              ? SPOT.haiku.x
              : from;
  return clamp((target - from) / 500, -0.85, 0.85);
};

export const pose = (t: number): Pose => {
  const jump = hop(t, T.me, 0.42, 110);
  const mine = ramp(t, T.opus, T.opus + 0.3) - ramp(t, T.me - 0.3, T.me);
  return {
    ...REST,
    x: SPOT.opus.x,
    y: LINE_Y,
    lift: jump.lift,
    squash: jump.squash,
    lookX: lookAt(t, SPOT.opus.x),
    lookY: -0.7 * mine,
    wave: ramp(t, T.me, T.me + 0.25) - ramp(t, T.me + 2, T.me + 2.3),
    mood: t > T.me && t < T.me + 2.2 ? "happy" : "smile",
  };
};

// Haiku 的路线：从左边冲过整个画面，再折回自己的位置急停
const haikuAt = (t: number) => {
  const out = ramp(t, T.haiku, T.haiku + 0.5, EASE.soft);
  const back = ramp(t, T.haiku + 0.5, T.haiku + 1.15, EASE.out);
  const x = mix(mix(-220, 1790, out), SPOT.haiku.x, back);
  const skid = hop(t, T.haiku + 1.15, 0.26, 46);
  return { x, skid, running: t < T.haiku + 1.15 };
};

const Haiku: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.haiku) return null;
  const run = haikuAt(t);
  const speed = (haikuAt(t + 0.01).x - haikuAt(t - 0.01).x) / 0.02;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <BuddyG
        t={t}
        kind="haiku"
        seed={1}
        pose={{
          ...REST,
          x: run.x,
          y: LINE_Y,
          size: SPOT.haiku.size,
          step: run.x / 90,
          tilt: clamp(speed / 260, -14, 14),
          squash: run.skid.squash - Math.min(0.12, Math.abs(speed) / 30000),
          lift: run.skid.lift,
          lookX: run.running ? Math.sign(speed) * 0.8 : lookAt(t, SPOT.haiku.x),
          mood: t < T.haiku + 2.4 || t > T.me ? "happy" : "smile",
          wave: ramp(t, T.me + 0.2, T.me + 0.45),
        }}
      />
    </svg>
  );
};

// 每个人头顶的一张小卡片：这个体裁长什么样
const FormCard: React.FC<{ kind: Kind }> = ({ kind }) => {
  const bar = (width: number, key: number, color = C.ink) => (
    <div
      key={key}
      style={{
        width,
        height: kind === "sonnet" ? 6 : 12,
        borderRadius: 6,
        background: color,
        opacity: 0.78,
        marginBottom: kind === "sonnet" ? 6 : 13,
      }}
    />
  );
  if (kind === "haiku") {
    return (
      <div style={{ padding: "22px 26px 10px", ...sticker(22) }}>
        {[70, 100, 70].map((w, i) => bar(w, i))}
      </div>
    );
  }
  if (kind === "sonnet") {
    return (
      <div style={{ padding: "20px 24px 12px", ...sticker(22) }}>
        {[96, 88, 100, 84, 92, 100, 80, 96, 90, 100, 86, 94, 100, 72].map(
          (w, i) => bar(w, i, i % 4 === 3 ? C.mintDeep : C.ink),
        )}
      </div>
    );
  }
  if (kind === "opus") {
    // 一本厚书
    return (
      <svg width={190} height={150} viewBox="0 0 190 150">
        <g stroke={C.ink} strokeWidth={6} strokeLinejoin="round">
          <path
            d="M 20 28 L 150 28 L 170 46 L 170 138 L 40 138 L 20 120 Z"
            fill={C.coral}
          />
          <path d="M 150 28 L 170 46 L 170 138 L 150 120 Z" fill={C.white} />
          <path d="M 20 28 L 150 28 L 150 120 L 20 120 Z" fill={C.coral} />
          <path
            d="M 44 54 L 126 54 M 44 76 L 106 76"
            strokeLinecap="round"
            stroke={C.white}
          />
          <path d="M 152 62 L 168 78 M 152 84 L 168 100" strokeWidth={3} />
        </g>
      </svg>
    );
  }
  // 一本摊开的故事书，上面一颗星
  return (
    <svg width={220} height={150} viewBox="0 0 220 150">
      <g
        stroke={C.ink}
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path
          d="M 110 40 Q 62 18 16 34 L 16 130 Q 62 114 110 136 Z"
          fill={C.white}
        />
        <path
          d="M 110 40 Q 158 18 204 34 L 204 130 Q 158 114 110 136 Z"
          fill={C.white}
        />
        <path
          d="M 38 62 Q 64 54 90 62 M 38 86 Q 64 78 90 86"
          strokeWidth={5}
          opacity={0.6}
          fill="none"
        />
        <path
          d="M 157 52 l 8 17 l 19 2 l -14 13 l 4 18 l -17 -9 l -17 9 l 4 -18 l -14 -13 l 19 -2 Z"
          fill={C.lemon}
          strokeWidth={5}
        />
      </g>
    </svg>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => {
  const sonnetIn = ramp(t, T.sonnet, T.sonnet + 1.1, EASE.out);
  const fableIn = ramp(t, T.fable, T.fable + 1.9, EASE.soft);
  const cheer = ramp(t, T.me + 0.2, T.me + 0.45);
  const glow = pop(t, T.me, 0.8);
  return (
    <>
      <Paper t={t} tint="#FFF4D6" floorColor="#FBE3A6" />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* 轮到自己时，背后转着一圈光 */}
        {t >= T.me ? (
          <g
            transform={`translate(${SPOT.opus.x} ${LINE_Y - 130}) rotate(${t * 22}) scale(${glow}) translate(-300 -300)`}
            opacity={0.55}
          >
            <path d={RAYS} fill={C.lemon} />
          </g>
        ) : null}
        {t >= T.sonnet ? (
          <BuddyG
            t={t}
            kind="sonnet"
            seed={2}
            pose={{
              ...REST,
              x: mix(-260, SPOT.sonnet.x, sonnetIn),
              y: LINE_Y,
              size: SPOT.sonnet.size,
              step: (sonnetIn * 960) / 120,
              lift: sonnetIn < 1 ? Math.abs(Math.sin(sonnetIn * 25)) * 7 : 0,
              lookX: sonnetIn < 1 ? 0.7 : lookAt(t, SPOT.sonnet.x),
              wave: cheer,
              mood: t > T.me ? "happy" : "smile",
            }}
          />
        ) : null}
        {t >= T.fable ? (
          <BuddyG
            t={t}
            kind="fable"
            seed={3}
            pose={{
              ...REST,
              x: mix(WIDTH + 320, SPOT.fable.x, fableIn),
              y: LINE_Y,
              size: SPOT.fable.size,
              step: (fableIn * 700) / 190,
              lookX: fableIn < 1 ? -0.5 : lookAt(t, SPOT.fable.x),
              spin: t * 70,
              glow: 0.5,
              sparkSize:
                fableIn < 1
                  ? 0.75
                  : 0.75 * (1 - ramp(t, T.fable + 2.1, T.fable + 2.4)),
              mood: fableIn < 1 ? "flat" : t > T.me ? "happy" : "smile",
              wave: cheer,
            }}
          />
        ) : null}
      </svg>
      {/* Haiku 跑得太快，带着拖影 */}
      {t >= T.haiku && t < T.haiku + 1.5 ? (
        <Trail layers={6} lagInFrames={1.4} trailOpacity={0.5}>
          <AbsoluteFill>
            <Haiku />
          </AbsoluteFill>
        </Trail>
      ) : (
        <Haiku />
      )}
      {/* 名牌 */}
      {NAMES.map((item) => (
        <Pop
          key={item.kind}
          t={t}
          at={item.at}
          x={SPOT[item.kind].x}
          y={LINE_Y + 96}
        >
          <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.05 }}>
              {item.name}
            </div>
            <div style={{ fontSize: 44 }}>{item.form}</div>
          </div>
        </Pop>
      ))}
      {/* 头顶的体裁卡片 */}
      {NAMES.map((item, i) => (
        <Pop
          key={item.kind}
          t={t}
          at={item.at + 0.25}
          x={SPOT[item.kind].x}
          y={top(item.kind) - 104 + Math.sin(t * 2 + i) * 5}
          turn={i % 2 ? 3 : -3}
        >
          <FormCard kind={item.kind} />
        </Pop>
      ))}
      <Pop t={t} at={0.9} out={T.haiku - 0.2} x={WIDTH / 2} y={300}>
        <div
          style={{
            padding: "16px 44px",
            fontSize: 58,
            ...sticker(36, C.lemon),
          }}
        >
          体裁：写东西的样式
        </div>
      </Pop>
    </>
  );
};
