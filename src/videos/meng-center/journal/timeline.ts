// 时间轴：plan.json（tools/meng-center/journal_music.py 按念白排的小节表）+ voice.json（每句时长和嘴型包络）
import plan from "./plan.json";
import voice from "./voice.json";

export const FPS = plan.fps;
export const BEAT = plan.beat; // 15 帧
export const BAR = plan.bar; // 60 帧
export const DURATION = plan.frames;
export const W = 1920;
export const H = 1080;

export type SceneId = (typeof plan.scenes)[number]["id"];

export type Line = { i: number; scene: string; text: string; at: number; dur: number; mouth: number[] };

export const LINES: Line[] = plan.scenes.flatMap((s) =>
  s.lines.map((l) => ({ i: l.i, scene: s.id, text: voice.lines[l.i].text, at: l.at, dur: l.dur, mouth: voice.lines[l.i].mouth })),
);

export const SCENES = plan.scenes.map((s) => ({ id: s.id, section: s.section, from: s.from, frames: s.frames, bars: s.bars }));

export const scene = (id: string) => {
  const s = plan.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`没有这一幕：${id}`);
  return s;
};

// 某一幕第 k 句从这一幕开头算起的帧数，和它的时长
export const cue = (id: string, k: number) => {
  const s = scene(id);
  const l = s.lines[Math.min(k, s.lines.length - 1)];
  return l.at - s.from;
};
export const cueEnd = (id: string, k: number) => {
  const s = scene(id);
  const l = s.lines[Math.min(k, s.lines.length - 1)];
  return l.at - s.from + l.dur;
};

// 当前在说哪一句，以及这一帧的嘴型（0..1）
export const mouthAt = (f: number) => {
  for (const l of LINES) {
    if (f >= l.at && f < l.at + l.mouth.length) return l.mouth[f - l.at];
  }
  return 0;
};
export const speakingAt = (f: number) => LINES.some((l) => f >= l.at - 2 && f < l.at + l.dur + 2);
