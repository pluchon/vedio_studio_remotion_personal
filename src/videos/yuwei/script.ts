// 念白时间表：tools/yuwei/align.py 对着录音量出来，存在 phrases.json
import phrases from "./phrases.json";
import { LEAD } from "./theme";

export type Phrase = { start: number; end: number; text: string; section: string };
export type Section = { id: string; start: number; end: number };

export const PHRASES: Phrase[] = phrases.phrases.map((p) => ({
  start: p.start + LEAD,
  end: p.end + LEAD,
  text: p.text,
  section: p.section,
}));

export const SECTIONS: Record<string, Section> = {};
for (const s of phrases.sections) {
  SECTIONS[s.id] = { id: s.id, start: s.start + LEAD, end: s.end + LEAD };
}

// 片内秒数（含片名）。hint 是稿子里一段连续的字。
export const at = (hint: string): number => {
  const p = PHRASES.find((x) => x.text.includes(hint));
  if (!p) throw new Error(`找不到句子：${hint}`);
  return p.start;
};

export const until = (hint: string): number => {
  const p = PHRASES.find((x) => x.text.includes(hint));
  if (!p) throw new Error(`找不到句子：${hint}`);
  return p.end;
};

export type Page = { start: number; end: number; text: string };

const PAGE_MAX = 18;

export const PAGES: Page[] = (() => {
  const pages: Page[] = [];
  let buf: Phrase[] = [];
  const flush = () => {
    if (!buf.length) return;
    pages.push({
      start: buf[0].start,
      end: buf[buf.length - 1].end,
      text: buf.map((p) => p.text).join("").replace(/[，。；：、]$/, ""),
    });
    buf = [];
  };
  const len = (list: Phrase[]) => list.reduce((n, p) => n + p.text.length, 0);
  for (const p of PHRASES) {
    buf.push(p);
    const long = len(buf) >= PAGE_MAX;
    const stop = /[。？！]$/.test(p.text);
    if (stop || long) flush();
  }
  flush();
  return pages;
})();
