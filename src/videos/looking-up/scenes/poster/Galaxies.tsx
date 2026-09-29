// 海报 · 1924 威尔逊山：镜头从银河的旋臂上方一路往后退，银河缩成一枚小小的漩涡，四周冒出越来越多别的星系——
// 那一年，人们第一次确认银河之外还有星系。全部平涂成复古配色的圆点
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Rows } from "../../components/Rows";
import { Subtitle } from "../../components/Subtitle";
import { CameraRig } from "../../three/CameraRig";
import { PointCloud, makeCloud } from "../../three/Points";
import { EASE_IN_OUT, RETRO, SEGMENTS, SPACE, localTime } from "../../theme";

const t = localTime(SEGMENTS.galaxies);
const PALETTE = [RETRO.creamLight, RETRO.mustard, RETRO.salmon, RETRO.tealLight, RETRO.coral].map((c) => new THREE.Color(c));

// 旋涡星系：三条旋臂，中心偏黄、外围偏蓝粉
const spiral = (seed: string, count: number, radius: number) =>
  makeCloud(count, (i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const d = Math.pow(r("d"), 0.7) * radius;
    const arm = Math.floor(r("arm") * 3);
    const a = (arm / 3) * Math.PI * 2 + (d / radius) * 5.2 + (r("a") - 0.5) * (0.9 - (d / radius) * 0.5);
    const h = (r("h") - 0.5) * radius * 0.06 * (1 - d / radius);
    const core = d < radius * 0.18;
    const c = core ? PALETTE[r("c") < 0.6 ? 1 : 0] : PALETTE[1 + Math.floor(r("c") * 4)];
    return { p: [Math.cos(a) * d, h, Math.sin(a) * d], s: 0.8 + r("s") * 1.4, c };
  });

// 远处的别的星系：一小团一小团
const FIELD = Array.from({ length: 70 }, (_, i) => {
  const r = (k: string) => random(`field-${i}-${k}`);
  const dir = new THREE.Vector3(r("x") - 0.5, (r("y") - 0.5) * 0.7, r("z") - 0.5).normalize();
  const dist = 260 + r("d") * 1400;
  return {
    position: dir.multiplyScalar(dist).toArray() as [number, number, number],
    rotation: [r("rx") * 3, r("ry") * 3, r("rz") * 3] as [number, number, number],
    size: 10 + r("s") * 26,
    seed: `g${i}`,
  };
});

const BACKGROUND = makeCloud(900, (i) => {
  const r = (k: string) => random(`bg-${i}-${k}`);
  const v = new THREE.Vector3(r("x") - 0.5, r("y") - 0.5, r("z") - 0.5).normalize().multiplyScalar(2600);
  return { p: [v.x, v.y, v.z], s: 1, c: PALETTE[0] };
});

export const Galaxies: React.FC = () => {
  const frame = useCurrentFrame();
  const milky = useMemo(() => spiral("milky", 14000, 60), []);
  const others = useMemo(() => FIELD.map((g) => spiral(g.seed, 380, g.size)), []);
  const p = interpolate(frame, [0, t(104.98)], [0, 1], { easing: EASE_IN_OUT });
  // 镜头沿一条斜线往后退，距离按指数拉开
  const dist = 70 * Math.pow(1800 / 70, p);
  const dir = new THREE.Vector3(0.15, 0.62, 1).normalize();
  const cam = dir.multiplyScalar(dist);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${RETRO.navy} 0%, ${RETRO.navyDeep} 100%)` }}>
      <ThreeCanvas width={1920} height={1080}>
        <CameraRig position={[cam.x, cam.y, cam.z]} target={[0, 0, 0]} fov={50} />
        <PointCloud cloud={BACKGROUND} flat scale={200} minSize={1.2} maxSize={2.2} opacity={0.5} />
        <group rotation={[0, frame * 0.0015, 0]}>
          <PointCloud cloud={milky} flat scale={260} minSize={1.3} maxSize={5} />
        </group>
        {FIELD.map((g, i) => (
          <PointCloud key={i} cloud={others[i]} flat position={g.position} rotation={g.rotation} scale={260} minSize={1.1} maxSize={4} />
        ))}
      </ThreeCanvas>
      <Rows
        rows={[
          { label: "银河系", value: "数千亿颗恒星", at: t(97.3) },
          { label: "银河之外", value: "以千亿计的星系", at: t(100.8), color: RETRO.mustard },
        ]}
        left={1180}
        top={190}
        labelWidth={170}
        step={78}
        size={40}
        color={SPACE.cream}
        soft={SPACE.creamSoft}
      />
      <Mist tone="space" strength={0.55} height={300} />
      <Locator year="1924" place="威尔逊山天文台" at={t(96.1)} tone="space" />
      <Subtitle
        zh={["光要走亿万年才能到达眼前；", "银河之外，还有以千亿计的星系。"]}
        en={["Light travels for billions of years to reach our eyes;", "beyond the Milky Way lie hundreds of billions of galaxies."]}
        at={t(96.5)}
        out={t(104.6)}
        tone="space"
      />
      <Grain opacity={0.08} vignette={0.25} />
    </AbsoluteFill>
  );
};
