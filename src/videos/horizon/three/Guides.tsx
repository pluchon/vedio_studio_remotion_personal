// 标注：真实比例下月球和行星都只有一两个像素，靠细细的轨道线和名字才看得出谁在哪儿。
// 轨道线画在 3D 里；名字是叠在画面上的字，位置由同一套镜头参数投影出来
import React, { useMemo } from "react";
import { interpolate } from "remotion";
import * as THREE from "three";
import { COLORS, FOV, HEIGHT, Shot, WIDTH } from "../theme";
import { FAR } from "./Bodies";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 一圈轨道只在从外面看得见整圈时才画：太小看不见；离得太近它只是一根横穿画面的线
const presence = (apparent: number) => interpolate(Math.log10(apparent), [-2.2, -1.6, -0.45, -0.2], [0, 1, 1, 0], clamp);

const CIRCLE = (() => {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 720; i++) points.push(new THREE.Vector3(Math.cos((i * Math.PI) / 360), Math.sin((i * Math.PI) / 360), 0));
  return new THREE.BufferGeometry().setFromPoints(points);
})();
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// 一圈轨道：center、radius 以米计，normal 是轨道面的法线；meters 是镜头此刻的距离
export const Ring: React.FC<{ center: THREE.Vector3; radius: number; normal: THREE.Vector3; meters: number; color?: string; strength?: number }> = ({
  center,
  radius,
  normal,
  meters,
  color = "#9fb4d8",
  strength = 0.5,
}) => {
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(Z_AXIS, normal), [normal]);
  const opacity = presence(radius / meters) * strength;
  if (opacity <= 0) return null;
  return (
    <lineLoop geometry={CIRCLE} position={center} quaternion={quaternion} scale={radius}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineLoop>
  );
};

// 和画布里一样的镜头，只用来算投影
const PROJECTOR = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, 0.004, FAR);

export type Mark = {
  name: string;
  note?: string;
  // 相对取景地的位置，米
  at: THREE.Vector3;
  // 镜头距离（米，取 10 的对数）在这个范围内才显示；不给范围就只看 show
  from?: number;
  to?: number;
  // 另外乘上的透明度
  show?: number;
  dot?: boolean;
};

export const Marks: React.FC<{ marks: Mark[]; shot: Shot; font: string }> = ({ marks, shot, font }) => {
  PROJECTOR.position.copy(shot.dir);
  PROJECTOR.up.copy(shot.up);
  PROJECTOR.lookAt(shot.target);
  PROJECTOR.updateMatrixWorld();
  return (
    <>
      {marks.map((m, i) => {
        const inRange = m.from === undefined || m.to === undefined ? 1 : interpolate(shot.level, [m.from, m.from + 0.25, m.to - 0.25, m.to], [0, 1, 1, 0], clamp);
        const opacity = inRange * (m.show ?? 1);
        if (opacity <= 0) return null;
        const p = m.at
          .clone()
          .multiplyScalar(1 / shot.meters)
          .project(PROJECTOR);
        if (p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1) return null;
        const x = ((p.x + 1) / 2) * WIDTH;
        const y = ((1 - p.y) / 2) * HEIGHT;
        // 名字写在右边；太靠右就翻到左边去
        const flip = x > WIDTH * 0.8;
        const side = flip ? { right: 58, textAlign: "right" as const } : { left: 58 };
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, opacity, color: COLORS.cream }}>
            {m.dot && <div style={{ position: "absolute", left: -3, top: -3, width: 6, height: 6, borderRadius: 3, background: COLORS.cream }} />}
            <div style={{ position: "absolute", left: flip ? -46 : 46, top: -14, width: 1, height: 28, background: COLORS.rule, opacity: 0.8 }} />
            <div style={{ position: "absolute", ...side, top: -19, whiteSpace: "nowrap", fontFamily: font, fontSize: 22, letterSpacing: "0.18em" }}>{m.name}</div>
            {m.note && (
              <div style={{ position: "absolute", ...side, top: 10, whiteSpace: "nowrap", fontFamily: font, fontSize: 15, letterSpacing: "0.12em", color: COLORS.soft }}>{m.note}</div>
            )}
          </div>
        );
      })}
    </>
  );
};
