// 念白的字幕：每一小句从哪一秒念到哪一秒（tools/attractor/tts_timing.py 从逐句生成的时间和波形里的停顿算出来，存在 narration.json）。
// 字幕一页一句（过长的在逗号处拆开），整页一起淡入淡出，句末不带标点。时间是放映时间，即念白的秒数加上片名占的 LEAD
import phrases from "./narration.json";
import english from "./script-en.json";
import { LEAD } from "./theme";

export type Phrase = { start: number; end: number; text: string };
export type Page = { start: number; end: number; text: string };

export const PHRASES: Phrase[] = phrases.phrases.map((p) => ({ start: p.start + LEAD, end: p.end + LEAD, text: p.text }));

// 一页最多放多少个字
const PAGE_MAX = 20;

const build = (): Page[] => {
  const sentences: Phrase[][] = [];
  let current: Phrase[] = [];
  for (const phrase of PHRASES) {
    current.push(phrase);
    if (/[。？！]$/.test(phrase.text)) {
      sentences.push(current);
      current = [];
    }
  }
  if (current.length) sentences.push(current);

  const length = (list: Phrase[]) => list.reduce((n, p) => n + p.text.length, 0);
  const out: Phrase[][] = [];
  for (const sentence of sentences) {
    const pieces: Phrase[][] = [sentence];
    while (pieces.some((p) => length(p) > PAGE_MAX && p.length > 1)) {
      const index = pieces.findIndex((p) => length(p) > PAGE_MAX && p.length > 1);
      const piece = pieces[index];
      const half = length(piece) / 2;
      let run = 0;
      let cut = 1;
      let best = Infinity;
      for (let i = 0; i < piece.length - 1; i++) {
        run += piece[i].text.length;
        if (Math.abs(run - half) < best) {
          best = Math.abs(run - half);
          cut = i + 1;
        }
      }
      pieces.splice(index, 1, piece.slice(0, cut), piece.slice(cut));
    }
    out.push(...pieces);
  }
  const pages = out.map((page) => ({ start: page[0].start, end: page[page.length - 1].end, text: page.map((p) => p.text).join("").replace(/[，。；：、]$/, "") }));
  // 念得太短的页（比如结尾的「睡吧」「晚安」）来不及读完就换了，并到下一页
  const merged: Page[] = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const next = pages[i + 1];
    if (next && page.end - page.start < 0.8 && page.text.length + next.text.length <= PAGE_MAX) {
      merged.push({ start: page.start, end: next.end, text: `${page.text}\u3000${next.text}` });
      i++;
    } else {
      merged.push(page);
    }
  }
  return merged;
};

export const PAGES: Page[] = build();

// 英文字幕：逐句（中文一句拆成两页时，英文整句跨两页一直留着），时间同样加上片名的 LEAD

export type EnLine = { start: number; end: number; text: string };
export const EN_LINES: EnLine[] = phrases.lines.map((l, i) => ({ start: l.start + LEAD, end: l.end + LEAD, text: english[i] }));
