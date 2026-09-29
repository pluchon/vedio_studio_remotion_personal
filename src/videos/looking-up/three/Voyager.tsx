// 旅行者号：一口朝向地球的大碟形天线，下面十边形的仪器舱，一侧长长的磁强计杆，另一侧挂三节核电池的杆，
// 再伸出一根科学仪器杆。海报风用平涂，深空里用金属质感
import React, { useMemo } from "react";
import * as THREE from "three";
import { RETRO } from "../theme";
import { ToonMaterial } from "./Toon";

type Look = "retro" | "real";

// 抛物面天线的剖面：口径 3.7 米，按 1 单位 = 1 米
const dishProfile = () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const r = (i / 16) * 1.85;
    pts.push(new THREE.Vector2(r, (r * r) / 5.2));
  }
  return pts;
};

const Part: React.FC<{ look: Look; tone: string; real: string; metal?: number; sunDir: [number, number, number]; children: React.ReactNode }> = ({
  look,
  tone,
  real,
  metal = 0.3,
  sunDir,
  children,
}) => (
  <mesh>
    {children}
    {look === "retro" ? (
      <ToonMaterial color={tone} night={RETRO.navyDeep} sunDir={sunDir} side={THREE.DoubleSide} />
    ) : (
      <meshStandardMaterial color={real} metalness={metal} roughness={0.45} side={THREE.DoubleSide} />
    )}
  </mesh>
);

export const Voyager: React.FC<{
  look: Look;
  sunDir: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ look, sunDir, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const dish = useMemo(() => new THREE.LatheGeometry(dishProfile(), 48), []);
  const p = { look, sunDir };

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 天线：碟口朝 +Y */}
      <group position={[0, 0.5, 0]}>
        <Part {...p} tone={RETRO.creamLight} real="#e9e6df" metal={0.1}>
          <primitive object={dish} attach="geometry" />
        </Part>
        <group position={[0, 0.9, 0]}>
          <Part {...p} tone={RETRO.sand} real="#b9b2a4">
            <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
          </Part>
        </group>
      </group>
      {/* 十边形仪器舱 */}
      <Part {...p} tone={RETRO.mustard} real="#c9a84a" metal={0.7}>
        <cylinderGeometry args={[0.9, 0.9, 0.45, 10]} />
      </Part>
      {/* 磁强计杆：13 米，画短一些 */}
      <group position={[-3.2, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Part {...p} tone={RETRO.cream} real="#d8d4cc">
          <cylinderGeometry args={[0.04, 0.04, 5.6, 6]} />
        </Part>
      </group>
      {/* 核电池杆：三节圆筒 */}
      <group position={[1.9, -0.25, 0.3]} rotation={[0, 0.3, Math.PI / 2]}>
        <Part {...p} tone={RETRO.sand} real="#a8a296">
          <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
        </Part>
        {[0.2, 0.62, 1.04].map((y) => (
          <group key={y} position={[0, -y, 0]}>
            <Part {...p} tone={RETRO.coral} real="#5b5a58" metal={0.6}>
              <cylinderGeometry args={[0.2, 0.2, 0.36, 12]} />
            </Part>
          </group>
        ))}
      </group>
      {/* 科学仪器杆与仪器平台 */}
      <group position={[1.2, -0.3, -1.3]} rotation={[0.9, 0, 0.4]}>
        <Part {...p} tone={RETRO.cream} real="#cfcac0">
          <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
        </Part>
        <group position={[0, 1.3, 0]}>
          <Part {...p} tone={RETRO.teal} real="#6f6c68" metal={0.5}>
            <boxGeometry args={[0.5, 0.4, 0.45]} />
          </Part>
        </group>
      </group>
    </group>
  );
};
