// 这支片子：镜头退出来，原来小家伙站在一个编辑器的预览窗里。左边是代码，下面是时间线和配乐的波形
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React from "react";
import { BuddyG, Pose, REST } from "../Buddy";
import { clamp, EASE, hop, mix, pop, ramp } from "../motion";
import { Paper } from "../Paper";
import { Pop, sticker } from "../stickers";
import { asset, C, FPS, GROUND, MONO, TEXT, WIDTH } from "../theme";
import { SECONDS, STARTS, TOTAL } from "../timeline";

const T = { win: 0.3, code: 2.4, wave: 6.2, out: 9.3, cards: 9.7, self: 13.0 };
const HERE = STARTS[6];
// 预览窗里小家伙站的位置
const STAGE = { x: 1335, y: 470, size: 78 };
const CHAPTER_NAMES = [
  "开场",
  "我是什么",
  "一路长大",
  "一家四口",
  "我",
  "老实交代",
  "这支片子",
  "再见",
];
const CHAPTER_COLORS = [
  C.coral,
  C.mint,
  C.sky,
  C.lemon,
  C.coralLight,
  C.lilac,
  C.coral,
  C.mint,
];
const EPISODES = [
  "日常",
  "云",
  "仰望",
  "光",
  "雨",
  "手帐",
  "河",
  "汉字",
  "那一天",
];
const EPISODE_COLORS = [
  C.lemon,
  C.sky,
  C.lilac,
  "#5B6BB5",
  C.mint,
  "#F7A8B8",
  "#4FAE8E",
  C.coralLight,
  "#8E7CC3",
];

// 左边的代码：就是开场里让小家伙「长出来、跳一下」的那几行。每个片段带一个颜色
const CODE: [string, string][][] = [
  [
    ["export const ", C.lilac],
    ["pose", C.lemon],
    [" = (t) => {", C.white],
  ],
  [
    ["  const ", C.lilac],
    ["born", C.white],
    [" = ", C.white],
    ["jelly", C.lemon],
    ["(t, T.land);", C.white],
  ],
  [
    ["  const ", C.lilac],
    ["jump", C.white],
    [" = ", C.white],
    ["hop", C.lemon],
    ["(t, T.hop, ", C.white],
    ["0.5", C.coralLight],
    [", ", C.white],
    ["170", C.coralLight],
    [");", C.white],
  ],
  [
    ["  return ", C.lilac],
    ["{", C.white],
  ],
  [
    ["    x: ", C.sky],
    ["mix", C.lemon],
    ["(", C.white],
    ["960", C.coralLight],
    [", ", C.white],
    ["470", C.coralLight],
    [", jump.p),", C.white],
  ],
  [
    ["    lift: ", C.sky],
    ["jump.lift,", C.white],
  ],
  [
    ["    squash: ", C.sky],
    ["born.squash + jump.squash,", C.white],
  ],
  [
    ["    mood: ", C.sky],
    ["cheer > ", C.white],
    ["0.5", C.coralLight],
    [" ? ", C.white],
    ['"happy"', C.mint],
    [" : ", C.white],
    ['"smile"', C.mint],
    [",", C.white],
  ],
  [["  };", C.white]],
  [["};", C.white]],
];
const CODE_LENGTH = CODE.reduce(
  (sum, line) => sum + line.reduce((n, [text]) => n + text.length, 0),
  0,
);

export const pose = (t: number): Pose => {
  const jump = hop(t, T.out, 0.55, 210);
  const puzzled =
    ramp(t, T.wave + 0.3, T.wave + 0.6) - ramp(t, T.out - 0.5, T.out - 0.2);
  const mine = ramp(t, T.self + 0.3, T.self + 0.6);
  const inWindow = ramp(t, 0, 0.7, EASE.inOut);
  return {
    ...REST,
    x: mix(mix(960, STAGE.x, inWindow), 960, jump.p),
    y: mix(mix(GROUND, STAGE.y, inWindow), GROUND + 20, jump.p),
    size: mix(mix(150, STAGE.size, inWindow), 140, jump.p),
    lift: jump.lift,
    squash: jump.squash,
    tilt: puzzled * 9,
    lookX: -0.6 * (1 - jump.p) * (1 - puzzled),
    lookY: 0.3 * puzzled - 0.6 * (ramp(t, T.cards, T.cards + 0.3) - mine),
    spin: t * 160,
    glow: 0.4,
    sparkSize: 0,
    wave: mine - ramp(t, T.self + 2, T.self + 2.3),
    mood: puzzled > 0.5 ? "think" : mine > 0.5 ? "happy" : "smile",
  };
};

// 配乐的波形：从这一刻的声音里读出各个频段的大小
const Wave: React.FC<{ t: number }> = ({ t }) => {
  const audio = useAudioData(asset("audio/bgm.wav"));
  if (!audio) return null;
  const bars = visualizeAudio({
    audioData: audio,
    frame: Math.round((HERE + t) * FPS),
    fps: FPS,
    numberOfSamples: 64,
    optimizeFor: "speed",
  });
  const grow = ramp(t, T.wave, T.wave + 0.5, EASE.out);
  return (
    <svg width={1500} height={64} viewBox="0 0 1500 64">
      {bars.slice(0, 50).map((v, i) => {
        const h = clamp(v ** 0.4 * 2.2, 0.06, 1) * 60 * grow;
        return (
          <rect
            key={i}
            x={i * 30}
            y={64 - h}
            width={20}
            height={h}
            rx={6}
            fill={i % 2 ? C.lemon : C.coralLight}
          />
        );
      })}
    </svg>
  );
};

const Editor: React.FC<{ t: number }> = ({ t }) => {
  const show = pop(t, T.win, 0.7);
  const dim = ramp(t, T.out, T.out + 0.5);
  const typed = Math.floor(
    CODE_LENGTH * ramp(t, T.code, T.code + 3.2, (v) => v),
  );
  const now = HERE + t;
  let used = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 50,
        width: 1640,
        height: 830,
        overflow: "hidden",
        transform: `scale(${0.9 + 0.1 * show}) translateY(${dim * -30}px)`,
        opacity: clamp(show * 2) * (1 - 0.72 * dim),
        fontFamily: TEXT,
        color: C.ink,
        ...sticker(40, "#FFFDF7"),
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          height: 66,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 26px",
          borderBottom: `6px solid ${C.ink}`,
          background: C.lemon,
          fontSize: 34,
        }}
      >
        {[C.coral, C.white, C.mint].map((color) => (
          <span
            key={color}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              background: color,
              border: `4px solid ${C.ink}`,
            }}
          />
        ))}
        <span style={{ marginLeft: 16 }}>video-studio</span>
        <span style={{ opacity: 0.55, fontFamily: MONO, fontSize: 28 }}>
          src/videos/hello/chapters/Opening.tsx
        </span>
      </div>
      {/* 左：代码 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 72,
          width: 850,
          height: 520,
          background: C.ink,
          padding: "26px 30px",
          boxSizing: "border-box",
          fontFamily: MONO,
          fontSize: 28,
          lineHeight: 1.62,
          whiteSpace: "pre",
        }}
      >
        {CODE.map((line, row) => (
          <div key={row}>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>
              {String(row + 41).padStart(3, " ")}{" "}
            </span>
            {line.map(([text, color], k) => {
              const visible = clamp(typed - used, 0, text.length);
              used += text.length;
              return (
                <span key={k} style={{ color }}>
                  {text.slice(0, visible)}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {/* 右：预览 */}
      <div
        style={{
          position: "absolute",
          left: 850,
          top: 72,
          width: 778,
          height: 520,
          borderLeft: `6px solid ${C.ink}`,
          overflow: "hidden",
          background: C.paper,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -160,
            top: 330,
            width: 1100,
            height: 500,
            borderRadius: "50%",
            background: C.floor,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 18,
            padding: "4px 20px",
            fontSize: 30,
            ...sticker(22),
            borderWidth: 4,
          }}
        >
          预览
        </div>
        <div
          style={{
            position: "absolute",
            right: 22,
            top: 18,
            padding: "4px 20px",
            fontFamily: MONO,
            fontSize: 26,
            ...sticker(22, C.lemon),
            borderWidth: 4,
          }}
        >
          第 {Math.round(now * FPS)} / {Math.round(TOTAL * FPS)} 帧
        </div>
      </div>
      {/* 下：时间线 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 592,
          width: 1628,
          height: 226,
          borderTop: `6px solid ${C.ink}`,
          background: "#F7EFE0",
          padding: "20px 60px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "relative", height: 62 }}>
          {SECONDS.map((seconds, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (STARTS[i] / TOTAL) * 1500,
                width: (seconds / TOTAL) * 1500 - 6,
                height: 58,
                borderRadius: 14,
                background: CHAPTER_COLORS[i],
                border: `4px solid ${C.ink}`,
                boxSizing: "border-box",
                fontSize: 26,
                lineHeight: "50px",
                textAlign: "center",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {CHAPTER_NAMES[i]}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, height: 64 }}>
          {t >= T.wave ? <Wave t={t} /> : null}
        </div>
        <div
          style={{
            position: "absolute",
            left: 60 + (now / TOTAL) * 1500 - 4,
            top: 8,
            width: 8,
            height: 200,
            borderRadius: 4,
            background: C.coralDeep,
          }}
        />
      </div>
    </div>
  );
};

// 前九期各一张小卡片，加上这一期
const Episodes: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.cards) return null;
  const away = ramp(t, T.self, T.self + 0.45, EASE.in);
  const mine = ramp(t, T.self, T.self + 0.6, EASE.inOut);
  return (
    <>
      {EPISODES.map((name, i) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: 170 + i * 162,
            top: 230 + (i % 2) * 26 + away * 900,
            width: 146,
            height: 176,
            transform: `rotate(${(i % 2 ? 3 : -3) + away * (i % 2 ? 40 : -40)}deg) scale(${pop(t, T.cards + i * 0.1)})`,
            textAlign: "center",
            fontFamily: TEXT,
            color: C.ink,
            ...sticker(24),
          }}
        >
          <div
            style={{
              height: 84,
              margin: 10,
              borderRadius: 12,
              background: EPISODE_COLORS[i],
              border: `4px solid ${C.ink}`,
              fontSize: 54,
              fontWeight: 700,
              lineHeight: "80px",
              color: C.white,
            }}
          >
            {i + 1}
          </div>
          <div style={{ fontSize: 34 }}>{name}</div>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: mix(170 + 9 * 162, WIDTH / 2 - 120, mine),
          top: mix(256, 170, mine),
          width: mix(146, 240, mine),
          height: mix(176, 290, mine),
          transform: `rotate(${mix(3, -4, mine)}deg) scale(${pop(t, T.cards + 0.9, 1.3)})`,
          textAlign: "center",
          fontFamily: TEXT,
          color: C.ink,
          ...sticker(mix(24, 36, mine), C.lemon),
        }}
      >
        <div
          style={{
            height: mix(84, 150, mine),
            margin: 10,
            borderRadius: 12,
            background: C.paper,
            border: `4px solid ${C.ink}`,
            overflow: "hidden",
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 200 130">
            <BuddyG
              t={t}
              pose={{
                ...REST,
                x: 100,
                y: 116,
                size: 50,
                wave: 1,
                mood: "happy",
              }}
            />
          </svg>
        </div>
        <div style={{ fontSize: mix(34, 58, mine), fontWeight: 700 }}>10</div>
      </div>
      <Pop
        t={t}
        at={T.self + 0.25}
        x={WIDTH / 2 + 400}
        y={300}
        origin="0% 100%"
        turn={3}
      >
        <div
          style={{
            padding: "22px 44px",
            fontSize: 62,
            whiteSpace: "nowrap",
            ...sticker(44, C.coralLight),
            borderRadius: "44px 44px 44px 12px",
          }}
        >
          这一期，你自己来～
        </div>
      </Pop>
    </>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Paper t={t} />
    <Editor t={t} />
  </>
);

export const Front: React.FC<{ t: number }> = ({ t }) => (
  <>
    {/* 听不见：头顶冒出一个问号 */}
    <Pop
      t={t}
      at={T.wave + 0.5}
      out={T.out - 0.4}
      x={STAGE.x + 96}
      y={STAGE.y - 176}
      turn={12}
      bounce={1.4}
    >
      <div
        style={{
          width: 70,
          height: 70,
          fontSize: 50,
          fontWeight: 700,
          lineHeight: "58px",
          textAlign: "center",
          ...sticker(35, C.lemon),
        }}
      >
        ?
      </div>
    </Pop>
    <Episodes t={t} />
  </>
);
