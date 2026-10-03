// 字幕条：底部一个圆角条，左边是小家伙的头像，字一个一个蹦出来
// 它和对话框是同一个东西：开场时对话框落下来变成它，结尾时它再变回对话框
import { measureText } from "@remotion/layout-utils";
import React from "react";
import { BuddyG, REST } from "./Buddy";
import { clamp, EASE, mix, pop, ramp } from "./motion";
import { C, FONT_ZH, HEIGHT, KAO, TEXT, WIDTH } from "./theme";
import {
  HANDOFF,
  LEAD,
  lineGone,
  LINES,
  PAGES,
  SPANS,
  talkAt,
} from "./timeline";

const SIZE = 56;
const BAR_TOP = HEIGHT - 150;
const IDLE = 250;
const BOX = { width: 1080, height: 118 };

const widths = new Map<number, number>();
const widthOf = (index: number) => {
  let hit = widths.get(index);
  if (hit === undefined) {
    hit =
      measureText({
        text: LINES[index].text,
        fontFamily: TEXT,
        fontSize: SIZE,
        fontWeight: "600",
      }).width + 130;
    widths.set(index, hit);
  }
  return hit;
};

export const SpeechBar: React.FC<{ t: number }> = ({ t }) => {
  if (t < HANDOFF.fly) return null;
  const span = SPANS.find((s) => t >= s.from && t < s.to + 0.3);
  if (!span) return null;
  const opening = 1 - ramp(t, HANDOFF.fly, HANDOFF.fly + 0.75, EASE.inOut);
  const closing = ramp(t, HANDOFF.box, HANDOFF.box + 0.7, EASE.inOut);
  const form = Math.max(opening, closing);
  const shown =
    (span.from === HANDOFF.fly ? 1 : pop(t, span.from, 0.9)) -
    ramp(t, span.to, span.to + 0.25);

  // 现在说到第几句；条的宽度从上一句的宽度弹到这一句的宽度
  let index = -1;
  for (let i = span.first; i <= span.last; i++) {
    if (t >= LINES[i].at - LEAD) index = i;
  }
  const before = index > span.first ? widthOf(index - 1) : IDLE;
  const width =
    index < 0
      ? IDLE
      : mix(before, widthOf(index), pop(t, LINES[index].at - LEAD, 0.75));
  const line = index >= 0 ? LINES[index] : null;
  const next = index >= 0 && index < span.last ? LINES[index + 1] : null;
  const ink = line
    ? (1 - ramp(t, lineGone(line), lineGone(line) + 0.2)) *
      (next ? 1 - ramp(t, next.at - LEAD - 0.1, next.at - LEAD + 0.05) : 1)
    : 0;
  const speaking = line !== null && t >= line.at && ink > 0;
  const waiting = clamp(1 - form * 4) * (speaking ? 0 : 1);
  const caret = Math.floor(t * 2.2) % 2 === 0;
  const wide = mix(width, BOX.width, form);

  return (
    <div
      style={{
        position: "absolute",
        left: WIDTH / 2 - wide / 2,
        top:
          opening > 0 ? mix(BAR_TOP, 720, opening) : mix(BAR_TOP, 904, closing),
        width: wide,
        height: mix(96, BOX.height, form),
        transform: `scale(${shown})`,
        transformOrigin: "50% 100%",
        opacity: clamp(shown * 1.6),
        borderRadius: 60,
        background: C.white,
        border: `6px solid ${C.ink}`,
        boxShadow: "0 9px 0 rgba(58, 42, 38, 0.16)",
        boxSizing: "border-box",
        fontFamily: TEXT,
        color: C.ink,
      }}
    >
      {/* 头像 */}
      <div
        style={{
          position: "absolute",
          left: -34,
          top: -18,
          width: 96,
          height: 96,
          borderRadius: 48,
          background: C.lemon,
          border: `6px solid ${C.ink}`,
          boxSizing: "border-box",
          overflow: "hidden",
          transform: `scale(${(1 - form) * pop(t, HANDOFF.fly + 0.55, 1.2)}) rotate(-8deg)`,
        }}
      >
        <svg width={84} height={84} viewBox="0 0 84 84">
          <BuddyG
            t={t}
            pose={{
              ...REST,
              x: 42,
              y: 72,
              size: 27,
              talk: talkAt(t),
              mood: speaking ? "happy" : "smile",
            }}
          />
        </svg>
      </div>

      {/* 正在说的这句话 */}
      {line && ink > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 34,
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: SIZE,
            fontWeight: 600,
            whiteSpace: "pre",
            opacity: ink * (1 - form),
          }}
        >
          {PAGES[index].tokens.map((token, i) => {
            const born = token.fromMs / 1000;
            const k = pop(t, born, 1.3);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily:
                    token.text.trim().charCodeAt(0) >= 0x2e80
                      ? `"${FONT_ZH}"`
                      : TEXT,
                  opacity: t >= born ? 1 : 0,
                  transform: `translateY(${(1 - k) * 22}px) scale(${0.5 + 0.5 * k})`,
                }}
              >
                {token.text}
              </span>
            );
          })}
        </div>
      ) : null}

      {/* 还没开口：三个点一跳一跳 */}
      {waiting > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 34,
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            opacity: waiting,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                background: C.ink,
                opacity: 0.55,
                transform: `translateY(${-11 * Math.max(0, Math.sin(t * 7 - i * 0.9))}px)`,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* 对话框的样子：光标、提示语、发送键 */}
      {form > 0.01 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 10px 0 46px",
            fontSize: 52,
            opacity: form,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              width: 5,
              height: 56,
              marginRight: 12,
              flexShrink: 0,
              borderRadius: 3,
              background: C.coral,
              opacity: caret ? 1 : 0,
            }}
          />
          {closing > 0 ? (
            <span style={{ opacity: 0.42, whiteSpace: "nowrap" }}>
              还想问点什么？
              <span style={{ fontFamily: KAO, fontSize: 44 }}> (・ω・)ノ</span>
            </span>
          ) : null}
          <span style={{ flex: 1 }} />
          <span
            style={{
              width: 84,
              height: 84,
              flexShrink: 0,
              borderRadius: 42,
              background: C.coralLight,
              border: `6px solid ${C.ink}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={44} height={44} viewBox="0 0 44 44">
              <path
                d="M 22 35 L 22 10 M 11 20 L 22 9 L 33 20"
                stroke={C.white}
                strokeWidth={6.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
        </div>
      ) : null}
    </div>
  );
};
