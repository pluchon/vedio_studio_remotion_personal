// 我，Opus 5.5：一间小书房。生日、一口气能读多少、想多久可以调、拿手的活、比上一代快多少
import React, { useContext } from "react";
import { Books } from "../Books";
import { BuddyG, headTop, Pose, REST } from "../Buddy";
import { Burst, Kao, Twinkles } from "../emotes";
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
import { daysOld, Options } from "../options";
import { Paper } from "../Paper";
import { At, Bookshelf, Lamp, Plant, Rug, Window } from "../scenery";
import { Pop, sticker, Tag } from "../stickers";
import { C, floorY, GROUND, HEIGHT, MONO, TEXT, WIDTH } from "../theme";

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
const LEVEL_COLORS = [C.mint, "#B9E3A0", C.lemon, C.coralLight, C.coral];
const TASKS = [
  { text: "读完整个仓库", at: 12.7 },
  { text: "改了 37 个文件", at: 13.4 },
  { text: "跑测试，修到全绿", at: 14.3 },
  { text: "查了 12 篇资料", at: 15.0 },
  { text: "写好说明", at: 15.6 },
];

// 思考程度的指针指在第几档：默认是「中」，难的拧到「满」，简单的拧到「低」，最后又被拧回了「满」
const level = (t: number) =>
  1 +
  3 * ramp(t, 10.0, 10.5, EASE.out) -
  4 * ramp(t, 10.8, 11.2, EASE.out) +
  4 * ramp(t, 11.4, 11.75, EASE.out);

const comma = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const pose = (t: number): Pose => {
  const dial = during(t, T.dial, T.dialOut, 0.25);
  const awe = during(t, T.books + 0.2, T.books + 2.2, 0.3);
  const win = ramp(t, 18.0, 18.2);
  const flip = hop(t, T.cal + 1.45, 0.3, 50);
  const cheerHop = hop(t, 18.05, 0.36, 90);
  return {
    ...REST,
    x: ME_X,
    lift: flip.lift + cheerHop.lift,
    squash: flip.squash + cheerHop.squash,
    lookX: 0.8,
    lookY: -0.35 + 0.2 * win,
    lean: 0.3,
    spin: t * (140 + level(t) * 110),
    glow: 0.3 + level(t) * 0.17,
    sparkSize: dial * (0.55 + level(t) * 0.2),
    cheer: during(t, 18.1, 19.6, 0.25),
    wave: during(t, T.badge + 0.1, T.calOut - 0.2, 0.25),
    mood:
      awe > 0.5
        ? "wow"
        : win > 0.5
          ? "star"
          : t > T.badge && t < T.calOut
            ? "happy"
            : t > 16.1 && t < T.termOut
              ? "wink"
              : "smile",
  };
};

export const camera = (t: number): Cam => ({
  z: track(t, [
    [0.3, 1],
    [1.2, 1.03],
    [T.dial, 1.03],
    [T.dial + 0.8, 1.07],
    [T.termOut - 0.3, 1.07],
    [T.race + 0.4, 1.02],
  ]),
  fx: track(t, [
    [T.dial, 960],
    [T.dial + 0.8, 1180],
    [T.termOut - 0.3, 1180],
    [T.race + 0.4, 960],
  ]),
  fy: track(t, [
    [T.dial, 540],
    [T.dial + 0.8, 450],
    [T.termOut - 0.3, 450],
    [T.race + 0.4, 540],
  ]),
  sx: jolt(t, T.cal + 1.5, 1),
  sy:
    [0, 1, 2, 3, 4].reduce(
      (sum, i) => sum + jolt(t, T.books + 0.5 + i * 0.3, 0.45),
      0,
    ) +
    jolt(t, 16.05, 0.5) +
    jolt(t, 18.41, 0.6),
});

const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const { asOf } = useContext(Options);
  // 日历一页一页翻到 22 号
  const turning = ramp(t, T.cal + 0.35, T.cal + 1.45, EASE.out);
  const day = Math.max(1, Math.round(22 * turning));
  const flip = Math.abs(Math.sin(turning * Math.PI * 11)) * (1 - turning);
  return (
    <>
      <Pop
        t={t}
        at={T.cal}
        out={T.calOut}
        x={RIGHT}
        y={410}
        turn={-3}
        from={[520, -60]}
        to={[-120, 520]}
        float={5}
      >
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
          <div
            style={{
              fontSize: 250,
              fontWeight: 700,
              lineHeight: 1.08,
              transform: `scaleY(${1 - 0.5 * flip})`,
              transformOrigin: "50% 0%",
            }}
          >
            {day}
          </div>
          <div style={{ fontSize: 44, paddingBottom: 26, opacity: 0.65 }}>
            {turning >= 1 ? "星期二" : "……"}
          </div>
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.cal + 1.5}
        out={T.calOut}
        x={RIGHT - 210}
        y={590}
        turn={-14}
        bounce={1.5}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            border: `7px solid ${C.coralDeep}`,
            color: C.coralDeep,
            fontSize: 42,
            lineHeight: "136px",
            textAlign: "center",
            background: "rgba(255,255,255,0.7)",
            boxSizing: "border-box",
          }}
        >
          发布日
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
        <Tag fill={C.lemon} size={52}>
          出来第{" "}
          <span style={{ fontWeight: 700, color: C.coralDeep }}>
            {daysOld(asOf)}
          </span>{" "}
          天
        </Tag>
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
          top: 150 + leave * 300,
          opacity: 1 - leave,
          transform: `scale(${1 - 0.2 * leave})`,
        }}
      >
        <Books t={t - T.books - 0.15} width={1040} height={700} />
      </div>
      <Pop
        t={t}
        at={T.books}
        out={T.booksOut}
        x={RIGHT}
        y={170}
        from={[0, -260]}
        float={5}
      >
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
      <Pop
        t={t}
        at={T.books + 2.0}
        out={T.booksOut}
        x={RIGHT + 330}
        y={300}
        turn={8}
        bounce={1.3}
      >
        <Tag fill={C.mint} size={40}>
          约 55 万个英文单词
        </Tag>
      </Pop>
    </>
  );
};

const Dial: React.FC<{ t: number }> = ({ t }) => {
  const now = level(t);
  const angle = -72 + now * 36;
  const hand = during(t, 11.25, 11.95, 0.15);
  const point = (deg: number, r: number) => ({
    x: 300 + Math.sin((deg * Math.PI) / 180) * r,
    y: 300 - Math.cos((deg * Math.PI) / 180) * r,
  });
  const tip = point(angle, 215);
  const from = point(-72, 215);
  const to = point(72, 215);
  const reach = point(angle, 215);
  const near = clamp(Math.round(now), 0, 4);
  return (
    <Pop
      t={t}
      at={T.dial}
      out={T.dialOut}
      x={RIGHT}
      y={420}
      from={[560, 0]}
      to={[0, 520]}
      float={4}
    >
      <div
        style={{
          width: 680,
          padding: "24px 0 22px",
          textAlign: "center",
          ...sticker(48),
        }}
      >
        <div style={{ fontSize: 54 }}>思考程度</div>
        <svg width={600} height={340} viewBox="0 0 600 340">
          {/* 底下一道弧，走到哪亮到哪 */}
          <path
            d={`M ${from.x} ${from.y} A 215 215 0 0 1 ${to.x} ${to.y}`}
            stroke={C.ink}
            strokeWidth={30}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${from.x} ${from.y} A 215 215 0 0 1 ${to.x} ${to.y}`}
            stroke="#F4E6CF"
            strokeWidth={18}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${from.x} ${from.y} A 215 215 0 0 1 ${reach.x} ${reach.y}`}
            stroke={LEVEL_COLORS[near]}
            strokeWidth={18}
            strokeLinecap="round"
            fill="none"
          />
          {LEVELS.map((label, i) => {
            const p = point(-72 + i * 36, 215);
            const on = Math.abs(now - i) < 0.5;
            return (
              <g key={label}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? 48 : 38}
                  fill={on ? C.lemon : LEVEL_COLORS[i]}
                  stroke={C.ink}
                  strokeWidth={6}
                />
                <text
                  x={p.x}
                  y={p.y + (label.length > 1 ? 11 : 14)}
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
            <path d="M 286 300 L 300 150 L 314 300 Z" fill={C.ink} />
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
  const done = TASKS.filter((task) => t >= task.at + 0.45).length;
  return (
    <>
      <Pop
        t={t}
        at={T.term}
        out={T.termOut}
        x={RIGHT}
        y={430}
        from={[0, 560]}
        to={[-80, 520]}
      >
        <div
          style={{
            width: 760,
            height: 520,
            padding: "26px 40px",
            ...sticker(40, C.ink),
          }}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
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
          <div style={{ height: 340 }}>
            {TASKS.map((task) => {
              const tick = pop(t, task.at + 0.45, 1.3);
              return t >= task.at ? (
                <div
                  key={task.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    fontSize: 44,
                    lineHeight: 1.55,
                    color: C.white,
                    opacity: clamp((t - task.at) * 6),
                    transform: `translateX(${(1 - clamp((t - task.at) * 5)) * 40}px)`,
                  }}
                >
                  <span style={{ fontFamily: MONO, color: C.lemon }}>›</span>
                  <span style={{ flex: 1 }}>{task.text}</span>
                  <span
                    style={{
                      color: C.mint,
                      fontFamily: TEXT,
                      fontWeight: 700,
                      transform: `scale(${t >= task.at + 0.45 ? tick : 0})`,
                    }}
                  >
                    ✓
                  </span>
                </div>
              ) : null;
            })}
          </div>
          {/* 进度条 */}
          <div
            style={{
              height: 26,
              borderRadius: 13,
              background: "rgba(255,255,255,0.16)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${mix(4, 100, ramp(t, T.term + 0.5, 16.05, EASE.soft))}%`,
                height: "100%",
                borderRadius: 13,
                background: done >= TASKS.length ? C.mint : C.lemon,
              }}
            />
          </div>
        </div>
      </Pop>
      <Pop
        t={t}
        at={T.term + 0.4}
        out={T.termOut}
        x={RIGHT + 330}
        y={170}
        turn={6}
        from={[300, -100]}
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
      <Pop t={t} at={T.race} x={RIGHT} y={440} from={[560, 0]} float={4}>
        <div style={{ width: 860, padding: "30px 40px", ...sticker(44) }}>
          {lanes.map((lane, i) => {
            const p = ramp(
              t,
              T.race + 0.35,
              T.race + 0.35 + lane.seconds,
              EASE.soft,
            );
            const x = mix(56, 500, p);
            return (
              <div
                key={lane.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginTop: i ? 14 : 0,
                }}
              >
                <span style={{ width: 150, fontSize: 46 }}>{lane.label}</span>
                <svg width={600} height={150} viewBox="0 0 600 150">
                  <rect
                    x={0}
                    y={118}
                    width={600}
                    height={18}
                    rx={9}
                    fill="#F4E6CF"
                  />
                  <line
                    x1={10}
                    y1={127}
                    x2={590}
                    y2={127}
                    stroke={C.white}
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray="18 22"
                  />
                  {/* 终点的旗 */}
                  <rect
                    x={566}
                    y={18}
                    width={8}
                    height={112}
                    rx={4}
                    fill={C.ink}
                  />
                  <path
                    d="M 566 20 L 522 38 L 566 58 Z"
                    fill={C.coral}
                    stroke={C.ink}
                    strokeWidth={5}
                    strokeLinejoin="round"
                  />
                  {/* 跑起来时身后的风 */}
                  {!lane.faded && p > 0 && p < 1
                    ? [0, 1, 2].map((k) => (
                        <line
                          key={k}
                          x1={x - 60}
                          y1={70 + k * 20}
                          x2={x - 110 - k * 14}
                          y2={70 + k * 20}
                          stroke={C.coralLight}
                          strokeWidth={7}
                          strokeLinecap="round"
                        />
                      ))
                    : null}
                  <g opacity={lane.faded ? 0.5 : 1}>
                    <BuddyG
                      t={t}
                      seed={i + 4}
                      pose={{
                        ...REST,
                        x,
                        y: 122,
                        size: 44,
                        step: p * 7,
                        tilt: p > 0 && p < 1 ? 8 : 0,
                        lookX: 0.8,
                        mood: !lane.faded && p >= 1 ? "happy" : "smile",
                        cheer: !lane.faded && p >= 1 ? 1 : 0,
                        lift:
                          !lane.faded && p >= 1
                            ? Math.abs(Math.sin(t * 7)) * 12
                            : 0,
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
        x={RIGHT + 310}
        y={200}
        turn={8}
        bounce={1.3}
      >
        <Tag fill={C.lemon} size={60}>
          快三成
        </Tag>
      </Pop>
      <Pop
        t={t}
        at={T.race + 1.9}
        x={RIGHT - 300}
        y={690}
        turn={-7}
        bounce={1.3}
      >
        <Tag fill={C.mint} size={50}>
          还更便宜
        </Tag>
      </Pop>
    </>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Paper t={t} tint="#FFEADD" floorColor="#FBD3BC" backColor="#FDE0CE" />
    {/* 小书房：窗、书架、盆栽、落地灯、地毯，都画得淡一些，不抢右边的戏 */}
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <g opacity={0.85}>
        <At x={430} y={420} k={pop(t, 0.1, 0.9)}>
          <Window t={t} w={320} h={250} />
        </At>
        <At x={120} y={470} s={0.8} k={pop(t, 0.2, 0.9)}>
          <Bookshelf w={250} h={230} rows={2} seed="study" />
        </At>
        <At x={740} y={floorY(740) + 6} s={0.92} k={pop(t, 0.3, 1.1)}>
          <Lamp />
        </At>
        <At x={130} y={floorY(130) + 24} s={1.05} k={pop(t, 0.25, 1.2)}>
          <Plant t={t} seed={2} />
        </At>
      </g>
      <At x={ME_X} y={GROUND + 12} k={pop(t, 0.1)}>
        <Rug w={260} fill={C.pink} />
      </At>
    </svg>
    <Calendar t={t} />
    <Pile t={t} />
    <Dial t={t} />
    <Terminal t={t} />
    <Race t={t} />
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Burst
        t={t}
        at={T.cal + 1.5}
        x={RIGHT}
        y={430}
        reach={300}
        count={12}
        ring={null}
        seed="day"
      />
      <Twinkles
        t={t}
        at={T.books + 1.9}
        out={T.booksOut}
        x={RIGHT}
        y={170}
        spread={300}
        seed="million"
      />
      <Burst
        t={t}
        at={16.05}
        x={RIGHT}
        y={430}
        reach={420}
        count={14}
        seed="done"
      />
      <Burst
        t={t}
        at={T.race + 1.36}
        x={RIGHT + 150}
        y={480}
        reach={300}
        count={14}
        seed="win"
      />
    </svg>
  </>
);

export const Front: React.FC<{ t: number }> = ({ t }) => {
  const me = pose(t);
  return (
    <>
      <Kao
        t={t}
        at={T.badge + 0.2}
        out={T.calOut}
        x={me.x + 20}
        y={headTop(me) - 70}
        text="(｡･ω･｡)"
      />
      <Kao
        t={t}
        at={T.books + 0.6}
        out={T.books + 2.4}
        x={me.x + 20}
        y={headTop(me) - 70}
        text="Σ(ﾟДﾟ)"
      />
      <Kao
        t={t}
        at={11.75}
        out={T.dialOut + 0.2}
        x={me.x + 250}
        y={headTop(me) + 40}
        text="(｀・ω・´)"
        turn={8}
        fill={C.lemon}
      />
      <Kao
        t={t}
        at={16.15}
        out={T.termOut}
        x={me.x + 20}
        y={headTop(me) - 70}
        text="(￣▽￣)ゞ"
      />
      <Kao
        t={t}
        at={18.3}
        out={19.2}
        x={me.x + 20}
        y={headTop(me) - 90}
        text="(≧▽≦)"
        fill={C.lemon}
        size={46}
      />
    </>
  );
};
