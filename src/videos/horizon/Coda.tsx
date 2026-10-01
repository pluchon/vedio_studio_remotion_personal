// 尾声：从全黑回到此刻。镜头朝着斯隆长城缓缓推过去——十亿光年外一道由星系连成的墙，每个点都是巡天测到的真实星系。
// 一点暖色的光从我们这里出发，朝它飞去，越来越小
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { PerspectiveCamera } from "three";
import { Cloud, useBinary } from "./three/Cloud";
import { Post } from "./three/Post";
import { COLORS, FOV, FPS, HEIGHT, MPC, T, WIDTH, equatorial, upFor } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 斯隆长城的中段：赤经 13 时、赤纬几度，红移 0.07 到 0.08
const AIM = equatorial(197, 4);
const UP = upFor(AIM);
const START = T.now - 1.2;

const Camera: React.FC = () => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    // 点云自己减去镜头的位置，镜头只管朝向
    camera.position.set(0, 0, 0);
    camera.up.copy(UP);
    camera.lookAt(AIM);
    camera.fov = FOV;
    camera.near = 0.01;
    camera.far = 1e6;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
};

export const Coda: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const wall = useBinary("data/wall.bin");
  if (t < START) return null;
  // 镜头从家门口出发，朝长城推过去；起步快，然后慢下来
  const pushed = 45 + 150 * (1 - Math.exp(-(t - START) / 4.5));
  const eye = AIM.clone().multiplyScalar(pushed * MPC);
  const show = interpolate(t, [T.now - 0.6, T.now + 1.6], [0, 1], clamp) * interpolate(t, [T.end - 1.4, T.end - 0.2], [1, 0], clamp);

  // 那一点光：从镜头左下方出来，沿着视线越飞越远
  const p = interpolate(t, [T.now + 1.2, T.end - 1.0], [0, 1], clamp);
  const ahead = 1.2 * 260 ** p;
  const spark = eye
    .clone()
    .multiplyScalar(1 / MPC)
    .addScaledVector(AIM, ahead)
    .addScaledVector(UP, -0.34)
    .addScaledVector(UP.clone().cross(AIM), -0.5);
  const sparkData = new Float32Array([spark.x, spark.y, spark.z, 0.45]);
  const sparkGain = 6 * interpolate(p, [0, 0.06, 0.9, 1], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {wall && (
        <AbsoluteFill style={{ opacity: show }}>
          <ThreeCanvas width={WIDTH} height={HEIGHT}>
            <Camera />
            <Cloud data={wall} eye={eye} metersPerUnit={MPC} gain={0.62} body={0.13} minSize={1.6} fog={250} />
            <Cloud data={sparkData} eye={eye} metersPerUnit={MPC} gain={sparkGain} body={0.03} minSize={4.6} />
            <Post strength={1.1} radius={0.7} threshold={0.6} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 120,
          color: COLORS.cream,
          opacity: interpolate(t, [T.now + 0.8, T.now + 1.8], [0, 1], clamp) * interpolate(t, [T.question - 0.6, T.question + 0.2], [1, 0], clamp),
        }}
      >
        <div style={{ width: 70, height: 1, background: COLORS.rule }} />
        <div style={{ marginTop: 16, fontFamily: "Horizon Song", fontSize: 28, letterSpacing: "0.3em" }}>此刻 · 斯隆长城</div>
        <div style={{ marginTop: 10, fontFamily: "Horizon Song", fontSize: 18, letterSpacing: "0.2em", color: COLORS.soft }}>十亿光年外 · 长十四亿光年</div>
      </div>
    </AbsoluteFill>
  );
};
