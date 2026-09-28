// 高架桥：一支笔从左往右画出桥面，剪影跟着笔尖铺开，再立起栏杆和路灯；车灯一盏一盏亮起沿桥流动，freeze 区间里慢慢停住
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { DUSK, EASE_IN_OUT } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 桥面上沿：左低右高（取自 city_walk 的构图）
export const DECK_SLOPE = 0.135;
export const deckTop = (x: number) => 790 - DECK_SLOPE * x;
const DECK_H = 64;
const RAIL_FROM = 880;
// 路灯立在文字右边，不压字
const POSTS = [1030, 1560];

const CARS = Array.from({ length: 28 }, (_, i) => {
  const r = (k: string) => random(`car-${i}-${k}`);
  const dir = r("dir") < 0.55 ? 1 : -1;
  return {
    dir,
    phase: r("p") * 2300,
    speed: 5 + r("v") * 6,
    appear: r("a"),
    color: dir === 1 ? (r("c") < 0.5 ? "255, 240, 210" : "255, 214, 150") : "236, 88, 70",
  };
});

export const Bridge: React.FC<{
  drawFrom: number;
  drawTo: number;
  railAt: number;
  postsAt: number;
  carsFrom: number;
  freezeFrom: number;
  freezeTo: number;
}> = ({ drawFrom, drawTo, railAt, postsAt, carsFrom, freezeFrom, freezeTo }) => {
  const frame = useCurrentFrame();
  const pen = interpolate(frame, [drawFrom, drawTo], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  if (pen <= 0) return null;
  // 笔尖最后要越过右边缘，渐隐的那一段才不会留在画面里
  const penX = -20 + pen * 2100;
  const rail = interpolate(frame, [railAt, railAt + 26], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const posts = interpolate(frame, [postsAt, postsAt + 20], [0, 1], clamp);

  const speedAt = (f: number) => interpolate(f, [freezeFrom, freezeTo], [1, 0], { ...clamp, easing: EASE_IN_OUT });
  let travelled = 0;
  for (let f = carsFrom; f < frame; f++) travelled += speedAt(f);

  const deckPath = `M-20 ${deckTop(-20)} L1940 ${deckTop(1940)}`;
  const railTop = (x: number) => deckTop(x) - 58;

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          {/* 剪影跟着笔尖铺开，边缘是一段渐隐而不是一刀切 */}
          <linearGradient id="wd-pen-edge" x1={penX - 110} y1={0} x2={penX + 10} y2={0} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <mask id="wd-bridge-reveal" maskUnits="userSpaceOnUse" x={-40} y={0} width={2000} height={1100}>
            <rect x={-40} y={0} width={2000} height={1100} fill="url(#wd-pen-edge)" />
          </mask>
          <linearGradient id="wd-under" x1={0} y1={450} x2={0} y2={1080} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b3533" />
            <stop offset="100%" stopColor="#1b1919" />
          </linearGradient>
          <clipPath id="wd-rail-reveal">
            <rect x={RAIL_FROM} y={0} width={rail * (1940 - RAIL_FROM)} height={1080} />
          </clipPath>
          <pattern id="wd-mesh" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={9} stroke={DUSK.silhouette} strokeWidth={1} />
          </pattern>
          <filter id="wd-car-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g mask="url(#wd-bridge-reveal)">
          {/* 桥下的暗 */}
          <polygon points={`-20,${deckTop(-20)} 1940,${deckTop(1940)} 1940,1100 -20,1100`} fill="url(#wd-under)" />
          {/* 桥面侧板 */}
          <polygon points={`-20,${deckTop(-20)} 1940,${deckTop(1940)} 1940,${deckTop(1940) + DECK_H} -20,${deckTop(-20) + DECK_H}`} fill="#3b3735" />
        </g>
        {/* 画桥的那一笔 */}
        <path d={deckPath} fill="none" stroke={DUSK.silhouette} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pen} />
        {/* 右半边的栏杆和网 */}
        <g clipPath="url(#wd-rail-reveal)">
          <polygon points={`${RAIL_FROM},${railTop(RAIL_FROM)} 1940,${railTop(1940)} 1940,${deckTop(1940)} ${RAIL_FROM},${deckTop(RAIL_FROM)}`} fill="url(#wd-mesh)" opacity={0.55} />
          <line x1={RAIL_FROM} y1={railTop(RAIL_FROM)} x2={1940} y2={railTop(1940)} stroke={DUSK.silhouette} strokeWidth={4} />
          {Array.from({ length: 17 }, (_, i) => {
            const x = RAIL_FROM + i * 66;
            return <line key={i} x1={x} y1={railTop(x)} x2={x} y2={deckTop(x)} stroke={DUSK.silhouette} strokeWidth={3} />;
          })}
        </g>
        {/* 路灯：还没有亮 */}
        {POSTS.map((x) => (
          <g key={x} opacity={posts}>
            <line x1={x} y1={deckTop(x)} x2={x} y2={deckTop(x) - 230} stroke={DUSK.silhouette} strokeWidth={5} />
            <path d={`M${x} ${deckTop(x) - 228} q 10 -22 46 -18`} fill="none" stroke={DUSK.silhouette} strokeWidth={4} />
            <ellipse cx={x + 52} cy={deckTop(x) - 245} rx={16} ry={5} fill={DUSK.silhouette} />
          </g>
        ))}
        {/* 车灯：各自奔赴各自的远方 */}
        {frame >= carsFrom &&
          CARS.map((c, i) => {
            const appear = interpolate(frame, [carsFrom + c.appear * 50, carsFrom + c.appear * 50 + 8], [0, 1], clamp);
            if (appear <= 0) return null;
            const x = ((((c.phase + c.dir * c.speed * travelled) % 2300) + 2300) % 2300) - 190;
            const y = deckTop(x) + (c.dir === 1 ? 22 : 42);
            return <circle key={i} cx={x} cy={y} r={4.5} fill={`rgb(${c.color})`} opacity={appear} filter="url(#wd-car-glow)" />;
          })}
      </svg>
    </AbsoluteFill>
  );
};
