// 风格样帧 · 1610 帕多瓦：照参考图的路子——年份地点标、扁平色块、画面里正在发生的事。
// 伽利略一夜一夜画下木星身边的小星（像参考图里一行行跳动的二进制），画到第五夜，四颗卫星认出来了；
// 右边镜筒里的木星是 3D，平涂成同一套复古配色
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Caption, inkIn } from "../../../shared/Caption";
import { Grain } from "../../../shared/Grain";
import { Locator } from "../components/Locator";
import { CameraRig } from "../three/CameraRig";
import { RetroPlanet } from "../three/RetroPlanet";
import { useTextures } from "../three/useTextures";
import { EASE_IN_OUT, EASE_OUT, FONTS, RETRO, asset } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TEXTURES = { jupiter: asset("textures/jupiter.jpg") };
const JUPITER: [string, string, string, string, string] = [RETRO.coral, RETRO.salmon, RETRO.sand, RETRO.cream, RETRO.creamLight];
const MOON: [string, string, string, string, string] = [RETRO.cream, RETRO.cream, RETRO.cream, RETRO.creamLight, RETRO.cream];
const SUN: [number, number, number] = [0.55, 0.25, 1];

// 镜筒里看到的圆
const VIEW = { cx: 1372, cy: 468, r: 318 };

// 《星际信使》里的记录：木星为 ○，小星为 ✱，数字是相对木星的位置（东在左）
const NIGHTS = [
  { date: "一月七日", stars: [-2, -1, 1.4] },
  { date: "一月八日", stars: [0.9, 1.7, 2.5] },
  { date: "一月十日", stars: [-2.2, -1.2] },
  { date: "一月十一日", stars: [-2.4, -1.1] },
  { date: "一月十三日", stars: [-1.3, 0.9, 1.7, 2.4] },
];
const ROW = { left: 480, x0: 820, unit: 62, top: 150, step: 66 };
const COLORS = [RETRO.teal, RETRO.coral, RETRO.ink, RETRO.teal, RETRO.coral];

// 四颗伽利略卫星：轨道压缩过，周期按 1:2:4:9.4 的共振关系
const MOONS = [
  { r: 2.0, period: 120, phase: 0.4, size: 0.11 },
  { r: 2.6, period: 240, phase: 2.1, size: 0.1 },
  { r: 3.3, period: 480, phase: 3.9, size: 0.14 },
  { r: 4.1, period: 1130, phase: 5.2, size: 0.13 },
];

const Backdrop: React.FC<{ drift: number }> = ({ drift }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, translate: `${drift * -12}px 0` }}>
    <circle cx={120} cy={170} r={150} fill={RETRO.mustard} opacity={0.9} />
    <rect x={186} y={20} width={196} height={470} fill={RETRO.tealLight} opacity={0.75} />
    <rect x={250} y={300} width={120} height={190} fill={RETRO.salmon} opacity={0.8} />
    <rect x={1120} y={60} width={150} height={820} fill={RETRO.salmon} opacity={0.55} />
    <rect x={1700} y={0} width={220} height={620} fill={RETRO.coral} opacity={0.85} />
    <rect x={1760} y={90} width={140} height={300} fill={RETRO.mustard} opacity={0.85} />
    <polygon points="1740,620 1920,420 1920,760" fill={RETRO.teal} opacity={0.8} />
    <rect x={1010} y={700} width={140} height={120} fill={RETRO.coral} opacity={0.7} />
    {/* 远处帕多瓦的屋顶与钟楼 */}
    <g fill={RETRO.tealLight} opacity={0.55}>
      <rect x={560} y={640} width={90} height={180} />
      <polygon points="560,640 605,590 650,640" />
      <rect x={690} y={560} width={46} height={260} />
      <polygon points="690,560 713,500 736,560" />
      <rect x={770} y={660} width={130} height={160} />
    </g>
  </svg>
);

// 扁平的望远镜：细长的镜筒斜指向右上，三脚架，旁边一张摊着稿纸的桌子
const Telescope: React.FC<{ drift: number }> = ({ drift }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, translate: `${drift * -26}px 0` }}>
    <rect x={0} y={880} width={1920} height={200} fill={RETRO.sand} />
    <rect x={0} y={872} width={1920} height={8} fill={RETRO.brown} opacity={0.35} />
    {/* 桌子与稿纸 */}
    <rect x={40} y={760} width={420} height={22} fill={RETRO.brown} />
    <rect x={70} y={782} width={16} height={110} fill={RETRO.brown} />
    <rect x={414} y={782} width={16} height={110} fill={RETRO.brown} />
    <rect x={90} y={728} width={170} height={34} fill={RETRO.creamLight} transform="rotate(-4 175 745)" />
    <rect x={200} y={734} width={150} height={28} fill={RETRO.cream} transform="rotate(3 275 748)" />
    <rect x={120} y={690} width={60} height={70} fill={RETRO.navy} />
    <rect x={126} y={696} width={48} height={8} fill={RETRO.mustard} />
    {/* 三脚架 */}
    <g stroke={RETRO.navy} strokeWidth={10} strokeLinecap="round">
      <line x1={640} y1={690} x2={566} y2={878} />
      <line x1={640} y1={690} x2={698} y2={878} />
      <line x1={640} y1={690} x2={648} y2={884} />
    </g>
    {/* 镜筒 */}
    <g transform="rotate(-27 640 680)">
      <polygon points="470,662 900,650 900,710 470,698" fill={RETRO.brown} />
      <rect x={880} y={644} width={36} height={72} fill={RETRO.mustard} />
      <rect x={560} y={660} width={24} height={40} fill={RETRO.mustard} />
      <rect x={740} y={655} width={16} height={50} fill={RETRO.coral} />
      <rect x={440} y={668} width={34} height={24} fill={RETRO.navy} />
    </g>
    <circle cx={640} cy={688} r={16} fill={RETRO.navy} />
  </svg>
);

// 镜筒里的星点
const ViewStars: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={VIEW.r * 2} height={VIEW.r * 2} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 70 }, (_, i) => {
        const r = (k: string) => random(`view-${i}-${k}`);
        return (
          <circle
            key={i}
            cx={r("x") * VIEW.r * 2}
            cy={r("y") * VIEW.r * 2}
            r={0.8 + r("s") * 1.6}
            fill={RETRO.creamLight}
            opacity={0.35 + 0.4 * (0.5 + 0.5 * Math.sin(frame / 11 + r("t") * 6.3))}
          />
        );
      })}
    </svg>
  );
};

// 一夜的记录：日期先写出来，小星从乱处落到它当晚的位置
const Night: React.FC<{ index: number; at: number }> = ({ index, at }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const n = NIGHTS[index];
  const y = ROW.top + index * ROW.step;
  const color = COLORS[index];
  const settle = interpolate(frame, [at + 6, at + 22], [0, 1], { ...clamp, easing: EASE_OUT });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: ROW.left,
          top: y + 10,
          width: 150,
          textAlign: "right",
          fontFamily: FONTS.song,
          fontSize: 22,
          letterSpacing: "0.12em",
          color: RETRO.inkSoft,
          ...inkIn(frame, at, 12),
        }}
      >
        {n.date}
      </div>
      <div style={{ position: "absolute", left: ROW.x0, top: y, transform: "translateX(-50%)", fontFamily: FONTS.song, fontSize: 40, color: RETRO.ink, ...inkIn(frame, at + 2, 10) }}>
        ○
      </div>
      {n.stars.map((s, k) => {
        // 落定之前在一条线上乱跳，像参考图里没定下来的二进制
        const jitter = (random(`night-${index}-${k}-${Math.floor(frame / 2)}`) - 0.5) * 5;
        const x = ROW.x0 + (s + jitter * (1 - settle)) * ROW.unit;
        return (
          <div
            key={k}
            style={{ position: "absolute", left: x, top: y + 4, transform: "translateX(-50%)", fontFamily: FONTS.song, fontSize: 34, color, opacity: interpolate(frame, [at + 4, at + 8], [0, 1], clamp) }}
          >
            ✱
          </div>
        );
      })}
    </div>
  );
};

export const Galileo1610: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  const push = interpolate(frame, [0, 272], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const camZ = interpolate(push, [0, 1], [12, 10]);
  const found = interpolate(frame, [176, 196], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <AbsoluteFill style={{ backgroundColor: RETRO.cream, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: `${1 + push * 0.035}`, transformOrigin: "60% 45%" }}>
        <Backdrop drift={push} />
        {/* 镜筒里看到的木星：藏青的圆里一颗平涂的木星，四颗卫星排成一线来回走 */}
        <div
          style={{
            position: "absolute",
            left: VIEW.cx - VIEW.r,
            top: VIEW.cy - VIEW.r,
            width: VIEW.r * 2,
            height: VIEW.r * 2,
            borderRadius: "50%",
            overflow: "hidden",
            backgroundColor: RETRO.navy,
            boxShadow: `0 0 0 14px ${RETRO.navyDeep}, 0 0 0 22px ${RETRO.mustard}`,
          }}
        >
          <ViewStars />
          {tex && (
            <ThreeCanvas width={VIEW.r * 2} height={VIEW.r * 2}>
              <CameraRig position={[0, 0.9, camZ]} target={[0, 0, 0]} fov={40} />
              <RetroPlanet map={tex.jupiter} palette={JUPITER} night={RETRO.navyDeep} radius={1.25} spin={frame * 0.01} sunDir={SUN} range={[0.3, 0.75]} />
              {MOONS.map((m, i) => {
                const a = m.phase + (frame / m.period) * Math.PI * 2;
                return (
                  <RetroPlanet key={i} palette={MOON} night={RETRO.navyDeep} radius={m.size} position={[Math.cos(a) * m.r, 0, Math.sin(a) * m.r]} sunDir={SUN} />
                );
              })}
            </ThreeCanvas>
          )}
        </div>
        <Telescope drift={push} />
      </AbsoluteFill>
      {NIGHTS.map((_, i) => (
        <Night key={i} index={i} at={20 + i * 30} />
      ))}
      <div
        style={{
          position: "absolute",
          left: ROW.left + 40,
          top: ROW.top + NIGHTS.length * ROW.step + 10,
          fontFamily: FONTS.songBlack,
          fontSize: 44,
          letterSpacing: "0.1em",
          color: RETRO.coral,
          opacity: found,
          translate: `${(1 - found) * -20}px 0`,
        }}
      >
        = 四颗卫星
      </div>
      <Locator year="1610" place="帕多瓦 · 意大利" at={4} />
      {/* 底部一层薄雾，托住字幕 */}
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, rgba(249, 240, 217, 0) 72%, rgba(249, 240, 217, 0.85) 100%)` }} />
      <Caption
        zh={["木星身边多出了四颗卫星，天空从此不再是一块穹顶。"]}
        en={["Four moons appeared beside Jupiter; the sky was no longer a dome."]}
        at={96}
        font={FONTS.song}
        enFont={FONTS.latin}
        color={RETRO.ink}
        enColor={RETRO.inkSoft}
        size={40}
        enSize={22}
        align="center"
        stagger={2.2}
        style={{ left: 0, right: 0, top: 918 }}
      />
      <Grain opacity={0.09} vignette={0.16} />
    </AbsoluteFill>
  );
};
