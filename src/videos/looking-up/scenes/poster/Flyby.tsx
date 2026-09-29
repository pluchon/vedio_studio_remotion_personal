// 海报 · 旅行者号的远行：1979 掠过木星，1980 掠过土星，然后越飞越远——最后这一幕里，海报的颜色一点点褪掉，
// 只剩真正的黑，接下一段的深空
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
import { RetroPlanet } from "../../three/RetroPlanet";
import { useTextures } from "../../three/useTextures";
import { Voyager } from "../../three/Voyager";
import { EASE_IN_OUT, RETRO, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const TEXTURES = { jupiter: asset("textures/jupiter.jpg") };
const SUN: [number, number, number] = [-0.6, 0.3, 1];
const JUPITER: [string, string, string, string, string] = [RETRO.coral, RETRO.salmon, RETRO.sand, RETRO.cream, RETRO.creamLight];
const SATURN: [string, string, string, string, string] = [RETRO.salmon, RETRO.sand, RETRO.cream, RETRO.creamLight, RETRO.mustard];

const STARS = makeCloud(1400, (i) => {
  const r = (k: string) => random(`fly-${i}-${k}`);
  const v = new THREE.Vector3(r("x") - 0.5, r("y") - 0.5, r("z") - 0.5).normalize().multiplyScalar(900);
  return { p: [v.x, v.y, v.z], s: 1 + r("s") * 2, c: new THREE.Color(RETRO.creamLight) };
});

const Backdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 40% 45%, ${RETRO.navy} 0%, ${RETRO.navyDeep} 100%)` }}>{children}</AbsoluteFill>
);

// 土星环：按半径分几圈平涂，中间留一道卡西尼缝
const RING_VERTEX = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const RING_FRAGMENT = /* glsl */ `
  uniform vec3 c0;
  uniform vec3 c1;
  uniform vec3 c2;
  uniform float inner;
  uniform float outer;
  varying vec3 vPos;
  void main() {
    float f = (length(vPos.xy) - inner) / (outer - inner);
    if (f > 0.63 && f < 0.69) discard;
    vec3 col = f < 0.22 ? c0 : f < 0.42 ? c1 : f < 0.63 ? c2 : f < 0.86 ? c1 : c0;
    gl_FragColor = vec4(col, 0.92);
  }
`;

const Rings: React.FC<{ inner: number; outer: number; tilt: number }> = ({ inner, outer, tilt }) => {
  const uniforms = useMemo(
    () => ({
      c0: { value: new THREE.Color(RETRO.brown) },
      c1: { value: new THREE.Color(RETRO.sand) },
      c2: { value: new THREE.Color(RETRO.cream) },
      inner: { value: inner },
      outer: { value: outer },
    }),
    [inner, outer],
  );
  return (
    <mesh rotation={[-Math.PI / 2 + tilt, 0, 0]}>
      <ringGeometry args={[inner, outer, 160, 1]} />
      <shaderMaterial vertexShader={RING_VERTEX} fragmentShader={RING_FRAGMENT} uniforms={uniforms} side={THREE.DoubleSide} transparent />
    </mesh>
  );
};

// 1979 · 木星：镜头跟着旅行者号从左往右，身后是占满半个画面的木星
export const Jupiter: React.FC = () => {
  const frame = useCurrentFrame();
  const t = localTime(SEGMENTS.jupiter);
  const tex = useTextures(TEXTURES);
  const p = interpolate(frame, [0, t(141.25)], [0, 1], { easing: EASE_IN_OUT });
  const vx = -22 + p * 44;

  return (
    <Backdrop>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          <CameraRig position={[vx - 10, 9, 42]} target={[vx * 0.5, 1, 0]} fov={42} />
          <PointCloud cloud={STARS} flat scale={200} minSize={1.2} maxSize={2.4} opacity={0.7} />
          <RetroPlanet map={tex.jupiter} palette={JUPITER} night={RETRO.navyDeep} radius={14} spin={frame * 0.004} sunDir={SUN} range={[0.3, 0.75]} />
          {/* 碟面斜朝镜头和太阳，受光，才认得出是一口天线 */}
          <Voyager look="retro" sunDir={SUN} position={[vx, 4, 27]} rotation={[Math.PI / 2 - 0.35, 0.5, 0.2]} scale={0.6} />
        </ThreeCanvas>
      )}
      <Rows rows={[{ label: "距木星中心", value: "34.9 万公里", at: t(135.5) }]} left={1300} top={170} labelWidth={170} size={40} color={SPACE.cream} soft={SPACE.creamSoft} />
      <Mist tone="space" strength={0.5} height={260} />
      <Locator year="1979" place="木星" at={t(132.4)} tone="space" />
      <Subtitle zh={["驶入没有尽头的黑暗。"]} en={["into a darkness without end."]} at={t(133.0)} out={t(138.2)} tone="space" stagger={3} />
      <Grain opacity={0.08} vignette={0.25} />
    </Backdrop>
  );
};

// 1980 · 土星：从环面上方俯看，旅行者号从环外掠过
export const Saturn: React.FC = () => {
  const frame = useCurrentFrame();
  const t = localTime(SEGMENTS.saturn);
  const p = interpolate(frame, [0, t(150.3)], [0, 1], { easing: EASE_IN_OUT });
  const tilt = 0.42;

  return (
    <Backdrop>
      <ThreeCanvas width={1920} height={1080}>
        <CameraRig position={[-30 + p * 26, 14 - p * 4, 46]} target={[p * 6, 0, 0]} fov={42} />
        <PointCloud cloud={STARS} flat scale={200} minSize={1.2} maxSize={2.4} opacity={0.7} />
        <group rotation={[0, 0, 0.18]}>
          <RetroPlanet palette={SATURN} night={RETRO.navyDeep} radius={10} tilt={tilt} spin={frame * 0.004} sunDir={SUN} bands={9} />
          <Rings inner={13.5} outer={24} tilt={tilt} />
        </group>
        <Voyager look="retro" sunDir={SUN} position={[-18 + p * 40, 11, 24]} rotation={[Math.PI / 2 - 0.35, 0.5, 0.2]} scale={0.55} />
      </ThreeCanvas>
      <Rows rows={[{ label: "距土星云顶", value: "12.4 万公里", at: t(143.5) }]} left={1300} top={900} labelWidth={170} size={40} color={SPACE.cream} soft={SPACE.creamSoft} />
      <Locator year="1980" place="土星" at={t(141.45)} tone="space" />
      <Grain opacity={0.08} vignette={0.25} />
    </Backdrop>
  );
};

// 越飞越远：旅行者号朝画面深处飞去，缩成一个点；海报的颜色一点点褪掉
export const Recede: React.FC = () => {
  const frame = useCurrentFrame();
  const t = localTime(SEGMENTS.recede);
  const p = interpolate(frame, [0, t(159.4)], [0, 1], { easing: (x) => x * x });
  const fade = interpolate(frame, [t(152), t(159.2)], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ filter: `saturate(${1 - fade}) brightness(${1 - fade * 0.45})` }}>
        <Backdrop>
          <ThreeCanvas width={1920} height={1080}>
            <CameraRig position={[0, 2, 12]} target={[0, 0, -40]} fov={42} />
            <PointCloud cloud={STARS} flat scale={200} minSize={1.2} maxSize={2.4} opacity={0.7} />
            <RetroPlanet palette={SATURN} night={RETRO.navyDeep} radius={10} position={[-46, -14, -150]} tilt={0.42} sunDir={SUN} bands={9} />
            <Voyager look="retro" sunDir={SUN} position={[1 - p * 3, 0.5 - p * 1.5, -2 - p * 160]} rotation={[0.5, 0.3 + frame * 0.002, Math.PI / 2]} scale={0.5} />
          </ThreeCanvas>
        </Backdrop>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: SPACE.bg, opacity: fade * 0.6 }} />
      <Grain opacity={0.08 * (1 - fade * 0.5)} vignette={0.25} />
    </AbsoluteFill>
  );
};
