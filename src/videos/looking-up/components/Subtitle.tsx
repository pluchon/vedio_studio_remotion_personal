// 旁白式字幕：横排压在画面下方，中文逐字洇开，英文随后淡入
import React from "react";
import { Caption } from "../../../shared/Caption";
import { FONTS, Tone } from "../theme";
import { TONES } from "./Ink";

export const Subtitle: React.FC<{ zh: string[]; en: string[]; at: number; out?: number; tone: Tone; stagger?: number }> = ({
  zh,
  en,
  at,
  out,
  tone,
  stagger = 2.2,
}) => (
  <Caption
    zh={zh}
    en={en}
    at={at}
    out={out}
    font={FONTS.song}
    enFont={FONTS.latin}
    color={TONES[tone].text}
    enColor={TONES[tone].soft}
    size={38}
    enSize={21}
    align="center"
    stagger={stagger}
    style={{ left: 0, right: 0, bottom: 54, textShadow: tone === "space" ? "0 0 16px rgba(4, 5, 11, 0.9)" : undefined }}
  />
);
