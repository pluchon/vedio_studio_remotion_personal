// 我是什么：不是人也不是机器人；一面书架上的字飞进肚子里；然后学会了猜下一个字
import React from "react";
import { random } from "remotion";
import { BuddyG, headTop, Pose, REST } from "../Buddy";
import { Burst, Kao, Puff, Twinkles } from "../emotes";
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
import { At, Bookshelf, Plant, Rug } from "../scenery";
import { Pop, sticker, Tag } from "../stickers";
import { C, floorY, GROUND, HEIGHT, MONO, TEXT, WIDTH } from "../theme";

const T = {
  stand: 0.45,
  crossA: 1.35,
  crossB: 1.95,
  fall: 2.75,
  rain: 3.3,
  rainEnd: 6.3,
  strip: 6.45,
  options: 7.5,
  pick: 9.25,
  cards: 12.6,
};
const ME = { x: 470, y: GROUND };
const SHELF = { x: 1330, y: 716, w: 940, h: 590 };

// 接在「今天天气真」后面的字，一个一个被猜出来
const TOKENS = [
  { text: "好", at: 9.7 },
  { text: "，", at: 10.1 },
  { text: "适合", at: 10.45 },
  { text: "出门", at: 10.85 },
  { text: "。", at: 11.25 },
];
const OPTIONS = [
  { text: "好", share: 72 },
  { text: "热", share: 15 },
  { text: "冷", share: 9 },
];
const GLYPHS = [
  ..."的一是了我不人在他有这个上们来到时大地为子中你说生年着就那和要出也得里后自以会家可下而过天去能对小多然于心学之都好看起发当没成只如事把还用第样道想作种开美从无情面最但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间知世什两次使身者被高已亲其进此话常与活正感",
  ..."abcdefghijklmnopqrstuvwxyz{}()=;?!",
];
const GLYPH_COLORS = [C.ink, C.ink, C.ink, C.coral, C.mintDeep, C.lilacDeep];

export const pose = (t: number): Pose => {
  const shake = (at: number) =>
    t > at && t < at + 0.55 ? Math.sin(((t - at) / 0.55) * Math.PI * 3) * 6 : 0;
  const eat = during(t, T.rain + 0.4, T.rainEnd, 0.35);
  const think = during(t, T.strip + 0.3, T.pick + 0.1, 0.25);
  const pick = hop(t, T.pick, 0.34, 80);
  const done = hop(t, T.rainEnd + 0.05, 0.3, 60);
  const proud = ramp(t, T.cards + 0.4, T.cards + 0.7);
  return {
    ...REST,
    ...ME,
    lift: pick.lift + done.lift,
    squash: pick.squash + done.squash + 0.035 * eat * Math.sin(t * 9),
    tilt: shake(T.crossA) + shake(T.crossB),
    lookX: 0.75 - 0.35 * eat,
    lookY: -0.5 * eat - 0.55 * think + 0.2 * proud,
    lean: 0.5,
    spin: t * 240,
    glow: 0.5 + 0.5 * Math.sin(t * 6),
    sparkSize: think,
    wave: during(t, T.pick, T.pick + 1, 0.2),
    cheer: during(t, T.cards + 1.6, T.cards + 3.2, 0.3),
    mood:
      eat > 0.5
        ? "happy"
        : t > T.pick && t < T.pick + 1.2
          ? "wink"
          : t > T.cards + 1.5
            ? "star"
            : t > T.crossA && t < T.fall
              ? "flat"
              : "smile",
  };
};

// 镜头：先看两块立牌，再凑近看它「吃」字，然后看右边猜字，最后拉开
export const camera = (t: number): Cam => ({
  z: track(t, [
    [0.4, 1],
    [1.2, 1.06],
    [T.fall + 0.2, 1.06],
    [T.rain + 0.7, 1.1],
    [T.rainEnd - 0.2, 1.1],
    [T.strip + 0.5, 1.06],
    [T.cards - 0.6, 1.06],
    [T.cards + 0.3, 1],
  ]),
  fx: track(t, [
    [0.4, 960],
    [1.2, 1250],
    [T.fall + 0.2, 1250],
    [T.rain + 0.7, 620],
    [T.rainEnd - 0.2, 620],
    [T.strip + 0.5, 1150],
    [T.cards - 0.6, 1150],
    [T.cards + 0.3, 960],
  ]),
  fy: track(t, [
    [0.4, 540],
    [1.2, 560],
    [T.rain + 0.7, 560],
    [T.strip + 0.5, 430],
    [T.cards - 0.6, 430],
    [T.cards + 0.3, 540],
  ]),
  sx: jolt(t, T.crossA, 1.2) + jolt(t, T.crossB, 1.2),
  sy: jolt(t, T.fall + 0.4, 0.6) + jolt(t, T.pick + 0.34, 0.5),
});

// 两块立牌：一个人，一个电影里的机器人。打上叉以后向后倒
const Standee: React.FC<{
  t: number;
  x: number;
  at: number;
  cross: number;
  robot?: boolean;
}> = ({ t, x, at, cross, robot = false }) => {
  const up = pop(t, at, 0.9);
  const down = ramp(t, T.fall, T.fall + 0.45, EASE.in);
  if (t < at || down >= 1) return null;
  const y = floorY(x) + 26;
  const nod = Math.sin(t * 2.2 + x) * 1.5;
  return (
    <>
      <ellipse
        cx={x}
        cy={y + 4}
        rx={150 * up * (1 - down)}
        ry={30 * up * (1 - down)}
        fill={C.white}
        opacity={0.55}
      />
      <g
        transform={`translate(${x} ${y}) rotate(${nod + down * (robot ? 86 : -86)}) scale(1 ${up})`}
        opacity={1 - down ** 3}
      >
        <rect x={-7} y={-70} width={14} height={72} rx={5} fill={C.ink} />
        {robot ? (
          <g stroke={C.ink} strokeWidth={6} strokeLinejoin="round">
            <line x1={0} y1={-330} x2={0} y2={-362} strokeLinecap="round" />
            <circle
              cx={0}
              cy={-370}
              r={11}
              fill={Math.floor(t * 4) % 2 ? C.coral : C.lemon}
            />
            <rect
              x={-66}
              y={-330}
              width={132}
              height={96}
              rx={16}
              fill="#CBD3DC"
            />
            <rect
              x={-46}
              y={-304}
              width={92}
              height={34}
              rx={12}
              fill={C.ink}
            />
            <circle cx={-20} cy={-287} r={8} fill="#FF5A4F" stroke="none" />
            <circle cx={20} cy={-287} r={8} fill="#FF5A4F" stroke="none" />
            <rect
              x={-78}
              y={-224}
              width={156}
              height={150}
              rx={18}
              fill="#CBD3DC"
            />
            <rect
              x={-40}
              y={-196}
              width={80}
              height={40}
              rx={8}
              fill={C.white}
            />
            <circle cx={-18} cy={-120} r={9} fill={C.lemon} />
            <circle cx={18} cy={-120} r={9} fill={C.mint} />
            <rect
              x={-108}
              y={-210}
              width={30}
              height={84}
              rx={12}
              fill="#AEB8C4"
            />
            <rect
              x={78}
              y={-210}
              width={30}
              height={84}
              rx={12}
              fill="#AEB8C4"
            />
          </g>
        ) : (
          <g stroke={C.ink} strokeWidth={6} strokeLinejoin="round">
            <path
              d="M -84 -74 Q -84 -214 0 -214 Q 84 -214 84 -74 Z"
              fill="#BFD4EE"
            />
            <path d="M -22 -212 L 0 -180 L 22 -212" fill={C.white} />
            <circle cx={0} cy={-282} r={58} fill="#F6D7BE" />
            <path
              d="M -58 -290 Q -50 -350 0 -342 Q 50 -350 58 -290 Q 30 -312 0 -306 Q -30 -312 -58 -290 Z"
              fill="#6B4A3A"
            />
            <path
              d="M -24 -272 Q -17 -262 -10 -272 M 10 -272 Q 17 -262 24 -272"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse
              cx={-32}
              cy={-256}
              rx={9}
              ry={5}
              fill={C.blush}
              stroke="none"
              opacity={0.8}
            />
            <ellipse
              cx={32}
              cy={-256}
              rx={9}
              ry={5}
              fill={C.blush}
              stroke="none"
              opacity={0.8}
            />
          </g>
        )}
        {t >= cross ? (
          <g
            transform={`translate(0 -220) scale(${pop(t, cross, 1.4)}) rotate(-8)`}
          >
            <path
              d="M -70 -70 L 70 70 M 70 -70 L -70 70"
              stroke={C.ink}
              strokeWidth={44}
              strokeLinecap="round"
            />
            <path
              d="M -70 -70 L 70 70 M 70 -70 L -70 70"
              stroke={C.coral}
              strokeWidth={30}
              strokeLinecap="round"
            />
          </g>
        ) : null}
      </g>
    </>
  );
};

// 书架上的字，一个一个飘出来，打着旋儿飞进小家伙肚子里
const Rain: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.rain || t > T.rainEnd + 0.2) return null;
  return (
    <>
      {Array.from({ length: 84 }, (_, i) => {
        const born =
          T.rain + random(`rain-b-${i}`) * (T.rainEnd - T.rain - 1.2);
        const p = (t - born) / 1.2;
        if (p <= 0 || p >= 1) return null;
        const k = p * p;
        const fromX = SHELF.x + (random(`rain-x-${i}`) - 0.5) * (SHELF.w - 80);
        const fromY = SHELF.y - 40 - random(`rain-y-${i}`) * (SHELF.h - 80);
        const midX =
          mix(fromX, ME.x, 0.5) + (random(`rain-c-${i}`) - 0.5) * 300;
        const midY = Math.min(fromY, 560) - 190;
        const x = mix(mix(fromX, midX, k), mix(midX, ME.x, k), k);
        const y = mix(mix(fromY, midY, k), mix(midY, ME.y - 150, k), k);
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontFamily: i % 5 === 0 ? MONO : TEXT,
              fontSize: 54,
              color: GLYPH_COLORS[i % GLYPH_COLORS.length],
              opacity: clamp(p * 5) * (1 - k ** 4),
              transform: `translate(-50%, -50%) rotate(${
                (random(`rain-r-${i}`) - 0.5) * 50 * (1 - k)
              }deg) scale(${(0.4 + 0.6 * clamp(p * 4)) * (1 - 0.7 * k)})`,
            }}
          >
            {GLYPHS[Math.floor(random(`rain-g-${i}`) * GLYPHS.length)]}
          </span>
        );
      })}
    </>
  );
};

// 上面一条句子，后面留一个空；下面是几个候选的字和各自的把握
const Guess: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.strip) return null;
  const done = t >= TOKENS[TOKENS.length - 1].at;
  const flying = ramp(t, T.pick, TOKENS[0].at, EASE.inOut);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 190 + Math.sin(t * 1.8) * 5,
          height: 128,
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          fontFamily: TEXT,
          fontSize: 64,
          color: C.ink,
          whiteSpace: "pre",
          transformOrigin: "0% 50%",
          transform: `translateX(${(1 - pop(t, T.strip, 0.8)) * 500}px) scale(${0.7 + 0.3 * pop(t, T.strip, 0.9)})`,
          opacity: clamp((t - T.strip) * 6),
          ...sticker(36),
        }}
      >
        <span>今天天气真</span>
        {TOKENS.map((token) =>
          t >= token.at ? (
            <span
              key={token.text}
              style={{
                display: "inline-block",
                color: C.coral,
                transform: `scale(${pop(t, token.at, 1.4)})`,
              }}
            >
              {token.text}
            </span>
          ) : null,
        )}
        {done ? null : (
          <span
            style={{
              width: 76,
              height: 84,
              marginLeft: 10,
              borderRadius: 16,
              border: `5px dashed ${C.ink}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              opacity: 0.45 + 0.4 * Math.sin(t * 7),
            }}
          >
            ?
          </span>
        )}
      </div>

      {/* 后面的字接着猜：每个字一张小卡片，从下面飞进句子里 */}
      {TOKENS.slice(1).map((token, i) => {
        const p = ramp(t, token.at - 0.36, token.at, EASE.inOut);
        if (p <= 0 || p >= 1) return null;
        const before = TOKENS.slice(0, i + 1).reduce(
          (n, item) => n + item.text.length,
          0,
        );
        return (
          <div
            key={token.text}
            style={{
              position: "absolute",
              left: mix(1240 + (i % 2) * 150, 872 + 64 * (5 + before), p),
              top: mix(470, 212, p) - Math.sin(p * Math.PI) * 60,
              height: 84,
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              fontFamily: TEXT,
              fontSize: 54,
              color: C.ink,
              transform: `rotate(${(1 - p) * (i % 2 ? 10 : -10)}deg) scale(${clamp(p * 5)})`,
              ...sticker(22, C.lemon),
            }}
          >
            {token.text}
          </div>
        );
      })}

      {/* 候选的字 */}
      {OPTIONS.map((option, i) => {
        const at = T.options + i * 0.16;
        const gone = ramp(
          t,
          T.pick + (i === 0 ? 0.5 : 0.05),
          T.pick + (i === 0 ? 0.6 : 0.4),
        );
        if (t < at || gone >= 1) return null;
        const grow = ramp(t, at + 0.1, at + 0.8, EASE.out);
        const lift = i === 0 ? flying : 0;
        return (
          <div
            key={option.text}
            style={{
              position: "absolute",
              left: mix(930, 1150, lift) + (i === 0 ? 0 : gone * 120),
              top:
                mix(380 + i * 104, 212, lift) - Math.sin(lift * Math.PI) * 70,
              display: "flex",
              alignItems: "center",
              gap: 22,
              fontFamily: TEXT,
              color: C.ink,
              opacity: 1 - gone,
              transformOrigin: "0% 50%",
              transform: `translateX(${(1 - pop(t, at, 0.8)) * 260}px) scale(${0.6 + 0.4 * pop(t, at)})`,
            }}
          >
            <span
              style={{
                width: 84,
                height: 84,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 54,
                ...sticker(22, i === 0 ? C.lemon : C.white),
              }}
            >
              {option.text}
            </span>
            <span
              style={{
                width: 420 * (option.share / 72) * grow * (1 - lift),
                height: 34,
                borderRadius: 17,
                background: i === 0 ? C.coral : C.coralLight,
                border: `5px solid ${C.ink}`,
                boxSizing: "border-box",
                opacity: 1 - lift,
              }}
            />
            <span style={{ fontSize: 44, fontWeight: 600, opacity: 1 - lift }}>
              {Math.round(option.share * grow)}%
            </span>
          </div>
        );
      })}
    </>
  );
};

// 猜下去的结果：句子、代码、视频。卡片里的内容自己会动
const Results: React.FC<{ t: number }> = ({ t }) => {
  const write = (at: number, i: number) =>
    ramp(t, at + 0.2 + i * 0.16, at + 0.55 + i * 0.16, EASE.out);
  return (
    <>
      <Pop
        t={t}
        at={T.cards + 0.55}
        x={990}
        y={560}
        turn={-4}
        from={[0, 260]}
        float={6}
      >
        <div style={{ width: 290, height: 250, padding: 30, ...sticker(30) }}>
          {[1, 0.82, 0.93, 0.55].map((w, i) => (
            <div
              key={i}
              style={{
                width: `${w * 100 * write(T.cards + 0.55, i)}%`,
                height: 20,
                borderRadius: 10,
                background: C.ink,
                opacity: 0.8,
                marginBottom: 20,
              }}
            />
          ))}
          <div style={{ fontSize: 40, textAlign: "right" }}>句子</div>
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.cards + 0.85}
        x={1320}
        y={600}
        turn={3}
        from={[0, 260]}
        float={7}
      >
        <div
          style={{
            width: 290,
            height: 250,
            padding: 30,
            ...sticker(30, "#3A2A26"),
          }}
        >
          {[
            [C.lilac, 0.34, C.lemon, 0.42],
            [C.mint, 0.5, C.coralLight, 0.26],
            [C.sky, 0.22, C.lemon, 0.5],
            [C.lilac, 0.2, C.white, 0],
          ].map(([a, wa, b, wb], i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: `${Number(wa) * 100 * write(T.cards + 0.85, i)}%`,
                  height: 20,
                  borderRadius: 10,
                  background: String(a),
                  marginLeft: i === 1 || i === 2 ? 26 : 0,
                }}
              />
              <div
                style={{
                  width: `${Number(wb) * 100 * write(T.cards + 1.0, i)}%`,
                  height: 20,
                  borderRadius: 10,
                  background: String(b),
                }}
              />
            </div>
          ))}
          <div style={{ fontSize: 40, textAlign: "right", color: C.white }}>
            代码
          </div>
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.cards + 1.4}
        x={1650}
        y={560}
        turn={-3}
        from={[0, 260]}
        float={6}
      >
        <div style={{ width: 290, height: 250, padding: 22, ...sticker(30) }}>
          <div
            style={{
              height: 142,
              borderRadius: 16,
              background: C.paper,
              border: `5px solid ${C.ink}`,
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <svg width={236} height={132} viewBox="0 0 236 132">
              <ellipse cx={118} cy={150} rx={170} ry={50} fill={C.floor} />
              <BuddyG
                t={t}
                pose={{
                  ...REST,
                  x: 118,
                  y: 112,
                  size: 36,
                  wave: 1,
                  mood: "happy",
                  lift: Math.abs(Math.sin(t * 5)) * 10,
                }}
              />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
              fontSize: 40,
            }}
          >
            <svg width={150} height={30}>
              <rect y={10} width={150} height={10} rx={5} fill={C.coralLight} />
              <rect
                y={10}
                width={150 * ramp(t, T.cards + 1.5, T.cards + 3.6, (v) => v)}
                height={10}
                rx={5}
                fill={C.coral}
              />
            </svg>
            <span>视频</span>
          </div>
        </div>
      </Pop>
    </>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => {
  const shelf =
    pop(t, 0.15, 0.8) - ramp(t, T.rainEnd - 0.1, T.rainEnd + 0.45, EASE.in);
  const reading = during(t, T.rain, T.rainEnd, 0.4);
  const percent = Math.round(
    100 * ramp(t, T.rain + 0.3, T.rainEnd - 0.3, (v) => v),
  );
  return (
    <>
      <Paper t={t} tint="#EEF6EA" floorColor="#D3EBD9" backColor="#E2F1E0" />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* 背后的一面书架：读书的时候亮起来，读完就收走 */}
        <g opacity={0.5 + 0.45 * reading}>
          <At x={SHELF.x} y={SHELF.y} k={shelf}>
            <Bookshelf w={SHELF.w} h={SHELF.h} rows={4} glow={reading} />
          </At>
        </g>
        <At x={ME.x} y={GROUND + 10} k={pop(t, 0.1)}>
          <Rug w={250} fill="#F9D7A6" />
        </At>
        <At x={130} y={floorY(130) + 20} s={1.15} k={pop(t, 0.2, 1.2)}>
          <Plant t={t} />
        </At>
        <Standee t={t} x={1090} at={T.stand} cross={T.crossA} />
        <Standee t={t} x={1500} at={T.stand + 0.22} cross={T.crossB} robot />
        <Puff t={t} at={T.fall + 0.4} x={880} y={floorY(880) + 26} />
        <Puff t={t} at={T.fall + 0.42} x={1710} y={floorY(1710) + 26} />
      </svg>

      {/* 头顶的牌子：语言模型，下面是读书的进度 */}
      <Pop
        t={t}
        at={T.rain + 0.2}
        out={T.rainEnd + 0.5}
        x={470}
        y={410}
        bounce={1.2}
        float={5}
      >
        <div
          style={{
            textAlign: "center",
            padding: "14px 30px 20px",
            ...sticker(30),
          }}
        >
          <div style={{ fontSize: 52 }}>语言模型</div>
          <div
            style={{
              marginTop: 8,
              width: 300,
              height: 30,
              borderRadius: 15,
              border: `5px solid ${C.ink}`,
              boxSizing: "border-box",
              overflow: "hidden",
              background: C.paper,
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: percent >= 100 ? C.mint : C.lemon,
              }}
            />
          </div>
          <div style={{ marginTop: 6, fontSize: 32, opacity: 0.7 }}>
            {percent >= 100 ? "读完啦" : `读书中 ${percent}%`}
          </div>
        </div>
      </Pop>

      <Guess t={t} />
      <Results t={t} />
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
          at={TOKENS[0].at}
          x={1188}
          y={254}
          count={9}
          reach={130}
          seconds={0.6}
          ring={null}
          seed="pick"
        />
        <Twinkles
          t={t}
          at={T.cards + 1.6}
          out={99}
          x={1320}
          y={580}
          spread={470}
          count={7}
          seed="cards"
        />
      </svg>
      <Pop
        t={t}
        at={T.strip + 0.5}
        out={T.cards - 0.3}
        x={1010}
        y={150}
        turn={-5}
        bounce={1.2}
      >
        <Tag fill={C.lemon} size={40}>
          下一个字是？
        </Tag>
      </Pop>
    </>
  );
};

export const Front: React.FC<{ t: number }> = ({ t }) => {
  const me = pose(t);
  return (
    <>
      <Rain t={t} />
      <Kao
        t={t}
        at={T.crossA + 0.15}
        out={T.fall + 0.3}
        x={me.x + 20}
        y={headTop(me) - 70}
        text="(・へ・)"
      />
      <Kao
        t={t}
        at={T.rainEnd + 0.1}
        out={T.strip + 1.2}
        x={me.x + 230}
        y={headTop(me) - 20}
        text="(｀・ω・´)"
        turn={6}
        fill={C.lemon}
      />
      <Kao
        t={t}
        at={T.cards + 1.7}
        out={15.2}
        x={me.x + 10}
        y={headTop(me) - 80}
        text="ヽ(・∀・)ノ"
      />
    </>
  );
};
