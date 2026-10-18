// 《萌部落》演示片的基础设定：画幅、节拍、颜色、字体、素材路径
import { staticFile } from "remotion";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 配乐 150 BPM：一拍 12 帧，一小节 48 帧；56 小节后留 2.4 秒尾巴（tools/meng-center/music.py）
export const BEAT = 12;
export const BAR = 48;
export const BARS = 56;
export const DURATION = BARS * BAR + 72;

// 素材都在 public/meng-center/ 下（由 tools/meng-center/prepare.py 生成）
export const asset = (path: string) => staticFile(`meng-center/${path}`);

// 水色主题：和萌部落网页一致的浅蓝、奶油、粉黄绿紫
export const C = {
  paper: "#EEF7FC",
  grid: "#D6EAF6",
  cream: "#FFF8EC",
  white: "#FFFFFF",
  ink: "#29486A",
  inkSoft: "#5C7894",
  blue: "#6CB4EA",
  blueDeep: "#2F64B0",
  blueLight: "#CFE8FA",
  pink: "#F4A3BC",
  pinkLight: "#FCE3EB",
  lemon: "#F6D57E",
  lemonLight: "#FFF1C9",
  mint: "#8ED4B5",
  mintLight: "#DDF4E9",
  lilac: "#B8A6EA",
  lilacLight: "#ECE6FB",
};

export const FONT_ZH = "MengKuaiLe";
export const FONT_EN = "MengFredoka";
export const FONT_KAO = "MengKao";
export const TEXT = `"${FONT_EN}", "${FONT_ZH}", sans-serif`;
export const ZH = `"${FONT_ZH}", "${FONT_EN}", sans-serif`;
export const KAO = `"${FONT_KAO}", "${FONT_EN}", sans-serif`;

// 各幕的起止（小节），和配乐的段落对齐
export const SCENES = {
  intro: [0, 4],
  account: [4, 8],
  home: [8, 12],
  create: [12, 14],
  detail: [14, 16],
  search: [16, 20],
  creator: [20, 22],
  growth: [22, 24],
  messages: [24, 26],
  profile: [26, 28],
  meng: [28, 32],
  chat: [32, 36],
  memory: [36, 40],
  tone: [40, 44],
  arch: [44, 52],
  outro: [52, 57.5],
} as const;
