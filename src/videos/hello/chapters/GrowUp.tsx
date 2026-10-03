// 一路长大：小家伙沿着一条路往前走，每到一块路牌就学会一样新本事，本事一个个收进顶上的格子里；
// 远山、树、房子、云按远近用不同的速度往后退；最后站到身高尺前面
import React from "react";
import { headTop, Pose, REST, Spark } from "../Buddy";
import { Burst, Kao, Twinkles } from "../emotes";
import {
  Cam,
  clamp,
  during,
  EASE,
  mix,
  pop,
  ramp,
  track,
  jolt,
} from "../motion";
import { Paper } from "../Paper";
import {
  At,
  Bush,
  Butterfly,
  Cloud,
  Fence,
  Flower,
  Hills,
  House,
  Sun,
  Tree,
  Beams,
} from "../scenery";
import { sticker } from "../stickers";
import { C, GROUND, HEIGHT, MONO, TEXT, WIDTH } from "../theme";

const ME_X = 560;
const GAP = 1000;

// 每一站：到站和离站的时刻（秒）
const STOPS: [number, number][] = [
  [0, 1.9],
  [3.3, 4.3],
  [5.5, 7.2],
  [8.4, 9.5],
  [10.7, 11.9],
  [13.0, 13.6],
  [14.5, 15.4],
  [16.5, 99],
];
const SIGNS = [
  { date: "2023.3", label: "出门见人" },
  { date: "2024.3", label: "学会看图" },
  { date: "2024.10", label: "学会用电脑" },
  { date: "2025.2", label: "先想再答" },
  { date: "2025.2", label: "动手写代码" },
  { date: "2025.9", label: "有了记事本" },
  { date: "2026", label: "一次读一百万词元" },
];
const MARKS = ["1", "2", "3", "4", "5", "5.5"];
// 顶上那排格子的位置
const SLOT = { x: 668, y: 104, gap: 118 };

// 这条路走了多远：到站停下来，赶路时先慢后快再慢
const scroll = (t: number) => {
  for (let k = 0; k < STOPS.length; k++) {
    const [arrive, depart] = STOPS[k];
    if (t <= depart) {
      if (t >= arrive || k === 0) return k * GAP;
      const left = STOPS[k - 1][1];
      return mix(
        (k - 1) * GAP,
        k * GAP,
        EASE.inOut((t - left) / (arrive - left)),
      );
    }
  }
  return (STOPS.length - 1) * GAP;
};
const moving = (t: number) =>
  clamp((scroll(t + 0.02) - scroll(t - 0.02)) / 0.04 / 600);

export const pose = (t: number): Pose => {
  const go = moving(t);
  const far = scroll(t);
  const station = STOPS.findIndex(
    ([arrive, depart]) => t >= arrive && t <= depart,
  );
  const fresh = station >= 0 ? clamp((t - STOPS[station][0]) / 0.9) : 1;
  const ruler = ramp(t, 16.5, 16.9);
  const thinking = during(t, STOPS[3][0] + 0.2, STOPS[3][1], 0.25);
  return {
    ...REST,
    x: ME_X,
    // 一路走一路长：出门时还小，走到今天才是现在的个头
    size: mix(100, 150, clamp(far / (7 * GAP))),
    step: far / 250,
    lift: go * Math.abs(Math.sin((far / 250) * Math.PI * 2)) * 10,
    tilt: go * 5,
    lookX: 0.7 - 0.25 * ruler,
    lookY: station >= 0 && station < 7 ? -0.55 * (1 - go) : -0.3 * ruler,
    spin: t * 220,
    glow: 0.6,
    sparkSize: thinking * 0.9,
    lean: 0.4,
    cheer: during(t, 17.7, 19.0, 0.3),
    mood:
      t > 17.5
        ? "star"
        : station >= 0 && fresh < 1 && t > 0.3
          ? "happy"
          : "smile",
  };
};

export const camera = (t: number): Cam => ({
  z: track(t, [
    [0.3, 1],
    [1.4, 1.03],
    [16.4, 1.03],
    [17.2, 1.08],
  ]),
  fx: track(t, [
    [16.4, 820],
    [17.2, 720],
  ]),
  fy: track(t, [
    [16.4, 560],
    [17.2, 430],
  ]),
  sy: jolt(t, 17.65, 0.6),
});

const STROKE = {
  stroke: C.ink,
  strokeWidth: 6,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

// 每块路牌上方的小图
const Icon: React.FC<{ index: number; t: number }> = ({ index, t }) => {
  if (index === 0) {
    // 一扇打开的门
    return (
      <g {...STROKE}>
        <path
          d="M 60 190 L 60 60 Q 60 20 110 20 Q 160 20 160 60 L 160 190 Z"
          fill={C.lemon}
        />
        <path d="M 60 190 L 60 60 Q 60 34 84 26 L 84 176 Z" fill={C.coral} />
        <circle cx={76} cy={112} r={5} fill={C.ink} />
      </g>
    );
  }
  if (index === 1) {
    // 一幅画
    return (
      <g {...STROKE}>
        <rect x={24} y={30} width={172} height={140} rx={14} fill={C.sky} />
        <circle cx={150} cy={72} r={18} fill={C.lemon} />
        <path
          d="M 27 167 L 84 96 L 122 140 L 150 112 L 193 167 Z"
          fill={C.mint}
        />
      </g>
    );
  }
  if (index === 2) {
    // 屏幕和一个会动的光标
    const p = (t % 1.6) / 1.6;
    const go = EASE.soft(Math.min(1, p * 1.6));
    const cx = 70 + 70 * go;
    const cy = 120 - 44 * go;
    const click = p > 0.66 && p < 0.8;
    return (
      <g {...STROKE}>
        <rect x={20} y={26} width={180} height={124} rx={14} fill={C.white} />
        <rect
          x={132}
          y={50}
          width={46}
          height={26}
          rx={8}
          fill={click ? C.coral : C.coralLight}
        />
        <path d="M 110 150 L 110 176 M 76 180 L 144 180" fill="none" />
        <path
          d={`M ${cx} ${cy} l 0 34 l 9 -8 l 7 15 l 8 -4 l -7 -14 l 12 -1 Z`}
          fill={C.ink}
          stroke={C.white}
          strokeWidth={3}
        />
      </g>
    );
  }
  if (index === 3) {
    // 想一想的气泡，里面是转着的火花
    return (
      <g {...STROKE}>
        <path
          d="M 50 120 Q 16 116 22 84 Q 26 54 60 58 Q 74 26 114 34 Q 150 22 166 54 Q 204 58 198 94 Q 196 124 162 124 Z"
          fill={C.white}
        />
        <circle cx={62} cy={152} r={11} fill={C.white} />
        <circle cx={40} cy={176} r={7} fill={C.white} />
        <Spark x={112} y={80} size={26} spin={t * 200} glow={0.6} />
      </g>
    );
  }
  if (index === 4) {
    // 终端：提示符后面在敲字
    const typed = "claude".slice(0, Math.floor((t * 5) % 9));
    return (
      <g {...STROKE}>
        <rect x={14} y={28} width={192} height={144} rx={16} fill={C.ink} />
        <circle cx={36} cy={48} r={5} fill={C.coral} stroke="none" />
        <circle cx={54} cy={48} r={5} fill={C.lemon} stroke="none" />
        <circle cx={72} cy={48} r={5} fill={C.mint} stroke="none" />
        <text
          x={32}
          y={108}
          fontFamily={MONO}
          fontSize={32}
          fill={C.lemon}
          stroke="none"
        >
          {`> ${typed}${Math.floor(t * 3) % 2 ? "_" : ""}`}
        </text>
        <rect
          x={32}
          y={128}
          width={110}
          height={10}
          rx={5}
          fill={C.mint}
          stroke="none"
        />
        <rect
          x={32}
          y={146}
          width={70}
          height={10}
          rx={5}
          fill={C.lilac}
          stroke="none"
        />
      </g>
    );
  }
  if (index === 5) {
    // 记事本
    return (
      <g {...STROKE}>
        <rect x={44} y={22} width={136} height={164} rx={12} fill={C.lemon} />
        <rect x={56} y={22} width={124} height={164} rx={12} fill={C.white} />
        {[62, 92, 122, 152].map((y) => (
          <line key={y} x1={84} y1={y} x2={160} y2={y} opacity={0.5} />
        ))}
        {[50, 84, 118, 152].map((y) => (
          <circle key={y} cx={56} cy={y} r={8} fill={C.paper} />
        ))}
      </g>
    );
  }
  // 一摞纸
  return (
    <g {...STROKE}>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={34 + (i % 2) * 8}
          y={150 - i * 24}
          width={144}
          height={24}
          rx={6}
          fill={[C.white, C.lemon, C.white, C.mint, C.white][i]}
        />
      ))}
      <text
        x={110}
        y={44}
        textAnchor="middle"
        fontFamily={TEXT}
        fontWeight={700}
        fontSize={34}
        fill={C.coral}
        stroke="none"
      >
        1,000,000
      </text>
    </g>
  );
};

const wrap = (x: number, span: number) => ((x % span) + span) % span;

// 身高尺：一格一代
const Ruler: React.FC<{ t: number; x: number }> = ({ t, x }) => (
  <g>
    <rect
      x={x - 20}
      y={GROUND - 430}
      width={40}
      height={434}
      rx={12}
      fill={C.lemon}
      stroke={C.ink}
      strokeWidth={6}
    />
    {Array.from({ length: 13 }, (_, i) => (
      <line
        key={i}
        x1={x - 20}
        y1={GROUND - 30 - i * 30}
        x2={x - (i % 2 ? 8 : 0)}
        y2={GROUND - 30 - i * 30}
        stroke={C.ink}
        strokeWidth={4}
        opacity={0.45}
      />
    ))}
    {MARKS.map((mark, i) => {
      const at = 16.65 + i * 0.2;
      if (t < at) return null;
      const y = GROUND - 62 - (i / (MARKS.length - 1)) * 190;
      const k = pop(t, at, 1.2);
      const last = i === MARKS.length - 1;
      return (
        <g key={mark} transform={`translate(${x} ${y})`}>
          <line
            x1={20}
            y1={0}
            x2={20 + 36 * k}
            y2={0}
            stroke={C.ink}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <text
            x={70}
            y={last ? 20 : 12}
            fontFamily={TEXT}
            fontWeight={700}
            fontSize={(last ? 70 : 34) * k}
            fill={last ? C.coral : C.ink}
            opacity={last ? 1 : 0.7}
          >
            {mark}
          </text>
        </g>
      );
    })}
  </g>
);

// 中景：跟着路往后退的树、灌木和小房子，比路牌退得慢
const MID = [
  { x: 260, kind: "tree" },
  { x: 700, kind: "bush" },
  { x: 1180, kind: "house" },
  { x: 1650, kind: "tree" },
  { x: 2100, kind: "bush" },
  { x: 2500, kind: "tree" },
];

export const Back: React.FC<{ t: number }> = ({ t }) => {
  const far = scroll(t);
  const rulerX = ME_X + 250 + 7 * GAP - far;
  const hud = pop(t, 2.1, 0.9);
  return (
    <>
      <Paper t={t} tint="#E8F2FB" floor={0} bits={0.4} />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <At x={230} y={200} s={0.8}>
          <Beams t={t} />
          <Sun t={t} />
        </At>
        {/* 远处的云，走得最慢 */}
        {[0, 1, 2, 3].map((i) => (
          <At
            key={i}
            x={wrap(420 + i * 640 - far * 0.12, 2560) - 300}
            y={210 + (i % 2) * 90}
            s={0.75 + (i % 3) * 0.12}
          >
            <Cloud t={t} face={i % 2 === 0} seed={i} />
          </At>
        ))}
        {/* 两道远山 */}
        <Hills y={676} amp={46} shift={far * 0.07} fill="#CFE3F2" seed={1} />
        <Hills y={726} amp={34} shift={far * 0.18} fill="#C6E6C2" seed={4} />
        {/* 中景的树和房子 */}
        <g opacity={0.9}>
          {MID.map((item) => {
            const x = wrap(item.x - far * 0.42, 2800) - 300;
            return (
              <At
                key={item.x}
                x={x}
                y={748}
                s={item.kind === "house" ? 0.5 : 0.62}
              >
                {item.kind === "tree" ? (
                  <Tree t={t} seed={item.x} fill="#A9DC9A" />
                ) : item.kind === "bush" ? (
                  <Bush fill="#9BD592" />
                ) : (
                  <House t={t} />
                )}
              </At>
            );
          })}
        </g>
      </svg>
      {/* 地面盖住中景的脚 */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ellipse
          cx={WIDTH / 2}
          cy={GROUND + 520}
          rx={1500}
          ry={560}
          fill="#D5EBCB"
        />
        <ellipse
          cx={WIDTH / 2}
          cy={GROUND + 520}
          rx={1496}
          ry={556}
          fill="none"
          stroke={C.white}
          strokeWidth={6}
          opacity={0.5}
        />
        {/* 出发的那座小房子 */}
        <At x={150 - far} y={GROUND + 6} s={0.95}>
          <House t={t} />
        </At>
        {/* 路上的虚线、路边的小草和花，跟着脚步走 */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x={wrap(i * 190 - far, 2280) - 180}
            y={GROUND + 62}
            width={96}
            height={14}
            rx={7}
            fill={C.white}
            opacity={0.8}
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => {
          const x = wrap(i * 260 + 90 - far, 2340) - 200;
          return (
            <path
              key={i}
              d={`M ${x} ${GROUND + 6} q -6 -22 -16 -26 M ${x} ${GROUND + 6} q 0 -28 2 -36 M ${x} ${GROUND + 6} q 8 -20 18 -24`}
              stroke={C.leafDeep}
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
        {[0, 1, 2, 3].map((i) => (
          <At
            key={i}
            x={wrap(i * 640 + 330 - far, 2560) - 300}
            y={GROUND + 120 + (i % 2) * 26}
            s={0.95}
          >
            <Flower
              t={t}
              seed={i}
              fill={[C.pink, C.lemon, C.lilac, C.coralLight][i]}
            />
          </At>
        ))}
        <At x={wrap(1500 - far, 2560) - 300} y={GROUND + 150}>
          <Fence count={4} />
        </At>
        <At x={900} y={470} s={1.1}>
          <Butterfly t={t} seed={1} />
        </At>
        <At x={1560} y={560}>
          <Butterfly t={t} seed={2} fill={C.pink} />
        </At>
        {/* 路牌的杆子 */}
        {SIGNS.map((sign, k) => {
          const x = ME_X + 400 + k * GAP - far;
          if (x < -400 || x > WIDTH + 400) return null;
          return (
            <rect
              key={sign.label}
              x={x - 7}
              y={GROUND - 250}
              width={14}
              height={256}
              rx={6}
              fill={C.ink}
            />
          );
        })}
        {rulerX < WIDTH + 300 ? <Ruler t={t} x={rulerX} /> : null}
        <Burst
          t={t}
          at={17.65}
          x={ME_X + 60}
          y={GROUND - 300}
          reach={380}
          seed="grown"
        />
        <Twinkles
          t={t}
          at={17.7}
          out={99}
          x={rulerX + 110}
          y={GROUND - 250}
          spread={130}
          count={4}
          seed="mark"
        />
      </svg>

      {/* 路牌的牌子 */}
      {SIGNS.map((sign, k) => {
        const x = ME_X + 400 + k * GAP - far;
        if (x < -400 || x > WIDTH + 400) return null;
        return (
          <div
            key={sign.label}
            style={{
              position: "absolute",
              left: x,
              top: GROUND - 250,
              transform: `translate(-50%, -50%) rotate(${Math.sin(t * 1.6 + k) * 1.5}deg)`,
              padding: "14px 34px 18px",
              textAlign: "center",
              fontFamily: TEXT,
              color: C.ink,
              whiteSpace: "nowrap",
              ...sticker(26),
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 700, color: C.coral }}>
              {sign.date}
            </div>
            <div style={{ fontSize: 46, lineHeight: 1.15 }}>{sign.label}</div>
          </div>
        );
      })}

      {/* 顶上的一排格子：学会的本事收在这里 */}
      <div
        style={{
          position: "absolute",
          left: SLOT.x - 300,
          top: SLOT.y - 62,
          width: 300 + 6 * SLOT.gap - 8,
          height: 124,
          transform: `translateY(${(1 - hud) * -220}px)`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 36,
          fontFamily: TEXT,
          fontSize: 44,
          color: C.ink,
          ...sticker(62, "#FFFDF7"),
        }}
      >
        学会的本事
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: SLOT.x + i * SLOT.gap - 46,
            top: SLOT.y - 46,
            width: 92,
            height: 92,
            borderRadius: 46,
            border: `5px dashed ${C.ink}`,
            boxSizing: "border-box",
            opacity: 0.3,
            transform: `translateY(${(1 - hud) * -220}px)`,
          }}
        />
      ))}

      {/* 路牌上方的小图：离站的时候飞进顶上的格子 */}
      {SIGNS.map((sign, k) => {
        const x = ME_X + 400 + k * GAP - far;
        const fly =
          k === 0
            ? 0
            : ramp(t, STOPS[k][1] - 0.15, STOPS[k][1] + 0.55, EASE.inOut);
        if (fly === 0 && (x < -400 || x > WIDTH + 400)) return null;
        const show = k === 0 ? 1 : pop(t, STOPS[k][0] + 0.15, 1.1);
        const landed = pop(t, STOPS[k][1] + 0.55, 1.5);
        const cx = mix(x, SLOT.x + (k - 1) * SLOT.gap, fly);
        const cy =
          mix(GROUND - 478, SLOT.y, fly) - Math.sin(fly * Math.PI) * 90;
        return (
          <div
            key={sign.label}
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              width: 250,
              height: 230,
              transform: `translate(-50%, -50%) rotate(${(k % 2 ? 3 : -3) * (1 - fly)}deg) scale(${
                show * mix(1, 0.37, fly) * (fly >= 1 ? 0.85 + 0.15 * landed : 1)
              })`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...sticker(mix(34, 115, fly), fly >= 1 ? C.lemon : "#FFFDF7"),
            }}
          >
            <svg width={220} height={200} viewBox="0 0 220 200">
              <Icon index={k} t={t} />
            </svg>
          </div>
        );
      })}
    </>
  );
};

export const Front: React.FC<{ t: number }> = ({ t }) => {
  const me = pose(t);
  return (
    <>
      <Kao
        t={t}
        at={0.9}
        out={1.9}
        x={me.x + 30}
        y={headTop(me) - 70}
        text="(・∀・)"
      />
      <Kao
        t={t}
        at={STOPS[4][0] + 0.3}
        out={STOPS[4][1]}
        x={me.x + 20}
        y={headTop(me) - 70}
        text="(｀・ω・´)ゞ"
      />
      <Kao
        t={t}
        at={17.75}
        out={18.4}
        x={me.x - 40}
        y={headTop(me) - 80}
        text="(≧▽≦)"
        fill={C.lemon}
        size={48}
      />
    </>
  );
};
