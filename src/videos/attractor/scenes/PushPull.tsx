// 第八幕「一边拉，一边推」：几个远处的结构画在同一张图里——拉着我们的，和推着我们的
import React from "react";
import * as THREE from "three";
import { useBinary } from "../data";
import { Credit, Tag } from "../labels";
import { Canvas, Galaxies, Rig, dir, project } from "../space";
import { COLORS } from "../theme";
import { ease, ramp, track, useT } from "../time";
import type { V3 } from "../time";

const UNIT = 0.01;
const H0 = 70;

type Thing = { name: string; sub: string; l: number; b: number; v: number; pull: boolean; at: number; dy: number };
// 位置：银道坐标 + 用速度表示的距离（km/s，÷70 得 Mpc）。出处见 refer/巨引源/资料.md
const THINGS: Thing[] = [
  { name: "巨引源", sub: "(307°, +9°) · 约 4,350 km/s", l: 307, b: 9, v: 4350, pull: true, at: 335, dy: 62 },
  { name: "沙普利超星系团", sub: "(312°, +31°) · 约 14,400 km/s", l: 312, b: 31, v: 14400, pull: true, at: 338, dy: -66 },
  { name: "船帆座超星系团", sub: "区域中心 (272.5°, 0°) · 约 18,000 km/s", l: 272.5, b: 0, v: 18000, pull: true, at: 343, dy: 62 },
  { name: "偶极排斥体（空洞）", sub: "示意 (93°, −18°) · 约 16,000 ± 4,500 km/s", l: 93, b: -18, v: 16000, pull: false, at: 350, dy: -70 },
];

const pos = (th: Thing): V3 => dir(th.l, th.b).map((x) => (x * th.v * UNIT) / H0) as V3;

const Arrow: React.FC<{ x0: number; y0: number; x1: number; y1: number; color: string; p: number }> = ({ x0, y0, x1, y1, color, p }) => {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const ex = x0 + (x1 - x0) * p;
  const ey = y0 + (y1 - y0) * p;
  return (
    <g stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.85}>
      <line x1={x0} y1={y0} x2={ex} y2={ey} />
      {p > 0.98 ? (
        <>
          <line x1={ex} y1={ey} x2={ex - 16 * Math.cos(ang - 0.45)} y2={ey - 16 * Math.sin(ang - 0.45)} />
          <line x1={ex} y1={ey} x2={ex - 16 * Math.cos(ang + 0.45)} y2={ey - 16 * Math.sin(ang + 0.45)} />
        </>
      ) : null}
    </g>
  );
};

export const PushPull: React.FC = () => {
  const t = useT();
  const galaxies = useBinary("galaxies.bin");
  const dist = track(t, [[329, 5.2], [372, 6.4]]);
  // 这几个结构差不多排在一条线上（偶极排斥体 ← 我们 → 巨引源 → 沙普利 → 船帆座），从侧面看才分得开
  const U = new THREE.Vector3(...dir(300, 14));
  const S = new THREE.Vector3().crossVectors(U, new THREE.Vector3(0, 1, 0)).normalize();
  const swing = track(t, [[329, -0.35], [372, 0.35]]);
  const cam = S.clone().multiplyScalar(1).add(new THREE.Vector3(0, 0.42, 0)).add(U.clone().multiplyScalar(swing)).normalize().multiplyScalar(dist).toArray() as V3;
  const look: V3 = [0, 0, 0];
  const fov = 46;
  const [ox, oy] = project([0, 0, 0], cam, look, fov);
  const shown = THINGS.map((th) => {
    const [x, y, z] = project(pos(th), cam, look, fov);
    return { th, x, y, z, p: ease(t, th.at, th.at + 3) * (1 - ramp(t, 371, 373)) };
  });
  return (
    <>
      {galaxies ? (
        <Canvas>
          <Rig pos={cam} look={look} fov={fov} far={200} />
          <Galaxies data={galaxies} stride={4} mode={0} unit={UNIT} gain={1.0} pixel={3.4} />
        </Canvas>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={ox} cy={oy} r={11} fill="none" stroke="#fff" strokeOpacity={0.9 * ramp(t, 330, 332)} strokeWidth={1.6} />
        {shown.map(({ th, x, y, z, p }) =>
          z > 0 && p > 0.003 ? (
            <g key={th.name} opacity={p}>
              <circle cx={x} cy={y} r={th.pull ? 20 : 34} fill={th.pull ? `${COLORS.amber}22` : `${COLORS.blue}18`} stroke={th.pull ? COLORS.amber : COLORS.blue} strokeWidth={1.6} strokeDasharray={th.pull ? undefined : "5 6"} />
              {th.pull ? (
                <Arrow x0={ox} y0={oy} x1={x} y1={y} color={COLORS.amber} p={ease(t, th.at + 1, th.at + 5)} />
              ) : (
                <Arrow x0={x} y0={y} x1={ox} y1={oy} color={COLORS.blue} p={ease(t, th.at + 1, th.at + 6)} />
              )}
            </g>
          ) : null,
        )}
      </svg>
      {shown.map(({ th, x, y, z, p }) =>
        z > 0 ? (
          <Tag key={th.name} chip x={x} y={y + th.dy} p={p} size={30} color={th.pull ? COLORS.amber : COLORS.blue} sub={th.sub}>
            {th.name}
          </Tag>
        ) : null,
      )}
      <Tag x={960} y={110} p={ramp(t, 331, 334) * (1 - ramp(t, 371, 373))} chip size={34} sub="琥珀色：拉　蓝色：推　· 位置来自论文，距离用「速度 ÷ 70」换成 Mpc，颜色深浅与大小只是示意">
        几个远处的结构
      </Tag>
      <Credit p={ramp(t, 332, 335) * (1 - ramp(t, 371, 373))}>背景：2MRS 星系 · 偶极排斥体：Hoffman 等 2017 · 船帆座：Kraan-Korteweg 等 2017</Credit>
    </>
  );
};
