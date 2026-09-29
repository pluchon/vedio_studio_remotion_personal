// 《我们一直在仰望》的尺寸与素材路径；配乐时间轴在搭骨架时补上
export { EASE_IN_OUT, EASE_OUT } from "../../shared/motion";

// 本视频的素材都在 public/looking-up/ 下，如 asset("textures/earth_day.jpg")
export const asset = (path: string) => `looking-up/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
