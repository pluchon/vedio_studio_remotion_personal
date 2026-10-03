// 我是什么：不是人也不是机器人；读过很多字，学会了猜下一个字
import React from "react";
import { random } from "remotion";
import { BuddyG, Pose, REST } from "../Buddy";
import { clamp, EASE, hop, mix, pop, ramp } from "../motion";
import { Paper } from "../Paper";
import { Pop, sticker } from "../stickers";
import { C, GROUND, HEIGHT, MONO, TEXT, WIDTH } from "../theme";

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
  const eat =
    ramp(t, T.rain + 0.4, T.rain + 0.8) - ramp(t, T.rainEnd - 0.3, T.rainEnd);
  const think =
    ramp(t, T.strip + 0.3, T.strip + 0.6) - ramp(t, T.pick - 0.1, T.pick + 0.1);
  const pick = hop(t, T.pick, 0.34, 80);
  const proud = ramp(t, T.cards + 0.4, T.cards + 0.7);
  return {
    ...REST,
    ...ME,
    lift: pick.lift,
    squash: pick.squash + 0.03 * eat * Math.sin(t * 16),
    tilt: shake(T.crossA) + shake(T.crossB),
    lookX: 0.75 - 0.5 * eat,
    lookY: -0.5 * eat - 0.55 * think + 0.2 * proud,
    lean: 0.5,
    spin: t * 240,
    glow: 0.5 + 0.5 * Math.sin(t * 6),
    sparkSize: think,
    wave: ramp(t, T.pick, T.pick + 0.2) - ramp(t, T.pick + 0.7, T.pick + 1),
    mood: eat > 0.5 || (t > T.pick && t < T.pick + 1.2) ? "happy" : "smile",
  };
};

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
  return (
    <g
      transform={`translate(${x} ${GROUND}) scale(1 ${up * (1 - down)})`}
      opacity={1 - down * down}
    >
      <rect x={-7} y={-70} width={14} height={72} rx={5} fill={C.ink} />
      {robot ? (
        <g stroke={C.ink} strokeWidth={6} strokeLinejoin="round">
          <line x1={0} y1={-330} x2={0} y2={-362} strokeLinecap="round" />
          <circle cx={0} cy={-370} r={11} fill={C.coral} />
          <rect
            x={-66}
            y={-330}
            width={132}
            height={96}
            rx={16}
            fill="#CBD3DC"
          />
          <rect x={-46} y={-304} width={92} height={34} rx={12} fill={C.ink} />
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
          <rect x={-40} y={-196} width={80} height={40} rx={8} fill={C.white} />
        </g>
      ) : (
        <g stroke={C.ink} strokeWidth={6} strokeLinejoin="round">
          <path
            d="M -84 -74 Q -84 -214 0 -214 Q 84 -214 84 -74 Z"
            fill="#BFD4EE"
          />
          <circle cx={0} cy={-282} r={58} fill="#F6D7BE" />
          <path
            d="M -24 -272 Q -17 -262 -10 -272 M 10 -272 Q 17 -262 24 -272"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
      {t >= cross ? (
        <g
          transform={`translate(0 -220) scale(${pop(t, cross, 1.4)}) rotate(-8)`}
        >
          <path
            d="M -70 -70 L 70 70 M 70 -70 L -70 70"
            stroke={C.coral}
            strokeWidth={30}
            strokeLinecap="round"
          />
        </g>
      ) : null}
    </g>
  );
};

// 很多很多字，打着旋儿飞进小家伙肚子里
const Rain: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.rain || t > T.rainEnd + 0.2) return null;
  return (
    <>
      {Array.from({ length: 76 }, (_, i) => {
        const born =
          T.rain + random(`rain-b-${i}`) * (T.rainEnd - T.rain - 1.1);
        const p = (t - born) / 1.1;
        if (p <= 0 || p >= 1) return null;
        const k = p * p;
        const fromX = 640 + random(`rain-x-${i}`) * 1240;
        const fromY = 40 + random(`rain-y-${i}`) * 600;
        const midX =
          mix(fromX, ME.x, 0.5) + (random(`rain-c-${i}`) - 0.5) * 360;
        const midY = Math.min(fromY, 600) - 150;
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
              fontSize: 50,
              color: GLYPH_COLORS[i % GLYPH_COLORS.length],
              opacity: clamp(p * 6) * (1 - k ** 4),
              transform: `translate(-50%, -50%) rotate(${
                (random(`rain-r-${i}`) - 0.5) * 50 * (1 - k)
              }deg) scale(${1 - 0.72 * k})`,
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
          top: 190,
          height: 128,
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          fontFamily: TEXT,
          fontSize: 64,
          color: C.ink,
          whiteSpace: "pre",
          transformOrigin: "0% 50%",
          transform: `scale(${pop(t, T.strip, 0.9)})`,
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

      {/* 候选的字 */}
      {OPTIONS.map((option, i) => {
        const at = T.options + i * 0.16;
        const gone = ramp(
          t,
          T.pick + (i === 0 ? 0.5 : 0.05),
          T.pick + (i === 0 ? 0.6 : 0.35),
        );
        if (t < at || gone >= 1) return null;
        const grow = ramp(t, at + 0.1, at + 0.8, EASE.out);
        const lift = i === 0 ? flying : 0;
        return (
          <div
            key={option.text}
            style={{
              position: "absolute",
              left: mix(930, 1150, lift),
              top: mix(380 + i * 104, 212, lift),
              display: "flex",
              alignItems: "center",
              gap: 22,
              fontFamily: TEXT,
              color: C.ink,
              opacity: 1 - gone,
              transformOrigin: "0% 50%",
              transform: `scale(${pop(t, at)})`,
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

// 猜下去的结果：句子、代码、视频
const Results: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Pop t={t} at={T.cards + 0.55} x={990} y={560} turn={-4}>
      <div style={{ width: 290, height: 250, padding: 30, ...sticker(30) }}>
        {[1, 0.82, 0.93, 0.55].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w * 100}%`,
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
    <Pop t={t} at={T.cards + 0.85} x={1320} y={600} turn={3}>
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
                width: `${Number(wa) * 100}%`,
                height: 20,
                borderRadius: 10,
                background: String(a),
                marginLeft: i === 1 || i === 2 ? 26 : 0,
              }}
            />
            <div
              style={{
                width: `${Number(wb) * 100}%`,
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
    <Pop t={t} at={T.cards + 1.4} x={1650} y={560} turn={-3}>
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
              pose={{ ...REST, x: 118, y: 112, size: 36, wave: 1 }}
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

export const Back: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Paper t={t} tint="#EEF6EA" floorColor="#D3EBD9" />
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Standee t={t} x={1090} at={T.stand} cross={T.crossA} />
      <Standee t={t} x={1500} at={T.stand + 0.22} cross={T.crossB} robot />
    </svg>
    <Pop t={t} at={T.rain + 0.2} out={T.rainEnd} x={470} y={470} bounce={1.2}>
      <div
        style={{ padding: "12px 34px", fontSize: 50, ...sticker(30, C.lemon) }}
      >
        语言模型
      </div>
    </Pop>
    <Guess t={t} />
    <Results t={t} />
  </>
);

export const Front: React.FC<{ t: number }> = ({ t }) => <Rain t={t} />;
