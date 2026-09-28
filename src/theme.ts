// 视频的配色、字体与时间线：配色取自墨衡两端页面（画卷风格）
import { Easing } from "remotion";

export const COLORS = {
  ink: "#2f2a24",
  text: "#5c5145",
  muted: "#8a7d6b",
  moss: "#354435",
  mossLight: "#3d7a57",
  cinnabar: "#8b352a",
  sand: "#b7a78f",
  paper: "#f4ede0",
  plate: "#fbf8f1",
  line: "rgba(92, 81, 69, 0.35)",
};

export const FONTS = {
  serif: "'Noto Serif SC', 'Songti SC', 'SimSun', serif",
  latin: "Georgia, 'Times New Roman', serif",
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 场景之间的淡入淡出帧数
export const TRANSITION = 18;

// 各场景时长（帧）；总长 = 各场景之和 - 转场重叠
export const DURATIONS = {
  opening: 300,
  overview: 300,
  architecture: 420,
  questionBank: 180,
  workbench: 240,
  tutor: 240,
  appeal: 180,
  contest: 180,
  review: 240,
  profile: 150,
  dashboard: 210,
  hardAnalysis: 240,
  aiQuestion: 240,
  appealJudge: 210,
  principles: 270,
  ending: 270,
};

const sceneCount = Object.keys(DURATIONS).length;
export const TOTAL_DURATION =
  Object.values(DURATIONS).reduce((sum, d) => sum + d, 0) - TRANSITION * (sceneCount - 1);

// 常用缓动：出现用 easeOut，镜头移动用 inOut
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
