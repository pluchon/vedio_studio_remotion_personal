// 第三幕「叶子与水流」：真实的星系群（Cosmicflows-4）先是一起膨胀，再给每一个加上它自己的特殊速度
import React, { useMemo } from "react";
import * as THREE from "three";
import { useBinary } from "../data";
import { Tag } from "../labels";
import { Canvas, Galaxies, Rig, Segments, dir, gal, project, rad } from "../space";
import { COLORS } from "../theme";
import { ease, ramp, track, useT } from "../time";
import { Stream } from "./Stream";
import type { V3 } from "../time";

const UNIT = 0.01; // 一个 Mpc 合 0.01 个 three 单位
const FLOW = 0.012; // 画线时，1 km/s 画成多少 Mpc

export const Leaves: React.FC = () => {
  const t = useT();
  const data = useBinary("cf4.bin");
  const lines = useMemo(() => {
    if (!data) return null;
    const from: V3[] = [];
    const to: V3[] = [];
    const color: V3[] = [];
    for (let i = 0; i < data.length / 5; i += 2) {
      const x = data[i * 5];
      const y = data[i * 5 + 1];
      const z = data[i * 5 + 2];
      const v = data[i * 5 + 3];
      const d = Math.hypot(x, y, z);
      if (d > 75 || d < 6 || Math.abs(v) < 120 || Math.abs(v) > 900) continue;
      const k = 1 + (v * FLOW) / d;
      from.push(gal(x * UNIT, y * UNIT, z * UNIT));
      to.push(gal(x * k * UNIT, y * k * UNIT, z * k * UNIT));
      color.push(v > 0 ? [1.0, 0.62, 0.3] : [0.35, 0.62, 1.0]);
    }
    return { from, to, color };
  }, [data]);

  // 镜头：站在银河系后面，朝着巨引源所在的那一边看，慢慢绕
  const ahead = new THREE.Vector3(...dir(315, 0));
  const az = rad(track(t, [[97, -25], [140, 35]]));
  const cam = ahead.clone().negate().multiplyScalar(2.9).applyAxisAngle(new THREE.Vector3(0, 1, 0), az).add(new THREE.Vector3(0, 0.55, 0)).toArray() as V3;
  const look: V3 = [0, 0, 0];
  const fov = 44;
  const expand = track(t, [[97, 0.8], [118, 1.0]]);
  const flow = ease(t, 113, 124);
  const colored = ease(t, 119, 124);
  const [mx, my] = project([0, 0, 0], cam, look, fov);
  return (
    <>
      <Stream />
      <Tag x={1330} y={540} p={ramp(t, 112, 115) * (1 - ramp(t, 119, 121))} size={30} color={COLORS.amber} sub="大质量处的引力，把附近的星系轻轻扯过去">
        漩涡
      </Tag>
      {data && lines ? (
        <div style={{ position: "absolute", inset: 0, opacity: ramp(t, 116, 121) }}>
        <Canvas>
          <Rig pos={cam} look={look} fov={fov} far={100} />
          <Galaxies data={data} stride={5} mode={2} unit={UNIT} gain={1.2 * (1 - colored)} pixel={4.0} expand={expand} limit={115} />
          <Galaxies data={data} stride={5} mode={1} unit={UNIT} gain={1.2 * colored} pixel={4.0} expand={expand} flow={flow * FLOW} limit={115} />
          <Segments from={lines.from} to={lines.to} color={lines.color} alpha={0.2 * ramp(t, 121, 127)} />
        </Canvas>
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: ramp(t, 116, 118) }}>
        <circle cx={mx} cy={my} r={13} fill="none" stroke={COLORS.amber} strokeWidth={1.6} />
        <circle cx={mx} cy={my} r={2.6} fill={COLORS.amber} />
      </svg>
      <Tag x={mx + 22} y={my - 30} p={ramp(t, 116, 118) * (1 - ramp(t, 120, 122))} size={24} align="left" color={COLORS.amber}>
        银河系
      </Tag>
      <Tag x={960} y={118} p={ramp(t, 100, 103) * (1 - ramp(t, 109, 111))} size={36} sub="所有星系顺着宇宙的膨胀，彼此散开">
        哈勃流：整体的膨胀
      </Tag>
      <Tag x={960} y={118} p={ramp(t, 123, 126) * (1 - ramp(t, 138, 140))} size={36} sub="比膨胀多出来的那一点速度 · 橙色：多出来的是远离我们 · 蓝色：多出来的是朝我们来">
        特殊速度
      </Tag>
    </>
  );
};
