// 截图的文件和像素尺寸（prepare.py 裁好的：只留网页本身）
import { asset } from "./theme";

const SIZE = {
  cover: [1600, 800],
  login: [1536, 900],
  home: [1536, 908],
  detail: [1536, 956],
  editor: [1536, 908],
  search: [1536, 908],
  creator: [1536, 956],
  profile: [1536, 908],
  "meng-home": [1536, 908],
  "meng-chat": [1536, 908],
  memory: [1536, 722],
  personality: [1536, 684],
  messages: [1536, 908],
  growth: [1536, 908],
} as const;

export type ShotName = keyof typeof SIZE;

export const shot = (name: ShotName) => ({ src: asset(`img/${name}.png`), imgW: SIZE[name][0], imgH: SIZE[name][1] });

export const img = (name: string) => asset(`img/${name}.png`);
