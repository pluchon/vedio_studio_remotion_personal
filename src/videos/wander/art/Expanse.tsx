// 五 · 疆域（155–186 秒）：2:35 配乐回来，舰队从轨道环四散出发；一颗、十颗、一千颗点亮的星图；
// 四个各不相同的新家园；戴森环一层层合拢、小行星被拆开、塔从卫星上立起来；星系尺度上一道光慢慢走过整片疆域
import { BlurMask, Circle, Group, LinearGradient, Oval, Path, Rect, Skia, vec } from "@shopify/react-native-skia";
import React from "react";
import { useT } from "../time";
import { Planet, Sun } from "./bodies";
import { NetMap, Skyline, makeNet } from "./props";
import { Bloom, H, Shot, W, lerp, rng, smooth } from "./sk";
import { Nebula, SpiralGalaxy, StarLayer } from "./space";
import { DuskWorld, Motes, Ridge, ridgeLine } from "./world";

// 1 · 可它们没有停步（154.6–159.6 秒）：轨道环上一下子放出几十艘船，光迹向右上方的星空扇形散开
const FLEET = (() => {
  const r = rng(301);
  return Array.from({ length: 46 }, () => ({ a: -0.25 - r() * 1.1, sp: 0.6 + r() * 0.8, delay: r() * 1.4, curve: (r() - 0.5) * 0.4, from: r() }));
})();
export const Fleet: React.FC = () => {
  const t = useT();
  const c: [number, number] = [430, 760];
  const R = 330;
  const push = lerp(1.04, 1, smooth(154.6, 159.6, t));
  const shake = Math.max(0, 1 - Math.abs(t - 155.1) / 0.5) * 4;
  return (
    <Shot>
      <Group transform={[{ translateX: W / 2 + Math.sin(t * 40) * shake }, { translateY: H / 2 }, { scale: push }, { translateX: -W / 2 }, { translateY: -H / 2 }]}>
        <Nebula t={t} cam={[10.4, 0.2]} glow={0.55} tintA={[0.36, 0.2, 0.7]} />
        <StarLayer t={t} seed={311} n={800} spikes={false} />
        <Planet x={c[0]} y={c[1]} R={R} t={t} rot={3.4 + t * 0.03} light={[0.6, 0.5, 0.4]} cities={1} />
        <Path path={`M${c[0] - R * 1.7} ${c[1]} A${R * 1.7} ${R * 0.36} 0 0 0 ${c[0] + R * 1.7} ${c[1]}`} style="stroke" strokeWidth={9} color="#bfe0ff" opacity={0.55}>
          <BlurMask blur={2} style="normal" />
        </Path>
        <Bloom radius={18} strength={1} threshold={0.5}>
          {FLEET.map((f, i) => {
            const k = Math.max(0, t - 155.0 - f.delay * 0.6) * f.sp;
            if (k <= 0) return null;
            const sx = c[0] + Math.cos(Math.PI * f.from) * R * 1.7;
            const sy = c[1] + Math.sin(Math.PI * f.from) * R * 0.36;
            const d = 900 * (1 - Math.exp(-k * 0.8)) + k * 120;
            const a = f.a + f.curve * Math.min(1, k);
            const hx = sx + Math.cos(a) * d;
            const hy = sy + Math.sin(a) * d;
            const tail = Math.min(d, 260);
            return (
              <Group key={i}>
                <Path path={`M${hx - Math.cos(a) * tail} ${hy - Math.sin(a) * tail} L${hx} ${hy}`} style="stroke" strokeWidth={2.4} strokeCap="round" opacity={0.85}>
                  <LinearGradient start={vec(hx - Math.cos(a) * tail, hy - Math.sin(a) * tail)} end={vec(hx, hy)} colors={["rgba(255,210,150,0)", "#ffe2b0"]} />
                </Path>
                <Circle cx={hx} cy={hy} r={3.4} color="#ffffff" />
              </Group>
            );
          })}
        </Bloom>
      </Group>
    </Shot>
  );
};

// 2 · 一颗，十颗，一千颗（159.2–163.8 秒）：一张深蓝的星图，暖色的灯按对数速度一颗颗点亮，航线连成网
const NET = () => makeNet(77, 1100, [520, 600], [80, 60, 1760, 960]);
const countAt = (t: number) => {
  if (t < 159.5) return 1 + smooth(158.8, 159.5, t) * 0.3;
  if (t < 160.3) return Math.pow(10, (t - 159.5) / 0.8);
  if (t < 161.3) return Math.pow(10, 1 + ((t - 160.3) / 1.0) * 2);
  return lerp(1000, 1100, smooth(161.3, 163, t));
};
export const Count: React.FC = () => {
  const t = useT();
  const net = NET();
  const zoom = lerp(1.9, 1.0, smooth(159.2, 162.2, t));
  const rings = [200, 420, 640, 860];
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#06102a", "#0a1838", "#061026"]} />
      </Rect>
      <Group transform={[{ translateX: 520 }, { translateY: 600 }, { scale: zoom }, { translateX: -520 }, { translateY: -600 }]}>
        {rings.map((r, i) => (
          <Circle key={i} cx={520} cy={600} r={r} style="stroke" strokeWidth={1} color="#4f7fc0" opacity={0.18} />
        ))}
        <StarLayer t={t} seed={321} n={900} spikes={false} opacity={0.55} />
        <Bloom radius={14} strength={1} threshold={0.45}>
          <NetMap net={net} count={countAt(t)} scale={1 / Math.sqrt(zoom)} />
        </Bloom>
      </Group>
    </Shot>
  );
};

// 3 · 陌生的恒星旁，接连安下家园（163.4–169.4 秒）：四个一闪而过的新世界，各有各的颜色
// a 红色沙漠：两颗月亮、沙丘、圆顶城
export const DesertHome: React.FC = () => {
  const t = useT();
  const lit = smooth(163.8, 164.6, t);
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#3a1630", "#a8484a", "#f0a070"]} />
      </Rect>
      <Circle cx={1400} cy={240} r={90} color="#ffe2c8" opacity={0.9} />
      <Circle cx={1380} cy={230} r={84} color="#e8b8a0" />
      <Circle cx={1600} cy={360} r={34} color="#ffd8c0" opacity={0.9} />
      <Ridge pts={ridgeLine(0, W, 700, 60, 331)} color="#8a3a34" rim="#ffb08a" rimWidth={2} />
      <Ridge pts={ridgeLine(0, W, 830, 50, 332)} color="#5a2028" rim="#ff9a7a" rimWidth={2} />
      <Group transform={[{ translateX: lerp(0, -40, smooth(163.4, 165.2, t)) }]}>
        {[
          [700, 860, 120],
          [880, 880, 80],
          [1000, 870, 150],
          [1200, 890, 90],
        ].map(([x, y, r], i) => (
          <Group key={i}>
            <Path path={`M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y} Z`} color="#2a1018" />
            <Path path={`M${x - r * 0.8} ${y - r * 0.4} A${r} ${r} 0 0 1 ${x + r * 0.8} ${y - r * 0.4}`} style="stroke" strokeWidth={3} color="#ffcf8a" opacity={lit} />
            <Circle cx={x} cy={y - r * 0.5} r={r * 0.4} color="#ffb85a" opacity={0.35 * lit}>
              <BlurMask blur={r * 0.4} style="normal" />
            </Circle>
          </Group>
        ))}
      </Group>
      <Rect x={0} y={890} width={W} height={H - 890} color="#3a1420" />
      <Motes t={t} seed={341} n={40} color="#ffd0b0" size={2} blur={1} drift={[80, 6]} opacity={0.6} />
    </Shot>
  );
};
// b 冰卫星：头顶一颗带条纹的巨行星，冰原上一排发光的舱
const GIANT_BANDS = Array.from({ length: 9 }, (_, i) => i);
export const IceHome: React.FC = () => {
  const t = useT();
  const lit = smooth(165.2, 166.0, t);
  const clip = Skia.Path.Make();
  clip.addCircle(1180, 340, 420);
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#020814", "#0a1a38", "#1a3a5a"]} />
      </Rect>
      <StarLayer t={t} seed={351} n={300} spikes={false} opacity={0.7} />
      <Group clip={clip}>
        {GIANT_BANDS.map((i) => (
          <Rect key={i} x={760} y={-80 + i * 94 + Math.sin(i * 1.7 + t * 0.3) * 6} width={840} height={94} color={i % 2 ? "#c89a6a" : "#e8c494"} />
        ))}
        <Oval x={1260} y={420} width={140} height={70} color="#a85a3a" />
        <Rect x={760} y={-80} width={840} height={840}>
          <LinearGradient start={vec(1500, 0)} end={vec(900, 0)} colors={["rgba(0,0,0,0)", "rgba(2,6,20,0.85)"]} />
        </Rect>
      </Group>
      <Ridge pts={ridgeLine(0, W, 760, 40, 352)} color="#b8d8f0" rim="#ffffff" rimWidth={2} />
      <Rect x={0} y={780} width={W} height={H - 780}>
        <LinearGradient start={vec(0, 780)} end={vec(0, H)} colors={["#9ac0e0", "#4a7aa8"]} />
      </Rect>
      {[420, 560, 700, 840, 980].map((x, i) => (
        <Group key={i}>
          <Oval x={x - 50} y={800 + i * 8} width={100} height={60} color="#d8ecff" />
          <Oval x={x - 30} y={810 + i * 8} width={60} height={24} color="#ffd38a" opacity={lit} />
          <Circle cx={x} cy={822 + i * 8} r={60} color="#ffd38a" opacity={0.3 * lit}>
            <BlurMask blur={30} style="normal" />
          </Circle>
        </Group>
      ))}
      <Motes t={t} seed={353} n={50} color="#ffffff" size={2} blur={1} drift={[-20, 30]} opacity={0.7} />
    </Shot>
  );
};
// c 海洋世界：极光下的海面，浮着几座发光的平台
export const OceanHome: React.FC = () => {
  const t = useT();
  const lit = smooth(166.7, 167.4, t);
  return (
    <Shot>
      <DuskWorld t={t} sun={[960, 1200]} horizon={620} night={0.95} />
      {[0, 1, 2].map((i) => (
        <Path
          key={i}
          path={`M-100 ${200 + i * 50} Q480 ${80 + i * 40 + Math.sin(t + i) * 30} 960 ${220 + i * 30} T${W + 100} ${160 + i * 60}`}
          style="stroke"
          strokeWidth={60 - i * 12}
          color={i === 1 ? "#7affc0" : "#5ad8ff"}
          opacity={0.18}
        >
          <BlurMask blur={30} style="normal" />
        </Path>
      ))}
      {[
        [520, 700, 1.2],
        [1100, 660, 0.8],
        [1500, 740, 1.4],
      ].map(([x, y, s], i) => (
        <Group key={i} transform={[{ translateX: 0 }, { translateY: Math.sin(t * 1.4 + i) * 4 }]}>
          <Rect x={x - 120 * s} y={y} width={240 * s} height={18 * s} color="#1a1e2a" />
          <Skyline seed={360 + i} base={y} x0={x - 100 * s} x1={x + 100 * s} minH={20 * s} maxH={110 * s} lit={lit} color="#141824" window="#ffd38a" />
          <Oval x={x - 140 * s} y={y + 20 * s} width={280 * s} height={40 * s} color="#ffd38a" opacity={0.25 * lit}>
            <BlurMask blur={20} style="normal" />
          </Oval>
        </Group>
      ))}
    </Shot>
  );
};
// d 潮汐锁定的世界：一半永昼一半永夜，晨昏线上一圈灯
export const LockedHome: React.FC = () => {
  const t = useT();
  const lit = smooth(168.0, 168.8, t);
  const ring = Array.from({ length: 40 }, (_, i) => i);
  return (
    <Shot>
      <Nebula t={t} cam={[11.2, 0.6]} glow={0.4} tintA={[0.5, 0.2, 0.3]} />
      <StarLayer t={t} seed={371} n={600} spikes={false} />
      <Bloom radius={24} strength={0.9} threshold={0.5}>
        <Sun x={180} y={520} R={70} t={t} />
      </Bloom>
      <Planet x={1100} y={540} R={360} t={t} rot={0.5} light={[-1, 0, 0.02]} cities={0} look={{ sea: [0.35, 0.3, 0.28], land: [0.75, 0.55, 0.35], air: [1.0, 0.7, 0.5] }} clouds={0.3} />
      <Bloom radius={16} strength={1} threshold={0.5}>
        {ring.map((i) => {
          const a = (i / ring.length) * Math.PI * 2;
          const y = 540 + Math.sin(a) * 340;
          const x = 1100 + Math.cos(a) * 26;
          const front = Math.cos(a) > -0.2;
          return front ? <Circle key={i} cx={x} cy={y} r={4} color="#ffd38a" opacity={lit * smooth(168.0 + (i % 10) * 0.05, 168.6 + (i % 10) * 0.05, t)} /> : null;
        })}
      </Bloom>
    </Shot>
  );
};

// 4 · 它们收拢整颗恒星的光，拆开小行星，筑起高塔（169.0–175.4 秒）
const SWARM = (() => {
  const r = rng(381);
  return Array.from({ length: 360 }, (_, i) => ({ ring: i % 4, a: r() * Math.PI * 2, at: 169.3 + r() * 4.5, s: 5 + r() * 6 }));
})();
const ROCKS = (() => {
  const r = rng(382);
  return Array.from({ length: 26 }, () => ({ dx: (r() - 0.5) * 120, dy: (r() - 0.5) * 100, s: 6 + r() * 16, ph: r() }));
})();
export const Swarm: React.FC = () => {
  const t = useT();
  const sc: [number, number] = [1080, 470];
  const cover = smooth(169.4, 174.6, t);
  const tilts = [-0.3, 0.25, 0.9, -1.0];
  const split = smooth(169.6, 171.2, t);
  const towers = smooth(171.0, 174.8, t);
  return (
    <Shot>
      <Nebula t={t} cam={[11.8, 0.2]} glow={0.45} />
      <StarLayer t={t} seed={391} n={700} spikes={false} />
      <Bloom radius={30} strength={1} threshold={0.5}>
        <Sun x={sc[0]} y={sc[1]} R={110} t={t} opacity={1 - cover * 0.55} />
        {SWARM.map((p, i) => {
          const on = smooth(p.at, p.at + 0.6, t);
          if (on <= 0) return null;
          const a = p.a + t * (0.25 + p.ring * 0.06);
          const rx = 230 + p.ring * 34;
          const ry = 70 + p.ring * 16;
          const tl = tilts[p.ring];
          const ex = Math.cos(a) * rx;
          const ey = Math.sin(a) * ry;
          const x = sc[0] + ex * Math.cos(tl) - ey * Math.sin(tl);
          const y = sc[1] + ex * Math.sin(tl) + ey * Math.cos(tl);
          const front = Math.sin(a) > 0;
          return <Rect key={i} x={x - p.s / 2} y={y - p.s / 2} width={p.s} height={p.s * 0.6} color={front ? "#ffcf7a" : "#c88a4a"} opacity={on * (front ? 1 : 0.55)} />;
        })}
      </Bloom>
      {/* 被拆开的小行星：碎块分开，一串串流向恒星 */}
      {ROCKS.map((k, i) => {
        const x0 = 330 + k.dx * (1 + split * 2.5);
        const y0 = 760 + k.dy * (1 + split * 2.5);
        const fly = smooth(170.6 + k.ph * 2, 173 + k.ph * 2, t);
        const x = lerp(x0, sc[0] - 240, fly);
        const y = lerp(y0, sc[1] + 60, fly) - Math.sin(fly * Math.PI) * 120;
        return <Circle key={i} cx={x} cy={y} r={k.s * (1 - fly * 0.6)} color="#6a5a58" />;
      })}
      <Circle cx={330} cy={760} r={90 * (1 - split)} color="#5a4a48" />
      {/* 卫星上立起的高塔 */}
      <Circle cx={1640} cy={980} r={260} color="#3a3444" />
      {[1520, 1580, 1640, 1700, 1760].map((x, i) => {
        const h = (120 + (i % 3) * 70) * towers;
        return <Path key={i} path={`M${x - 10} ${760 - Math.abs(x - 1640) * 0.28} L${x} ${760 - Math.abs(x - 1640) * 0.28 - h} L${x + 10} ${760 - Math.abs(x - 1640) * 0.28} Z`} color="#1a1622" />;
      })}
      {[1520, 1580, 1640, 1700, 1760].map((x, i) => (
        <Circle key={i} cx={x} cy={760 - Math.abs(x - 1640) * 0.28 - (120 + (i % 3) * 70) * towers} r={4} color="#ffcf7a" opacity={towers}>
          <BlurMask blur={3} style="normal" />
        </Circle>
      ))}
    </Shot>
  );
};

// 5 · 疆域辽阔，光从一端走到另一端，也要几千年（175.0–181.6 秒）：星系尺度，旋臂上的一大片都是它们的灯，一道光沿着航线慢慢走
export const Realm: React.FC = () => {
  const t = useT();
  const net = NET();
  const g: [number, number] = [960, 560];
  const pulse = smooth(176.2, 181.4, t);
  const chain: number[] = [];
  // 走到疆域里离母星最远的那颗
  let far = 0;
  net.forEach((s, k) => {
    const inside = Math.hypot((s.x - 620) / 620, (s.y - 560) / 420) <= 1;
    if (inside && Math.hypot(s.x - net[0].x, s.y - net[0].y) > Math.hypot(net[far].x - net[0].x, net[far].y - net[0].y)) far = k;
  });
  let i = far;
  while (i >= 0) {
    chain.unshift(i);
    i = net[i].parent;
  }
  const pos = pulse * (chain.length - 1);
  const a = Math.floor(pos);
  const f = pos - a;
  const s0 = net[chain[Math.min(chain.length - 1, a)]];
  const s1 = net[chain[Math.min(chain.length - 1, a + 1)]];
  return (
    <Shot>
      <Nebula t={t} cam={[12.4, 0.1]} glow={0.45} />
      <StarLayer t={t} seed={401} n={700} spikes={false} />
      <Bloom radius={26} strength={0.9} threshold={0.45}>
        <SpiralGalaxy x={g[0]} y={g[1]} R={520} spin={t * 0.03} tilt={0.48} angle={-14} seed={31} />
      </Bloom>
      <Group transform={[{ translateX: g[0] + 120 }, { translateY: g[1] - 30 }, { rotate: -0.25 }, { scale: 0.28 }, { scaleY: 0.5 }, { translateX: -960 }, { translateY: -540 }]}>
        <Bloom radius={18} strength={1} threshold={0.4}>
          <NetMap net={net} count={1100} scale={7} dot={0.45} within={[620, 560, 620, 420]} />
          <Circle cx={lerp(s0.x, s1.x, f)} cy={lerp(s0.y, s1.y, f)} r={60} color="#fff6dc" opacity={pulse > 0 && pulse < 1 ? 1 : 0}>
            <BlurMask blur={14} style="normal" />
          </Circle>
        </Bloom>
      </Group>
    </Shot>
  );
};

// 6 · 航线越来越亮，像发光的神经（181.2–186.6 秒）：推近那片疆域，航线变粗、变成紫色的光脉，开始呼吸
export const Veins: React.FC = () => {
  const t = useT();
  const net = NET();
  const z = lerp(1.0, 1.6, smooth(181.2, 186.6, t));
  const glow = smooth(182.0, 185.6, t);
  const routes = Skia.Path.Make();
  net.forEach((s) => {
    if (s.parent < 0) return;
    const p = net[s.parent];
    routes.moveTo(p.x, p.y);
    routes.quadTo((p.x + s.x) / 2 + (s.y - p.y) * 0.15, (p.y + s.y) / 2 - (s.x - p.x) * 0.15, s.x, s.y);
  });
  const breath = 0.75 + 0.25 * Math.sin(t * 2.2);
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H} color="#05040e" />
      <Group transform={[{ translateX: 960 }, { translateY: 540 }, { scale: z }, { translateX: -900 }, { translateY: -560 }]}>
        <Bloom radius={22} strength={1} threshold={0.35}>
          <Path path={routes} style="stroke" strokeWidth={lerp(1.4, 5, glow)} color={glow > 0.5 ? "#d8a0ff" : "#ffb26b"} opacity={lerp(0.45, 0.8 * breath, glow)}>
            <BlurMask blur={lerp(1, 4, glow)} style="normal" />
          </Path>
          <NetMap net={net} count={1100} />
        </Bloom>
      </Group>
      <Rect x={0} y={0} width={W} height={H} color="#7a3aff" opacity={glow * 0.08} blendMode="screen" />
    </Shot>
  );
};
