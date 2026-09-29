// 地球：白天一面是陆地和云，背光一面亮着城市灯火，边缘一圈大气；昼夜交界随太阳方向走
import React, { useMemo } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D cloudMap;
  uniform vec3 sunDir;
  uniform float nightGain;
  uniform float cloudShift;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float d = dot(n, sunDir);
    float lit = smoothstep(-0.12, 0.28, d);
    float cloud = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;

    vec3 day = texture2D(dayMap, vUv).rgb * (0.06 + 1.15 * max(d, 0.0));
    day = mix(day, vec3(0.95) * (0.08 + 1.05 * max(d, 0.0)), cloud * 0.85);
    // 海面反光：只在白天、没云的地方
    vec3 h = normalize(sunDir + v);
    float ocean = 1.0 - smoothstep(0.02, 0.12, length(texture2D(dayMap, vUv).rgb));
    day += vec3(1.0, 0.92, 0.8) * pow(max(dot(n, h), 0.0), 60.0) * ocean * (1.0 - cloud) * 0.6;

    vec3 night = texture2D(nightMap, vUv).rgb * nightGain * (1.0 - cloud * 0.7);
    vec3 col = mix(night, day, lit);

    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    col += vec3(0.32, 0.56, 1.0) * rim * (0.08 + 0.9 * smoothstep(-0.25, 0.6, d));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// 经纬度 → 地球（未转动时）上的坐标，和贴图的等距圆柱投影对齐
export const latLon = (lat: number, lon: number, r: number): [number, number, number] => {
  const a = (lat * Math.PI) / 180;
  const b = (lon * Math.PI) / 180;
  return [Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r];
};

// 外面一层稍大的壳，只画朝向太阳一侧的蓝色光晕
const HALO = 1.07;
const HALO_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vNormalW;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 sunDir;
  uniform float strength;
  uniform float limb;
  varying vec3 vNormalV;
  varying vec3 vNormalW;
  void main() {
    // 看到的是壳的背面：贴着地球边缘处法线最背向镜头（-z 最大），往外到壳的轮廓处归零
    float i = pow(clamp(-vNormalV.z / limb, 0.0, 1.0), 2.2);
    float side = 0.2 + 0.8 * smoothstep(-0.35, 0.5, dot(vNormalW, sunDir));
    gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * i * side * strength, 1.0);
  }
`;

export const Earth: React.FC<{
  day: THREE.Texture;
  night: THREE.Texture;
  clouds: THREE.Texture;
  radius: number;
  spin: number;
  sunDir: [number, number, number];
  nightGain?: number;
  cloudShift?: number;
  // 跟着地球一起转的东西（光缆弧线等），坐标按世界单位写，用 latLon() 算位置
  children?: React.ReactNode;
}> = ({ day, night, clouds, radius, spin, sunDir, nightGain = 1.6, cloudShift = 0, children }) => {
  const sun = useMemo(() => new THREE.Vector3(...sunDir).normalize(), [sunDir]);
  const uniforms = useMemo(
    () => ({
      dayMap: { value: day },
      nightMap: { value: night },
      cloudMap: { value: clouds },
      sunDir: { value: new THREE.Vector3() },
      nightGain: { value: 0 },
      cloudShift: { value: 0 },
    }),
    [day, night, clouds],
  );
  // 地球边缘处壳背面法线的 z：壳半径是地球的 HALO 倍
  const haloUniforms = useMemo(
    () => ({
      sunDir: { value: new THREE.Vector3() },
      strength: { value: 1.2 },
      limb: { value: Math.sqrt(1 - 1 / (HALO * HALO)) },
    }),
    [],
  );
  uniforms.sunDir.value.copy(sun);
  uniforms.nightGain.value = nightGain;
  uniforms.cloudShift.value = cloudShift;
  haloUniforms.sunDir.value.copy(sun);

  return (
    <group>
      <group rotation={[0.41, spin, 0]}>
        <mesh scale={radius}>
          <sphereGeometry args={[1, 128, 96]} />
          <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} />
        </mesh>
        {children}
      </group>
      <mesh scale={radius * HALO}>
        <sphereGeometry args={[1, 96, 64]} />
        <shaderMaterial
          vertexShader={HALO_VERTEX}
          fragmentShader={HALO_FRAGMENT}
          uniforms={haloUniforms}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
