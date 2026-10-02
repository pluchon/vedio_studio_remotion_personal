// 数据范围以外的地球，和地球边缘那一圈大气
import React from "react";
import * as THREE from "three";
import { EARTH } from "../theme";
import { AIR } from "./glsl";

const GLOBE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }
`;

const GLOBE_FRAGMENT = /* glsl */ `
  ${AIR}
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vec3 up = normalize(vPos);
    float lit = smoothstep(-0.05, 0.12, dot(up, sunDir));
    vec3 sunColor = mix(vec3(1.0, 0.62, 0.36), vec3(1.0, 0.95, 0.88), smoothstep(0.05, 0.5, dot(up, sunDir)));
    vec3 color = texture2D(map, vUv).rgb * (vec3(0.36, 0.5, 0.8) * 0.3 + sunColor * 1.15) * lit;
    gl_FragColor = vec4(grade(withHaze(color, vPos)), 1.0);
    #include <colorspace_fragment>
  }
`;

const AIR_VERTEX = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }
`;

// 看到的是一个大壳的内壁：每条视线离地心最近时有多高，那里的空气就有多厚
const AIR_FRAGMENT = /* glsl */ `
  ${AIR}
  uniform float thickness;
  varying vec3 vPos;
  void main() {
    vec3 ray = normalize(vPos - cameraPosition);
    float along = max(-dot(cameraPosition, ray), 0.0);
    vec3 nearest = cameraPosition + ray * along;
    float height = length(nearest) - ${EARTH.toFixed(1)};
    float glow = exp(-max(height, 0.0) / thickness);
    float day = smoothstep(-0.25, 0.2, dot(normalize(nearest), sunDir));
    vec3 color = hazeColor(ray) * (glow * 1.1 + pow(glow, 5.0) * 1.3) * (0.1 + 0.9 * day);
    gl_FragColor = vec4(grade(color), 1.0);
    #include <colorspace_fragment>
  }
`;

export const Sky: React.FC<{ map: THREE.Texture; sun: THREE.Vector3; hazeRange: number; thickness?: number }> = ({
  map,
  sun,
  hazeRange,
  thickness = 12,
}) => {
  // 每帧给一份新的：画布会把 uniforms 复制进材质，事后改原对象里的数字它看不到
  const globe = { map: { value: map }, sunDir: { value: sun }, hazeRange: { value: hazeRange } };
  const air = { sunDir: { value: sun }, hazeRange: { value: hazeRange }, thickness: { value: thickness } };

  return (
    <>
      <mesh renderOrder={-2}>
        <sphereGeometry args={[EARTH + 600, 96, 48]} />
        <shaderMaterial vertexShader={AIR_VERTEX} fragmentShader={AIR_FRAGMENT} uniforms={air} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh renderOrder={0}>
        <sphereGeometry args={[EARTH - 3, 192, 96]} />
        <shaderMaterial vertexShader={GLOBE_VERTEX} fragmentShader={GLOBE_FRAGMENT} uniforms={globe} />
      </mesh>
    </>
  );
};
