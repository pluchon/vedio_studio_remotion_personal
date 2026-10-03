// 我，Opus 5.5：生日、一口气能读多少、想多久可以调、拿手的活、比上一代快多少
import React, { useContext } from "react";
import { Books } from "../Books";
import { BuddyG, Pose, REST } from "../Buddy";
import { clamp, EASE, mix, pop, ramp } from "../motion";
import { daysOld, Options } from "../options";
import { Paper } from "../Paper";
import { Pop, sticker } from "../stickers";
import { C, MONO, TEXT } from "../theme";

const T = {
  cal: 0.5,
  badge: 3.05,
  calOut: 4.7,
  books: 5.0,
  booksOut: 7.9,
  dial: 8.2,
  dialOut: 11.85,
  term: 12.1,
  termOut: 16.7,
  race: 16.9,
};
const ME_X = 430;
const RIGHT = 1250;
const LEVELS = ["低", "中", "高", "极高", "满"];
const TASKS = [
  { text: "读完整个仓库", at: 12.7 },
  { text: "改了 37 个文件", at: 13.4 },
  { text: "跑测试，修到全绿", at: 14.3 },
  { text: "查了 12 篇资料", at: 15.0 },
  { text: "写好说明", at: 15.6 },
];

// 思考程度的指针指在第几档：默认是「中」，难的拧到「满」，简单的拧到「低」，最后有人把它拧回了「满」
const level = (t: number) =>
  1 +
  3 * ramp(t, 10.0, 10.5, EASE.out) -
  4 * ramp(t, 10.8, 11.2, EASE.out) +
  4 * ramp(t, 11.4, 11.75, EASE.out);

const comma = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const pose = (t: number): Pose => {
  const dial =
    ramp(t, T.dial, T.dial + 0.3) - ramp(t, T.dialOut - 0.2, T.dialOut);
  const awe =
    ramp(t, T.books + 0.2, T.books + 0.5) -
    ramp(t, T.books + 1.9, T.books + 2.2);
  const win = ramp(t, 18.0, 18.2);
  return {
    ...REST,
    x: ME_X,
    lookX: 0.8,
    lookY: -0.35 + 0.2 * win,
    lean: 0.3,
    spin: t * (140 + level(t) * 110),
    glow: 0.3 + level(t) * 0.17,
    sparkSize: dial * (0.55 + level(t) * 0.2),
    wave: win - ramp(t, 19.2, 19.5),
    mood:
      awe > 0.5
        ? "wow"
        : win > 0.5 || (t > T.badge && t < T.calOut)
          ? "happy"
          : "smile",
  };
};

const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const { asOf } = useContext(Options);
  return (
    <>
      <Pop t={t} at={T.cal} out={T.calOut} x={RIGHT} y={410} turn={-3}>
        <div
          style={{
            width: 400,
            overflow: "hidden",
            textAlign: "center",
            ...sticker(40),
          }}
        >
          <div
            style={{
              background: C.coral,
              color: C.white,
              fontSize: 50,
              padding: "14px 0 16px",
              borderBottom: `6px solid ${C.ink}`,
            }}
          >
            2026 年 9 月
          </div>
          <div style={{ fontSize: 250, fontWeight: 700, lineHeight: 1.08 }}>
            22
          </div>
          <div style={{ fontSize: 44, paddingBottom: 26, opacity: 0.65 }}>
            星期二
          </div>
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.badge}
        out={T.calOut}
        x={RIGHT + 280}
        y={640}
        turn={10}
        bounce={1.3}
      >
        <div
          style={{
            padding: "14px 34px",
            fontSize: 52,
            ...sticker(34, C.lemon),
          }}
        >
          出来第{" "}
          <span style={{ fontWeight: 700, color: C.coralDeep }}>
            {daysOld(asOf)}
          </span>{" "}
          天
        </div>
      </Pop>
    </>
  );
};

const Pile: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.books || t > T.booksOut + 0.3) return null;
  const leave = ramp(t, T.booksOut, T.booksOut + 0.3, EASE.in);
  const count = Math.round(
    1000000 * ramp(t, T.books + 0.1, T.books + 1.9, EASE.out),
  );
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: RIGHT - 520,
          top: 150,
          opacity: 1 - leave,
          transform: `scale(${1 - 0.2 * leave})`,
        }}
      >
        <Books t={t - T.books - 0.15} width={1040} height={700} />
      </div>
      <Pop t={t} at={T.books} out={T.booksOut} x={RIGHT} y={170}>
        <div
          style={{
            padding: "10px 44px 14px",
            whiteSpace: "nowrap",
            ...sticker(40),
          }}
        >
          <span style={{ fontSize: 84, fontWeight: 700, color: C.coral }}>
            {comma(count)}
          </span>
          <span style={{ fontSize: 50 }}> 词元</span>
        </div>
      </Pop>
    </>
  );
};

const Dial: React.FC<{ t: number }> = ({ t }) => {
  const now = level(t);
  const angle = -72 + now * 36;
  const hand = ramp(t, 11.25, 11.4) - ramp(t, 11.8, 11.95);
  const tip = {
    x: 300 + Math.sin((angle * Math.PI) / 180) * 215,
    y: 300 - Math.cos((angle * Math.PI) / 180) * 215,
  };
  return (
    <Pop t={t} at={T.dial} out={T.dialOut} x={RIGHT} y={420}>
      <div
        style={{
          width: 680,
          padding: "24px 0 30px",
          textAlign: "center",
          ...sticker(48),
        }}
      >
        <div style={{ fontSize: 54 }}>思考程度</div>
        <svg width={600} height={350} viewBox="0 0 600 350">
          {LEVELS.map((label, i) => {
            const a = ((-72 + i * 36) * Math.PI) / 180;
            const on = Math.abs(now - i) < 0.5;
            return (
              <g key={label}>
                <circle
                  cx={300 + Math.sin(a) * 215}
                  cy={300 - Math.cos(a) * 215}
                  r={on ? 46 : 38}
                  fill={
                    on
                      ? C.lemon
                      : [C.mint, "#B9E3A0", C.lemon, C.coralLight, C.coral][i]
                  }
                  stroke={C.ink}
                  strokeWidth={6}
                />
                <text
                  x={300 + Math.sin(a) * 215}
                  y={300 - Math.cos(a) * 215 + (label.length > 1 ? 11 : 14)}
                  textAnchor="middle"
                  fontFamily={TEXT}
                  fontSize={label.length > 1 ? 30 : 40}
                  fill={C.ink}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <g transform={`rotate(${angle} 300 300)`}>
            <path d="M 286 300 L 300 136 L 314 300 Z" fill={C.ink} />
          </g>
          <circle
            cx={300}
            cy={300}
            r={30}
            fill={C.coral}
            stroke={C.ink}
            strokeWidth={6}
          />
          {/* 一只把它拧回去的手 */}
          <g
            transform={`translate(${tip.x + 26} ${tip.y + 30}) scale(${hand * 1.5})`}
            opacity={clamp(hand * 2)}
          >
            <path
              d="M 0 0 l 0 34 l 9 -8 l 7 15 l 8 -4 l -7 -14 l 12 -1 Z"
              fill={C.white}
              stroke={C.ink}
              strokeWidth={4}
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    </Pop>
  );
};

const Terminal: React.FC<{ t: number }> = ({ t }) => {
  const minutes = Math.round(192 * ramp(t, T.term + 0.5, 16.0, (v) => v));
  const turn = ramp(t, T.term + 0.5, 16.0, (v) => v) * 360 * 3.2;
  return (
    <>
      <Pop t={t} at={T.term} out={T.termOut} x={RIGHT} y={430}>
        <div
          style={{
            width: 760,
            height: 500,
            padding: "26px 40px",
            ...sticker(40, C.ink),
          }}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
            {[C.coral, C.lemon, C.mint].map((color) => (
              <span
                key={color}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: color,
                }}
              />
            ))}
          </div>
          {TASKS.map((task) => {
            const done = pop(t, task.at + 0.45, 1.3);
            return t >= task.at ? (
              <div
                key={task.text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  fontSize: 48,
                  lineHeight: 1.62,
                  color: C.white,
                  opacity: clamp((t - task.at) * 6),
                }}
              >
                <span style={{ fontFamily: MONO, color: C.lemon }}>›</span>
                <span style={{ flex: 1 }}>{task.text}</span>
                <span
                  style={{
                    color: C.mint,
                    fontFamily: TEXT,
                    fontWeight: 700,
                    transform: `scale(${t >= task.at + 0.45 ? done : 0})`,
                  }}
                >
                  ✓
                </span>
              </div>
            ) : null;
          })}
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.term + 0.4}
        out={T.termOut}
        x={RIGHT + 330}
        y={170}
        turn={6}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "10px 30px 10px 14px",
            fontSize: 48,
            whiteSpace: "nowrap",
            ...sticker(44, C.lemon),
          }}
        >
          <svg width={72} height={72} viewBox="0 0 72 72">
            <circle
              cx={36}
              cy={36}
              r={30}
              fill={C.white}
              stroke={C.ink}
              strokeWidth={6}
            />
            <line
              x1={36}
              y1={36}
              x2={36 + Math.sin((turn * Math.PI) / 180) * 20}
              y2={36 - Math.cos((turn * Math.PI) / 180) * 20}
              stroke={C.ink}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <line
              x1={36}
              y1={36}
              x2={36 + Math.sin((turn / 12) * (Math.PI / 180)) * 13}
              y2={36 - Math.cos((turn / 12) * (Math.PI / 180)) * 13}
              stroke={C.coral}
              strokeWidth={6}
              strokeLinecap="round"
            />
          </svg>
          {Math.floor(minutes / 60)} 小时 {minutes % 60} 分
        </div>
      </Pop>
    </>
  );
};

const Race: React.FC<{ t: number }> = ({ t }) => {
  const lanes = [
    { label: "上一代", seconds: 1.3, faded: true },
    { label: "我", seconds: 1.0, faded: false },
  ];
  return (
    <>
      <Pop t={t} at={T.race} x={RIGHT} y={440}>
        <div style={{ width: 820, padding: "30px 40px", ...sticker(44) }}>
          {lanes.map((lane, i) => {
            const p = ramp(
              t,
              T.race + 0.35,
              T.race + 0.35 + lane.seconds,
              EASE.soft,
            );
            return (
              <div
                key={lane.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginTop: i ? 22 : 0,
                }}
              >
                <span style={{ width: 150, fontSize: 46 }}>{lane.label}</span>
                <svg width={560} height={120} viewBox="0 0 560 120">
                  <line
                    x1={0}
                    y1={104}
                    x2={560}
                    y2={104}
                    stroke={C.ink}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray="2 18"
                  />
                  <rect
                    x={530}
                    y={12}
                    width={8}
                    height={94}
                    rx={4}
                    fill={C.ink}
                  />
                  <path
                    d="M 530 14 L 490 31 L 530 48 Z"
                    fill={C.coral}
                    stroke={C.ink}
                    strokeWidth={5}
                    strokeLinejoin="round"
                  />
                  <g opacity={lane.faded ? 0.5 : 1}>
                    <BuddyG
                      t={t}
                      seed={i + 4}
                      pose={{
                        ...REST,
                        x: mix(46, 470, p),
                        y: 100,
                        size: 36,
                        step: p * 9,
                        tilt: p < 1 ? 7 : 0,
                        lookX: 0.8,
                        mood: !lane.faded && p >= 1 ? "happy" : "smile",
                        wave: !lane.faded && p >= 1 ? 1 : 0,
                      }}
                    />
                  </g>
                </svg>
              </div>
            );
          })}
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.race + 1.4}
        x={RIGHT + 300}
        y={210}
        turn={8}
        bounce={1.3}
      >
        <div
          style={{
            padding: "12px 34px",
            fontSize: 58,
            ...sticker(36, C.lemon),
          }}
        >
          快三成
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.race + 1.9}
        x={RIGHT - 280}
        y={680}
        turn={-7}
        bounce={1.3}
      >
        <div
          style={{ padding: "12px 34px", fontSize: 50, ...sticker(36, C.mint) }}
        >
          还更便宜
        </div>
      </Pop>
    </>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Paper t={t} tint="#FFEADD" floorColor="#FBD3BC" />
    <Calendar t={t} />
    <Pile t={t} />
    <Dial t={t} />
    <Terminal t={t} />
    <Race t={t} />
  </>
);
