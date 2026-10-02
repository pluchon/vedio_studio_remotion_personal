// 贴图和二进制数据载好之前挡住渲染；同一页面里各帧共用一份
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { DEM_SIZE, assetUrl } from "../theme";

const cache = new Map<string, Promise<unknown>>();

const once = <T>(key: string, make: () => Promise<T>) => {
  let hit = cache.get(key) as Promise<T> | undefined;
  if (!hit) {
    hit = make();
    cache.set(key, hit);
  }
  return hit;
};

const buffer = (path: string) =>
  fetch(assetUrl(path)).then((res) => {
    if (!res.ok) throw new Error(`读不到 ${path}：${res.status}`);
    return res.arrayBuffer();
  });

const image = (path: string) =>
  once(path, () =>
    new THREE.TextureLoader().loadAsync(assetUrl(path)).then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 16;
      return texture;
    }),
  );

// 高程：int16 的米数转成半精度浮点贴图，显卡可以直接做线性插值
const dem = () =>
  once("dem", () =>
    buffer("data/dem.bin").then((buf) => {
      const meters = new Int16Array(buf);
      const half = new Uint16Array(meters.length);
      for (let i = 0; i < meters.length; i++) half[i] = THREE.DataUtils.toHalfFloat(meters[i]);
      const texture = new THREE.DataTexture(half, DEM_SIZE.width, DEM_SIZE.height, THREE.RedFormat, THREE.HalfFloatType);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      // 原始的米数留一份，画水系小图的陆地轮廓时用
      texture.userData.meters = meters;
      return texture;
    }),
  );

// 大河附近的范围：一个字节一格，尺寸是高程的一半
const water = () =>
  once("water", () =>
    buffer("data/water.bin").then((buf) => {
      const texture = new THREE.DataTexture(new Uint8Array(buf), DEM_SIZE.width / 2, DEM_SIZE.height / 2, THREE.RedFormat, THREE.UnsignedByteType);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    }),
  );

// 大河在每一格离海多远：线画到哪儿，地面上真实的河面就亮到哪儿。不属于亚马逊水系的记成 -1
const reach = () =>
  once("reach", () =>
    buffer("data/reach.bin").then((buf) => {
      const raw = new Uint16Array(buf);
      const half = new Uint16Array(raw.length);
      for (let i = 0; i < raw.length; i++) half[i] = THREE.DataUtils.toHalfFloat(raw[i] - 1);
      const texture = new THREE.DataTexture(half, DEM_SIZE.width / 2, DEM_SIZE.height / 2, THREE.RedFormat, THREE.HalfFloatType);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      return texture;
    }),
  );

const floats = (path: string) => once(path, () => buffer(path).then((buf) => new Float32Array(buf)));

export type World = {
  land: THREE.Texture;
  world: THREE.Texture;
  dem: THREE.DataTexture;
  water: THREE.DataTexture;
  reach: THREE.DataTexture;
  rivers: Float32Array;
  route: Float32Array;
};

export const useWorld = () => {
  const [handle] = useState(() => delayRender("加载地形与河网", { timeoutInMilliseconds: 180000 }));
  const [world, setWorld] = useState<World | null>(null);
  useEffect(() => {
    Promise.all([image("textures/land.jpg"), image("textures/world.jpg"), dem(), water(), reach(), floats("data/rivers.bin"), floats("data/route.bin")])
      .then(([land, globe, height, near, far, rivers, route]) => {
        // 底图第一行是北边，和高程的行序一致
        land.flipY = false;
        land.needsUpdate = true;
        setWorld({ land, world: globe, dem: height, water: near, reach: far, rivers, route });
      })
      .catch((err) => cancelRender(err));
  }, []);
  // 等画布随数据一起挂上之后再放行
  useEffect(() => {
    if (world) continueRender(handle);
  }, [world, handle]);
  return world;
};
