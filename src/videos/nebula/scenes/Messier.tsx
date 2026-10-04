// 第五幕「梅西耶」：目镜里，恒星一动不动，彗星每夜挪一点，只有那一小块云雾斑块纹丝不动
// 第六幕「星表」：梅西耶的一百零三个条目，几个有名字的星云，M31，德雷耶的一万三千个条目
import React from "react";
import { Tag, Eyepiece } from "../labels";
import { COLORS, FONT } from "../theme";
import { Dots, GALAXY, Rig, SPHERE } from "../Stars";
import { dip, ease, ramp, track, useT } from "../time";
import type { V3 } from "../time";
import { Canvas, VolumeMesh } from "../Volume";

const CX = 960;
const CY = 510;
const R = 430;

// 彗星：一个亮点加一条朝右上、背着太阳的尾巴
const Comet: React.FC<{ x: number; y: number; p: number; tail?: number }> = ({ x, y, p, tail = 1 }) => {
  if (p <= 0.003) return null;
  return (
    <g opacity={p} transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id="nebula-tail">
          <stop offset="0" stopColor="#dfe8ff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#dfe8ff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#dfe8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula-coma">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.35" stopColor="#dce8ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#dce8ff" stopOpacity="0" />
        </radialGradient>
        <filter id="nebula-soft">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <g filter="url(#nebula-soft)" opacity={tail}>
        <ellipse cx={110} cy={-62} rx={150} ry={20} transform="rotate(-30 110 -62)" fill="url(#nebula-tail)" />
      </g>
      <circle r={26} fill="url(#nebula-coma)" />
    </g>
  );
};

const NIGHTS: { from: number; to: number; x: number; y: number; name: string }[] = [
  { from: 87.9, to: 90.5, x: 720, y: 620, name: "第一夜" },
  { from: 90.7, to: 92.9, x: 820, y: 560, name: "第二夜" },
  { from: 93.1, to: 97.6, x: 930, y: 490, name: "第三夜" },
];

export const Messier: React.FC = () => {
  const t = useT();
  // 先在天上一路扫，到 82 秒左右那块斑块进到视场中央
  const sweep = track(t, [[74.5, -26], [82.4, 0], [100, 0.5]]);
  const look2: V3 = [sweep + Math.sin(t * 0.35) * 0.18, Math.cos(t * 0.27) * 0.12, 0];
  const exposure = track(t, [[75, 0.9], [82, 0.9], [84, 1.1]]);
  const eye = ramp(t, 74.6, 76.2);
  const night = NIGHTS.find((n) => t >= n.from - 0.2 && t < n.to + 0.2);
  // 每夜的彗星位置：夜里线性移动
  const comet = NIGHTS.map((n) => {
    const p = ramp(t, n.from - 0.1, n.from + 0.5) * (1 - ramp(t, n.to - 0.4, n.to + 0.2));
    const move = ramp(t, n.from, n.to);
    return { x: n.x + move * 30, y: n.y - move * 14, p };
  });
  const ghost = ramp(t, 92.9, 93.9) * (1 - ramp(t, 97.0, 98.4));
  return (
    <>
      <Canvas>
        <VolumeMesh time={t * 0.3} mix={1} cam={[0, 0, 60]} look={[0, 0, 0]} cam2={[0, 0, 60]} look2={look2} fov={16} mono={1} exposure={exposure} />
      </Canvas>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {comet.map((c, i) => (
          <Comet key={i} x={c.x} y={c.y} p={c.p} />
        ))}
        {[NIGHTS[0], NIGHTS[1]].map((n, i) => (
          <circle key={i} cx={n.x + 30} cy={n.y - 14} r={5} fill="none" stroke="#dfe8ff" strokeOpacity={0.55 * ghost} strokeWidth={1.4} strokeDasharray="3 4" />
        ))}
      </svg>
      <Eyepiece p={eye} radius={R} cx={CX} cy={CY} />
      <Tag x={CX} y={CY - R + 62} p={night ? ramp(t, night.from - 0.1, night.from + 0.6) * (1 - ramp(t, night.to - 0.3, night.to + 0.2)) : 0} size={28} sub="彗星在挪位置">
        {night?.name ?? ""}
      </Tag>
      <Tag x={CX} y={CY + 110} p={ramp(t, 83.2, 84.4) * (1 - ramp(t, 87.4, 88.2))} size={26} sub="云雾状的斑块">
        一块不动的光斑
      </Tag>
      <Tag x={CX + 250} y={CY - 140} p={ramp(t, 97.8, 98.8)} size={90} color={COLORS.soft}>
        ？
      </Tag>
    </>
  );
};

// ---------- 星表 ----------
const CODES: { code: string; x: number; y: number }[] = [
  ["M1", 330, 250], ["M8", 1480, 330], ["M13", 520, 700], ["M16", 1290, 190], ["M17", 1620, 520], ["M20", 760, 160],
  ["M27", 240, 560], ["M31", 1100, 760], ["M33", 410, 410], ["M42", 1360, 700], ["M43", 1500, 620], ["M44", 880, 290],
  ["M45", 640, 480], ["M51", 1210, 440], ["M57", 300, 810], ["M64", 1010, 640], ["M78", 1710, 300], ["M81", 570, 250],
  ["M82", 1560, 180], ["M87", 770, 790], ["M97", 1190, 850], ["M101", 190, 380], ["M104", 1750, 700], ["M110", 950, 150],
].map(([code, x, y]) => ({ code: code as string, x: x as number, y: y as number }));

const NAMED: { from: number; to: number; seed: V3; blue: number; name: string; sub: string }[] = [
  { from: 112.2, to: 115.6, seed: [0, 0, 0], blue: 0, name: "猎户座大星云", sub: "M42" },
  { from: 115.6, to: 117.2, seed: [4, 2, 1], blue: 0.5, name: "三叶星云", sub: "M20" },
  { from: 117.2, to: 118.7, seed: [9, 3, 7], blue: 0, name: "北美洲星云", sub: "NGC 7000" },
];

export const Catalog: React.FC = () => {
  const t = useT();
  const named = NAMED.find((n) => t >= n.from - 0.3 && t < n.to - 0.3);
  const seed = (NAMED.find((n) => t >= n.from - 0.3 && t < n.to - 0.3) ?? NAMED[0]).seed;
  const blue = (named ?? NAMED[0]).blue;
  const showNebula = t >= 111.7 && t < 118.9;
  const fade = Math.min(dip(t, 111.8, 0.4), dip(t, 115.6, 0.35), dip(t, 117.2, 0.35), dip(t, 118.8, 0.4), dip(t, 126.0, 0.4), dip(t, 137.0, 0.4));

  // M31 像彗星的那一段、星表的那一段、仙女座的那一段，各有各的镜头
  let cam: V3 = [0, 0, 45];
  let look: V3 = [0, 0, 0];
  let fov = 10;
  if (t >= 126) {
    const phi = (t - 126) * 0.06;
    cam = [0, 0, 0];
    look = [Math.cos(phi) * 9, Math.sin(phi * 0.7) * 2, Math.sin(phi) * 9];
    fov = 70;
  }
  if (t >= 137) {
    cam = [0, 1.6, 3.3];
    look = [0, 0, 0];
    fov = 46;
  }
  const m31Alpha = (ramp(t, 118.8, 119.8) * (1 - ramp(t, 125.6, 126.2))) * 0.5 + ramp(t, 137.2, 138.4) * 0.5;
  const sphere = ramp(t, 126.2, 127.2) * (1 - ramp(t, 136.6, 137.2));
  const reveal = ease(t, 126.4, 135.6);
  const eye = ramp(t, 118.8, 119.6) * (1 - ramp(t, 125.4, 126.0));
  const codeP = (i: number) => ramp(t, 102.2 + i * 0.28, 102.8 + i * 0.28) * (1 - ramp(t, 111.0, 111.8));

  return (
    <>
      <Canvas>
        <VolumeMesh
          time={t}
          mix={1}
          cam={[0, 0, 50]}
          look={[0, 0, 60]}
          cam2={showNebula ? [4.6 + (t - 112) * 0.1, 0.6, 4.2] : [0, 0, 50]}
          look2={showNebula ? [0, 0, 0] : [0, 0, 60]}
          fov={52}
          seed={seed}
          blue={blue}
          exposure={0.9}
          fade={fade}
        />
        <Rig pos={cam} look={look} fov={fov} />
        <Dots data={GALAXY()} alpha={m31Alpha} time={t} rotation={[-1.25, 0.0, 0.5]} />
        <Dots data={SPHERE()} alpha={1.0 * sphere} pixel={1.7} time={t} reveal={reveal} rotation={[0, 0, 0]} />
      </Canvas>

      {/* 梅西耶的一百零三个条目 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {CODES.map((c, i) => (
          <g key={c.code} opacity={codeP(i) * 0.85}>
            <circle cx={c.x} cy={c.y} r={7} fill="none" stroke={COLORS.soft} strokeWidth={1.4} />
            <circle cx={c.x} cy={c.y} r={1.8} fill={COLORS.text} />
          </g>
        ))}
      </svg>
      {CODES.map((c, i) => (
        <div
          key={c.code}
          style={{ position: "absolute", left: c.x + 16, top: c.y - 12, fontFamily: FONT, fontSize: 21, letterSpacing: 3, color: COLORS.soft, opacity: codeP(i) * 0.85 }}
        >
          {c.code}
        </div>
      ))}
      <Tag x={CX} y={190} p={ramp(t, 104.4, 105.6) * (1 - ramp(t, 110.8, 111.6))} size={96} sub="梅西耶星表">
        103
      </Tag>

      {/* 有名字的星云 */}
      {NAMED.map((n) => (
        <Tag key={n.name} x={300} y={870} p={ramp(t, n.from + 0.2, n.from + 0.9) * (1 - ramp(t, n.to - 0.7, n.to - 0.3))} size={36} sub={n.sub} align="left">
          {n.name}
        </Tag>
      ))}

      {/* M31：小望远镜里像彗星 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: ramp(t, 119.4, 120.4) * (1 - ramp(t, 123.6, 124.8)) }}>
        <defs>
          <radialGradient id="nebula-m31tail">
            <stop offset="0" stopColor="#dfe8ff" stopOpacity="0.4" />
            <stop offset="0.5" stopColor="#dfe8ff" stopOpacity="0.12" />
            <stop offset="1" stopColor="#dfe8ff" stopOpacity="0" />
          </radialGradient>
          <filter id="nebula-m31soft">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <ellipse cx={1100} cy={450} rx={150} ry={22} transform="rotate(-30 1100 450)" fill="url(#nebula-m31tail)" filter="url(#nebula-m31soft)" />
      </svg>
      <Eyepiece p={eye} radius={R} cx={CX} cy={CY} />
      <Tag x={CX} y={CY + 250} p={ramp(t, 124.2, 125.0) * (1 - ramp(t, 125.4, 125.9))} size={34} sub="仙女座">
        M31
      </Tag>

      {/* 德雷耶的一万三千个条目 */}
      <Tag x={CX} y={190} p={ramp(t, 127.0, 128.0) * (1 - ramp(t, 136.6, 137.2))} size={84} sub="新总表 · 星团和星云">
        {`${(Math.round((13000 * reveal) / 100) * 100).toLocaleString("en-US").replace(/,/g, " ")}+`}
      </Tag>
      <Tag x={CX} y={870} p={ramp(t, 138.2, 139.0)} size={44} sub="仙女座星系">
        NGC 224
      </Tag>
    </>
  );
};
