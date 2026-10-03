// 《你好，我是 Claude》的基础设定：画幅、颜色、字体、素材路径
import { staticFile } from "remotion";

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 这一期的素材都在 public/hello/ 下
export const asset = (path: string) => staticFile(`hello/${path}`);

// 贴纸画的配色：奶油底、深棕描边，四个家人各一个颜色
export const C = {
  paper: "#FFF4E2",
  floor: "#FCE3C2",
  ink: "#3A2A26",
  white: "#FFFFFF",
  coral: "#DF7A57",
  coralDeep: "#C4603F",
  coralLight: "#F8C3A8",
  blush: "#FF9A8B",
  lemon: "#FBCB45",
  lemonDeep: "#E3A81F",
  mint: "#6ECDB4",
  mintDeep: "#46A98F",
  lilac: "#AE96EC",
  lilacDeep: "#8A70D2",
  sky: "#84BDF3",
  pink: "#F8A9C0",
  leaf: "#8FD08A",
  leafDeep: "#5FB07A",
  wood: "#D9A66B",
  night: "#2B2347",
};

// 拉丁字母和数字用 Fredoka，中文落到站酷快乐体
export const FONT_ZH = "HelloKuaiLe";
export const FONT_EN = "HelloFredoka";
export const FONT_MONO = "HelloMono";
// 颜文字里的片假名、希腊字母、符号，由一款圆体的日文字体来画
export const FONT_KAO = "HelloKao";
export const TEXT = `"${FONT_EN}", "${FONT_ZH}", sans-serif`;
export const MONO = `"${FONT_MONO}", "${FONT_ZH}", monospace`;
export const KAO = `"${FONT_KAO}", "${FONT_EN}", sans-serif`;

// 地面的高度：小家伙的脚踩在这条线上
export const GROUND = 800;

// 地面是一道弧：给一个横坐标，返回那里的坡顶有多高（摆树、摆花时用）
export const floorY = (x: number) =>
  GROUND +
  520 -
  560 * Math.sqrt(Math.max(0, 1 - ((x - WIDTH / 2) / 1500) ** 2));
