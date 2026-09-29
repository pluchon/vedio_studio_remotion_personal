// 《云走过的地方，天空都记得》的配色、字体与时间轴：配乐是一段自由速度的钢琴（约 72 BPM），画面切换对在实测的乐句点上
import { staticFile } from "remotion";
import { loadLocalFont } from "../../shared/fonts";

export { EASE_IN_OUT, EASE_OUT } from "../../shared/motion";

// 本视频的素材都在 public/cloud-sky/ 下，如 asset("photos/library_01.png")
export const asset = (path: string) => `cloud-sky/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 与第一期同一套字：中文霞鹜文楷，英文斜体衬线
export const FONTS = {
  hand: "'LXGW WenKai', 'KaiTi', serif",
  latin: "Georgia, 'Times New Roman', serif",
};
loadLocalFont("LXGW WenKai", staticFile(asset("fonts/LXGWWenKai-Regular.ttf")));

// 图书馆里：米色的墙、深色窗框、午后的木桌
export const ROOM = {
  wall: "#ece3d2",
  frame: "#3a3631",
  frameLight: "#57514a",
  desk: "#c49a6c",
  deskDeep: "#8e6644",
  paper: "#f7f1e4",
  ink: "#33363b",
  inkSoft: "rgba(51, 54, 59, 0.62)",
  sun: "255, 232, 188",
  night: "#18203a",
};

// 白天的天：高处的蓝到地平线的浅，云是奶白、背光处灰蓝
export const DAY = {
  top: "#6e9fd0",
  mid: "#a8c8e3",
  low: "#e9eee9",
  cloud: "#fffdf8",
  cloudMid: "#eef0f2",
  cloudShade: "#aebdd0",
};

// 旅程里的天：地平线附近发白；抬头看的天：更深更干净的蓝
export const PLAIN = { top: "#86b2da", mid: "#bcd5e8", low: "#eef0e6" };
export const HIGH = { top: "#5a8ec5", mid: "#86b3dc", low: "#b9d5ea" };

// 云的旅程：淡彩线稿的山水
export const LAND = {
  sea: "#8fb3c9",
  seaDeep: "#6c94b0",
  mountFar: "#b9c6cf",
  mount: "#9fae9a",
  field: "#e6cf8f",
  grass: "#a9bf83",
  line: "rgba(58, 62, 66, 0.55)",
  house: "#f1e7d6",
  roof: "#9a6f5a",
  river: "#9cc4d8",
};

// 黄昏：天暗下去，光借给云（橘、粉、金）
export const DUSK = {
  top: "#2f3a5e",
  mid: "#6f6484",
  low: "#eea27d",
  gold: "#ffd59a",
  orange: "#ffae78",
  pink: "#f4a3a0",
  shade: "#6b5a7c",
  skyline: "#2a2630",
  cream: "#f8efe3",
};

// 黄昏沉进的深靛色，尾声从同一个颜色里亮起来
export const DIP = "#1b2140";

// 入夜
export const NIGHT = {
  top: "#0f1428",
  mid: "#1d2744",
  low: "#46476a",
  star: "#fff6df",
};

// 配乐：Chill out 裁到 1:14.3（1:14.1~1:14.4 几乎无声，下一段 1:14.5 进来）；之后画面再静静停 2.7 秒
export const MUSIC = asset("audio/chill-out.mp3");
export const MUSIC_SEC = 74.3;
export const END_SEC = 77.0;
export const sec = (s: number) => Math.round(s * FPS);
export const TOTAL_FRAMES = sec(END_SEC);

// 实测的乐句点（秒）：0.1 第一个音；13.7 引子收尾，16.5~17.0 一口长停顿；17.1 主旋律进来，33~35 最亮；
// 44.1 转入安静的一段；57.0 高潮，64.4 高潮第二句；70 起渐弱，74.1 静下来
export type Segment = { from: number; to: number };
export const SEGMENTS = {
  opening: { from: 0, to: 17.1 },
  journey: { from: 17.1, to: 44.1 },
  sky: { from: 44.1, to: 57.0 },
  dusk: { from: 57.0, to: 67.6 },
  // 尾声比黄昏早 0.4 秒进来，从窗格里淡出来接住
  later: { from: 67.2, to: END_SEC },
} satisfies Record<string, Segment>;

export const segFrom = (s: Segment) => sec(s.from);
export const segDuration = (s: Segment) => sec(s.to) - sec(s.from);

// 段落内的本地帧：直接写配乐里的秒数，如 t(33.2)
export const localTime = (s: Segment) => (music: number) => sec(music) - sec(s.from);
