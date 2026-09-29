// 海报风的平涂材质：一个颜色，受光面和背光面一刀切开，背光面压成藏青；任何几何体都能用
import React, { useMemo } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 color;
  uniform vec3 night;
  uniform vec3 sunDir;
  varying vec3 vNormalW;
  void main() {
    // 双面的薄片（天线碟面）看到的是背面时，法线要翻过来，否则凹面永远是暗的
    vec3 n = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    float d = dot(n, sunDir);
    float lit = smoothstep(-0.02, 0.06, d);
    // 受光面分两档：正对太阳的一档亮，斜着的一档稍暗
    vec3 c = mix(color * 0.84, color, smoothstep(0.35, 0.45, d));
    gl_FragColor = vec4(mix(mix(night, c, 0.18), c, lit), 1.0);
  }
`;

export const ToonMaterial: React.FC<{ color: string; night: string; sunDir: [number, number, number]; side?: THREE.Side }> = ({
  color,
  night,
  sunDir,
  side = THREE.FrontSide,
}) => {
  const uniforms = useMemo(
    () => ({ color: { value: new THREE.Color(color) }, night: { value: new THREE.Color(night) }, sunDir: { value: new THREE.Vector3() } }),
    [color, night],
  );
  uniforms.sunDir.value.set(...sunDir).normalize();
  return <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} side={side} />;
};
