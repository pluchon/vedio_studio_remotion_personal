// 复古海报风的星球：贴图只取明暗，分成几档平涂成调色板里的颜色；受光面和背光面一刀切开，背光面压成藏青
import React, { useMemo } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

// 不走色彩空间转换：调色板的颜色原样输出，和画面里的平面色块对得上
const FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float useMap;
  uniform vec3 sunDir;
  uniform vec3 c0;
  uniform vec3 c1;
  uniform vec3 c2;
  uniform vec3 c3;
  uniform vec3 c4;
  uniform vec3 night;
  uniform float lo;
  uniform float hi;
  uniform float bands;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float l = 0.75;
    if (bands > 0.0) {
      // 没有贴图的气态行星：按纬度叠两组正弦，平涂出宽窄不一的色带
      l = 0.52 + 0.22 * sin(vUv.y * bands * 3.1416) + 0.1 * sin(vUv.y * bands * 7.3 + 1.0);
    }
    if (useMap > 0.5) {
      // 取模糊一些的那层 mipmap，平涂出来是成片的色带而不是碎点
      vec3 t = texture2D(map, vUv, 2.5).rgb;
      l = clamp((dot(t, vec3(0.299, 0.587, 0.114)) - lo) / (hi - lo), 0.0, 1.0);
    }
    vec3 col = l < 0.2 ? c0 : l < 0.4 ? c1 : l < 0.6 ? c2 : l < 0.8 ? c3 : c4;
    float d = dot(normalize(vNormalW), sunDir);
    float lit = smoothstep(-0.03, 0.05, d);
    // 受光面靠边缘再压一档，像印刷时多套了一层
    float edge = smoothstep(0.35, 0.05, d) * lit;
    col = mix(col, col * 0.82, edge * 0.6);
    gl_FragColor = vec4(mix(mix(night, col, 0.12), col, lit), 1.0);
  }
`;

const rgb = (hex: string) => new THREE.Color(hex);

export const RetroPlanet: React.FC<{
  map?: THREE.Texture;
  palette: [string, string, string, string, string];
  night: string;
  radius: number;
  position?: [number, number, number];
  spin?: number;
  tilt?: number;
  sunDir: [number, number, number];
  // 贴图明暗的取值范围，决定分档落在哪里
  range?: [number, number];
  // 没有贴图时按纬度画几条色带
  bands?: number;
}> = ({ map, palette, night, radius, position = [0, 0, 0], spin = 0, tilt = 0, sunDir, range = [0.3, 0.85], bands = 0 }) => {
  const uniforms = useMemo(
    () => ({
      map: { value: map ?? null },
      useMap: { value: map ? 1 : 0 },
      sunDir: { value: new THREE.Vector3() },
      c0: { value: rgb(palette[0]) },
      c1: { value: rgb(palette[1]) },
      c2: { value: rgb(palette[2]) },
      c3: { value: rgb(palette[3]) },
      c4: { value: rgb(palette[4]) },
      night: { value: rgb(night) },
      lo: { value: range[0] },
      hi: { value: range[1] },
      bands: { value: bands },
    }),
    [map, palette, night, range, bands],
  );
  uniforms.sunDir.value.set(...sunDir).normalize();

  return (
    <mesh position={position} rotation={[tilt, spin, 0]} scale={radius}>
      <sphereGeometry args={[1, 96, 64]} />
      <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} />
    </mesh>
  );
};
