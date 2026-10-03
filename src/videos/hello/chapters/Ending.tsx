// 结尾：一家人出来挥手，彩纸屑落下；最后对话框又回来了，等着下一个问题
import { Lottie } from "@remotion/lottie";
import React from "react";
import { Sequence } from "remotion";
import { BuddyG, Kind, Pose, REST } from "../Buddy";
import { CONFETTI, CONFETTI_FRAMES } from "../confetti";
import { hop, jelly, pop, ramp, settle } from "../motion";
import { Paper } from "../Paper";
import { Pop, sticker } from "../stickers";
import { C, FPS, HEIGHT, TEXT, WIDTH } from "../theme";

const T = { family: 2.2, confetti: 2.5, box: 5.3, credit: 6.5 };
const FAMILY: { kind: Kind; x: number; size: number }[] = [
  { kind: "haiku", x: 200, size: 84 },
  { kind: "sonnet", x: 520, size: 116 },
  { kind: "fable", x: 1500, size: 182 },
];

export const pose = (t: number): Pose => {
  const jump = hop(t, T.confetti, 0.42, 120);
  const again = hop(t, T.credit + 1.6, 0.36, 70);
  const down = ramp(t, T.box, T.box + 0.3) - ramp(t, T.credit, T.credit + 0.4);
  return {
    ...REST,
    lift: jump.lift + again.lift,
    squash: jump.squash + again.squash,
    lookY: 0.7 * down,
    wave:
      ramp(t, T.confetti, T.confetti + 0.25) -
      ramp(t, T.box - 0.5, T.box - 0.2) +
      ramp(t, T.credit + 1.6, T.credit + 1.85),
    mood:
      (t > T.confetti && t < T.box - 0.3) || t > T.credit + 1.6
        ? "happy"
        : "smile",
  };
};

export const Back: React.FC<{ t: number }> = ({ t }) => {
  const caret = Math.floor(t * 2.2) % 2 === 0;
  return (
    <>
      <Paper t={t} />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {FAMILY.map((member, i) => {
          const at = T.family + i * 0.14;
          if (t < at) return null;
          const born = jelly(t, at);
          const cheer = hop(t, T.credit + 1.7 + i * 0.08, 0.34, 56);
          return (
            <BuddyG
              key={member.kind}
              t={t}
              kind={member.kind}
              seed={i + 1}
              pose={{
                ...REST,
                x: member.x,
                size: member.size,
                scale: born.scale,
                squash: born.squash + cheer.squash,
                lift: cheer.lift,
                lookX: member.x < 960 ? 0.4 : -0.4,
                wave: ramp(t, at + 0.3, at + 0.55),
                mood: "happy",
              }}
            />
          );
        })}
      </svg>
      {/* 落款 */}
      <Pop t={t} at={T.credit} x={WIDTH / 2} y={210}>
        <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: 92, fontWeight: 700 }}>
            你好，我是 <span style={{ color: C.coral }}>Claude</span>
          </div>
          <div style={{ fontSize: 42, opacity: 0.66, marginTop: 6 }}>
            画面、配乐、文案：Claude Opus 5.5 · 用 Remotion 一行一行写成
          </div>
        </div>
      </Pop>
      {/* 对话框回来了 */}
      {t >= T.box ? (
        <div
          style={{
            position: "absolute",
            left: (WIDTH - 1080) / 2,
            top: HEIGHT + 20 - 190 * settle(t, T.box, 0.6),
            width: 1080,
            height: 118,
            display: "flex",
            alignItems: "center",
            padding: "0 16px 0 46px",
            fontFamily: TEXT,
            fontSize: 52,
            color: C.ink,
            transform: `scale(${0.9 + 0.1 * pop(t, T.box)})`,
            ...sticker(59),
          }}
        >
          <span
            style={{
              width: 5,
              height: 56,
              marginRight: 10,
              borderRadius: 3,
              background: C.coral,
              opacity: caret ? 1 : 0,
            }}
          />
          <span style={{ opacity: 0.4 }}>还想问点什么？</span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              width: 84,
              height: 84,
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
    </>
  );
};

// 彩纸屑盖在所有人前面
export const Front: React.FC<{ t: number }> = () => (
  <Sequence
    from={Math.round(T.confetti * FPS)}
    durationInFrames={CONFETTI_FRAMES}
  >
    <Lottie
      animationData={CONFETTI}
      style={{ position: "absolute", inset: 0, width: WIDTH, height: HEIGHT }}
    />
  </Sequence>
);
