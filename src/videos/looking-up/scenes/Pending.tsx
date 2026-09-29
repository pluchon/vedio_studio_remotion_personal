// 还没做的段落先占位：写上这一段要讲什么，成片从头到尾仍能连着看
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONTS, SPACE } from "../theme";

export const pending = (title: string, lines: string[]): React.FC => {
  const PendingPart: React.FC = () => (
    <AbsoluteFill style={{ backgroundColor: "#15171d", color: SPACE.creamSoft, fontFamily: FONTS.song, padding: "220px 260px" }}>
      <div style={{ fontSize: 44, color: SPACE.cream, letterSpacing: "0.1em" }}>{title}（待做）</div>
      <div style={{ marginTop: 40, fontSize: 28, lineHeight: 1.9 }}>
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
  return PendingPart;
};
