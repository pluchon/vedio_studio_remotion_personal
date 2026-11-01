// 截图的文件和像素尺寸（prepare.py 生成）
import { asset } from "./theme";

const SIZE = {
  cover: [1600, 533],
  login: [1536, 1152],
  home: [1536, 960],
  naitang: [1536, 960],
  detail: [1536, 960],
  editor: [1536, 960],
  search: [1536, 960],
  creator: [1536, 960],
  profile: [1536, 960],
  messages: [1536, 960],
} as const;

export type ShotName = keyof typeof SIZE;

export const shot = (name: ShotName) => ({ src: asset(`img/${name}.png`), imgW: SIZE[name][0], imgH: SIZE[name][1] });

export const img = (name: string) => asset(`img/${name}.png`);
