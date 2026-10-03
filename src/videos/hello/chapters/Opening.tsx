// 开场：有人在对话框里敲下「介绍一下你自己？」，思考的火花落到地上，长出小家伙，自报家门，亮出片名
import { fitText } from "@remotion/layout-utils";
import { evolvePath } from "@remotion/paths";
import { makeCircle, makeStar, makeTriangle } from "@remotion/shapes";
import React from "react";
import { random } from "remotion";
import { Pose, REST, Spark } from "../Buddy";
import { clamp, EASE, hop, jelly, mix, pop, ramp, settle } from "../motion";
import { Paper } from "../Paper";
import { C, GROUND, HEIGHT, TEXT, WIDTH } from "../theme";

// 这一段的时间表（秒）
const T = {
  box: 0.3,
  type: 0.95,
  send: 2.75,
  think: 3.15,
  fly: 4.5,
  land: 4.95,
  hello: 5.75,
  exact: 8.0,
  tag: 8.75,
  tagOff: 10.3,
  hop: 10.75,
  title: 11.2,
};

const QUESTION = "介绍一下你自己？";
const TYPE_PACE = 0.17;
const HOP_SECONDS = 0.5;
const HOME_X = 960;
const SIDE_X = 470;

// 思考时火花待的位置，和它落地的抛物线
const THINK = { x: 500, y: 560 };
const flight = (t: number) => {
  const p = ramp(t, T.fly, T.land, EASE.soft);
  return {
    x: mix(THINK.x, HOME_X, p),
    y: mix(THINK.y, GROUND - 4, p) - 190 * 4 * p * (1 - p) * 0.5,
  };
};

export const pose = (t: number): Pose => {
  if (t < T.land) return { ...REST, x: HOME_X, opacity: 0, scale: 0 };
  const born = jelly(t, T.land);
  const jump = hop(t, T.hop, HOP_SECONDS, 170);
  const lookTag =
    ramp(t, T.tag - 0.1, T.tag + 0.25) -
    ramp(t, T.tagOff - 0.5, T.tagOff - 0.1);
  const lookTitle = ramp(t, T.title, T.title + 0.4);
  // 落地后火花先保持「图标大小」被顶起来，在头顶停一会儿再收掉
  const sparkSize =
    mix(
      Math.min(9, 26 / (36 * Math.max(born.scale, 0.02))),
      1,
      ramp(t, T.land + 0.3, T.land + 0.9),
    ) *
    (1 - ramp(t, T.land + 1.05, T.land + 1.35, EASE.in));
  const cheer =
    ramp(t, T.land + 0.25, T.land + 0.5) - ramp(t, T.hello - 0.2, T.hello);
  return {
    ...REST,
    x: mix(HOME_X, SIDE_X, jump.p),
    scale: born.scale,
    squash: born.squash + jump.squash,
    lift: jump.lift,
    tilt: -7 * Math.sin(jump.p * Math.PI),
    lean:
      0.9 * Math.sin(jump.p * Math.PI) +
      0.5 * (1 - ramp(t, T.land, T.land + 0.6)),
    lookX: 0.75 * lookTag + 0.8 * lookTitle,
    lookY: -0.7 * lookTag - 0.25 * lookTitle,
    wave:
      ramp(t, T.hello - 0.2, T.hello + 0.15) -
      ramp(t, T.hello + 1.5, T.hello + 1.85),
    spin: 40 * (t - T.land) + 360 * EASE.out(clamp((t - T.land) / 0.9)),
    glow: 1 - ramp(t, T.land, T.land + 1),
    sparkSize,
    mood:
      cheer > 0.5
        ? "happy"
        : lookTag > 0.5 && t < T.tag + 0.9
          ? "wow"
          : "smile",
  };
};

const CONFETTI = [
  makeCircle({ radius: 10 }).path,
  makeStar({ points: 5, innerRadius: 6, outerRadius: 13, cornerRadius: 2 })
    .path,
  makeTriangle({ length: 22, direction: "up", cornerRadius: 4 }).path,
];
const CONFETTI_COLORS = [C.lemon, C.mint, C.lilac, C.sky, C.coral];

const Arrow: React.FC = () => (
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
);

// 对话框那一页：问候、输入条、发出去的气泡、「想一想」
const Chat: React.FC<{ t: number }> = ({ t }) => {
  const typed = clamp(
    Math.floor((t - T.type) / TYPE_PACE) + 1,
    0,
    [...QUESTION].length,
  );
  const sent = t >= T.send;
  const leave = ramp(t, T.fly + 0.1, T.fly + 0.75, EASE.in);
  if (leave >= 1) return null;
  const press = 1 - 0.16 * Math.sin(clamp((t - T.send + 0.12) / 0.3) * Math.PI);
  const caret =
    Math.floor(t * 2.2) % 2 === 0 || (t > T.type && t < T.send - 0.3);
  const bubble = pop(t, T.send);
  const thinking = pop(t, T.think) * (1 - ramp(t, T.fly - 0.1, T.fly + 0.05));
  // 小家伙要出来了，这一页的东西先后掉下去
  const fall = (delay: number) =>
    ramp(t, T.fly - 0.12 + delay, T.fly + 0.36 + delay, EASE.in);

  return (
    <div
      style={{ position: "absolute", inset: 0, fontFamily: TEXT, color: C.ink }}
    >
      {/* 问候 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: WIDTH,
          top: mix(396, 250, settle(t, T.send, 0.5)),
          textAlign: "center",
          fontSize: 62,
          opacity: clamp(pop(t, T.box)) * (1 - ramp(t, T.send, T.send + 0.3)),
        }}
      >
        今天想聊点什么？
      </div>

      {/* 发出去的问题 */}
      <div
        style={{
          position: "absolute",
          right: 420,
          top: 398,
          padding: "22px 40px",
          borderRadius: "44px 44px 12px 44px",
          background: C.coralLight,
          border: `6px solid ${C.ink}`,
          boxShadow: "0 8px 0 rgba(58, 42, 38, 0.14)",
          fontSize: 50,
          transformOrigin: "100% 100%",
          transform: `scale(${bubble})`,
          opacity: sent ? 1 - fall(0.06) : 0,
          translate: `0px ${fall(0.06) * 700}px`,
        }}
      >
        {QUESTION}
      </div>

      {/* 想一想 */}
      <div
        style={{
          position: "absolute",
          left: THINK.x + 46,
          top: THINK.y - 34,
          display: "flex",
          gap: 14,
          alignItems: "center",
          fontSize: 44,
          opacity: clamp(thinking),
          transform: `scale(${0.6 + 0.4 * thinking})`,
          transformOrigin: "0% 50%",
        }}
      >
        <span>想一想</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: C.ink,
              transform: `translateY(${-12 * Math.max(0, Math.sin((t - T.think) * 7 - i * 0.9))}px)`,
            }}
          />
        ))}
      </div>

      {/* 输入条 */}
      <div
        style={{
          position: "absolute",
          left: (WIDTH - 1080) / 2,
          top: mix(520, 720, settle(t, T.send, 0.5)),
          width: 1080,
          height: 118,
          borderRadius: 59,
          background: C.white,
          border: `6px solid ${C.ink}`,
          boxShadow: "0 10px 0 rgba(58, 42, 38, 0.16)",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          padding: "0 16px 0 46px",
          fontSize: 52,
          transform: `scale(${pop(t, T.box)})`,
          opacity: 1 - fall(0),
          translate: `0px ${fall(0) * 700}px`,
        }}
      >
        <span style={{ whiteSpace: "pre" }}>
          {sent ? "" : [...QUESTION].slice(0, typed).join("")}
        </span>
        <span
          style={{
            width: 5,
            height: 56,
            marginLeft: 6,
            borderRadius: 3,
            background: C.coral,
            opacity: caret ? 1 : 0,
          }}
        />
        <span style={{ flex: 1 }} />
        <span
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            background: typed > 0 && !sent ? C.coral : C.coralLight,
            border: `6px solid ${C.ink}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${press})`,
          }}
        >
          <Arrow />
        </span>
      </div>
    </div>
  );
};

// 型号牌：从上面吊下来，晃两下
const Tag: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.tag - 0.05 || t > T.tagOff + 0.6) return null;
  const down = pop(t, T.tag, 0.8) - ramp(t, T.tagOff, T.tagOff + 0.45, EASE.in);
  const swing = 13 * Math.exp(-(t - T.tag) * 2.1) * Math.cos((t - T.tag) * 6.5);
  return (
    <div
      style={{
        position: "absolute",
        left: 1330,
        top: -460 + 460 * down,
        transformOrigin: "50% 0%",
        transform: `rotate(${swing}deg)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: TEXT,
        color: C.ink,
      }}
    >
      <div
        style={{ width: 6, height: 250, background: C.ink, borderRadius: 3 }}
      />
      <div
        style={{
          marginTop: -6,
          padding: "20px 46px 24px",
          borderRadius: 34,
          background: C.white,
          border: `6px solid ${C.ink}`,
          boxShadow: "0 10px 0 rgba(58, 42, 38, 0.16)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 34, opacity: 0.6, letterSpacing: 6 }}>型号</div>
        <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1.1 }}>
          Opus <span style={{ color: C.coral }}>5.5</span>
        </div>
      </div>
    </div>
  );
};

// 片名
const Title: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.title) return null;
  const big = "我是 Claude";
  const box = 900;
  const { fontSize } = fitText({
    text: big,
    withinWidth: box,
    fontFamily: TEXT,
    fontWeight: "700",
  });
  const size = Math.min(fontSize, 190);
  const squiggle =
    "M 6 20 Q 40 2 78 18 T 150 18 T 222 18 T 294 18 T 366 18 T 438 16";
  const drawn = evolvePath(
    ramp(t, T.title + 0.75, T.title + 1.4, EASE.out),
    squiggle,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 800,
        top: 330,
        width: box,
        fontFamily: TEXT,
        color: C.ink,
      }}
    >
      <div style={{ fontSize: 96, display: "flex" }}>
        {[..."你好，"].map((char, i) => {
          const k = pop(t, T.title + i * 0.07, 1.3);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - k) * 50}px) scale(${k})`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1.12,
          display: "flex",
          whiteSpace: "pre",
        }}
      >
        {[...big].map((char, i) => {
          const k = pop(t, T.title + 0.22 + i * 0.055, 1.3);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: i >= 3 ? C.coral : C.ink,
                transform: `translateY(${(1 - k) * 70}px) scale(${k})`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
      <svg
        width={460}
        height={40}
        style={{ marginTop: 6, overflow: "visible" }}
      >
        <path
          d={squiggle}
          stroke={C.lemon}
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={drawn.strokeDasharray}
          strokeDashoffset={drawn.strokeDashoffset}
        />
      </svg>
      <div
        style={{
          marginTop: 20,
          fontSize: 46,
          opacity: ramp(t, T.title + 1.0, T.title + 1.4),
          translate: `0px ${(1 - ramp(t, T.title + 1.0, T.title + 1.5, EASE.out)) * 24}px`,
        }}
      >
        一段自己写、自己画的自我介绍
      </div>
    </div>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => {
  const spot = flight(t);
  const burst = ramp(t, T.land, T.land + 0.85, EASE.out);
  return (
    <>
      <Paper
        t={t}
        floor={settle(t, T.fly + 0.15, 0.9)}
        bits={0.35 + 0.65 * ramp(t, T.fly, T.land + 0.5)}
      />
      <Chat t={t} />
      <Tag t={t} />
      <Title t={t} />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* 思考时转着的火花，想好了就跳到地上 */}
        {t >= T.think - 0.05 && t < T.land ? (
          <Spark
            x={spot.x}
            y={spot.y}
            size={26 * clamp(pop(t, T.think))}
            spin={(t - T.think) * 300}
            glow={0.5 + 0.5 * Math.sin((t - T.think) * 6)}
          />
        ) : null}
        {/* 落地的一圈和迸出来的小图形 */}
        {t >= T.land && burst < 1 ? (
          <g transform={`translate(${HOME_X} ${GROUND - 120})`}>
            <circle
              r={40 + 300 * burst}
              fill="none"
              stroke={C.lemon}
              strokeWidth={22 * (1 - burst)}
              opacity={1 - burst}
            />
            {Array.from({ length: 14 }, (_, i) => {
              const angle =
                (i / 14) * Math.PI * 2 + random(`burst-a-${i}`) * 0.4;
              const reach = (250 + random(`burst-d-${i}`) * 190) * burst;
              const fall = 150 * burst * burst;
              return (
                <g
                  key={i}
                  transform={`translate(${Math.cos(angle) * reach} ${Math.sin(angle) * reach * 0.8 + fall}) rotate(${
                    burst * 300 * (i % 2 ? 1 : -1)
                  }) scale(${(1.1 + random(`burst-s-${i}`) * 0.8) * (1 - burst ** 3)})`}
                >
                  <path
                    d={CONFETTI[i % CONFETTI.length]}
                    transform="translate(-11 -11)"
                    fill={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                    stroke={C.ink}
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>
        ) : null}
      </svg>
    </>
  );
};
