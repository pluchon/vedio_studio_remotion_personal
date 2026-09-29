// 有纵深的星空：星星散在一段长长的空间里，镜头往前飞时近的掠过、远的几乎不动；外面再罩一层银河天球
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  attribute float size;
  attribute vec3 tint;
  varying vec3 vTint;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // 近大远小，但限住上下限：太小会闪，太大会糊成一团
    gl_PointSize = clamp(size * 260.0 / -mv.z, 1.6, 7.0);
    vTint = tint;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float opacity;
  varying vec3 vTint;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, r);
    gl_FragColor = vec4(vTint * a * a * opacity, 1.0);
  }
`;

// 恒星的颜色按温度大致分几档：多数偏白，少数偏蓝或偏橙
const TINTS = [
  [1.0, 1.0, 1.0],
  [0.8, 0.88, 1.0],
  [1.0, 0.9, 0.75],
  [1.0, 0.78, 0.6],
];

export const StarField: React.FC<{
  seed: string;
  count: number;
  // 星星分布的范围：沿 z 从 near 到 far，离镜头轴线至少 hole
  near: number;
  far: number;
  spread: number;
  hole: number;
  opacity?: number;
}> = ({ seed, count, near, far, spread, hole, opacity = 1 }) => {
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const tint = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const angle = r("a") * Math.PI * 2;
      const dist = hole + Math.sqrt(r("d")) * spread;
      pos[i * 3] = Math.cos(angle) * dist;
      pos[i * 3 + 1] = Math.sin(angle) * dist;
      pos[i * 3 + 2] = near - r("z") * (near - far);
      size[i] = 0.6 + Math.pow(r("s"), 6) * 5;
      const c = TINTS[Math.floor(r("t") * TINTS.length)];
      const b = 0.35 + r("b") * 0.65;
      tint.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("size", new THREE.BufferAttribute(size, 1));
    g.setAttribute("tint", new THREE.BufferAttribute(tint, 3));
    return g;
  }, [seed, count, near, far, spread, hole]);

  const uniforms = useMemo(() => ({ opacity: { value: 1 } }), []);
  uniforms.opacity.value = opacity;

  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </points>
  );
};

// 银河天球：一颗很大的球从里面看，贴上全天星图
export const SkySphere: React.FC<{ map: THREE.Texture; radius: number; brightness?: number }> = ({
  map,
  radius,
  brightness = 0.55,
}) => (
  <mesh scale={radius}>
    <sphereGeometry args={[1, 64, 48]} />
    <meshBasicMaterial map={map} side={THREE.BackSide} color={new THREE.Color(brightness, brightness, brightness)} depthWrite={false} />
  </mesh>
);
