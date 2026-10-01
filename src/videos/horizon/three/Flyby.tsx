// 掠过旅行者 1 号。在一光日的尺度上，镜头哪怕只挪动一点点都是几百万公里，探测器只有十几米长：
// 所以这一段镜头几乎停住，探测器按米为单位摆在镜头自己的坐标里，从身后滑进画面，再朝太阳的方向退远
import React from "react";
import { interpolate } from "remotion";
import * as THREE from "three";
import { Voyager } from "../../looking-up/three/Voyager";
import { FPS, Shot, T, rightFor } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const START = T.voyager - 0.9;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// 0 → 1：探测器从镜头身后到远得看不见
export const flybyProgress = (frame: number) => interpolate(frame / FPS, [START, T.voyagerOut], [0, 1], clamp);

// 探测器此刻在哪儿（渲染单位，1 单位 = 1 米，镜头在 shot.dir 处）
export const flybyPosition = (frame: number, shot: Shot) => {
  const p = flybyProgress(frame);
  // 往前的距离按指数拉开，和整部片子按数量级后退的感觉一致
  const ahead = 6 * 8000 ** p - 10;
  const forward = shot.target.clone().sub(shot.dir).normalize();
  return shot.dir
    .clone()
    .addScaledVector(forward, ahead)
    .addScaledVector(rightFor(shot.dir), -5.5)
    .addScaledVector(shot.up, 2.2);
};

export const VoyagerPass: React.FC<{ frame: number; shot: Shot }> = ({ frame, shot }) => {
  const p = flybyProgress(frame);
  if (p <= 0 || p > 0.9) return null;
  const forward = shot.target.clone().sub(shot.dir).normalize();
  const position = flybyPosition(frame, shot);
  // 天线朝着地球（也就是镜头看过去的方向），我们看到的是它的背面；整体缓缓转一点
  const aim = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, forward);
  const roll = new THREE.Quaternion().setFromAxisAngle(forward, 0.9 + p * 0.5);
  const quaternion = roll.multiply(aim);
  const sun = forward.clone().multiplyScalar(4000);
  const fill = shot.dir.clone().multiplyScalar(40).addScaledVector(rightFor(shot.dir), -30).addScaledVector(shot.up, 24);
  return (
    <>
      <ambientLight intensity={0.05} />
      {/* 太阳在它身后：逆光勾出轮廓；镜头这一侧补一点冷光，背面才看得清 */}
      <directionalLight position={sun} intensity={3.2} color="#fff1dc" />
      <directionalLight position={fill} intensity={0.45} color="#9fb4d8" />
      <group position={position} quaternion={quaternion}>
        <Voyager look="real" sunDir={[0, 1, 0]} />
      </group>
    </>
  );
};
