// 《一场雨》的配色与布景尺寸：配乐是 30 秒的钢琴曲《溯》，每分钟 60 拍；雨点、雨势都从曲子的波形里读出来，不写死时间点
// 本视频的素材都在 public/rain/ 下，如 asset("audio/su.mp3")
export const asset = (path: string) => `rain/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const MUSIC = asset("audio/su.mp3");
export const TOTAL_FRAMES = 30 * FPS;

// 整片是一张竖长的画，镜头一路往下：玻璃在最上面，往下是窗框和窗台，窗台下沿以下是院子
// 玻璃到 FRAME_Y 为止，下面是窗框的横档和窗台；LIP_Y 是窗台下沿
export const FRAME_Y = 2300;
export const RAIL = 150;
export const SILL = 80;
export const LIP_Y = FRAME_Y + RAIL + SILL;

// 院子里的东西用「窗台下沿以下多少」来定位
export const EAVE_Y = 560;
export const GROUND_Y = 2380;
export const PUDDLE = { x: 960, y: 2720, rx: 830, ry: 262 };
// 水洼里映着的那扇窗：结尾镜头钻进去，回到第一帧
export const PANE = { x: 1250, y: 2676, w: 256, h: 144 };

// 傍晚的雨天：青灰的天，越靠近地面越亮
export const DUSK = {
  top: "#1b2c3a",
  mid: "#39525f",
  low: "#748a8a",
  block: "#142029",
};

// 失焦的灯：暖的街灯居多，夹几盏青白和红
export const LIGHTS = ["#ffd596", "#ffb45e", "#ffc67a", "#ffe2b0", "#ff9d6a", "#9ad8d6", "#f3efe2", "#ff8672"];

// 玻璃上的水珠：上缘映着暗处，下缘映着天光
export const BEAD = {
  dark: "rgba(6, 16, 24, 0.66)",
  mid: "rgba(96, 136, 150, 0.06)",
  bright: "rgba(240, 248, 244, 0.5)",
  rim: "rgba(8, 18, 26, 0.38)",
  glint: "rgba(255, 255, 255, 0.92)",
  trail: "rgba(214, 232, 234, 0.2)",
};

// 院子：雾里的远山、屋瓦、灯笼、枝叶、石头和水
export const YARD = {
  far: "#5b757e",
  hill: "#4d6771",
  roof: "#354c57",
  tile: "#1d2d37",
  tileEdge: "#3a5360",
  wood: "#1a2329",
  sill: "#3c4a51",
  lantern: "#ffc67a",
  leaf: "#4f8473",
  leafLight: "#7fb295",
  leafDark: "#2d5449",
  ground: "#36515b",
  groundDeep: "#19272f",
  stone: "#44575f",
  water: "#3b5661",
  waterDeep: "#243741",
  ripple: "rgba(232, 244, 242, 1)",
};
