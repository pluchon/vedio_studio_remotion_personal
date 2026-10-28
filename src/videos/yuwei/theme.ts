// 《雨未愁眠》：横屏 60fps。时间跟着念白走，画面是一张很长的纸，海报和贴纸叠在上面。
import phrases from "./phrases.json";

export const asset = (path: string) => `yuwei/${path}`;

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const LEAD = 2.8;
export const TAIL = 6.0;
export const VOICE_SECONDS = phrases.duration;
export const DURATION = LEAD + VOICE_SECONDS + TAIL;
export const TOTAL_FRAMES = Math.round(DURATION * FPS);

export const WORLD = { w: 12800, h: 2160 };

export const FONT_ZH = "Yuwei Sans";
export const FONT_ZH_BOLD = "Yuwei Sans Bold";
export const FONT_SONG = "Yuwei Song";
export const FONT_NUM = "Yuwei Num";
export const FONT_EN = "Yuwei En";
export const FONT_ITAL = "Yuwei Ital";

// 印刷海报的配色：奶油纸上印夜色，强调色只有台灯的暖黄
export const C = {
  paper: "#f3e6cc",
  paperDeep: "#e6d4b0",
  paperLight: "#faf3e4",
  fiber: "#cbb892",
  ink: "#1e1914",
  inkSoft: "#4a4036",
  muted: "#7a6e60",
  line: "rgba(40, 32, 24, 0.18)",
  navy: "#243044",
  navyDeep: "#161e2a",
  slate: "#4d6275",
  rain: "#7ea0b4",
  rainDeep: "#3e5a6c",
  night: "#1a2433",
  gold: "#e6b03a",
  goldDeep: "#c4891e",
  lamp: "#f4d27a",
  lampSoft: "rgba(244, 210, 122, 0.42)",
  coral: "#d46a4c",
  terracotta: "#c17a56",
  roof: "#a85d42",
  teal: "#3d6e72",
  tealSoft: "#6d9aa0",
  stamp: "#b33a2e",
  cream: "#fffaf2",
  tape: "rgba(232, 210, 160, 0.82)",
  white: "#fffdf8",
};

export const VOICE = asset("audio/voice.wav");
export const MUSIC = asset("audio/bgm.wav");
export const RAIN = asset("audio/rain.wav");
export const SFX = asset("audio/sfx.wav");
