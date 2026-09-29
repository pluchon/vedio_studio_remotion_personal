// 点云：星系、尘埃、沙粒都用它。flat 为海报风的平涂圆点（正常混合），否则是发光的软点（叠加混合）
import React, { useMemo } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  attribute float size;
  attribute vec3 tint;
  uniform float scale;
  uniform float minSize;
  uniform float maxSize;
  varying vec3 vTint;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(size * scale / -mv.z, minSize, maxSize);
    vTint = tint;
    gl_Position = projectionMatrix * mv;
  }
`;

const FLAT = /* glsl */ `
  uniform float opacity;
  varying vec3 vTint;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(vTint, opacity);
  }
`;

const GLOW = /* glsl */ `
  uniform float opacity;
  varying vec3 vTint;
  void main() {
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vTint * a * a * opacity, 1.0);
  }
`;

export type Cloud = { positions: Float32Array; sizes: Float32Array; tints: Float32Array };

export const PointCloud: React.FC<{
  cloud: Cloud;
  flat?: boolean;
  opacity?: number;
  scale?: number;
  minSize?: number;
  maxSize?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}> = ({ cloud, flat = false, opacity = 1, scale = 300, minSize = 1.2, maxSize = 9, position, rotation }) => {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    g.setAttribute("size", new THREE.BufferAttribute(cloud.sizes, 1));
    g.setAttribute("tint", new THREE.BufferAttribute(cloud.tints, 3));
    return g;
  }, [cloud]);
  const uniforms = useMemo(
    () => ({ opacity: { value: 1 }, scale: { value: 300 }, minSize: { value: 1 }, maxSize: { value: 9 } }),
    [],
  );
  uniforms.opacity.value = opacity;
  uniforms.scale.value = scale;
  uniforms.minSize.value = minSize;
  uniforms.maxSize.value = maxSize;

  return (
    <points geometry={geometry} position={position} rotation={rotation}>
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={flat ? FLAT : GLOW}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={flat ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
};

// 一团点：由 make(i) 给出每个点的位置、大小、颜色
export const makeCloud = (count: number, make: (i: number) => { p: [number, number, number]; s: number; c: THREE.Color }): Cloud => {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const tints = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const { p, s, c } = make(i);
    positions.set(p, i * 3);
    sizes[i] = s;
    tints.set([c.r, c.g, c.b], i * 3);
  }
  return { positions, sizes, tints };
};

// 发光的圆斑（太阳、新星、火花）：一张始终朝向镜头的面片
const GLOW_SPRITE = /* glsl */ `
  uniform vec3 color;
  uniform float intensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float core = smoothstep(0.12, 0.0, d);
    float halo = pow(max(1.0 - d, 0.0), 3.0);
    gl_FragColor = vec4(color * (core * 2.0 + halo) * intensity, 1.0);
  }
`;

const SPRITE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // 广告牌：只取物体中心的位置，面片在视空间里展开
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    gl_Position = projectionMatrix * mv;
  }
`;

export const Glow: React.FC<{ color: string; size: number; intensity?: number; position?: [number, number, number] }> = ({
  color,
  size,
  intensity = 1,
  position = [0, 0, 0],
}) => {
  const uniforms = useMemo(() => ({ color: { value: new THREE.Color(color) }, intensity: { value: 1 } }), [color]);
  uniforms.intensity.value = intensity;
  return (
    <mesh position={position} scale={size}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={SPRITE_VERTEX}
        fragmentShader={GLOW_SPRITE}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
