// 贴图全部载好之前挡住渲染：画布要等贴图到手才挂上去，否则第一帧会是一颗白球
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";

// 同一页面里各帧共用一份，不重复解码
const cache = new Map<string, Promise<THREE.Texture>>();

const load = (path: string) => {
  const hit = cache.get(path);
  if (hit) return hit;
  const promise = new THREE.TextureLoader().loadAsync(staticFile(path)).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  });
  cache.set(path, promise);
  return promise;
};

export const useTextures = <K extends string>(paths: Record<K, string>) => {
  const [handle] = useState(() => delayRender("加载贴图", { timeoutInMilliseconds: 120000 }));
  const [textures, setTextures] = useState<Record<K, THREE.Texture> | null>(null);

  useEffect(() => {
    const keys = Object.keys(paths) as K[];
    Promise.all(keys.map((k) => load(paths[k])))
      .then((list) => setTextures(Object.fromEntries(keys.map((k, i) => [k, list[i]])) as Record<K, THREE.Texture>))
      .catch((err) => cancelRender(err));
    // 路径表是模块级常量，只在挂载时载一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 等画布随贴图一起挂上（它自己会挡住渲染）之后再放行
  useEffect(() => {
    if (textures) continueRender(handle);
  }, [textures, handle]);

  return textures;
};
