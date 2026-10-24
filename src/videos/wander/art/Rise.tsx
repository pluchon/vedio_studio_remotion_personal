// 三 · 宏伟（89–126 秒）：城市从平原上一层层长起来；夜面铺满灯火；蓝图里的轨道、原子和「来历」；
// 火箭穿过云层、在地平线上看见日出；带轨道环的母星；山顶的天文台，目镜里是开场那条星系；镜头退远
import { BlurMask, Circle, Group, LinearGradient, Oval, Path, Rect, Skia, vec } from "@shopify/react-native-skia";
import React from "react";
import { useT } from "../time";
import { Planet, Sun } from "./bodies";
import { Critter } from "./critter";
import { Embers, Flame, Skyline, Smoke } from "./props";
import { Bloom, H, Shot, W, lerp, smooth } from "./sk";
import { Nebula, SpiralGalaxy, StarLayer } from "./space";
import { DuskWorld, MilkyWay, Motes, Ridge, ridgeLine } from "./world";

// 1 · 地面亮起一座座城（89.0–95.8 秒）：黄昏的平原上，远中近三层城市长出来，天黑时窗灯一盏盏亮，路上有车灯流动
export const Cities: React.FC = () => {
  const t = useT();
  const night = smooth(89.5, 94.5, t);
  const grow = (d: number) => smooth(89.6 + d, 93.6 + d, t);
  const pan = smooth(89, 95.8, t) * 120;
  const road = Skia.Path.Make();
  road.moveTo(-50, 940);
  road.cubicTo(500, 900, 900, 980, 1300, 920);
  road.cubicTo(1600, 880, 1800, 900, W + 50, 880);
  const measure = Skia.ContourMeasureIter(road, false, 1).next();
  return (
    <Shot>
      <DuskWorld t={t} sun={[1500, 760]} horizon={700} night={lerp(0.25, 0.85, night)} />
      <Group opacity={night * 0.7}>
        <MilkyWay t={t} amount={night} angle={-0.2} />
      </Group>
      <Ridge pts={ridgeLine(-100, W + 200, 690, 70, 51).map(([x, y]) => [x - pan * 0.2, y] as [number, number])} color="#2a1c3c" rim="#8a5a7a" rimWidth={2} />
      <Group transform={[{ translateX: -pan * 0.35 }]}>
        <Skyline seed={3} base={712} x0={-60} x1={W + 200} minH={30} maxH={120} grow={grow(0)} lit={night} color="#20162f" window="#ffcf8a" />
      </Group>
      <Rect x={0} y={712} width={W} height={H - 712} color="#140d1f" />
      <Rect x={0} y={560} width={W} height={260}>
        <LinearGradient start={vec(0, 560)} end={vec(0, 820)} colors={["rgba(120,70,110,0)", "rgba(120,70,110,0.35)", "rgba(40,20,50,0)"]} />
      </Rect>
      <Group transform={[{ translateX: -pan * 0.6 }]}>
        <Skyline seed={5} base={800} x0={-60} x1={W + 200} minH={60} maxH={260} grow={grow(0.6)} lit={night} color="#160f24" window="#ffc46a" rim="#ff9f7a" />
      </Group>
      <Path path={road} style="stroke" strokeWidth={10} color="#2a1d36" />
      <Path path={road} style="stroke" strokeWidth={3} color="#ffb76b" opacity={0.5 * night}>
        <BlurMask blur={3} style="normal" />
      </Path>
      {Array.from({ length: 14 }, (_, i) => {
        const u = ((t * 0.06 + i / 14) % 1 + 1) % 1;
        if (!measure) return null;
        const m = measure;
        const pos = m.getPosTan(u * m.length())[0];
        return (
          <Circle key={i} cx={pos.x} cy={pos.y} r={4} color={i % 2 ? "#fff1c8" : "#ff6a4a"} opacity={night}>
            <BlurMask blur={3} style="normal" />
          </Circle>
        );
      })}
      <Group transform={[{ translateX: -pan }]}>
        <Skyline seed={9} base={H + 4} x0={-60} x1={W + 200} minH={80} maxH={300} grow={grow(1.2)} lit={night} color="#0d0818" window="#ffb85a" rim="#ff8a6a" />
      </Group>
      <Motes t={t} seed={51} n={24} color="#ffcf7a" size={3} blur={2} drift={[2, 30]} opacity={1 - smooth(90, 91.5, t)} />
    </Shot>
  );
};

// 2 · 背阴的半球，渐渐满是灯火（95.4–98.8 秒）：从轨道上看母星的夜面，灯火像生长的菌丝一样铺开，几颗卫星划过
export const NightSide: React.FC = () => {
  const t = useT();
  const sats = [0, 1, 2, 3];
  return (
    <Shot>
      <Nebula t={t} cam={[5.2, 0.4]} glow={0.35} />
      <StarLayer t={t} seed={111} n={600} spikes={false} />
      <Planet x={W / 2 + 120} y={H / 2 + 40} R={430} t={t} rot={1.4 + t * 0.03} light={[-0.75, 0.2, -0.62]} cities={smooth(95.2, 98.6, t)} />
      {sats.map((i) => {
        const a = t * (0.5 + i * 0.13) + i * 1.7;
        const x = W / 2 + 120 + Math.cos(a) * (520 + i * 40);
        const y = H / 2 + 40 + Math.sin(a) * (120 + i * 30);
        const front = Math.sin(a) > -0.2;
        return front ? (
          <Circle key={i} cx={x} cy={y} r={3} color="#e8f2ff">
            <BlurMask blur={2} style="normal" />
          </Circle>
        ) : null;
      })}
    </Shot>
  );
};

// 3 · 它们算出星辰的轨道，拆开原子，也读懂了自己的来历（98.4–103.6 秒）：一张蓝图，三幅发光的线图依次画出来
const helix = (x: number, y: number, len: number, t: number, ph: number) => {
  const pts: { x: number; y: number; c: number; front: boolean }[] = [];
  for (let i = 0; i < 26; i++) {
    const u = i / 25;
    const a = u * Math.PI * 4 + t * 1.2 + ph;
    pts.push({ x: x + Math.cos(a) * 46, y: y - len / 2 + u * len, c: i % 5, front: Math.sin(a) > 0 });
  }
  return pts;
};
const BALL = ["#ff8a6b", "#ffd66b", "#5fe0c8", "#8fb4ff", "#ff9fd0"];
export const Blueprint: React.FC = () => {
  const t = useT();
  const grid = Skia.Path.Make();
  for (let x = 0; x <= W; x += 60) {
    grid.moveTo(x, 0);
    grid.lineTo(x, H);
  }
  for (let y = 0; y <= H; y += 60) {
    grid.moveTo(0, y);
    grid.lineTo(W, y);
  }
  const d1 = smooth(98.6, 100.2, t);
  const d2 = smooth(99.6, 101.2, t);
  const d3 = smooth(100.8, 102.6, t);
  const split = smooth(100.8, 101.4, t);
  const cyan = "#8fe6ff";
  const orbit = (rx: number, ry: number) => `M${-rx} 0 A${rx} ${ry} 0 1 1 ${rx} 0 A${rx} ${ry} 0 1 1 ${-rx} 0`;
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={["#0a2a4a", "#0b1f3d", "#081530"]} />
      </Rect>
      <Path path={grid} style="stroke" strokeWidth={1} color="#4fa3d8" opacity={0.12} />
      <Bloom radius={16} strength={1} threshold={0.45}>
        {/* 轨道：太阳和三颗行星 */}
        <Group transform={[{ translateX: 400 }, { translateY: 500 }]}>
          {[90, 150, 220].map((rx, i) => (
            <Path key={i} path={orbit(rx, rx * 0.42)} style="stroke" strokeWidth={2} color={cyan} end={d1} opacity={0.8} />
          ))}
          <Circle cx={0} cy={0} r={18 * d1} color="#ffe39a" />
          {[90, 150, 220].map((rx, i) => {
            const a = t * (1.4 - i * 0.35) + i;
            return <Circle key={i} cx={Math.cos(a) * rx} cy={Math.sin(a) * rx * 0.42} r={7 * d1} color={cyan} />;
          })}
        </Group>
        {/* 原子：电子绕核，然后核裂开 */}
        <Group transform={[{ translateX: 960 }, { translateY: 470 }]} opacity={d2 > 0 ? 1 : 0}>
          {[0, 1, 2].map((i) => (
            <Group key={i} transform={[{ rotate: (i * Math.PI) / 3 }]}>
              <Path path={orbit(150, 46)} style="stroke" strokeWidth={2} color={cyan} end={d2} opacity={0.8} />
              <Circle cx={Math.cos(t * 3 + i * 2) * 150} cy={Math.sin(t * 3 + i * 2) * 46} r={6 * d2} color="#ffffff" />
            </Group>
          ))}
          <Circle cx={-24 * split} cy={-8 * split} r={20 * d2} color="#ffb37a" />
          <Circle cx={24 * split} cy={8 * split} r={20 * d2 * (split > 0 ? 1 : 0.0001)} color="#ffb37a" />
          <Circle cx={0} cy={0} r={120} color="#ffffff" opacity={Math.max(0, 1 - Math.abs(t - 101.0) / 0.35) * 0.8}>
            <BlurMask blur={60} style="normal" />
          </Circle>
        </Group>
        {/* 来历：一条双螺旋，珠子的颜色就是海里那条分子链 */}
        <Group opacity={d3}>
          {helix(1500, 500, 520 * d3, t, 0).map((p, i) => (
            <Circle key={`a${i}`} cx={p.x} cy={p.y} r={p.front ? 9 : 6} color={BALL[p.c]} opacity={p.front ? 1 : 0.5} />
          ))}
          {helix(1500, 500, 520 * d3, t, Math.PI).map((p, i) => (
            <Circle key={`b${i}`} cx={p.x} cy={p.y} r={p.front ? 9 : 6} color={BALL[(p.c + 2) % 5]} opacity={p.front ? 1 : 0.5} />
          ))}
        </Group>
      </Bloom>
    </Shot>
  );
};

// 火箭：圆头、细腰、三片尾翼
const rocketPath = (x: number, y: number, s: number) => {
  const p = Skia.Path.Make();
  p.moveTo(x, y - 230 * s);
  p.cubicTo(x + 30 * s, y - 190 * s, x + 26 * s, y - 120 * s, x + 24 * s, y - 20 * s);
  p.lineTo(x + 48 * s, y + 10 * s);
  p.lineTo(x + 20 * s, y + 2 * s);
  p.lineTo(x - 20 * s, y + 2 * s);
  p.lineTo(x - 48 * s, y + 10 * s);
  p.lineTo(x - 24 * s, y - 20 * s);
  p.cubicTo(x - 26 * s, y - 120 * s, x - 30 * s, y - 190 * s, x, y - 230 * s);
  p.close();
  return p;
};
const Rocket: React.FC<{ x: number; y: number; s: number; t: number; k: number }> = ({ x, y, s, t, k }) => (
  <Group>
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: Math.PI }, { translateX: -x }, { translateY: -y }]}>
      <Flame x={x} y={y} w={30 * s} h={lerp(80, 320, k) * s} t={t * 1.6} k={Math.min(1, k * 1.5)} glow={1.4} />
    </Group>
    <Path path={rocketPath(x, y, s)}>
      <LinearGradient start={vec(x - 30 * s, 0)} end={vec(x + 30 * s, 0)} colors={["#7d6f78", "#f2ece4", "#b8aab0"]} />
    </Path>
    <Circle cx={x} cy={y - 140 * s} r={9 * s} color="#5fd0ff" />
    <Circle cx={x - 3 * s} cy={y - 143 * s} r={3 * s} color="#ffffff" />
  </Group>
);

// 4 · 飞船第一次驶离母星，去触碰那片仰望已久的夜空（103.2–109.4 秒）：发射台上点火升空，镜头跟着往上；穿出大气，弧形的地平线上日出
export const Launch: React.FC = () => {
  const t = useT();
  const lift = Math.pow(smooth(103.6, 106.4, t), 2);
  const space = smooth(105.8, 106.8, t);
  const k = smooth(103.3, 103.9, t);
  const ry = 820 - lift * 900;
  const cam = Math.min(0, ry - 600);
  const rise2 = smooth(106.2, 109.4, t);
  return (
    <Shot>
      {/* 地面这一段 */}
      <Group opacity={1 - space}>
        <Group transform={[{ translateY: -cam }]}>
          <DuskWorld t={t} sun={[300, 1100]} horizon={760} night={0.9} />
          <Group opacity={0.7}>
            <MilkyWay t={t} angle={-0.6} />
          </Group>
          <Ridge pts={ridgeLine(0, W, 770, 40, 61)} color="#1a1229" rim="#5a3b62" rimWidth={2} />
          <Skyline seed={21} base={830} x0={0} x1={W} minH={30} maxH={140} color="#130c20" window="#ffc46a" />
          <Rect x={0} y={830} width={W} height={600} color="#0c0814" />
          <Path path={`M880 830 L880 600 M1040 830 L1040 600 M880 640 L1040 640 M880 720 L1040 720`} style="stroke" strokeWidth={8} color="#2b1f3a" />
          <Smoke x={960} y={840} t={t} n={22} spread={260} rise={180} opacity={k} color="#d8c8c0" />
          <Oval x={600} y={790} width={720} height={100} color="#ff9a4a" opacity={0.5 * k}>
            <BlurMask blur={40} style="normal" />
          </Oval>
        </Group>
        <Bloom radius={22} strength={0.9} threshold={0.55}>
          <Rocket x={960} y={ry - cam} s={1} t={t} k={k} />
        </Bloom>
      </Group>
      {/* 太空这一段 */}
      <Group opacity={space}>
        <Nebula t={t} cam={[6.0, 0.2]} glow={0.4} />
        <StarLayer t={t} seed={121} n={500} spikes={false} />
        <Planet x={W / 2} y={H + 1500} R={1760} t={t} rot={2.2} light={[0.6, 0.6, 0.4]} cities={0.6} />
        <Bloom radius={30} strength={1} threshold={0.5}>
          <Sun x={1500} y={H - 250 + (1 - rise2) * 60} R={34} t={t} />
          <Path path={`M${960} ${H - 120} Q${1150} ${H - 420} ${lerp(1300, 1700, rise2)} ${lerp(500, 140, rise2)}`} style="stroke" strokeWidth={3} color="#ffd8a0" opacity={0.6} end={0.3 + 0.7 * rise2}>
            <BlurMask blur={2} style="normal" />
          </Path>
          <Circle cx={lerp(1300, 1700, rise2)} cy={lerp(500, 140, rise2)} r={6} color="#ffffff">
            <BlurMask blur={4} style="normal" />
          </Circle>
        </Bloom>
      </Group>
      <Embers x={960} y={ry - cam + 60} t={t} n={20} k={k * (1 - space)} spread={120} rise={-200} />
    </Shot>
  );
};

// 5 · 这是它们最骄傲的时刻（109.0–114.6 秒）：母星戴着一圈轨道环，空间站的灯沿环转，飞船的航迹绕来绕去，旁边的月亮上也有灯
const ringPath = (cx: number, cy: number, rx: number, ry: number, from: number, to: number) => {
  const p = Skia.Path.Make();
  for (let i = 0; i <= 80; i++) {
    const a = from + ((to - from) * i) / 80;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
};
export const Proud: React.FC = () => {
  const t = useT();
  const push = lerp(1, 1.08, smooth(109, 114.6, t));
  const c: [number, number] = [860, 560];
  const R = 300;
  const tilt = -0.18;
  const st = Array.from({ length: 16 }, (_, i) => i);
  return (
    <Shot>
      <Group transform={[{ translateX: W / 2 }, { translateY: H / 2 }, { scale: push }, { translateX: -W / 2 }, { translateY: -H / 2 }]}>
        <Nebula t={t} cam={[6.6, 0.5]} glow={0.5} tintA={[0.3, 0.18, 0.6]} />
        <StarLayer t={t} seed={131} n={700} spikes={false} />
        <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, { rotate: tilt }, { translateX: -c[0] }, { translateY: -c[1] }]}>
          <Path path={ringPath(c[0], c[1], R * 1.7, R * 0.36, Math.PI, Math.PI * 2)} style="stroke" strokeWidth={10} color="#9fcfff" opacity={0.35}>
            <BlurMask blur={3} style="normal" />
          </Path>
        </Group>
        <Planet x={c[0]} y={c[1]} R={R} t={t} rot={2.6 + t * 0.03} light={[-0.7, 0.4, 0.5]} cities={1} />
        <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, { rotate: tilt }, { translateX: -c[0] }, { translateY: -c[1] }]}>
          <Path path={ringPath(c[0], c[1], R * 1.7, R * 0.36, 0, Math.PI)} style="stroke" strokeWidth={10} color="#bfe0ff" opacity={0.6}>
            <BlurMask blur={2} style="normal" />
          </Path>
          {st.map((i) => {
            const a = t * 0.25 + (i / st.length) * Math.PI * 2;
            const front = Math.sin(a) > 0;
            return (
              <Circle key={i} cx={c[0] + Math.cos(a) * R * 1.7} cy={c[1] + Math.sin(a) * R * 0.36} r={front ? 6 : 4} color="#ffd38a" opacity={front ? 1 : 0.4}>
                <BlurMask blur={3} style="normal" />
              </Circle>
            );
          })}
        </Group>
        {/* 航迹 */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Path
            key={i}
            path={ringPath(c[0], c[1], R * (1.25 + i * 0.22), R * (0.8 + i * 0.1), t * (0.6 - i * 0.07) + i, t * (0.6 - i * 0.07) + i + 1.2)}
            style="stroke"
            strokeWidth={2}
            color="#ffe2b0"
            opacity={0.45}
          />
        ))}
        {/* 月亮和月面的灯 */}
        <Planet x={1520} y={300} R={70} t={t} rot={0.4} light={[-0.8, 0.3, 0.5]} cities={0.8} look={{ sea: [0.3, 0.3, 0.34], land: [0.55, 0.52, 0.5], air: [0.6, 0.6, 0.7] }} clouds={0} />
      </Group>
    </Shot>
  );
};

// 6 · 宇宙终于有了能读懂它的存在（114.0–120.6 秒）：山顶的天文台和一口巨大的天线，几个小小的它们；右上角的目镜里，是开场那条星系
export const Observatory: React.FC = () => {
  const t = useT();
  const eye = smooth(115.4, 116.6, t);
  const dishA = lerp(-0.5, -0.9, smooth(114, 117, t));
  return (
    <Shot>
      <MilkyWay t={t} angle={-0.7} offset={[0, -60]} />
      <StarLayer t={t} seed={141} n={140} />
      <Ridge pts={ridgeLine(0, W, 930, 50, 71)} color="#110b1d" rim="#5c4a8a" rimWidth={2} />
      <Ridge pts={[[0, 1000], [300, 960], [560, 800], [700, 760], [860, 770], [1020, 860], [1300, 980], [W, 1010]]} color="#08050f" rim="#8a7ac8" rimWidth={2} />
      {/* 圆顶观测站 */}
      <Path path="M560 790 L560 730 A70 70 0 0 1 700 730 L700 790 Z" color="#1a1428" />
      <Path path="M630 662 L640 662 L700 728" style="stroke" strokeWidth={6} color="#2a2238" />
      <Rect x={620} y={740} width={20} height={14} color="#ffcf7a" />
      {/* 天线：一只朝天的大碗 */}
      <Group transform={[{ translateX: 800 }, { translateY: 740 }, { rotate: dishA }]}>
        <Path path="M-130 0 Q0 90 130 0 Z" color="#2a2238" />
        <Path path="M-130 0 Q0 90 130 0" style="stroke" strokeWidth={4} color="#9fb0ff" opacity={0.6} />
        <Path path="M0 40 L0 -90" style="stroke" strokeWidth={4} color="#3a3050" />
        <Circle cx={0} cy={-92} r={6} color="#ffcf7a" />
      </Group>
      <Path path="M790 760 L800 740 L812 760 L812 800 L790 800 Z" color="#1a1428" />
      <Critter x={940} y={792} s={0.24} pose={{ lift: 1, glow: 0.9, look: [0.3, -1] }} silhouette={0.8} rim="#9fb0ff" />
      <Critter x={1000} y={808} s={0.2} flip pose={{ lift: 0.8, glow: 0.9 }} silhouette={0.8} rim="#9fb0ff" />
      {/* 目镜里的星系 */}
      <Group opacity={eye}>
        <Circle cx={1480} cy={330} r={250} color="#000000" opacity={0.85} />
        <Group clip={Skia.Path.Make().addCircle(1480, 330, 240)}>
          <Nebula t={t} cam={[3.1, -0.2]} glow={0.6} zoom={1.4} />
          <Bloom radius={20} strength={0.9} threshold={0.45}>
            <SpiralGalaxy x={1480} y={330} R={170} spin={t * 0.12} tilt={0.5} angle={-16} seed={31} />
          </Bloom>
        </Group>
        <Circle cx={1480} cy={330} r={244} style="stroke" strokeWidth={6} color="#cbbfd9" opacity={0.8} />
        <Path path="M1480 70 L1480 100 M1480 560 L1480 590 M1220 330 L1250 330 M1710 330 L1740 330" style="stroke" strokeWidth={2} color="#cbbfd9" opacity={0.6} />
      </Group>
    </Shot>
  );
};

// 7 · 退远（120.2–126.4 秒）：母星缩成恒星旁的一个小点；2:05 配乐抽空时，颜色也跟着褪掉
export const Recede: React.FC = () => {
  const t = useT();
  const back = smooth(120.2, 125.6, t);
  const R = lerp(240, 10, Math.pow(back, 0.6));
  const sun: [number, number] = [lerp(-300, 520, back), lerp(540, 520, back)];
  const p: [number, number] = [lerp(980, 640, back), lerp(560, 520, back)];
  const grey = smooth(124.6, 126.2, t);
  return (
    <Shot>
      <Nebula t={t} cam={[7.1, 0.1]} glow={lerp(0.5, 0.2, grey)} />
      <StarLayer t={t} seed={151} n={800} spikes={false} zoom={lerp(1.4, 1, back)} />
      <Bloom radius={26} strength={0.9} threshold={0.5}>
        <Sun x={sun[0]} y={sun[1]} R={lerp(120, 22, back)} t={t} />
      </Bloom>
      <Planet x={p[0]} y={p[1]} R={R} t={t} rot={3 + t * 0.03} light={[-1, 0.1, 0.3]} cities={1} />
      <Rect x={0} y={0} width={W} height={H} color="#20202a" opacity={grey * 0.35} />
    </Shot>
  );
};
