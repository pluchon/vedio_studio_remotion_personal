// 这支片子：镜头退出来，原来小家伙站在一个编辑器的预览窗里。左边是文件和代码，下面是时间线和配乐的波形；
// 后半段摆出一条胶片，一帧一帧检查，挑出画错的那一帧改好
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React from "react";
import { BuddyG, headTop, Pose, REST, Spark } from "../Buddy";
import { Burst, Emote, Kao, Twinkles } from "../emotes";
import {
  Cam,
  clamp,
  during,
  EASE,
  hop,
  mix,
  pop,
  ramp,
  track,
  jolt,
} from "../motion";
import { Paper } from "../Paper";
import { Mark, Pop, sticker, Tag } from "../stickers";
import { asset, C, FPS, GROUND, HEIGHT, MONO, TEXT, WIDTH } from "../theme";
import { SECONDS, STARTS, TOTAL } from "../timeline";

const T = { win: 0.3, code: 2.4, wave: 6.2, out: 9.3, strip: 9.7, fix: 13.0 };
const HERE = STARTS[6];
// 预览窗里小家伙站的位置
const STAGE = { x: 1385, y: 478, size: 78 };
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
const FILES = [
  { name: "hello", depth: 0, folder: true },
  { name: "Buddy.tsx", depth: 1 },
  { name: "Film.tsx", depth: 1 },
  { name: "script.json", depth: 1 },
  { name: "chapters", depth: 1, folder: true },
  { name: "Opening.tsx", depth: 2, active: true },
  { name: "What.tsx", depth: 2 },
  { name: "GrowUp.tsx", depth: 2 },
  { name: "Family.tsx", depth: 2 },
  { name: "music.py", depth: 1 },
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
    ["glad ? ", C.white],
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

// 胶片上的五帧：第三帧是画错的（落地那一下被拉得太长），后来改好
const SHOTS = [
  { frame: 285, check: 10.3 },
  { frame: 300, check: 10.6 },
  { frame: 305, check: 10.95 },
  { frame: 400, check: 11.25 },
  { frame: 780, check: 11.55 },
];
const STRIP = { x: 250, y: 215, w: 270, h: 150 };

export const pose = (t: number): Pose => {
  const jump = hop(t, T.out, 0.55, 210);
  const puzzled = during(t, T.wave + 0.3, T.out - 0.2, 0.3);
  const inWindow = ramp(t, 0, 0.7, EASE.inOut);
  const shock = during(t, 10.95, 12.4, 0.15);
  const done = hop(t, T.fix + 0.75, 0.36, 90);
  const watch = track(t, [
    [9.9, -0.7],
    [11.6, 0.7],
    [12.2, 0],
  ]);
  return {
    ...REST,
    x: mix(mix(960, STAGE.x, inWindow), 960, jump.p),
    y: mix(mix(GROUND, STAGE.y, inWindow), GROUND + 20, jump.p),
    size: mix(mix(150, STAGE.size, inWindow), 140, jump.p),
    lift: jump.lift + done.lift,
    squash: jump.squash + done.squash,
    tilt:
      puzzled * 9 + shock * Math.sin(t * 30) * 2 * Math.exp(-(t - 10.95) * 3),
    lookX: t < T.out ? -0.6 * (1 - puzzled) : watch,
    lookY: 0.3 * puzzled - 0.8 * ramp(t, T.strip, T.strip + 0.3),
    cheer: during(t, T.fix + 0.8, T.fix + 2.6, 0.25),
    mood:
      puzzled > 0.5
        ? "think"
        : shock > 0.5 && t < 11.7
          ? "wow"
          : shock > 0.5
            ? "squint"
            : t > T.fix + 0.7
              ? "star"
              : "smile",
  };
};

// 镜头：说到「听不见」时凑近预览窗和波形，之后拉回全景
export const camera = (t: number): Cam => ({
  z: track(t, [
    [T.wave - 0.2, 1],
    [T.wave + 0.8, 1.34],
    [T.out - 0.5, 1.34],
    [T.out + 0.4, 1],
  ]),
  fx: 1380,
  fy: 400,
  sx: jolt(t, 10.95, 1.2),
  sy: jolt(t, T.out + 0.55, 0.7) + jolt(t, T.fix + 0.55, 0.5),
});

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
            stroke={C.ink}
            strokeWidth={3}
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
        opacity: clamp(show * 2) * (1 - 0.74 * dim),
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
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: MONO, fontSize: 26, opacity: 0.6 }}>
          1920 × 1080 · 60 帧/秒
        </span>
      </div>
      {/* 最左：文件 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 72,
          width: 250,
          height: 520,
          background: "#4A3833",
          padding: "18px 0",
          boxSizing: "border-box",
          fontFamily: MONO,
          fontSize: 22,
          lineHeight: 1.9,
          color: "rgba(255,255,255,0.72)",
          whiteSpace: "pre",
        }}
      >
        {FILES.map((file, i) => (
          <div
            key={file.name}
            style={{
              paddingLeft: 18 + file.depth * 22,
              background: file.active
                ? "rgba(251, 203, 69, 0.25)"
                : "transparent",
              color: file.active ? C.lemon : undefined,
              opacity: clamp((t - T.win - 0.2 - i * 0.05) * 6),
            }}
          >
            {file.folder ? "▾ " : "  "}
            {file.name}
          </div>
        ))}
      </div>
      {/* 中间：代码 */}
      <div
        style={{
          position: "absolute",
          left: 250,
          top: 72,
          width: 610,
          height: 520,
          background: C.ink,
          padding: "22px 20px",
          boxSizing: "border-box",
          fontFamily: MONO,
          fontSize: 23,
          lineHeight: 1.72,
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
              const last = typed - used > 0 && typed - used <= text.length;
              used += text.length;
              return (
                <span key={k} style={{ color }}>
                  {text.slice(0, visible)}
                  {last && typed < CODE_LENGTH ? (
                    <span style={{ background: C.lemon, color: C.lemon }}>
                      .
                    </span>
                  ) : null}
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
          left: 860,
          top: 72,
          width: 768,
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
                transform: `scaleX(${clamp((t - T.win - 0.3 - i * 0.07) * 5)})`,
                transformOrigin: "0% 50%",
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
        <div
          style={{
            position: "absolute",
            left: 60 + (now / TOTAL) * 1500 - 16,
            top: -2,
            width: 32,
            height: 24,
            borderRadius: "6px 6px 16px 16px",
            background: C.coralDeep,
            border: `4px solid ${C.ink}`,
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
};

// 胶片上的一小格画面
const Shot: React.FC<{ index: number; t: number }> = ({ index, t }) => {
  // 第三帧：一开始被拉得又细又长，改过以后弹回正常
  const fixed = pop(t, T.fix + 0.25, 1.3);
  const mini: Pose = { ...REST, x: 125, y: 124, size: 34 };
  return (
    <svg width={250} height={150} viewBox="0 0 250 150">
      <rect width={250} height={150} fill={C.paper} />
      <ellipse cx={125} cy={176} rx={200} ry={60} fill={C.floor} />
      {index === 0 ? (
        <Spark x={125} y={86} size={24} spin={t * 200} glow={0.7} />
      ) : index === 1 ? (
        <>
          <circle
            cx={125}
            cy={100}
            r={50}
            fill="none"
            stroke={C.lemon}
            strokeWidth={8}
            opacity={0.7}
          />
          <BuddyG t={t} pose={{ ...mini, scale: 0.55 }} />
        </>
      ) : index === 2 ? (
        <BuddyG
          t={t}
          pose={{
            ...mini,
            squash: mix(-0.5, 0, fixed),
            mood: fixed > 0.5 ? "happy" : "smile",
          }}
        />
      ) : index === 3 ? (
        <BuddyG t={t} pose={{ ...mini, wave: 1, mood: "happy" }} />
      ) : (
        <>
          <BuddyG t={t} pose={{ ...mini, x: 62, size: 26, y: 120 }} />
          <rect x={110} y={56} width={60} height={12} rx={6} fill={C.ink} />
          <rect x={110} y={76} width={112} height={20} rx={8} fill={C.coral} />
          <rect x={110} y={104} width={80} height={8} rx={4} fill={C.lemon} />
        </>
      )}
    </svg>
  );
};

// 一条胶片：五帧画面排开，放大镜一帧一帧看过去
const Strip: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.strip) return null;
  const slide = 1 - ramp(t, T.strip, T.strip + 0.7, EASE.out);
  const lens = ramp(t, 10.0, 11.75, (v) => v);
  const lensGone = ramp(t, 11.9, 12.2);
  const width = SHOTS.length * STRIP.w + 40;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: STRIP.x + slide * 1900,
          top: STRIP.y,
          width,
          height: STRIP.h + 110,
          borderRadius: 26,
          background: C.ink,
          boxShadow: "0 10px 0 rgba(58, 42, 38, 0.2)",
          transform: `rotate(${-2 + slide * 6}deg)`,
        }}
      >
        {/* 两排齿孔 */}
        {[14, STRIP.h + 76].map((y) =>
          Array.from({ length: 22 }, (_, i) => (
            <span
              key={`${y}-${i}`}
              style={{
                position: "absolute",
                left: 26 + i * 62,
                top: y,
                width: 30,
                height: 20,
                borderRadius: 6,
                background: "#FFFDF7",
                opacity: 0.85,
              }}
            />
          )),
        )}
        {SHOTS.map((shot, i) => {
          const bad = i === 2;
          const fixed = t >= T.fix + 0.55;
          const shake =
            bad && t > shot.check && t < T.fix
              ? Math.sin((t - shot.check) * 38) *
                7 *
                Math.exp(-(t - shot.check) * 5)
              : 0;
          return (
            <div
              key={shot.frame}
              style={{
                position: "absolute",
                left: 30 + i * STRIP.w + shake,
                top: 48,
                width: 250,
                height: 150,
                borderRadius: 14,
                overflow: "hidden",
                outline: `6px solid ${bad && t >= shot.check && !fixed ? C.coral : "#FFFDF7"}`,
              }}
            >
              <Shot index={i} t={t} />
            </div>
          );
        })}
      </div>
      {/* 每一帧下面的帧号，上面的勾和叉 */}
      {SHOTS.map((shot, i) => {
        const bad = i === 2;
        const cx = STRIP.x + 30 + i * STRIP.w + 125 + slide * 1900;
        const fixed = t >= T.fix + 0.55;
        return (
          <React.Fragment key={shot.frame}>
            <div
              style={{
                position: "absolute",
                left: cx,
                top: STRIP.y + STRIP.h + 128,
                transform: "translateX(-50%) rotate(-2deg)",
                fontFamily: MONO,
                fontSize: 28,
                color: C.ink,
                opacity: 0.7,
                whiteSpace: "nowrap",
              }}
            >
              第 {shot.frame} 帧
            </div>
            {t >= shot.check && !(bad && !fixed) ? (
              <div
                style={{
                  position: "absolute",
                  left: cx + 96,
                  top: STRIP.y + 14,
                  transform: `translate(-50%, -50%) scale(${pop(t, bad ? T.fix + 0.55 : shot.check, 1.5)})`,
                }}
              >
                <Mark ok size={84} />
              </div>
            ) : null}
            {bad && t >= shot.check && !fixed ? (
              <div
                style={{
                  position: "absolute",
                  left: cx + 96,
                  top: STRIP.y + 14,
                  transform: `translate(-50%, -50%) rotate(-10deg) scale(${
                    3 - 2 * Math.min(1, pop(t, shot.check, 1.5))
                  })`,
                }}
              >
                <Mark ok={false} size={96} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      {/* 放大镜 */}
      {t >= 9.95 && lensGone < 1 ? (
        <svg
          width={230}
          height={230}
          viewBox="0 0 220 220"
          style={{
            position: "absolute",
            left: mix(STRIP.x + 60, STRIP.x + 60 + 4 * STRIP.w, lens),
            top: STRIP.y + 70 + Math.sin(lens * Math.PI * 5) * 12,
            transform: `scale(${pop(t, 9.95) - lensGone})`,
          }}
        >
          <line
            x1={128}
            y1={128}
            x2={196}
            y2={196}
            stroke={C.ink}
            strokeWidth={26}
            strokeLinecap="round"
          />
          <line
            x1={134}
            y1={134}
            x2={192}
            y2={192}
            stroke={C.lemon}
            strokeWidth={12}
            strokeLinecap="round"
          />
          <circle
            cx={88}
            cy={88}
            r={70}
            fill="rgba(255,255,255,0.3)"
            stroke={C.ink}
            strokeWidth={12}
          />
          <path
            d="M 50 70 Q 60 44 88 40"
            stroke={C.white}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            opacity={0.8}
          />
        </svg>
      ) : null}
      <Pop
        t={t}
        at={T.strip + 0.5}
        out={T.fix + 0.7}
        x={WIDTH / 2}
        y={130}
        turn={-2}
        from={[0, -200]}
        to={[0, -160]}
      >
        <Tag fill={C.lemon} size={50}>
          一帧一帧检查
        </Tag>
      </Pop>
      <Pop t={t} at={T.fix + 0.8} x={WIDTH / 2} y={130} turn={2} bounce={1.4}>
        <Tag fill={C.mint} size={56}>
          全部通过 ✓
        </Tag>
      </Pop>
    </>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Paper t={t} backColor="#FDEBD0" />
    <Editor t={t} />
  </>
);

export const Front: React.FC<{ t: number }> = ({ t }) => {
  const me = pose(t);
  const unit = me.size / 100;
  const deaf = during(t, T.wave + 0.4, T.out - 0.25, 0.25);
  return (
    <>
      {/* 戴上耳机也听不见：音符飘上来，头顶一个问号 */}
      {deaf > 0.01 ? (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <g
            transform={`translate(${me.x} ${headTop(me)}) rotate(${me.tilt}) scale(${unit * deaf})`}
          >
            <path
              d="M -112 70 Q -112 -52 0 -52 Q 112 -52 112 70"
              stroke={C.ink}
              strokeWidth={16}
              strokeLinecap="round"
              fill="none"
            />
            {[-1, 1].map((side) => (
              <rect
                key={side}
                x={side * 118 - 22}
                y={34}
                width={44}
                height={78}
                rx={18}
                fill={C.lemon}
                stroke={C.ink}
                strokeWidth={8}
              />
            ))}
          </g>
        </svg>
      ) : null}
      {[0, 1, 2].map((i) => (
        <Emote
          key={i}
          t={t}
          at={T.wave + 0.7 + i * 0.7}
          out={T.wave + 1.9 + i * 0.7}
          x={1150 + i * 150}
          y={690 - i * 16}
          kind="♪"
          size={54}
          color={[C.lemon, C.mint, C.pink][i]}
        />
      ))}
      <Kao
        t={t}
        at={T.wave + 0.9}
        out={T.out - 0.3}
        x={me.x + 190}
        y={headTop(me) - 20}
        text="(・_・?)"
        size={32}
        turn={8}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${ramp(t, 15, 15.4, EASE.in) * -620}px)`,
          opacity: 1 - ramp(t, 15.1, 15.4),
        }}
      >
        <Strip t={t} />
      </div>
      <Kao
        t={t}
        at={11.05}
        out={12.5}
        x={me.x + 20}
        y={headTop(me) - 70}
        text="Σ(ﾟДﾟ)"
      />
      <Kao
        t={t}
        at={T.fix + 0.9}
        out={15}
        x={me.x + 20}
        y={headTop(me) - 80}
        text="(｀・ω・´)ゞ"
        fill={C.lemon}
        size={46}
      />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <Burst
          t={t}
          at={T.fix + 0.55}
          x={STRIP.x + 30 + 2 * STRIP.w + 125}
          y={STRIP.y + 120}
          reach={260}
          count={12}
          seed="fixed"
        />
        <Twinkles
          t={t}
          at={T.fix + 0.9}
          out={15}
          x={WIDTH / 2}
          y={130}
          spread={300}
          count={6}
          seed="pass"
        />
      </svg>
    </>
  );
};
