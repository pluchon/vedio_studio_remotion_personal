// 《巨引源》的常量
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 时间轴跟着念白走：片名先占前 LEAD 秒，念白之后再留 TAIL 秒；配乐按这个长度拼（tools/attractor/loop_music.py）
import phrases from "./phrases.json";

export const LEAD = 5.5;
export const TAIL = 7.8;
export const VOICE_SECONDS = phrases.duration;
export const DURATION = LEAD + VOICE_SECONDS + TAIL;
export const TOTAL_FRAMES = Math.round(DURATION * FPS);

// 各幕的动画是按下面 SCENES 的「设计时间」写的（总长 DESIGN_END）；放映时按念白里每一幕的真实起止，
// 在 time.tsx 里把设计时间分段线性地映射到真实时间。幕的内部不用改，只要这张表的两头对得上。
export const DESIGN_END = 428.5;

// 三维画面的分辨率比例：画得柔，半分辨率渲出来再放大，省时间
export const RENDER_SCALE = 0.5;

export const FONT = "Attractor Serif";

export const COLORS = {
  text: "#e9ecf5",
  soft: "#a9b2c8",
  amber: "#f0c58a", // 拉：暖琥珀
  blue: "#7fb6f2", // 推：冷蓝
  rose: "#e88fa6",
  night: "#02040b",
};

export const asset = (path: string) => `attractor/${path}`;

// 每一幕的起止秒
export const SCENES = {
  sky: [0, 48],
  cmb: [48, 98],
  leaves: [98, 140],
  paper: [140, 186],
  zone: [186, 232],
  norma: [232, 282],
  laniakea: [282, 330],
  pushpull: [330, 372],
  maybe: [372, 410],
  night: [410, DESIGN_END],
} as const;

// 每一幕在放映时间里的起点：念白里相邻两幕的交界（再加上片名的 LEAD），首尾接 0 和片尾
const SECTION_ORDER = ["sky", "cmb", "leaves", "paper", "zone", "norma", "laniakea", "pushpull", "maybe", "night"] as const;
export const REAL_KNOTS: number[] = [0, ...SECTION_ORDER.slice(1).map((id) => LEAD + (phrases.sections.find((s) => s.id === id)?.start ?? 0)), DURATION];
export const DESIGN_KNOTS: number[] = [0, ...SECTION_ORDER.slice(1).map((id) => SCENES[id][0]), DESIGN_END];

export type SceneId = keyof typeof SCENES;
