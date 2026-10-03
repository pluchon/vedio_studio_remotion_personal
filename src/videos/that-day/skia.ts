// Skia 的小工具：载入图片（载好之前挡住渲染）、编译着色器、月相的形状
import { useEffect, useState } from "react";
import { Skia } from "@shopify/react-native-skia";
import type { SkImage } from "@shopify/react-native-skia";
import { cancelRender, continueRender, delayRender } from "remotion";

const images = new Map<string, Promise<SkImage>>();

export const useSkiaImage = (url: string) => {
  const [image, setImage] = useState<SkImage | null>(null);
  const [handle] = useState(() => delayRender(`载入 ${url}`));

  useEffect(() => {
    let hit = images.get(url);
    if (!hit) {
      hit = Skia.Data.fromURI(url).then((data) => {
        const decoded = Skia.Image.MakeImageFromEncoded(data);
        if (!decoded) throw new Error(`解不开图片 ${url}`);
        return decoded;
      });
      images.set(url, hit);
    }
    hit
      .then((loaded) => {
        setImage(loaded);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [url, handle]);

  return image;
};

export const effect = (source: string) => {
  const made = Skia.RuntimeEffect.Make(source);
  if (!made) throw new Error(`着色器编译失败：${source.slice(0, 60)}`);
  return made;
};

// 被照亮的那一块：一侧是半圆，另一侧是明暗交界线（一段椭圆）；亮的一侧朝右，用的时候再转到朝着太阳
export const litShape = (
  cx: number,
  cy: number,
  r: number,
  illuminated: number,
) => {
  const rx = Math.max(0.01, r * Math.abs(2 * illuminated - 1));
  const sweep = illuminated > 0.5 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`;
};
