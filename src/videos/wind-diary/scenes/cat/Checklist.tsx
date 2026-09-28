// 今夜偶遇记录：逐条写上，每条写完打一个勾
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Caption } from "../../components/Caption";
import { EASE_OUT, NIGHT } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const STAGGER = 2.5;

export type ChecklistItem = { zh: string; en: string; at: number };

const Tick: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [at, at + 9], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <svg width={46} height={40} viewBox="0 0 46 40" style={{ marginLeft: 18, overflow: "visible" }}>
      <path
        d="M4 22 C 9 26, 13 31, 17 35 C 24 22, 32 11, 43 3"
        fill="none"
        stroke={NIGHT.lamp}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
    </svg>
  );
};

export const Checklist: React.FC<{ title: string; items: ChecklistItem[]; at: number; out: number; style?: React.CSSProperties }> = ({
  title,
  items,
  at,
  out,
  style,
}) => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [out, out + 14], [1, 0], clamp);

  return (
    <div style={{ position: "absolute", opacity: fadeOut, ...style }}>
      <Caption zh={[title]} at={at} color={NIGHT.textSoft} enColor={NIGHT.textSoft} size={34} style={{ position: "relative", marginBottom: 22 }} />
      {items.map((item) => (
        <div key={item.zh} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Caption zh={[item.zh]} at={item.at} color={NIGHT.text} enColor={NIGHT.textSoft} size={48} stagger={STAGGER} style={{ position: "relative" }} />
            <Tick at={item.at + [...item.zh].length * STAGGER + 4} />
          </div>
          <Caption zh={[]} en={[item.en]} at={item.at + 6} color={NIGHT.text} enColor={NIGHT.textSoft} enSize={22} style={{ position: "relative", marginTop: -14 }} />
        </div>
      ))}
    </div>
  );
};
