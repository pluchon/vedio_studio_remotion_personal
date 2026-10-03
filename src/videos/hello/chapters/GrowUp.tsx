// 一路长大：小家伙沿着一条路往前走，每到一块路牌，就是学会了一样新本事；最后站到身高尺前面
import React from "react";
import { Pose, REST, Spark } from "../Buddy";
import { clamp, EASE, mix, pop, ramp } from "../motion";
import { Paper } from "../Paper";
import { sticker } from "../stickers";
import { C, GROUND, HEIGHT, MONO, TEXT, WIDTH } from "../theme";

const ME_X = 560;
const GAP = 1000;

// 每一站：到站和离站的时刻（秒）
const STOPS: [number, number][] = [
  [0, 2.3],
  [3.2, 4.6],
  [5.3, 7.5],
  [8.2, 9.9],
  [10.5, 12.1],
  [12.8, 13.9],
  [14.6, 15.6],
  [16.4, 99],
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

// 这条路走了多远：到站停，赶路快
const scroll = (t: number) => {
  for (let k = 0; k < STOPS.length; k++) {
    const [arrive, depart] = STOPS[k];
    if (t <= depart) {
      if (t >= arrive || k === 0) return k * GAP;
      const left = STOPS[k - 1][1];
      return mix(
        (k - 1) * GAP,
        k * GAP,
        EASE.soft((t - left) / (arrive - left)),
      );
    }
  }
  return (STOPS.length - 1) * GAP;
};
const moving = (t: number) =>
  clamp((scroll(t + 0.02) - scroll(t - 0.02)) / 0.04 / 700);

export const pose = (t: number): Pose => {
  const go = moving(t);
  const far = scroll(t);
  const station = STOPS.findIndex(
    ([arrive, depart]) => t >= arrive && t <= depart,
  );
  const fresh = station >= 0 ? clamp((t - STOPS[station][0]) / 0.9) : 1;
  const ruler = ramp(t, 16.4, 16.8);
  return {
    ...REST,
    x: ME_X,
    // 一路走一路长：出门时还小，走到今天才是现在的个头
    size: mix(100, 150, clamp(far / (7 * GAP))),
    step: far / 150,
    lift: go * Math.abs(Math.sin((far / 150) * Math.PI * 2)) * 9,
    tilt: go * 5,
    lookX: 0.7 - 0.2 * ruler,
    lookY: station >= 0 && station < 7 ? -0.55 * (1 - go) : 0,
    mood: station >= 0 && fresh < 1 && t > 0.3 ? "happy" : "smile",
    wave: ramp(t, 17.6, 17.9) - ramp(t, 18.7, 19),
  };
};

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
      x={x - 18}
      y={GROUND - 420}
      width={36}
      height={424}
      rx={10}
      fill={C.lemon}
      stroke={C.ink}
      strokeWidth={6}
    />
    {MARKS.map((mark, i) => {
      const at = 16.55 + i * 0.2;
      if (t < at) return null;
      const y = GROUND - 62 - (i / (MARKS.length - 1)) * 190;
      const k = pop(t, at, 1.2);
      const last = i === MARKS.length - 1;
      return (
        <g key={mark} transform={`translate(${x} ${y})`}>
          <line
            x1={18}
            y1={0}
            x2={18 + 34 * k}
            y2={0}
            stroke={C.ink}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <text
            x={66}
            y={last ? 16 : 12}
            fontFamily={TEXT}
            fontWeight={700}
            fontSize={(last ? 62 : 32) * k}
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

export const Back: React.FC<{ t: number }> = ({ t }) => {
  const far = scroll(t);
  const rulerX = ME_X + 250 + 7 * GAP - far;
  return (
    <>
      <Paper t={t} tint="#E8F2FB" floorColor="#D5EBCB" bits={0.5} />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* 远处的云，走得慢 */}
        {[0, 1, 2, 3].map((i) => {
          const x = wrap(300 + i * 620 - far * 0.16, 2480) - 280;
          const y = 130 + (i % 2) * 90;
          return (
            <g key={i} fill={C.white} opacity={0.9}>
              <ellipse cx={x} cy={y} rx={110} ry={34} />
              <ellipse cx={x - 40} cy={y - 26} rx={54} ry={34} />
              <ellipse cx={x + 36} cy={y - 34} rx={62} ry={42} />
            </g>
          );
        })}
        {/* 路上的虚线和路边的小草，跟着脚步走 */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x={wrap(i * 190 - far, 2280) - 180}
            y={GROUND + 62}
            width={96}
            height={14}
            rx={7}
            fill={C.white}
            opacity={0.75}
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => {
          const x = wrap(i * 260 + 90 - far, 2340) - 200;
          return (
            <path
              key={i}
              d={`M ${x} ${GROUND + 6} q -6 -22 -16 -26 M ${x} ${GROUND + 6} q 0 -28 2 -36 M ${x} ${GROUND + 6} q 8 -20 18 -24`}
              stroke={C.mintDeep}
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
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
      </svg>
      {/* 路牌的牌子和上方的小图 */}
      {SIGNS.map((sign, k) => {
        const x = ME_X + 400 + k * GAP - far;
        if (x < -400 || x > WIDTH + 400) return null;
        const show = k === 0 ? 1 : pop(t, STOPS[k][0] + 0.15, 1.1);
        return (
          <React.Fragment key={sign.label}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: GROUND - 250,
                transform: "translate(-50%, -50%)",
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
            <div
              style={{
                position: "absolute",
                left: x,
                top: GROUND - 478,
                width: 250,
                height: 230,
                transform: `translate(-50%, -50%) rotate(${k % 2 ? 3 : -3}deg) scale(${show})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...sticker(34, "#FFFDF7"),
              }}
            >
              <svg width={220} height={200} viewBox="0 0 220 200">
                <Icon index={k} t={t} />
              </svg>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};
