// 深空 · 2012：太阳风吹出的那个大气泡，边缘是一层淡淡发光的壳；旅行者号穿过去，就离开了太阳的庇护。
// 镜头回头看，太阳缩成一颗普通的星。最后记下它今天在哪儿
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Grain } from "../../../../shared/Grain";
import { Mist } from "../../components/Ink";
import { Locator } from "../../components/Locator";
import { Rows } from "../../components/Rows";
import { Subtitle } from "../../components/Subtitle";
import { CameraRig } from "../../three/CameraRig";
import { DeepSky } from "../../three/DeepSky";
import { Glow } from "../../three/Points";
import { useTextures } from "../../three/useTextures";
import { Voyager } from "../../three/Voyager";
import { EASE_IN_OUT, SEGMENTS, SPACE, asset, localTime } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.helio);
const TEXTURES = { sky: asset("textures/milky_way.jpg") };
const SHELL = 120;

// 气泡的壳：只在掠射的边缘发光
const SHELL_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vPosV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosV = mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;
const SHELL_FRAGMENT = /* glsl */ `
  uniform float strength;
  varying vec3 vNormalV;
  varying vec3 vPosV;
  void main() {
    float f = 1.0 - abs(dot(normalize(vNormalV), normalize(-vPosV)));
    // 只是一层很淡的边：掠射处也压得很低，免得看成一颗行星的大气
    gl_FragColor = vec4(vec3(0.5, 0.52, 0.95) * pow(f, 6.0) * strength, 1.0);
  }
`;

const Shell: React.FC<{ strength: number }> = ({ strength }) => {
  const uniforms = useMemo(() => ({ strength: { value: 1 } }), []);
  uniforms.strength.value = strength;
  return (
    <mesh scale={SHELL}>
      <sphereGeometry args={[1, 128, 96]} />
      <shaderMaterial vertexShader={SHELL_VERTEX} fragmentShader={SHELL_FRAGMENT} uniforms={uniforms} side={THREE.DoubleSide} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

export const Helio: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures(TEXTURES);
  // 旅行者号沿 +z 往外飞，在 182 秒左右穿过壳
  const vz = interpolate(frame, [0, t(195.54)], [104, 150]);
  // 前半跟拍，后半镜头回头看太阳
  const look = interpolate(frame, [t(186), t(192)], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const cam: [number, number, number] = [14 - look * 10, 4 + look * 2, vz + 10 + look * 22];
  const target: [number, number, number] = [0, 0, vz * (1 - look)];
  const crossing = interpolate(frame, [t(181.6), t(182.2), t(183.4), t(186)], [0.12, 0.45, 0.12, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE.bg }}>
      {tex && (
        <ThreeCanvas width={1920} height={1080}>
          <CameraRig position={cam} target={target} fov={45} />
          <DeepSky sky={tex.sky} brightness={0.45} />
          <ambientLight intensity={0.1} />
          {/* 平行光从太阳那边（-z）照过来 */}
          <directionalLight position={[0, 0, -10]} intensity={2} />
          {/* 太阳：离得越远越小 */}
          <Glow color="#fff1d6" size={interpolate(vz, [104, 150], [26, 12])} intensity={1.3} position={[0, 0, 0]} />
          <directionalLight position={[10, 6, 200]} intensity={0.6} color="#9fb4d8" />
          <Shell strength={crossing} />
          <group position={[0, 0, vz]}>
            <Voyager look="real" sunDir={[0, 0, -1]} rotation={[-Math.PI / 2, 0, 0]} scale={1.1} />
          </group>
        </ThreeCanvas>
      )}
      <Rows
        rows={[
          { label: "如今 · 距地球", value: "约 256 亿公里", at: t(190.4) },
          { label: "2026 年 11 月", value: "将满一光日", at: t(191.6), color: SPACE.cinnabar },
        ]}
        left={1150}
        top={200}
        labelWidth={230}
        step={76}
        size={42}
        color={SPACE.cream}
        soft={SPACE.creamSoft}
      />
      <Mist tone="space" strength={0.5} height={260} />
      <Locator year="2012" place="日球层顶 · 距太阳 121 天文单位" at={t(181.4)} tone="space" />
      <Subtitle zh={["它至今仍在飞，早已离开了太阳的庇护。"]} en={["It is still flying, long gone from the shelter of the Sun."]} at={t(182.6)} out={t(189.9)} tone="space" stagger={2.6} />
      <Grain opacity={0.06} vignette={0.3} />
    </AbsoluteFill>
  );
};
