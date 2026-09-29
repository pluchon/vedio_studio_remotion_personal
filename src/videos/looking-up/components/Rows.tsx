// 一行行显现的记录：左边标签、右边数值，像参考图里一行行跳出来的二进制；数值先乱跳几帧再定下来
import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { inkIn } from "../../../shared/Caption";
import { EASE_OUT, FONTS } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ARABIC = "0123456789";
const HAN = "一二三四五六七八九〇";

// 定下来之前，数值里的数字随机跳：阿拉伯数字只换阿拉伯数字，汉字数字只换汉字数字
const scramble = (text: string, frame: number, settleAt: number, seed: string) => {
  if (frame >= settleAt) return text;
  const pick = (set: string, i: number) => set[Math.floor(random(`${seed}-${i}-${Math.floor(frame / 2)}`) * set.length)];
  return [...text].map((c, i) => (ARABIC.includes(c) ? pick(ARABIC, i) : HAN.includes(c) ? pick(HAN, i) : c)).join("");
};

export type Row = { label: string; value?: string; at: number; color?: string };

export const Rows: React.FC<{
  rows: Row[];
  left: number;
  top: number;
  // 标签列宽，数值从这里开始
  labelWidth?: number;
  step?: number;
  size?: number;
  color: string;
  soft: string;
  out?: number;
}> = ({ rows, left, top, labelWidth = 320, step = 62, size = 34, color, soft, out }) => {
  const frame = useCurrentFrame();
  const o = out === undefined ? 1 : interpolate(frame, [out, out + 14], [1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left, top, opacity: o }}>
      {rows.map((r, i) => {
        if (frame < r.at) return null;
        const slide = interpolate(frame, [r.at, r.at + 12], [18, 0], { ...clamp, easing: EASE_OUT });
        return (
          <div key={i} style={{ position: "absolute", top: i * step, whiteSpace: "nowrap", translate: `${slide}px 0` }}>
            <span style={{ fontFamily: FONTS.song, fontSize: size * 0.7, letterSpacing: "0.14em", color: soft, ...inkIn(frame, r.at, 10) }}>{r.label}</span>
            {r.value && (
              <span
                style={{
                  position: "absolute",
                  left: labelWidth,
                  fontFamily: FONTS.songBlack,
                  fontSize: size,
                  letterSpacing: "0.06em",
                  color: r.color ?? color,
                  top: -size * 0.22,
                  ...inkIn(frame, r.at + 4, 10),
                }}
              >
                {scramble(r.value, frame, r.at + 14, `row-${i}`)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
