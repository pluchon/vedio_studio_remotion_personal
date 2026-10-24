// 《宇宙漫游》的常量：没有念白，整片的时间轴就是配乐（单位：秒）
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// public/wander/audio/bgm.wav：原曲 4:07.6 + 寂静到 4:11 + 尾声复用的引子 30.6 秒
export const MUSIC_END = 281.6;
// 星海停在第一帧的构图，淡到黑，再放片尾的资料与署名
export const TOTAL = 296;
export const TOTAL_FRAMES = Math.round(TOTAL * FPS);

// 配乐里的几个节点（tools/wander 的频谱分析定的）
export const BEAT = {
  open: 31.0, // 深低音和高处的空气感同时进来
  voidStart: 125.0, // 高频抽空，旋律停下
  back: 155.0, // 整个频段回来
  peak: 218.0, // 旋律爬到全曲最高处
  silent: 247.6, // 原曲彻底静下来
  reprise: 251.0, // 引子重来
} as const;

export const FONT = "Wander Serif";

// 冷光是星海，暖光是文明
export const COLORS = {
  night: "#000000",
  text: "#e8edf5",
  soft: "rgba(214, 224, 238, 0.62)",
  warm: "#ffc98a",
  cold: "#cfe0ff",
};

export const asset = (path: string) => `wander/${path}`;
