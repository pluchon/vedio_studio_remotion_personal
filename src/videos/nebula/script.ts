// 念白的时间表：每一小句从哪一秒念到哪一秒（tools/nebula/align.py 从录音的停顿里量出来，再和语音识别的结果对过）
// 字幕一页一句（过长的在逗号处拆开），整页一起淡入淡出
import script from "./script.json";

export type Phrase = { start: number; end: number; text: string };
export const PHRASES: Phrase[] = script.phrases;

// 一页最多放多少个字
const PAGE_MAX = 19;

export type Page = { start: number; end: number; text: string };

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
  return out.map((page) => ({ start: page[0].start, end: page[page.length - 1].end, text: page.map((p) => p.text).join("") }));
};

export const PAGES: Page[] = build();
