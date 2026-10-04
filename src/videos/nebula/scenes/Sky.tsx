// 第一幕「云」：地球上的云，一路抬头，天黑下来，露出星星
// 第二幕「银河与星系」：地球只是银河里普通的一颗，银河又只是千亿个星系里的一个
import React from "react";
import * as THREE from "three";
import { Tag } from "../labels";
import { Canvas, VolumeMesh } from "../Volume";
import type { V3 } from "../Volume";
import { COLORS } from "../theme";
import { Dots, FIELD, GALAXY, Rig, project } from "../Stars";
import { ease, ramp, track, track3, useT } from "../time";

export const Clouds: React.FC = () => {
  const t = useT();
  const sun = track(t, [[-2, 0.1], [5, 0.15], [9.5, 0.35], [10.8, 1], [13.6, 1], [14.6, 0.7], [18, 0.5], [25, 0.55]]);
  const dark = track(t, [[13.4, 0], [14.8, 1], [17.4, 1], [19.2, 0.1]]);
  const night = track(t, [[17, 0], [21, 0.35], [25, 0.85]]);
  const look = track3(t, [
    [-2, [-0.6, 0.85, -3]],
    [10, [-0.6, 1.2, -3]],
    [19, [-0.3, 1.9, -2.6]],
    [26, [0, 4.0, -1.6]],
  ]);
  return (
    <>
      <Canvas>
        <VolumeMesh time={t} cam={[0, 0.3, 0]} look={look} fov={62} sun={sun} dark={dark} night={night} exposure={1} />
      </Canvas>
    </>
  );
};

// 银河系：我们在一条旋臂上
const TILT: V3 = [-1.05, 0.0, 0.35];
const SUN_LOCAL = new THREE.Vector3(0.62 * Math.cos(0.9), 0.62 * Math.sin(0.9), 0);

export const Cosmos: React.FC = () => {
  const t = useT();
  const dist = track(t, [[24, 2.3], [29, 2.6], [33.5, 45], [39.5, 70]]);
  const lift = track(t, [[24, 1.4], [29, 1.7], [33.5, 28], [39.5, 40]]);
  const cam: V3 = [0.3, lift, dist];
  const look: V3 = [0, 0, 0];
  const fov = 46;
  const spin = t * 0.025;
  const euler = new THREE.Euler(TILT[0], TILT[1], TILT[2] + spin, "XYZ");
  const sunWorld = SUN_LOCAL.clone().applyEuler(euler);
  const [sx, sy] = project([sunWorld.x, sunWorld.y, sunWorld.z], cam, look, fov);
  const fieldAlpha = ease(t, 28.2, 34.5);
  const fadeIn = ramp(t, 24.0, 26.2);
  return (
    <>
      <Canvas>
        <VolumeMesh time={t} cam={[0, 0, 50]} look={[0, 0, 60]} mix={1} exposure={0.8} />
        <Rig pos={cam} look={look} fov={fov} />
        <Dots data={GALAXY()} alpha={0.55 * fadeIn} time={t} rotation={[TILT[0], TILT[1], TILT[2] + spin]} />
        <Dots data={FIELD()} alpha={0.85 * fieldAlpha} time={t} rotation={[0, t * 0.01, 0]} />
      </Canvas>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: ramp(t, 26, 27.2) * (1 - ramp(t, 31, 32.4)) }}>
        <circle cx={sx} cy={sy} r={18} fill="none" stroke={COLORS.warm} strokeWidth={1.8} strokeOpacity={0.85} />
        <circle cx={sx} cy={sy} r={3.2} fill={COLORS.warm} />
      </svg>
      <Tag x={sx + 34} y={sy - 30} p={ramp(t, 26.4, 27.6) * (1 - ramp(t, 31, 32.4))} size={26} align="left" color={COLORS.warm}>
        我们在这里
      </Tag>
      <Tag x={960} y={180} p={ramp(t, 31.4, 33.0) * (1 - ramp(t, 37.5, 39.0))} size={34} sub="像银河系这样的星系，千亿个">
        千亿个星系
      </Tag>
    </>
  );
};
