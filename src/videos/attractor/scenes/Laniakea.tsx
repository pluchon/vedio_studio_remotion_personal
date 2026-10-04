// 第七幕「拉尼亚凯亚」：Cosmicflows-4 的星系群按特殊速度上色；论文里说的那一片，直径约 160 Mpc
import React from "react";
import * as THREE from "three";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { useBinary } from "../data";
import { Credit, Tag } from "../labels";
import { Canvas, Galaxies, Rig, dir, project, rad } from "../space";
import { COLORS, asset } from "../theme";
import { ease, ramp, track, useT } from "../time";
import type { V3 } from "../time";

const UNIT = 0.01;
const RADIUS = 0.8; // 80 Mpc：直径 160 Mpc
// 示意的位置：我们在这一片里面，中心在巨引源这一边
const CENTRE = dir(307, 9).map((v) => v * 0.5) as V3;

// 球面上的三圈经线，投到屏幕上画成折线
const ring = (axis: THREE.Vector3, cam: V3, look: V3, fov: number) => {
  const u = new THREE.Vector3(1, 0, 0);
  if (Math.abs(axis.dot(u)) > 0.9) u.set(0, 0, 1);
  const a = new THREE.Vector3().crossVectors(axis, u).normalize();
  const b = new THREE.Vector3().crossVectors(axis, a).normalize();
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const th = (i / 96) * Math.PI * 2;
    const p = a
      .clone()
      .multiplyScalar(Math.cos(th) * RADIUS)
      .add(b.clone().multiplyScalar(Math.sin(th) * RADIUS))
      .add(new THREE.Vector3(...CENTRE));
    const [x, y, z] = project(p.toArray() as V3, cam, look, fov);
    if (z > 0) pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

export const Laniakea: React.FC = () => {
  const t = useT();
  const data = useBinary("cf4.bin");
  const dist = track(t, [[281, 3.2], [292, 5.6], [310, 6.4], [330, 6.0]]);
  const az = rad(track(t, [[281, 20], [330, 150]]));
  const el = rad(track(t, [[281, 20], [330, 16]]));
  const cam: V3 = [Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist];
  const look: V3 = [CENTRE[0] * 0.5, CENTRE[1] * 0.5, CENTRE[2] * 0.5];
  const fov = 44;
  const shown = ease(t, 296, 304);
  const [mx, my, mz] = project([0, 0, 0], cam, look, fov);
    return (
    <>
      {data ? (
        <Canvas>
          <Rig pos={cam} look={look} fov={fov} far={200} />
          <Galaxies data={data} stride={5} mode={1} unit={UNIT} gain={1.9} pixel={4.2} limit={190} focus={{ at: CENTRE.map((v) => v / UNIT) as V3, radius: RADIUS / UNIT, dim: 0.7 * shown }} />
        </Canvas>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: shown }}>
        {[new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)].map((axis, i) => (
          <polyline key={i} points={ring(axis, cam, look, fov)} fill="none" stroke={COLORS.amber} strokeWidth={3} strokeOpacity={1} strokeDasharray="10 8" />
        ))}
      </svg>
      {mz > 0 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: ramp(t, 293, 295) }}>
            <circle cx={mx} cy={my} r={12} fill="none" stroke="#fff" strokeOpacity={0.9} strokeWidth={1.6} />
          </svg>
          <Tag x={mx + 22} y={my - 26} p={ramp(t, 293, 296)} size={24} align="left">
            银河系
          </Tag>
        </>
      ) : null}
      <Tag chip x={960} y={118} p={ramp(t, 309, 311.5) * (1 - ramp(t, 327, 329.5))} size={36} color={COLORS.amber} sub="夏威夷语 lani 天 + akea 广阔、无量 · 示意：近似为圆，直径约 160 Mpc（5.2 亿光年），含约 10¹⁷ 个太阳的质量">
        拉尼亚凯亚 Laniakea
      </Tag>
      <Tag x={960} y={118} p={ramp(t, 284, 287) * (1 - ramp(t, 295, 297))} chip size={34} sub="Cosmicflows-4 · 3.8 万个星系群 · 橙：比膨胀多出的速度是远离我们 · 蓝：朝我们来">
        把更多星系的速度画在一起
      </Tag>
      <div style={{ position: "absolute", left: 1260, top: 500, width: 560, height: 315, opacity: ramp(t, 304, 306) * (1 - ramp(t, 326.6, 328.6)), boxShadow: "0 0 30px rgba(0,0,0,0.7)" }}>
        <OffthreadVideo src={staticFile(asset("video/supercl.mp4"))} muted style={{ width: 560, height: 315 }} />
      </div>
      <Tag chip x={1540} y={850} p={ramp(t, 305, 307) * (1 - ramp(t, 326.6, 328.6))} size={22}>
        同一片天的另一种画法 · Galaxies3D（CC BY-SA 4.0）
      </Tag>
      <div style={{ position: "absolute", left: 90, top: 560, width: 300, opacity: ramp(t, 316, 319) * (1 - ramp(t, 327, 329.5)) }}>
        <Img src={staticFile(asset("img/paper_tully2014.jpg"))} style={{ width: 300, boxShadow: "0 0 30px rgba(0,0,0,0.7)", filter: "brightness(0.9)" }} />
      </div>
      <Credit x={90} y={1012} align="left" p={ramp(t, 316, 319) * (1 - ramp(t, 327, 329.5))}>
        Tully 等，Nature 513, 71（2014）· Hawaiian: lani 天 + akea 广阔、无量
      </Credit>
    </>
  );
};
