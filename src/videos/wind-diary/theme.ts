// 《风经过的地方》的配色、字体与节拍：配乐为 花暦（约 82 BPM），场景切换卡在小节线上
import { staticFile } from "remotion";
import { loadLocalFont } from "../../shared/fonts";

export { EASE_IN_OUT, EASE_OUT } from "../../shared/motion";

// 本视频的素材都在 public/wind-diary/ 下，如 asset("photos/cat.png")
export const asset = (path: string) => `wind-diary/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 手写感的中文用霞鹜文楷，英文用斜体衬线
export const FONTS = {
  hand: "'LXGW WenKai', 'KaiTi', serif",
  latin: "Georgia, 'Times New Roman', serif",
};
loadLocalFont("LXGW WenKai", staticFile(asset("fonts/LXGWWenKai-Regular.ttf")));

// 夜（第一则 · 猫）：深靛蓝的柏油路、琥珀色路灯、奶白的字
export const NIGHT = {
  ground: "#1a1c23",
  groundDeep: "#0f1015",
  text: "#efe5d3",
  textSoft: "rgba(239, 229, 211, 0.62)",
  lamp: "#f2c27b",
  lampCore: "#fff1d6",
  paw: "#f4ede1",
  paper: "#f6f1e7",
};

// 白天（第二则 · 海）：天蓝、海青、沙色，字用暖墨色
export const DAY = {
  paper: "#fff1d6",
  sky: "#cfe8f1",
  skyHigh: "#a9d3e6",
  sea: "#3a9cc2",
  seaDeep: "#236f98",
  sand: "#f0dcb8",
  sandWet: "#d9bf93",
  foam: "#fffdf6",
  gold: "255, 232, 160",
  ink: "#3b3833",
  inkSoft: "rgba(59, 56, 51, 0.62)",
  sunset: "#f1b88f",
};

// 傍晚（第三则 · 暮色）：取自 city_walk 那张的色卡（雾灰、桥体灰、暮色棕、夕阳粉、剪影黑）
export const DUSK = {
  skyTop: "#9aa3b2",
  skyMid: "#d6c4b9",
  skyLow: "#efbf9f",
  fog: "#d9d2c8",
  bridge: "#b3a79a",
  brown: "#8a7b6e",
  pink: "#e7b8a2",
  silhouette: "#2f2d2d",
  ink: "#2f2b29",
  inkSoft: "rgba(47, 43, 41, 0.62)",
  cream: "#f6eee2",
  lamp: "#ffd9a0",
};

// 家（片头、尾声）：台灯下的一页日记
export const HOME = {
  room: "#141210",
  paper: "#efe5d1",
  ink: "#3b3129",
  inkSoft: "rgba(59, 49, 41, 0.6)",
  lamp: "255, 214, 150",
  seal: "#a33a2c",
};

// 配乐：花暦 裁到 1:30.6（下一句唢呐在 1:30.73 进来），末尾 1.6 秒淡出
export const MUSIC = asset("audio/hanagoyomi.mp3");
export const MUSIC_SEC = 90.6;
export const MUSIC_FRAMES = Math.round(MUSIC_SEC * FPS);

// 节拍网格：第一拍在 2.94 秒，每拍 0.7316 秒，四拍一小节（由音头自相关测得）
const FIRST_BEAT_SEC = 2.94;
const BEAT_SEC = 0.7316;
export const beatFrame = (n: number) => Math.round((FIRST_BEAT_SEC + n * BEAT_SEC) * FPS);
const secToBeat = (sec: number) => (sec - FIRST_BEAT_SEC) / BEAT_SEC;

// 各章节在配乐里的起止拍（按响度与高频能量量出的段落：第 44~56 拍稀疏的停顿，56~76 拍唢呐①，88~105 拍唢呐②）
export type Chapter = { fromBeat: number; toBeat: number };
export const CHAPTERS = {
  opening: { fromBeat: secToBeat(0), toBeat: 4 },
  cat: { fromBeat: 4, toBeat: 40 },
  sea: { fromBeat: 40, toBeat: 76 },
  dusk: { fromBeat: 76, toBeat: 106 },
  ending: { fromBeat: 106, toBeat: secToBeat(MUSIC_SEC) },
} satisfies Record<string, Chapter>;

export const chapterFrom = (c: Chapter) => beatFrame(c.fromBeat);
export const chapterDuration = (c: Chapter) => beatFrame(c.toBeat) - beatFrame(c.fromBeat);

// 章节内第 k 拍对应的本地帧（k 可以是小数，如 2.5 表示第 3 拍的后半拍）
export const localBeat = (c: Chapter, k: number) =>
  Math.round((FIRST_BEAT_SEC + (c.fromBeat + k) * BEAT_SEC) * FPS) - beatFrame(c.fromBeat);
