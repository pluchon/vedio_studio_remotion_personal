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

// 配乐：花暦 裁到 1:30.6（下一句唢呐在 1:30.73 进来），末尾 1.6 秒淡出
export const MUSIC = asset("audio/hanagoyomi.mp3");
export const MUSIC_FRAMES = Math.round(90.6 * FPS);

// 节拍网格：第一拍在 2.94 秒，每拍 0.7316 秒，四拍一小节（由音头自相关测得）
const FIRST_BEAT_SEC = 2.94;
const BEAT_SEC = 0.7316;
export const beatFrame = (n: number) => Math.round((FIRST_BEAT_SEC + n * BEAT_SEC) * FPS);

// 各章节在配乐里的起止拍
export type Chapter = { fromBeat: number; toBeat: number };
export const CHAPTERS = {
  cat: { fromBeat: 4, toBeat: 40 },
} satisfies Record<string, Chapter>;

export const chapterFrom = (c: Chapter) => beatFrame(c.fromBeat);
export const chapterDuration = (c: Chapter) => beatFrame(c.toBeat) - beatFrame(c.fromBeat);

// 章节内第 k 拍对应的本地帧（k 可以是小数，如 2.5 表示第 3 拍的后半拍）
export const localBeat = (c: Chapter, k: number) =>
  Math.round((FIRST_BEAT_SEC + (c.fromBeat + k) * BEAT_SEC) * FPS) - beatFrame(c.fromBeat);
