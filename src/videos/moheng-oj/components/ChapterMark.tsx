// 左上角的章节标记：罗马数字 + 章节名
import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { enter } from "../../../shared/motion";

export const ChapterMark: React.FC<{ numeral: string; label: string }> = ({ numeral, label }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: 66,
        top: 58,
        padding: "14px 40px 14px 30px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        background: "radial-gradient(closest-side, rgba(246, 240, 229, 0.92), rgba(246, 240, 229, 0.75) 70%, rgba(246, 240, 229, 0))",
        ...enter(frame, 4, 24, 12),
      }}
    >
      <span style={{ fontFamily: FONTS.latin, fontStyle: "italic", fontSize: 46, color: COLORS.cinnabar }}>
        {numeral}
      </span>
      <span style={{ width: 1, height: 34, backgroundColor: COLORS.line }} />
      <span
        style={{
          fontFamily: FONTS.serif,
          fontSize: 30,
          letterSpacing: "0.32em",
          color: COLORS.text,
        }}
      >
        {label}
      </span>
    </div>
  );
};
