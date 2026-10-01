// 全片的安排：什么时候换镜头、换成哪一个，小人在做什么。换镜头的时刻从配乐的起音里挑，不手写
import { random } from "remotion";
import { AudioScore, Note } from "../../shared/audioScore";
import { PARTS, SHOTS } from "./theme";

export type Cut = {
  // 换上这个镜头的时刻（秒）
  time: number;
  // 用合集里的第几个镜头
  shot: number;
  // 这一段切得快不快：快的时候小人蹦，慢的时候小人看
  fast: boolean;
};

export type Plan = { cuts: Cut[] };

// 在一段时间里挑换镜头的时刻：两次至少隔 gap 秒，在够得着的起音里取最重的那个
const pickTimes = (notes: Note[], from: number, to: number, gap: number): number[] => {
  const times: number[] = [];
  let earliest = from;
  while (earliest < to - gap * 0.6) {
    const reach = notes.filter((note) => note.time >= earliest && note.time < Math.min(to, earliest + gap * 0.7));
    const best = reach.reduce<Note | null>((a, b) => (a === null || b.strength > a.strength ? b : a), null);
    const time = best ? best.time : earliest;
    times.push(time);
    earliest = time + gap;
  }
  return times;
};

export const makePlan = (score: AudioScore): Plan => {
  const sections = [
    { from: PARTS.first, to: PARTS.lift, gap: 1.75, fast: false },
    { from: PARTS.lift, to: PARTS.middle, gap: 0.85, fast: true },
    { from: PARTS.middle, to: PARTS.breath, gap: 1.75, fast: false },
    { from: PARTS.main, to: PARTS.coda, gap: 0.85, fast: true },
  ];
  // 最后一个镜头留给尾声，其余的按顺序用，用完从头再来
  const last = SHOTS.length - 1;
  const cuts: Cut[] = [];
  let next = 0;
  for (const section of sections) {
    for (const time of pickTimes(score.notes, section.from, section.to, section.gap)) {
      cuts.push({ time, shot: next % last, fast: section.fast });
      next++;
    }
  }
  const codaNote = score.notes.find((note) => note.time >= PARTS.coda - 0.3);
  cuts.push({ time: codaNote ? codaNote.time : PARTS.coda, shot: last, fast: false });
  return { cuts };
};

// 此刻卡片里是第几次换上来的镜头；还没开始时是 -1
export const cutIndexAt = (plan: Plan, t: number) => {
  let index = -1;
  for (let i = 0; i < plan.cuts.length; i++) {
    if (plan.cuts[i].time <= t) {
      index = i;
    }
  }
  return index;
};

// 这一帧该显示合集里的第几帧：镜头放完就停在最后一格
export const reelFrameAt = (plan: Plan, t: number, fps: number) => {
  const index = cutIndexAt(plan, t);
  if (index < 0) {
    return null;
  }
  const cut = plan.cuts[index];
  const [start, end] = SHOTS[cut.shot];
  const inside = Math.min(t - cut.time, end - start - 2 / fps);
  return Math.round((start + inside) * fps);
};

// 动画的节奏：把帧号按 hold 帧一格取整，动一下、停一下
export const stepped = (frame: number, hold: number) => Math.floor(frame / hold) * hold;

// 手画的线每一格都会抖一点
export const boil = (seed: string, frame: number, hold = 4) => {
  const tick = Math.floor(frame / hold);
  return {
    x: (random(`${seed}-x-${tick}`) - 0.5) * 2.4,
    y: (random(`${seed}-y-${tick}`) - 0.5) * 2.4,
    tilt: (random(`${seed}-r-${tick}`) - 0.5) * 0.9,
  };
};

export type Pose = "walk1" | "walk2" | "jump1" | "jump2" | "sleepy1" | "sleepy2" | "watch1" | "watch2";

export type Chibi = {
  pose: Pose;
  x: number;
  // 离地多高
  lift: number;
  // 朝左（素材默认朝右）
  flip: boolean;
  visible: boolean;
};

// 小人站的两个位置：一开始在卡片右下，低音进来后走到卡片下方中间
const SPOT_RIGHT = 1716;
const SPOT_MID = 1300;
const WALK_IN = { from: 1.0, to: 5.0 };
const WALK_OVER = { from: 14.2, to: 17.4 };

// 小人此刻的姿势和位置
export const chibiAt = (plan: Plan, t: number, fps: number): Chibi => {
  const frame = Math.round(t * fps);
  const step = stepped(frame, 3) / fps;
  const stride: Pose = Math.floor(frame / 7) % 2 === 0 ? "walk1" : "walk2";
  if (t < WALK_IN.from) {
    return { pose: "walk1", x: 2120, lift: 0, flip: true, visible: false };
  }
  if (t < WALK_IN.to) {
    const u = (step - WALK_IN.from) / (WALK_IN.to - WALK_IN.from);
    return { pose: stride, x: 2080 + (SPOT_RIGHT - 2080) * u, lift: stride === "walk2" ? 6 : 0, flip: true, visible: true };
  }
  if (t >= WALK_OVER.from && t < WALK_OVER.to) {
    const u = (step - WALK_OVER.from) / (WALK_OVER.to - WALK_OVER.from);
    return { pose: stride, x: SPOT_RIGHT + (SPOT_MID - SPOT_RIGHT) * u, lift: stride === "walk2" ? 6 : 0, flip: true, visible: true };
  }
  const x = t < WALK_OVER.from ? SPOT_RIGHT : SPOT_MID;
  const index = cutIndexAt(plan, t);
  const sinceCut = index < 0 ? 99 : Math.round((t - plan.cuts[index].time) * fps);

  if (t >= PARTS.coda + 3.5) {
    return { pose: "sleepy2", x, lift: 0, flip: true, visible: true };
  }
  if (t >= PARTS.coda || (t >= PARTS.breath && t < PARTS.main)) {
    return { pose: "sleepy1", x, lift: 0, flip: true, visible: true };
  }
  if (index >= 0 && plan.cuts[index].fast) {
    // 快切的段落：每换一个镜头蹦一下
    if (sinceCut < 3) {
      return { pose: "jump2", x, lift: 46, flip: false, visible: true };
    }
    if (sinceCut < 6) {
      return { pose: "jump2", x, lift: 62, flip: false, visible: true };
    }
    if (sinceCut < 9) {
      return { pose: "jump2", x, lift: 30, flip: false, visible: true };
    }
    return { pose: "jump1", x, lift: 0, flip: false, visible: true };
  }
  // 慢的段落：坐着看，换镜头时轻轻颠一下；中段偶尔害羞捂脸
  const shy = t >= PARTS.middle && index % 3 === 1;
  return { pose: shy ? "watch2" : "watch1", x, lift: sinceCut < 3 ? 12 : sinceCut < 6 ? 5 : 0, flip: !shy, visible: true };
};
