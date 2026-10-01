// 全片的走位：那滴水什么时候在哪、镜头跟到哪、雨的时钟走多快。时间点都从谱里的三个时刻推出来：雨下大、换气、重新起音
import { noise2D } from "@remotion/noise";
import { getLength, getPointAtLength } from "@remotion/paths";
import { Easing, interpolate } from "remotion";
import { Score } from "./score";
import { FRAME_Y, HEIGHT, LIP_Y, PANE, PUDDLE, TOTAL_FRAMES, WIDTH } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FALL = Easing.bezier(0.38, 0, 0.3, 1);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

// 主角那滴水落在玻璃上的位置，和它悬在水面上方多高
export const HERO_START = { x: 960, y: 400 };
const HANG_ABOVE = 330;
// 窗台下沿挂着的水滴，中心在下沿以下多少
const PENDANT = 40;

export type Plan = {
  // 主角是谱里的第几个音：雨下大的那一声
  heroIndex: number;
  // 它开始往下滑、滑到窗框、从窗台滴落、悬在水面上、落进水里的时刻（秒）
  slideStart: number;
  sill: number;
  drip: number;
  hang: number;
  splash: number;
  // 镜头开始钻进水里那扇窗的时刻
  dive: number;
  // 沿玻璃滑落的路线
  path: string;
  length: number;
  // 滑到窗框时的横坐标：之后它就沿这条竖线往下落
  x: number;
  // 雨的时钟：换气时慢下来停住，逐帧累计
  clock: number[];
};

// 沿玻璃滑落的路线：一路往下，左右被噪声推着拐弯
export const slidePath = (x: number, y: number, seed: string, toY: number) => {
  const points: string[] = [`M ${x.toFixed(1)} ${y.toFixed(1)}`];
  for (let yy = y + 14; yy < toY; yy += 14) {
    const drift = noise2D(seed, 0, (yy - y) / 260) * 22 * Math.min(1, (yy - y) / 160);
    points.push(`L ${(x + drift).toFixed(1)} ${yy.toFixed(1)}`);
  }
  return points.join(" ");
};

export const makePlan = (score: Score, fps: number): Plan => {
  const heroIndex = Math.max(0, score.notes.findIndex((note) => note.time >= score.pour - 0.08));
  const hero = score.notes[heroIndex];
  const slideStart = hero.time + 0.7;
  const sill = score.pour + (score.breath - score.pour) * 0.42;
  const drip = sill + 0.8;
  const hang = score.breath - 0.25;
  const splash = score.resume;
  const path = slidePath(HERO_START.x, HERO_START.y, "hero", FRAME_Y + 14);
  const length = getLength(path);
  const end = getPointAtLength(path, length);

  // 换气前半秒雨慢下来，停住，重新起音时恢复
  const clock: number[] = [];
  let elapsed = 0;
  for (let f = 0; f <= TOTAL_FRAMES; f++) {
    const t = f / fps;
    clock.push(elapsed);
    const speed = t < splash ? interpolate(t, [hang - 0.7, hang], [1, 0.02], clamp) : interpolate(t, [splash, splash + 0.12], [0.02, 1], clamp);
    elapsed += speed / fps;
  }

  return { heroIndex, slideStart, sill, drip, hang, splash, dive: splash + (30 - splash) * 0.68, path, length, x: end?.x ?? HERO_START.x, clock };
};

export type Hero = {
  // bead：停在玻璃上；slide：沿玻璃滑；trickle：漫过窗框；pendant：挂在窗台下沿；fall：往下落；gone：落进水里了
  phase: "bead" | "slide" | "trickle" | "pendant" | "fall" | "gone";
  x: number;
  y: number;
  // 这一段走了多少，0 到 1
  progress: number;
};

// 主角此刻在画里的位置（整张长画的坐标）
export const heroAt = (plan: Plan, t: number): Hero => {
  if (t < plan.slideStart) {
    return { phase: "bead", ...HERO_START, progress: 0 };
  }
  if (t < plan.sill) {
    // 走走停停：整体先慢后快，中间有两次顿住
    const u = (t - plan.slideStart) / (plan.sill - plan.slideStart);
    const progress = Math.pow(u + 0.03 * Math.sin(u * Math.PI * 4), 1.25);
    const point = getPointAtLength(plan.path, plan.length * progress);
    return { phase: "slide", x: point?.x ?? HERO_START.x, y: point?.y ?? HERO_START.y, progress };
  }
  if (t < plan.sill + 0.45) {
    return { phase: "trickle", x: plan.x, y: FRAME_Y, progress: (t - plan.sill) / 0.45 };
  }
  if (t < plan.drip) {
    return { phase: "pendant", x: plan.x, y: LIP_Y + PENDANT * 0.6, progress: (t - plan.sill - 0.45) / (plan.drip - plan.sill - 0.45) };
  }
  const hangY = LIP_Y + PUDDLE.y - HANG_ABOVE;
  if (t < plan.splash - 0.2) {
    const progress = interpolate(t, [plan.drip, plan.hang], [0, 1], { ...clamp, easing: FALL });
    // 下落时被风带着微微偏
    const sway = noise2D("hero-fall", t * 0.4, 0) * 26 * Math.sin(progress * Math.PI);
    return { phase: "fall", x: plan.x + sway, y: LIP_Y + PENDANT + (hangY - LIP_Y - PENDANT) * progress, progress };
  }
  if (t < plan.splash) {
    const u = (t - plan.splash + 0.2) / 0.2;
    return { phase: "fall", x: plan.x, y: hangY + HANG_ABOVE * u * u, progress: 1 };
  }
  return { phase: "gone", x: plan.x, y: LIP_Y + PUDDLE.y, progress: 1 };
};

// 镜头：画面顶边在长画里的纵坐标。一路跟着主角往下
export const cameraAt = (plan: Plan, t: number): number => {
  const atSill = FRAME_Y - 560;
  const atLip = LIP_Y - 380;
  const atPuddle = LIP_Y + PUDDLE.y - 640;
  if (t < plan.slideStart) {
    return 0;
  }
  if (t < plan.sill) {
    return heroAt(plan, t).y - interpolate(t, [plan.slideStart, plan.sill], [HERO_START.y, 560]);
  }
  if (t < plan.drip) {
    return interpolate(t, [plan.sill, plan.sill + 0.65], [atSill, atLip], { ...clamp, easing: EASE_OUT });
  }
  if (t < plan.hang) {
    const onScreen = interpolate(t, [plan.drip, plan.drip + 1.4, plan.hang - 1.8, plan.hang], [380 + PENDANT, 480, 480, 310], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    return heroAt(plan, t).y - onScreen;
  }
  return atPuddle;
};

// 结尾钻进水洼里映着的那扇窗：到最后一帧，这扇窗正好铺满画面
export const diveAt = (plan: Plan, t: number) => {
  const u = interpolate(t, [plan.dive, 30], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const scale = Math.exp(Math.log(WIDTH / PANE.w) * u);
  const fromX = PANE.x;
  const fromY = PANE.y - (PUDDLE.y - 640);
  return { u, scale, fromX, fromY, toX: fromX + (WIDTH / 2 - fromX) * u, toY: fromY + (HEIGHT / 2 - fromY) * u };
};

// 雨势：跟低音走，来得快去得慢；后三分之一雨渐渐收住
export const rainAt = (score: Score, plan: Plan, frame: number, fps: number) => {
  const at = Math.min(Math.max(0, frame), score.bass.length - 1);
  let level = 0;
  for (let f = Math.max(0, at - 45); f <= at; f++) {
    level = Math.max(level, Math.max(0, score.bass[f] - 0.1) * Math.exp(-(at - f) / 28));
  }
  return level * clearAt(plan, frame / fps);
};

// 雨还剩几成：水洼那一段的后半慢慢停
export const clearAt = (plan: Plan, t: number) => interpolate(t, [plan.splash + 3.2, plan.dive + 0.6], [1, 0], clamp);

// 天放亮了几成
export const warmAt = (plan: Plan, t: number) => interpolate(t, [plan.splash + 3, plan.dive + 0.8], [0, 1], { ...clamp, easing: EASE_IN_OUT });

// 每个音让灯亮一下
export const glowAt = (score: Score, frame: number, fps: number) => {
  const at = Math.min(Math.max(0, frame), score.loudness.length - 1);
  const seconds = frame / fps;
  const pulse = score.notes.reduce((sum, note) => {
    const age = seconds - note.time;
    return age < 0 || age > 0.8 ? sum : sum + note.strength * Math.exp(-age * 5);
  }, 0);
  return 0.8 + score.loudness[at] * 0.22 + Math.min(0.3, pulse * 0.16);
};
