// 《汉字的演变》的配色、字体和素材路径：羊皮纸底、墨色的字、朱砂点缀；整片跟着一段 82.7 秒的念白走
// 本视频的素材都在 public/hanzi/ 下，如 asset("audio/voice.mp3")
export const asset = (path: string) => `hanzi/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const VOICE = asset("audio/voice.mp3");
export const MUSIC = asset("audio/bgm.wav");

// 念白前留一秒半，念完再留四秒收尾
export const LEAD = 1.5;
export const VOICE_SECONDS = 82.7;
export const TOTAL_FRAMES = Math.round((LEAD + VOICE_SECONDS + 4) * FPS);

export const FONT = "Hanzi Song";

export const COLORS = {
  paper: "#efe6d3",
  paperDeep: "#e4d8bf",
  ink: "#2a251f",
  text: "#5c5145",
  muted: "#8f8370",
  line: "rgba(92, 81, 69, 0.3)",
  cinnabar: "#a23a2c",
};

// 五种字体，按年代排
export const SCRIPTS = ["oracle", "bronze", "seal", "clerical", "regular"] as const;
export type Script = (typeof SCRIPTS)[number];

export const SCRIPT_NAMES: Record<Script, { name: string; era: string }> = {
  oracle: { name: "甲骨文", era: "商 · 约公元前 1250 年" },
  bronze: { name: "金文", era: "商周 · 铸在青铜器上" },
  seal: { name: "小篆", era: "秦 · 公元前 221 年" },
  clerical: { name: "隶书", era: "秦汉" },
  regular: { name: "楷书", era: "魏晋至今" },
};
