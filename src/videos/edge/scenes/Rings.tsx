// 第三幕「越拉越远」：地球 → 太阳系 → 银河系 → 宇宙，每一层都有一圈朱砂的边；拉到最外面，问：边的外面是什么？
// 四层嵌在一起，以地球为锚点，用同一个缩放档位 λ 推拉：λ=0 看地球，1 看太阳系，2 看银河系，3 看宇宙
import React from "react";
import { random } from "remotion";
import { Draw, DrawDashed } from "../ink";
import { Big, Tag } from "../labels";
import { COLORS } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";
import { RINGS, ringPath } from "./Globe";

const PX = 960;
const PY = 520;
// 每升一档，下一层比上一层大多少倍
const F = 12;

const SUN_ORBIT = 100; // 地球轨道半径（太阳系坐标）
const HELIO = 470; // 太阳系的边
const SUN_IN_GALAXY = 236; // 太阳离银心多远
const GALAXY_R = 380;
const GALAXY_EDGE = 410;
const GAL_IN_UNIVERSE = 190;
const UNIVERSE_R = 400;

// 行星：轨道半径、点的大小、公转快慢（弧度/秒）、起始角
const PLANETS: [number, number, number, number][] = [
  [40, 3, 1.9, 0.5],
  [70, 5, 1.3, 2.4],
  [135, 4, 0.7, 4.0],
  [210, 10, 0.32, 1.0],
  [270, 9, 0.2, 3.3],
  [330, 6, 0.14, 5.0],
  [385, 6, 0.1, 2.0],
];

// 缩放档位随时间：每次推一档都是缓入缓出
const lambda = (t: number) => ease(t, 34.15, 35.7) + ease(t, 36.2, 37.9) + ease(t, 38.6, 40.7);

const gauss = (seed: string) => {
  const u = Math.max(1e-6, random(`${seed}-a`));
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random(`${seed}-b`));
};

// 一堆点画成一条路径：每个点是长度为 0 的短线，靠圆头显示
const dots = (pts: [number, number][]) => pts.map(([x, y]) => `M${x.toFixed(1)},${y.toFixed(1)}h0`).join("");

// 银河：两条主旋臂、两条小旋臂和中间的核球
const ARM_DOTS: [number, number][][] = [[], [], []];
for (let i = 0; i < 1500; i++) {
  const arm = i % 4;
  const u = random(`arm-u${i}`);
  const r = 36 + Math.pow(u, 0.85) * (GALAXY_R - 36);
  const theta = (arm * Math.PI) / 2 + Math.log(r / 36) * 2.6 + gauss(`arm-t${i}`) * (0.16 + 0.1 * u);
  const spread = gauss(`arm-s${i}`) * (4 + r * 0.025);
  const x = Math.cos(theta) * (r + spread);
  const y = Math.sin(theta) * (r + spread);
  ARM_DOTS[i % 3].push([x, y]);
}
for (let i = 0; i < 360; i++) {
  const r = Math.abs(gauss(`bulge-r${i}`)) * 30;
  const a = random(`bulge-a${i}`) * Math.PI * 2;
  ARM_DOTS[2].push([Math.cos(a) * r, Math.sin(a) * r * 0.8]);
}
const ARM_PATHS = ARM_DOTS.map(dots);

// 宇宙：圈里圈外撒满星系
const FIELD_IN: [number, number][][] = [[], [], []];
for (let i = 0; i < 260; i++) {
  const r = Math.sqrt(random(`fi-r${i}`)) * (UNIVERSE_R - 14);
  const a = random(`fi-a${i}`) * Math.PI * 2;
  FIELD_IN[i % 3].push([Math.cos(a) * r, Math.sin(a) * r]);
}
const FIELD_IN_PATHS = FIELD_IN.map(dots);
const FIELD_OUT: [number, number][][] = [[], [], []];
for (let i = 0; i < 700; i++) {
  const r = UNIVERSE_R + 20 + Math.sqrt(random(`fo-r${i}`)) * 2600;
  const a = random(`fo-a${i}`) * Math.PI * 2;
  FIELD_OUT[i % 3].push([Math.cos(a) * r, Math.sin(a) * r]);
}
const FIELD_OUT_PATHS = FIELD_OUT.map(dots);

const circle = (r: number) => `M${-r},0 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;

export const Rings: React.FC = () => {
  const t = useT();
  const lam = lambda(t);
  const scale = (k: number) => Math.pow(F, k - lam);
  const sE = scale(0);
  const sS = scale(1);
  const sG = scale(2);
  const sU = scale(3);

  // 锚点链：地球在 P；太阳在地球轨道的圆心；银心在太阳的左边；宇宙中心在银河的左边
  const sunX = PX - SUN_ORBIT * sS;
  const galX = sunX - SUN_IN_GALAXY * sG;
  const uniX = galX - GAL_IN_UNIVERSE * sU;

  // 镜头：拉到宇宙以后，推向宇宙的边
  const pan = ease(t, 41.6, 43.8) * (UNIVERSE_R - GAL_IN_UNIVERSE) * 0.0 + ease(t, 41.8, 43.8) * 200;
  const zoom = mix(1, 1.7, ease(t, 42.0, 44.4)) * mix(1, 0.62, ease(t, 48.6, 50.4));
  const camera = `translate(${PX} ${PY}) scale(${zoom}) translate(${-PX - pan} ${-PY})`;

  const levelOpacity = (k: number) => (k === 0 ? 1 : ramp(lam, k - 1, k - 0.55));
  const earthLon = 75 + t * 3.2;

  const edgeEarth = ease(t, 32.4, 33.8);
  const edgeSolar = ease(t, 35.3, 36.3);
  const edgeGalaxy = ease(t, 37.6, 38.6);
  const edgeUniverse = ease(t, 40.0, 41.2);

  // 外面的墨：从宇宙的边向外一点点漫开，又退回去
  const flood = easeOut(t, 45.3, 46.9);
  const drain = 1 - ease(t, 48.0, 49.6);
  const inkR = UNIVERSE_R + 3400 * flood;

  // 一条直线：从中间向两边画开
  const lineP = ease(t, 50.6, 52.4);
  const tickShift = ((t - 50.6) * 90) % 80;

  const tagFade = (k: number) => Math.max(0, 1 - Math.abs(lam - k) * 2.2);

  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="edge-core-glow">
            <stop offset="0%" stopColor="#d9a84e" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#d9a84e" stopOpacity={0} />
          </radialGradient>
          <filter id="edge-ink-soak" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="140" />
          </filter>
        </defs>
        <g transform={camera}>
          {/* 宇宙 */}
          {levelOpacity(3) > 0.01 ? (
            <g transform={`translate(${uniX} ${PY}) scale(${sU})`} opacity={levelOpacity(3) * (1 - ease(t, 50.2, 51.2))}>
              <g filter="url(#edge-rough)">
                {FIELD_IN_PATHS.map((d, i) => (
                  <path key={i} d={d} stroke={COLORS.ink} strokeWidth={(2.6 + i * 1.4) / sU} strokeLinecap="round" opacity={0.65} />
                ))}
                <g opacity={ease(t, 48.4, 50.2)}>
                  {FIELD_OUT_PATHS.map((d, i) => (
                    <path key={i} d={d} stroke={COLORS.ink} strokeWidth={(2.6 + i * 1.4) / sU} strokeLinecap="round" opacity={0.65} />
                  ))}
                </g>
                <g opacity={1 - ease(t, 48.6, 50.0)}>
                  <DrawDashed d={circle(UNIVERSE_R)} p={edgeUniverse} dash={`${10 / sU} ${12 / sU}`} width={4.5 / sU} color={COLORS.red} />
                </g>
              </g>
            </g>
          ) : null}

          {/* 墨：宇宙的边以外 */}
          {flood > 0.001 && drain > 0.001 ? (
            <g transform={`translate(${uniX} ${PY})`} opacity={drain}>
              <path
                d={`${circle(inkR)} ${circle(UNIVERSE_R)}`}
                fillRule="evenodd"
                fill={COLORS.night}
                filter="url(#edge-ink-soak)"
                opacity={0.96}
              />
            </g>
          ) : null}

          {/* 银河系 */}
          {levelOpacity(2) > 0.01 ? (
            <g transform={`translate(${galX} ${PY}) scale(${sG})`} opacity={levelOpacity(2)}>
              <g transform={`rotate(${t * 2.4})`}>
                <circle r={GALAXY_R * 0.55} fill="url(#edge-core-glow)" />
                <g filter="url(#edge-rough)">
                  {ARM_PATHS.map((d, i) => (
                    <path key={i} d={d} stroke={i === 2 ? COLORS.gold : COLORS.ink} strokeWidth={(i === 2 ? 5 : 3.4) / sG} strokeLinecap="round" opacity={0.7} />
                  ))}
                </g>
              </g>
              <g filter="url(#edge-rough)">
                <DrawDashed d={circle(GALAXY_EDGE)} p={edgeGalaxy} dash={`${10 / sG} ${12 / sG}`} width={4.5 / sG} color={COLORS.red} />
              </g>
            </g>
          ) : null}

          {/* 太阳系 */}
          {levelOpacity(1) > 0.01 ? (
            <g transform={`translate(${sunX} ${PY}) scale(${sS})`} opacity={levelOpacity(1)}>
              <g filter="url(#edge-rough)">
                {[40, 70, SUN_ORBIT, 135, 210, 270, 330, 385].map((r) => (
                  <path key={r} d={circle(r)} fill="none" stroke={COLORS.ink} strokeWidth={1.4 / sS} opacity={0.45} />
                ))}
                <circle r={17} fill={COLORS.gold} stroke={COLORS.ink} strokeWidth={2 / sS} />
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i / 12) * Math.PI * 2 + t * 0.2;
                  return (
                    <line key={i} x1={Math.cos(a) * 24} y1={Math.sin(a) * 24} x2={Math.cos(a) * 34} y2={Math.sin(a) * 34} stroke={COLORS.gold} strokeWidth={3 / sS} strokeLinecap="round" />
                  );
                })}
                {PLANETS.map(([r, size, speed, start], i) => {
                  const a = start + t * speed;
                  return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={size} fill={COLORS.paperLight} stroke={COLORS.ink} strokeWidth={1.8 / sS} />;
                })}
                <DrawDashed d={circle(HELIO)} p={edgeSolar} dash={`${10 / sS} ${12 / sS}`} width={4.5 / sS} color={COLORS.red} />
              </g>
            </g>
          ) : null}

          {/* 地球 */}
          <g transform={`translate(${PX} ${PY}) scale(${sE}) translate(${-PX} ${-PY})`} opacity={1 - ease(t, 37.0, 38.2) * 0.0}>
            <g filter="url(#edge-rough)">
              <circle cx={PX} cy={PY} r={66} fill={COLORS.sea} fillOpacity={0.8} />
              <clipPath id="edge-rings-disc">
                <circle cx={PX} cy={PY} r={66} />
              </clipPath>
              <g clipPath="url(#edge-rings-disc)">
                {RINGS.map((ring, i) => {
                  const d = ringPath(ring, earthLon, 66, PX, PY);
                  return d ? <path key={i} d={d} fill={COLORS.land} stroke={COLORS.ink} strokeWidth={1 / Math.max(sE, 0.2)} /> : null;
                })}
              </g>
              <circle cx={PX} cy={PY} r={66} fill="none" stroke={COLORS.ink} strokeWidth={3 / Math.max(sE, 0.08)} />
              <Draw d={`M${PX - 80},${PY} a80,80 0 1,0 160,0 a80,80 0 1,0 -160,0`} p={edgeEarth} width={5 / Math.max(sE, 0.08)} color={COLORS.red} />
            </g>
          </g>
        </g>

        {/* 一条没有端点的直线 */}
        <g filter="url(#edge-rough)">
          <Draw d={`M${PX},${PY} L${PX - 1000},${PY}`} p={lineP} width={5} />
          <Draw d={`M${PX},${PY} L${PX + 1000},${PY}`} p={lineP} width={5} />
          {lineP > 0.3
            ? Array.from({ length: 26 }, (_, i) => {
                const x = 60 + i * 80 + tickShift;
                const d = Math.abs(x - PX);
                if (d > 1000 * lineP) return null;
                return <line key={i} x1={x} x2={x} y1={PY - 14} y2={PY + 14} stroke={COLORS.ink} strokeWidth={2.4} opacity={0.7 * (1 - ease(t, 54.2, 55.0))} />;
              })
            : null}
          {lineP > 0.92 ? (
            <>
              <path d={`M${88},${PY - 22} L${58},${PY} L${88},${PY + 22}`} fill="none" stroke={COLORS.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M${1832},${PY - 22} L${1862},${PY} L${1832},${PY + 22}`} fill="none" stroke={COLORS.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : null}
        </g>
      </svg>

      <div style={{ position: "absolute", inset: 0 }}>
        <Tag x={PX} y={150} p={tagFade(0) * ramp(t, 32.5, 33.4)} size={40}>
          地球
        </Tag>
        <Tag x={PX} y={150} p={tagFade(1)} size={40}>
          太阳系
        </Tag>
        <Tag x={PX} y={150} p={tagFade(2)} size={40}>
          银河系
        </Tag>
        <Tag x={PX} y={150} p={tagFade(3) * (1 - ease(t, 42.0, 43.0))} size={40}>
          宇宙
        </Tag>
        <Big x={PX - 120} y={PY - 40} p={ramp(t, 40.6, 41.6) * (1 - ease(t, 42.0, 42.8))} size={150} color={COLORS.red} black>
          ?
        </Big>
        <Big x={PX + 330} y={PY - 160} p={ramp(t, 43.2, 44.0) * (1 - ease(t, 45.0, 45.8))} size={120} color={COLORS.red} black>
          ?
        </Big>
      </div>
    </>
  );
};
