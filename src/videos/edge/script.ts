// 念白的时间表：每一小句从哪一秒念到哪一秒（tools/edge/align.py 从录音的停顿里量出来，再和语音识别的结果对过）
// 字幕一句一页；一小句里的字按时间均分
import type { Caption } from "@remotion/captions";
import script from "./script.json";

type Phrase = { start: number; end: number; text: string };
export const PHRASES: Phrase[] = script.phrases;

const MARKS = "，。？！、";

// 一页最多放多少个字：超过的句子在逗号处拆开
const PAGE_MAX = 22;

// 先按句末的标点分句，过长的再在逗号处平分
const pages = (): Phrase[][] => {
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

  const out: Phrase[][] = [];
  for (const sentence of sentences) {
    const length = (list: Phrase[]) => list.reduce((n, p) => n + p.text.length, 0);
    const pieces: Phrase[][] = [sentence];
    // 反复把最长的一页在最接近中间的逗号处拆开，直到都不超过上限
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
  return out;
};

export const CAPTIONS: Caption[] = pages().flatMap((page) =>
  page.flatMap((phrase, p) => {
    const tokens: string[] = [];
    for (const char of phrase.text) {
      if (MARKS.includes(char) && tokens.length) tokens[tokens.length - 1] += char;
      else tokens.push(char);
    }
    const last = p === page.length - 1;
    // 字在这一小句的前 92% 里出完，留一点气口
    const span = (phrase.end - phrase.start) * 0.92;
    const each = span / tokens.length;
    return tokens.map((token, i) => ({
      text: token,
      startMs: Math.round((phrase.start + i * each) * 1000),
      endMs: Math.round((phrase.start + (i + 1) * each) * 1000),
      timestampMs: Math.round((phrase.start + (i + 0.5) * each) * 1000),
      confidence: null,
      pageBreakAfter: last && i === tokens.length - 1,
    }));
  }),
);
