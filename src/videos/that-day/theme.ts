// 《那一天》的参数、配色和时间表：输入一个日期和一个地方，片子算出那天天上的样子
// 仓库里的默认参数是一个中性的日期；真实的日期放在 refer/那一天/props.json（不入库），渲染时用 --props 传进来
import { zColor, zTextarea } from "@remotion/zod-types";
import { z } from "zod";

export const asset = (path: string) => `that-day/${path}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const MUSIC = asset("audio/bgm.wav");
export const FONT = "Day Song";

export const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "写成 YYYY-MM-DD"),
  city: z.string(),
  // 纬度只到 ±65 度：再往两极去会有极昼极夜，天空那一段的画法不适用
  lat: z.number().min(-65).max(65),
  lon: z.number().min(-180).max(180),
  utcOffset: z.number().min(-12).max(14),
  name: z.string(),
  message: zTextarea(),
  // 「从那天到现在」量到哪一天为止
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "写成 YYYY-MM-DD"),
  accent: zColor(),
});

export type Props = z.infer<typeof schema>;

export const COLORS = {
  ink: "#0d1018",
  cream: "#f1e7d3",
  soft: "rgba(241, 231, 211, 0.62)",
  faint: "rgba(241, 231, 211, 0.3)",
  sun: "#fff3d6",
  moon: "#f4efe2",
};

// 各段的起点（秒）；最后一段的长短随留言的字数变
export const PARTS = {
  title: 0,
  sky: 6,
  moon: 27,
  year: 38,
  orbit: 48,
  card: 57,
};

export const cardSeconds = (message: string) =>
  5 + Math.min(6, [...message].length * 0.18);
export const totalSeconds = (message: string) =>
  PARTS.card + cardSeconds(message);
