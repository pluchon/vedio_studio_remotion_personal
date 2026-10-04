// 《星云》的常量
import script from "./script.json";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 片名占前两秒，念白之后再留五秒
export const LEAD = 2;
export const TAIL = 5;
export const VOICE_SECONDS = script.duration;
export const TOTAL_FRAMES = Math.round((LEAD + VOICE_SECONDS + TAIL) * FPS);

// 体积渲染的分辨率比例：星云本来就是柔的，半分辨率渲出来再放大，省一大半时间
export const RENDER_SCALE = 0.5;

export const FONT = "Nebula Serif";
export const FONT_LIGHT = "Nebula Serif Light";

export const COLORS = {
  text: "#ece8f4",
  soft: "#b8b2cc",
  warm: "#f2cba2",
  rose: "#e88fa6",
  teal: "#86d6d8",
  night: "#02030a",
};

export const asset = (path: string) => `nebula/${path}`;

// 每一幕在念白里的起止秒（对着 script.json 的小句定的）
export const SCENES = {
  clouds: [0, 25.2],
  cosmos: [25.2, 39.0],
  morph: [39.0, 58.8],
  gallery: [58.8, 75.7],
  messier: [75.7, 99.8],
  catalog: [99.8, 140.2],
  debate: [140.2, 182.5],
  shell: [182.5, 200.3],
  spectra: [200.3, 236.7],
  hubble: [236.7, 261.4],
  classes: [261.4, 291.7],
  aurora: [291.7, 317.4],
  flowers: [317.4, VOICE_SECONDS + TAIL - 0.6],
} as const;
