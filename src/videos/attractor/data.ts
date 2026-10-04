// 真实数据的二进制：由 tools/attractor/prepare.py data 生成。载好之前挡住渲染
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { asset } from "./theme";

const cache = new Map<string, Promise<Float32Array>>();

const load = (name: string) => {
  let hit = cache.get(name);
  if (!hit) {
    hit = fetch(staticFile(asset(`data/${name}`)))
      .then((res) => {
        if (!res.ok) throw new Error(`读不到 ${name}：${res.status}，先跑 python tools/attractor/prepare.py data`);
        return res.arrayBuffer();
      })
      .then((buf) => new Float32Array(buf));
    cache.set(name, hit);
  }
  return hit;
};

export const useBinary = (name: string) => {
  const [handle] = useState(() => delayRender(`加载 ${name}`, { timeoutInMilliseconds: 120000 }));
  const [data, setData] = useState<Float32Array | null>(null);
  useEffect(() => {
    load(name)
      .then((d) => {
        setData(d);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [name, handle]);
  return data;
};
