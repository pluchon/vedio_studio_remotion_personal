// 《宇宙的尽头》的配色、时间表和素材路径：一张不断被重画的老地图，念白是朋友录的一段关于宇宙尽头的朗读
// 本视频的素材都在 public/edge/ 下，如 asset("audio/voice.mp3")
import script from "./script.json";

export const asset = (path: string) => `edge/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const VOICE = asset("audio/voice.mp3");
export const MUSIC = asset("audio/bgm.wav");

// 念白前留两秒给片名，念完再留四秒收尾
export const LEAD = 2;
export const VOICE_SECONDS: number = script.duration;
export const TAIL = 4;
export const TOTAL_FRAMES = Math.round((LEAD + VOICE_SECONDS + TAIL) * FPS);

export const FONT = "Edge Serif";
export const FONT_BLACK = "Edge Serif Black";

export const COLORS = {
  paper: "#e9ddbd",
  paperDeep: "#d9c9a0",
  paperLight: "#f3ebd2",
  ink: "#3a2b1e",
  inkSoft: "rgba(58, 43, 30, 0.55)",
  sea: "#a7bdb3",
  seaDeep: "#7f9b95",
  land: "#efe3c0",
  red: "#b3382c",
  gold: "#b8923a",
  night: "#0a0e1c",
  nightSoft: "#141a30",
  star: "#f3e9c9",
};

// 各幕在念白里的起止秒数（对着 script.json 里的小句定的）
export type SceneId = "sea" | "globe" | "rings" | "fur" | "hubble" | "fossil" | "edge" | "bang" | "coda";
export const SCENES: { id: SceneId; from: number; to: number }[] = [
  { id: "sea", from: 0, to: 18.7 },
  { id: "globe", from: 18.7, to: 32.3 },
  { id: "rings", from: 32.3, to: 54.9 },
  { id: "fur", from: 54.9, to: 78.5 },
  { id: "hubble", from: 78.5, to: 115.5 },
  { id: "fossil", from: 115.5, to: 140.5 },
  { id: "edge", from: 140.5, to: 159.5 },
  { id: "bang", from: 159.5, to: 195.0 },
  { id: "coda", from: 195.0, to: VOICE_SECONDS },
];
