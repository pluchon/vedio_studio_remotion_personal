// 星系的点云：近邻宇宙（2MRS）、深空的星系与类星体（SDSS）、斯隆长城那片天区，都是真实测到的位置。
// 每个点 4 个数：x y z（共动距离，百万秒差距）和红移。颜色由红移定：越远越红
import React, { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { FOCAL, MPC, assetUrl } from "../theme";

const cache = new Map<string, Promise<Float32Array>>();
const load = (path: string) => {
  let hit = cache.get(path);
  if (!hit) {
    hit = fetch(assetUrl(path))
      .then((res) => {
        if (!res.ok) throw new Error(`读不到 ${path}：${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => new Float32Array(buf));
    cache.set(path, hit);
  }
  return hit;
};

// 数据载好之前挡住渲染
export const useBinary = (path: string) => {
  const [handle] = useState(() => delayRender(`加载 ${path}`, { timeoutInMilliseconds: 120000 }));
  const [data, setData] = useState<Float32Array | null>(null);
  useEffect(() => {
    load(path)
      .then((d) => {
        setData(d);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [path, handle]);
  return data;
};

// 太远的点压到这个距离上画，只保留方向，免得被远裁剪面切掉
const LIMIT = "4.0e5";

const VERTEX = /* glsl */ `
  attribute float redshift;
  uniform vec3 eye;      // 镜头位置，百万秒差距
  uniform float unit;    // 一个渲染单位合多少百万秒差距
  uniform float gain;
  uniform float flow;    // 空间膨胀的示意：所有点按同一个比例往外推
  uniform float shift;   // 时间快进：红移放大多少倍
  uniform float body;    // 一个星系有多大（百万秒差距）
  uniform float minSize;
  uniform float fog;     // 大于 0 时，越远的点越暗，给出纵深
  varying vec3 vColor;

  // 红移越大颜色越红：近处蓝白，到 1 是橙，再往上是暗红
  vec3 palette(float z) {
    vec3 c = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.93, 0.8), smoothstep(0.0, 0.25, z));
    c = mix(c, vec3(1.0, 0.6, 0.3), smoothstep(0.25, 1.2, z));
    c = mix(c, vec3(0.95, 0.22, 0.12), smoothstep(1.2, 3.5, z));
    return mix(c, vec3(0.35, 0.04, 0.03), smoothstep(3.5, 12.0, z));
  }

  void main() {
    vec3 rel = position * flow - eye;
    float d = max(length(rel), 1e-6);
    float seen = redshift * shift;
    // 每个星系的颜色略有不同：有的偏暖，有的偏蓝
    float warm = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
    // 红移被放大以后，光被拉得更长、更暗
    float dim = pow((1.0 + redshift) / (1.0 + seen), 1.1);
    float px = body / d * ${FOCAL.toFixed(1)};
    gl_PointSize = clamp(px, minSize, 48.0);
    float depth = fog > 0.0 ? clamp(pow(fog / d, 1.6), 0.0, 2.4) : 1.0;
    vColor = palette(seen) * mix(vec3(0.82, 0.9, 1.0), vec3(1.0, 0.84, 0.62), warm * warm) * gain * dim * depth;
    vec3 dir = mat3(viewMatrix) * (rel / d);
    gl_Position = projectionMatrix * vec4(dir * min(d / unit, ${LIMIT}), 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor * exp(-r * r * 16.0) * smoothstep(0.5, 0.3, r), 1.0);
  }
`;

export const Cloud: React.FC<{
  data: Float32Array;
  eye: THREE.Vector3; // 镜头位置，米
  metersPerUnit: number;
  gain: number;
  flow?: number;
  shift?: number;
  body?: number;
  minSize?: number;
  fog?: number;
}> = ({ data, eye, metersPerUnit, gain, flow = 1, shift = 1, body = 0.05, minSize = 1.6, fog = 0 }) => {
  const geometry = useMemo(() => {
    const buffer = new THREE.InterleavedBuffer(data, 4);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.InterleavedBufferAttribute(buffer, 3, 0));
    g.setAttribute("redshift", new THREE.InterleavedBufferAttribute(buffer, 1, 3));
    return g;
  }, [data]);
  if (gain <= 0) return null;
  // 每帧给一份新的：画布会把 uniforms 复制进材质，事后改原对象里的数字它看不到
  const uniforms = {
    eye: { value: eye.clone().multiplyScalar(1 / MPC) },
    unit: { value: metersPerUnit / MPC },
    gain: { value: gain },
    flow: { value: flow },
    shift: { value: shift },
    body: { value: body },
    minSize: { value: minSize },
    fog: { value: fog },
  };
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};
