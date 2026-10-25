// 《宇宙漫游》重制版的常量：没有念白，时间轴就是配乐（单位：秒）
export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
// 画幅 2.4:1，上下各留 140 像素黑边：正文写在下边，资料小字写在上边
export const PIC_W = 1920;
export const PIC_H = 800;
export const BAR = (HEIGHT - PIC_H) / 2;

// public/ember/audio/bgm.wav：原曲 4:07.6 + 寂静到 4:11 + 尾声复用的引子 30.6 秒
export const MUSIC_END = 281.6;
export const TOTAL = 296;
export const TOTAL_FRAMES = Math.round(TOTAL * FPS);

// 配乐里的几个节点（第十五期做频谱分析时定的）
export const BEAT = {
  open: 31.0, // 深低音和高处的空气感同时进来
  voidStart: 125.0, // 高频抽空，旋律停下
  back: 155.0, // 整个频段回来
  peak: 218.0, // 旋律爬到全曲最高处
  silent: 247.6, // 原曲彻底静下来
  reprise: 251.0, // 引子重来
} as const;

export const FONT = "Ember Serif";

export const COLORS = {
  text: "#e9edf3",
  soft: "rgba(214, 222, 234, 0.6)",
};

export const asset = (path: string) => `ember/${path}`;
