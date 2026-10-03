// 成片的参数：可以在 Remotion Studio 右侧的表单里改，也可以渲染时用 --props 传
import React from "react";
import { z } from "zod";

export const schema = z.object({
  // 片子是哪一天做的：用来算「出来第几天」
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Props = z.infer<typeof schema>;

export const DEFAULTS: Props = { asOf: "2026-10-03" };
export const Options = React.createContext<Props>(DEFAULTS);

// Opus 5.5 发布的日子
const RELEASED = Date.UTC(2026, 8, 22);

// 到 asOf 那天，是出来的第几天（发布当天算第一天）
export const daysOld = (asOf: string) => {
  const [year, month, day] = asOf.split("-").map(Number);
  const days = Math.round(
    (Date.UTC(year, month - 1, day) - RELEASED) / 86400000,
  );
  return Math.max(1, days + 1);
};
