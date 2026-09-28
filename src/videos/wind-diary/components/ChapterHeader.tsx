// 章节抬头：像日记的开头，只写第几则、天气与时辰，不写日期
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Caption } from "./Caption";
import { EASE_IN_OUT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ChapterHeader: React.FC<{
  numeral: string;
  title: string;
  weather: string;
  en: string;
  out: number;
  color: string;
  softColor: string;
}> = ({ numeral, title, weather, en, out, color, softColor }) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [22, 46], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const fade = interpolate(frame, [out, out + 14], [1, 0], clamp);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", opacity: fade }}>
      <Caption
        zh={[`${numeral} · ${title}`]}
        at={4}
        color={color}
        enColor={softColor}
        size={78}
        align="center"
        stagger={4}
        style={{ position: "relative" }}
      />
      <svg width={360} height={16} style={{ display: "block", margin: "18px auto 22px" }}>
        <path
          d="M4 9 C 90 4, 180 13, 270 7 S 350 8, 356 6"
          fill="none"
          stroke={softColor}
          strokeWidth={1.6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - line}
        />
      </svg>
      <Caption zh={[weather]} en={[en]} at={34} color={softColor} enColor={softColor} size={36} enSize={24} align="center" style={{ position: "relative" }} />
    </div>
  );
};
