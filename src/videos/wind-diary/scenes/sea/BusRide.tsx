// 公交车窗外：楼越来越矮，山越来越多，最后露出一线海；车顶的电子屏报站
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { DAY, EASE_OUT, FONTS } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const GROUND = 830;
const SPEED = 30;
const ROUTE = 4200;

// 路线上的城市密度与山的高度（按路程 x 变化）
const city = (x: number) => Math.max(0, 1 - x / 2600) ** 0.8;
const hills = (x: number) => Math.min(1, Math.max(0, (x - 500) / 1800));

// 沿路的楼：宽窄不一、高低不一
const BLOCKS = (() => {
  const list: { x: number; w: number; h: number }[] = [];
  let x = -400;
  let i = 0;
  while (x < ROUTE + 2400) {
    const w = 50 + random(`bus-w-${i}`) * 110;
    list.push({ x, w, h: 60 + random(`bus-h-${i}`) * 330 });
    x += w + random(`bus-g-${i}`) * 18;
    i++;
  }
  return list;
})();

// 一层山的剪影：parallax 越小越远
const ridge = (scroll: number, parallax: number, height: number, seed: number) => {
  const pts: string[] = [`-20,${GROUND}`];
  for (let sx = -20; sx <= 1940; sx += 20) {
    const x = sx + scroll * parallax;
    const h = height * hills(scroll + sx) * (0.7 + 0.3 * Math.sin(x / 330 + seed) + 0.18 * Math.sin(x / 120 + seed * 2));
    pts.push(`${sx},${(GROUND - Math.max(0, h)).toFixed(1)}`);
  }
  pts.push(`1940,${GROUND}`);
  return pts.join(" ");
};

export const BusRide: React.FC<{ from: number; to: number; arriveAt: number }> = ({ from, to, arriveAt }) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 1) return null;
  const t = frame - from;
  const scroll = t * SPEED;
  const sway = Math.sin(frame / 5) * 2.5 + Math.sin(frame / 2.3) * 0.8;
  const seaIn = interpolate(scroll, [ROUTE * 0.62, ROUTE * 0.85], [0, 1], clamp);
  const opacity = interpolate(frame, [from, from + 12, to - 12, to], [0, 1, 1, 0], clamp);
  const arrived = frame >= arriveAt;

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ transform: `translateY(${sway}px) scale(1.02)` }}>
        <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${DAY.skyHigh} 0%, ${DAY.sky} 60%, #eef7f6 ${(GROUND / 1080) * 100}%)` }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <polygon points={ridge(scroll, 0.25, 260, 1)} fill="#a9c7c3" />
          {/* 一线海：在远山脚下慢慢露出来 */}
          <rect x={0} y={GROUND - 34} width={1920} height={34} fill={DAY.sea} opacity={seaIn} />
          <polygon points={ridge(scroll, 0.5, 190, 4)} fill="#7faa98" />
          {BLOCKS.map((blk, i) => {
            const sx = blk.x - scroll * 0.9;
            if (sx + blk.w < -20 || sx > 1940) return null;
            const h = blk.h * city(blk.x);
            if (h < 4) return null;
            return <rect key={i} x={sx} y={GROUND - h} width={blk.w} height={h} fill="#93aab3" opacity={0.9} />;
          })}
          <rect x={0} y={GROUND} width={1920} height={1080 - GROUND} fill="#c9c6b3" />
          {/* 路边一闪而过的栏杆 */}
          {Array.from({ length: 40 }, (_, i) => {
            const x = ((i * 90 - scroll * 1.6) % 3600 + 3600) % 3600 - 100;
            return <rect key={i} x={x} y={GROUND + 10} width={6} height={90} fill="#8c8a7c" opacity={0.6} />;
          })}
        </svg>
        {/* 车窗玻璃的反光 */}
        <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 42%, rgba(255,255,255,0) 52%)" }} />
      </AbsoluteFill>
      {/* 车窗框 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path
          fillRule="evenodd"
          fill="#2e3a3c"
          d="M0 0 H1920 V1080 H0 Z M150 150 H1770 A40 40 0 0 1 1810 190 V960 A40 40 0 0 1 1770 1000 H150 A40 40 0 0 1 110 960 V190 A40 40 0 0 1 150 150 Z"
        />
      </svg>
      {/* 电子报站屏 */}
      <div
        style={{
          position: "absolute",
          left: 660,
          top: 40,
          width: 600,
          height: 76,
          borderRadius: 10,
          backgroundColor: "#141816",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.hand,
          fontSize: 40,
          letterSpacing: "0.3em",
          color: "#ffb347",
          textShadow: "0 0 10px rgba(255, 170, 60, 0.8)",
        }}
      >
        {/* 换字时闪两下，像电子屏刷新 */}
        <span style={{ opacity: interpolate(frame - (arrived ? arriveAt : from + 6), [0, 3, 6, 9], [0, 1, 0.3, 1], clamp) }}>
          {arrived ? "杨梅坑 · 到了" : "下一站 · 杨梅坑"}
        </span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 128, textAlign: "center", fontFamily: FONTS.latin, fontStyle: "italic", fontSize: 24, color: "rgba(255,255,255,0.55)", ...fadeIn(frame, from + 14) }}>
        {arrived ? "Yangmeikeng — we're here." : "Next stop: Yangmeikeng"}
      </div>
    </AbsoluteFill>
  );
};

const fadeIn = (frame: number, at: number) => ({
  opacity: interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: EASE_OUT }),
});
