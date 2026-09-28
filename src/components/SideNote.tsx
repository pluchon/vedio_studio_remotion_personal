// 图版右侧的旁注：图号、标题、说明与要点标签
import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { enter } from "./motion";

export const SideNote: React.FC<{
  fig: string;
  title: string;
  desc: string;
  chips?: string[];
  children?: React.ReactNode;
}> = ({ fig, title, desc, chips = [], children }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: 1320,
        top: 225,
        width: 520,
        height: 658,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.latin,
          fontStyle: "italic",
          fontSize: 28,
          color: COLORS.muted,
          letterSpacing: "0.08em",
          ...enter(frame, 8),
        }}
      >
        {fig}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: FONTS.serif,
          fontSize: 84,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: "0.08em",
          lineHeight: 1.15,
          ...enter(frame, 14),
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 28, width: 64, height: 3, backgroundColor: COLORS.cinnabar, ...enter(frame, 20) }} />
      <div
        style={{
          marginTop: 28,
          fontFamily: FONTS.serif,
          fontSize: 38,
          lineHeight: 1.7,
          color: COLORS.text,
          whiteSpace: "pre-line",
          ...enter(frame, 26),
        }}
      >
        {desc}
      </div>
      {chips.length > 0 && (
        <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 14, ...enter(frame, 34) }}>
          {chips.map((chip) => (
            <span
              key={chip}
              style={{
                fontFamily: FONTS.serif,
                fontSize: 28,
                color: COLORS.moss,
                padding: "6px 18px",
                border: `1px solid rgba(53, 68, 53, 0.35)`,
                borderRadius: 999,
                backgroundColor: "rgba(251, 248, 241, 0.7)",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
};
