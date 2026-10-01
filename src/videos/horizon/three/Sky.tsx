// 银河的那条光带：星表里只有十万颗亮星，撑不起背景。这里按银道坐标画一层很淡的辉光——
// 贴着银道面的一条带，朝银心方向更亮更暖，中间夹着尘埃的暗纹。只在太阳附近才成立，飞远了要淡掉
import React from "react";
import * as THREE from "three";
import { DIR_NGP, GALACTIC_CENTER } from "../theme";

const VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    // 只跟着镜头转，不跟着走：天球在无穷远
    vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = p.xyww;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 pole;
  uniform vec3 center;
  uniform float strength;
  varying vec3 vDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += amp * noise(p);
      p = p * 2.03 + 7.1;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 d = normalize(vDir);
    float b = asin(clamp(dot(d, pole), -1.0, 1.0));
    // 离银心方向的夹角
    float toCenter = dot(d, center);
    float along = 0.5 + 0.5 * toCenter;

    // 盘：贴着银道面，越朝银心越亮；核球：银心方向鼓起来的一团
    float disk = exp(-abs(b) / mix(0.09, 0.16, along)) * (0.22 + 0.78 * pow(along, 2.2));
    float bulge = exp(-(pow(max(1.0 - toCenter, 0.0) * 9.0, 1.0) + b * b * 26.0)) * 1.3;

    // 尘埃：银道面上撕开的暗纹，朝银心一侧最浓
    float lane = fbm(d * 5.0 + 3.0);
    float fine = fbm(d * 17.0);
    float dust = smoothstep(0.42, 0.7, lane * 0.65 + fine * 0.45) * exp(-pow(b / 0.11, 2.0)) * (0.35 + 0.65 * along);

    float glow = (disk + bulge) * (1.0 - 0.8 * dust) * (0.75 + 0.5 * fine);
    vec3 tint = mix(vec3(0.5, 0.62, 0.95), vec3(1.0, 0.82, 0.6), clamp(along * along + bulge, 0.0, 1.0));
    gl_FragColor = vec4(tint * glow * strength, 1.0);
  }
`;

const GEOMETRY = new THREE.SphereGeometry(1, 64, 48);

export const SkyGlow: React.FC<{ strength: number }> = ({ strength }) => {
  if (strength <= 0) return null;
  return (
    <mesh geometry={GEOMETRY} frustumCulled={false} renderOrder={-10}>
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={{ pole: { value: DIR_NGP }, center: { value: GALACTIC_CENTER }, strength: { value: strength } }}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
