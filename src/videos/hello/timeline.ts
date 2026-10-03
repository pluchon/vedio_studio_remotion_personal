// 全片的时间表：各段的长短和每句话的时刻都写在 script.json 里，配乐脚本读的也是那一份
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";
import script from "./script.json";

// 一句话：at 是开口的时刻（秒），hold 是说完后停留多久
export type Line = { at: number; text: string; hold: number };

export const PACE = script.pace;
export const OVERLAP = script.overlap;

// 相邻两段叠着过渡，所以下一段的起点要减去叠的那一截
export const STARTS: number[] = [];
script.chapters.forEach((chapter, i) => {
  STARTS.push(
    i === 0 ? 0 : STARTS[i - 1] + script.chapters[i - 1].seconds - OVERLAP,
  );
});
export const SECONDS = script.chapters.map((chapter) => chapter.seconds);
export const TOTAL = STARTS[STARTS.length - 1] + SECONDS[SECONDS.length - 1];

const indexOf = (id: string) => {
  const index = script.chapters.findIndex((chapter) => chapter.id === id);
  if (index < 0) throw new Error(`没有这一段：${id}`);
  return index;
};
export const secondsOf = (id: string) => SECONDS[indexOf(id)];

// 某一段里的台词（用这一段自己的时间）
export const linesOf = (id: string): Line[] =>
  script.chapters[indexOf(id)].lines.map((line) => ({
    at: line.at,
    text: line.text,
    hold: line.hold ?? script.hold,
  }));

// 全片的台词（用全片的时间）
export const LINES: Line[] = script.chapters.flatMap((chapter, i) =>
  linesOf(chapter.id).map((line) => ({ ...line, at: line.at + STARTS[i] })),
);

export const lineEnd = (line: Line) => line.at + [...line.text].length * PACE;
export const lineGone = (line: Line) => lineEnd(line) + line.hold;

// 交给字幕工具分页：一个字一个时间戳，每句话结尾断页；空格并进后面那个字里
const captions: Caption[] = LINES.flatMap((line) => {
  const chars = [...line.text];
  const out: Caption[] = [];
  let pending = "";
  chars.forEach((char, i) => {
    if (char === " ") {
      pending = " ";
      return;
    }
    const startMs = Math.round((line.at + i * PACE) * 1000);
    out.push({
      text: pending + char,
      startMs,
      endMs: startMs + Math.round(PACE * 1000),
      timestampMs: startMs,
      confidence: 1,
    });
    pending = "";
  });
  out[out.length - 1] = { ...out[out.length - 1], pageBreakAfter: true };
  return out;
});

export const PAGES: TikTokPage[] = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 600000,
}).pages;

// 这一刻说话的劲头：说着话时每个字颠一下，标点处停
export const talkAt = (lines: Line[], t: number) => {
  const line = lines.find((l) => t >= l.at && t < lineEnd(l));
  if (!line) return 0;
  const index = Math.floor((t - line.at) / PACE);
  const char = [...line.text][index];
  if (!char || char === " " || "，。？！、：；".includes(char)) return 0;
  const phase = ((t - line.at) % PACE) / PACE;
  return 0.3 + 0.7 * Math.sin(phase * Math.PI);
};
