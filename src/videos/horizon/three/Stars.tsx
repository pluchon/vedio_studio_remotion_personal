// 真实的恒星：位置、绝对星等、颜色来自 HYG 星表。每颗星的亮度按镜头此刻离它多远现算，
// 所以在地球上看是熟悉的夜空，退出去以后太阳也只是其中普通的一颗
import React, { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { AU, PARSEC, SUN_DIR, assetUrl } from "../theme";

const STRIDE = 7;
// 太远的星压到这个距离上画，只保留方向，免得被远裁剪面切掉
const LIMIT = 4e5;

const VERTEX = /* glsl */ `
  attribute float absmag;
  attribute vec3 tint;
  uniform vec3 eye;        // 镜头位置，秒差距
  uniform float pcPerUnit; // 一个渲染单位合多少秒差距
  uniform float gain;
  varying vec3 vColor;
  void main() {
    vec3 rel = position - eye;
    float dpc = max(length(rel), 1e-9);
    // 视星等 = 绝对星等 + 5 lg(d / 10pc)；以 4.5 等星为 1 算亮度
    float m = absmag + 5.0 * log(dpc) / log(10.0) - 5.0;
    float flux = pow(10.0, -0.4 * (m - 4.5));
    gl_PointSize = clamp(1.5 + 1.4 * pow(flux, 0.3), 1.5, 30.0);
    vColor = tint * clamp(0.9 * pow(flux, 0.5), 0.0, 9.0) * gain;
    vec3 dir = mat3(viewMatrix) * (rel / dpc);
    gl_Position = projectionMatrix * vec4(dir * min(dpc / pcPerUnit, ${LIMIT.toExponential(1)}), 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  void main() {
    // 中心一个锐利的亮核，外面很快衰减；光晕交给后期的辉光
    float r = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor * exp(-r * r * 22.0) * smoothstep(0.5, 0.35, r), 1.0);
  }
`;

let cache: Promise<Float32Array> | null = null;
const load = () => {
  cache ??= fetch(assetUrl("data/stars.bin"))
    .then((res) => res.arrayBuffer())
    .then((buf) => {
      const raw = new Float32Array(buf);
      // 末尾补上太阳：它相对取景地的方向是片子定的
      const all = new Float32Array(raw.length + STRIDE);
      all.set(raw);
      const sun = SUN_DIR.clone().multiplyScalar(AU / PARSEC);
      all.set([sun.x, sun.y, sun.z, 4.83, 1, 0.95, 0.88], raw.length);
      return all;
    });
  return cache;
};

// 星表载好之前挡住渲染
export const useStars = () => {
  const [handle] = useState(() => delayRender("加载星表"));
  const [data, setData] = useState<Float32Array | null>(null);
  useEffect(() => {
    load()
      .then((d) => {
        setData(d);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return data;
};

export const Stars: React.FC<{ data: Float32Array; eye: THREE.Vector3; metersPerUnit: number; gain?: number }> = ({ data, eye, metersPerUnit, gain = 1 }) => {
  const geometry = useMemo(() => {
    const buffer = new THREE.InterleavedBuffer(data, STRIDE);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.InterleavedBufferAttribute(buffer, 3, 0));
    g.setAttribute("absmag", new THREE.InterleavedBufferAttribute(buffer, 1, 3));
    g.setAttribute("tint", new THREE.InterleavedBufferAttribute(buffer, 3, 4));
    return g;
  }, [data]);
  // 每帧给一份新的：画布会把 uniforms 复制进材质，事后改原对象里的数字它看不到
  const uniforms = {
    eye: { value: eye.clone().multiplyScalar(1 / PARSEC) },
    pcPerUnit: { value: metersPerUnit / PARSEC },
    gain: { value: gain },
  };

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};
