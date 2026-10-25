// 全片镜头表：按配乐的秒数排，每一段一个文件
import type { Shot } from "../shot";
import { AGES } from "./ages";
import { CODA } from "./coda";
import { ASCEND } from "./ascend";
import { DAWN } from "./dawn";
import { EXPANSE } from "./expanse";
import { HEARTH } from "./hearth";
import { PROLOGUE } from "./prologue";
import { RISE } from "./rise";

const ALL: Shot[] = [...PROLOGUE, ...DAWN, ...HEARTH, ...RISE, ...AGES, ...EXPANSE, ...ASCEND, ...CODA];

// 前一个镜头要等后一个完全淡入盖住了才撤，不然交接处会闪一下黑
export const SHOTS: Shot[] = ALL.map((s) => {
  if (s.out) return s;
  const cover = ALL.filter((n) => n !== s && n.from > s.from && n.from <= s.to).map((n) => n.from + n.fade);
  return cover.length ? { ...s, to: Math.max(s.to, ...cover) } : s;
});
