// 《我们一直在仰望》的配色、字体与时间轴：配乐整首 4:57 不裁，画面切换对在实测的乐句点上
import { staticFile } from "remotion";
import { loadLocalFont } from "../../shared/fonts";

export { EASE_IN_OUT, EASE_OUT } from "../../shared/motion";

// 本视频的素材都在 public/looking-up/ 下，如 asset("textures/earth_day.jpg")
export const asset = (path: string) => `looking-up/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// 史书用宋体：正文思源宋体常规，卷名用最粗的一档；英文译注用斜体衬线
export const FONTS = {
  song: "'LU Song', 'SimSun', serif",
  songBlack: "'LU Song Black', 'SimSun', serif",
  latin: "Georgia, 'Times New Roman', serif",
};
loadLocalFont("LU Song", staticFile(asset("fonts/NotoSerifSC-Regular.otf")));
loadLocalFont("LU Song Black", staticFile(asset("fonts/NotoSerifSC-Black.otf")));

// 纸面：宣纸、墨、乌丝栏、朱砂
export const PAPER = {
  base: "#efe4cb",
  deep: "#e0cfac",
  ink: "#2b2520",
  inkSoft: "rgba(43, 37, 32, 0.62)",
  rule: "rgba(62, 44, 30, 0.5)",
  cinnabar: "#b5362a",
};

// 宇宙：纸退掉之后，版框和字改用月白色压在星空上
export const SPACE = {
  bg: "#04050b",
  cream: "#efe6d2",
  creamSoft: "rgba(239, 230, 210, 0.72)",
  rule: "rgba(239, 230, 210, 0.3)",
  cinnabar: "#e0674f",
};

// 复古海报风（照用户给的参考图）：奶油底，灰蓝、珊瑚、芥末黄、藏青的色块，年份粗衬线、地点细字、一道红短线
export const RETRO = {
  cream: "#f4e8c8",
  creamLight: "#f9f0d9",
  sand: "#e6d6ae",
  teal: "#5f8e9c",
  tealLight: "#93b5bd",
  navy: "#1f3445",
  navyDeep: "#15242f",
  coral: "#e5805e",
  salmon: "#efa585",
  mustard: "#efb641",
  brown: "#8a5a45",
  ink: "#2a2a28",
  inkSoft: "#7a7263",
  red: "#b8412f",
};

// 配乐：Marcus Warner《If I Should Return》整首 297.0 秒；音乐在 296.5 秒静下来，画面再停到 300 秒收尾
export const MUSIC = asset("audio/if-i-should-return.mp3");
export const END_SEC = 300;
export const sec = (s: number) => Math.round(s * FPS);
export const TOTAL_FRAMES = sec(END_SEC);

// 实测的乐句点（秒）：四小节一句约 9.07 秒（约 106 BPM）
// 9.90 第一声低鼓；27.95 节奏进来，之后 37.06、46.12、55.13、64.23、73.29、82.34 每句一换；
// 82.5~86.8 屏息；86.85 第一次爆发，104.98、123.11 各亮一层；159.4 回落；195.54 重新蓄力（每 4.53 秒一记低鼓）；
// 232.0~235.0 第二次屏息；235.0 起镲、236.29 最终爆发，之后 245.35、254.4、263.5、272.6、281.6 每句一换；290.7 起衰减，296.5 静音
// 全片按年代换画法：墨（望远镜之前，铜版画）→ 海报（1610~1977，复古扁平）→ 深空（写实 3D 与真照片）→ 光（硅与 AI）→ 跋回到墨
// 每一幕一个历史瞬间，切换都落在乐句点上
export type Segment = { from: number; to: number };
export const SEGMENTS = {
  // 序：黑夜里一堆火慢慢熄下去，第一声低鼓时片名落下
  prologue: { from: 0, to: 15.2 },
  // 墨 · 约三十万年前：火边的人抬头，星一颗颗亮
  primal: { from: 15.2, to: 27.95 },
  // 墨 · 约四万年前：骨上的刻痕，月相一格格排出来
  bone: { from: 27.95, to: 37.06 },
  // 墨 · 约五千年前：太阳从巨石的缝里升起
  stones: { from: 37.06, to: 41.6 },
  // 墨 · 约三千年前：循着一颗星的舟
  canoe: { from: 41.6, to: 46.12 },
  // 墨 · 公元前 613 年：史官记下划进北斗的彗星
  chronicle: { from: 46.12, to: 55.13 },
  // 墨 · 约三千年前：塔顶读星象的祭司
  omens: { from: 55.13, to: 64.23 },
  // 墨 · 1576~1609：第谷的记录，开普勒的椭圆
  kepler: { from: 64.23, to: 73.29 },
  // 墨 · 1687：苹果落下，石头飞成了轨道
  newton: { from: 73.29, to: 82.34 },
  // 墨 · 1609：屏息，弗拉马利翁版画里的人探出天穹
  lens: { from: 82.34, to: 86.85 },
  // 海报 · 1610：颜色涌进来，伽利略与木星的四颗卫星
  galileo: { from: 86.85, to: 95.9 },
  // 海报 · 1924：一路退出银河，退出一片千亿星系
  galaxies: { from: 95.9, to: 104.98 },
  // 海报 · 宇宙日历：一百三十八亿年压成一年，文明挤在最后几秒
  calendar: { from: 104.98, to: 114.04 },
  // 海报 · 1957：屋顶上的人看一颗会走的星
  sputnik: { from: 114.04, to: 118.6 },
  // 海报 · 1969：土星五号升空
  launch: { from: 118.6, to: 123.11 },
  // 海报 · 1969：电视里月面上的脚印
  landing: { from: 123.11, to: 127.6 },
  // 海报 · 1977：金唱片
  record: { from: 127.6, to: 132.2 },
  // 海报 · 1979：掠过木星
  jupiter: { from: 132.2, to: 141.25 },
  // 海报 · 1980：掠过土星
  saturn: { from: 141.25, to: 150.3 },
  // 海报褪色：旅行者号越飞越远，颜色褪成真正的黑
  recede: { from: 150.3, to: 159.4 },
  // 深空 · 1990：旅行者号在六十亿公里外转身
  turn: { from: 159.4, to: 168.0 },
  // 深空 · 1990：暗淡蓝点
  dot: { from: 168.0, to: 178.37 },
  // 深空 · 2012：穿出日球层顶，至今仍在飞
  helio: { from: 178.37, to: 195.54 },
  // 深空 · 2021：韦布展开
  webb: { from: 195.54, to: 204.62 },
  // 深空 · 2022：第一张深空场
  deepfield: { from: 204.62, to: 213.7 },
  // 深空 · 约五十亿年前：恒星锻出铁与钙，尘埃聚成地球
  forge: { from: 213.7, to: 222.71 },
  // 深空 · 地球的夜面，「终于开始自己点火」
  home: { from: 222.71, to: 232.0 },
  // 光 · 屏息里擦亮一粒电火花；沙 → 硅 → 回路
  silicon: { from: 232.0, to: 245.35 },
  // 光 · 编年越翻越快，地球夜面被灯火织满；光很亮，影子也很深
  network: { from: 245.35, to: 272.6 },
  // 未知：年份跳成「？」，页边多出一行字——最终爆发的最后两句
  unknown: { from: 272.6, to: 290.7 },
  // 跋 · 今天：回到墨，屋顶上仰望的人
  coda: { from: 290.7, to: END_SEC },
} satisfies Record<string, Segment>;

export const segFrom = (s: Segment) => sec(s.from);
export const segDuration = (s: Segment) => sec(s.to) - sec(s.from);

// 段落内的本地帧：直接写配乐里的秒数，如 t(46.12)
export const localTime = (s: Segment) => (music: number) => sec(music) - sec(s.from);

// 三种底色下字的配色：墨（宣纸）、海报（奶油）、深空（黑）
export type Tone = "ink" | "retro" | "space";
