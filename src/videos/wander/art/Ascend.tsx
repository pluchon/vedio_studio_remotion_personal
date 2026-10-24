// 六 · 跃迁（185–234 秒，以下是一种想象）：圣殿里，玻璃球中的液态光醒过来；一片发光的意识之海；
// 两个遥远的世界亮起同一个符号；文明的阶梯；彩色的思绪缠成一股；两个生灵融成一团光；飞船和文字都不再需要；
// 最亮的光之曼陀罗；一条发光的路在前方消失，它停下来坐着
import { BlurMask, Circle, Fill, Group, LinearGradient, Path, Rect, Shader, Skia, vec } from "@shopify/react-native-skia";
import React from "react";
import { useT } from "../time";
import { Planet } from "./bodies";
import { Critter } from "./critter";
import { Flame, Glyph, NetMap, Skyline, makeNet } from "./props";
import { Bloom, H, NOISE, Shot, W, effect, lerp, rng, smooth } from "./sk";
import { Nebula, SpiralGalaxy, StarLayer } from "./space";
import { Motes, Ridge, ridgeLine } from "./world";

// ---------- 液态的光 ----------
const LIQUID = effect(`
uniform float2 c;
uniform float R;
uniform float t;
uniform float k;
${NOISE}
half4 main(float2 p) {
  float2 d = (p - c) / R;
  float r = length(d);
  if (r > 1.0) return half4(0.0);
  float n = warped(d * 1.6 + float2(t * 0.05, 0.0), t * 1.5);
  float n2 = fbm(d * 3.0 - t * 0.2);
  float3 a = float3(0.55, 0.25, 0.95);
  float3 b = float3(0.15, 0.85, 0.85);
  float3 g = float3(1.0, 0.75, 0.35);
  float3 col = mix(a, b, smoothstep(0.3, 0.7, n));
  col = mix(col, g, smoothstep(0.55, 0.9, n2));
  col *= (0.25 + 0.95 * k) * (0.6 + 0.6 * n);
  float edge = smoothstep(1.0, 0.86, r);
  return half4(half3(col * edge), edge);
}
`);

// 1 · 为了跨过几千年的孤单，它们唤醒了一种新物质（185.4–192.8 秒）：幽暗的圣殿，台座上一只玻璃球，里面的光慢慢醒来
export const Awaken: React.FC = () => {
  const t = useT();
  const k = smooth(186.0, 190.5, t);
  const c: [number, number] = [960, 470];
  const ring = (t - 189.6) / 1.6;
  const push = lerp(1, 1.1, smooth(185.4, 192.8, t));
  return (
    <Shot>
      <Group transform={[{ translateX: W / 2 }, { translateY: H / 2 }, { scale: push }, { translateX: -W / 2 }, { translateY: -H / 2 }]}>
        <Rect x={0} y={0} width={W} height={H}>
          <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#07050f", "#100a1e", "#1a0f26"]} />
        </Rect>
        {[200, 440, 1480, 1720].map((x, i) => (
          <Group key={i}>
            <Rect x={x - 46} y={60} width={92} height={900} color="#120c1c" />
            <Rect x={x - 46} y={60} width={10} height={900} color="#8a6aff" opacity={0.08 + 0.12 * k} />
          </Group>
        ))}
        <Circle cx={c[0]} cy={c[1]} r={700} color="#7a4aff" opacity={0.1 + 0.2 * k}>
          <BlurMask blur={260} style="normal" />
        </Circle>
        <Path path={`M${c[0] - 160} 900 L${c[0] - 110} 690 L${c[0] + 110} 690 L${c[0] + 160} 900 Z`} color="#1c1428" />
        <Bloom radius={34} strength={1} threshold={0.4}>
          <Circle cx={c[0]} cy={c[1]} r={220}>
            <Shader source={LIQUID} uniforms={{ c, R: 220, t, k }} />
          </Circle>
          {ring > 0 && ring < 1 ? <Circle cx={c[0]} cy={c[1]} r={230 + ring * 700} style="stroke" strokeWidth={4} color="#e0c8ff" opacity={1 - ring} /> : null}
        </Bloom>
        <Circle cx={c[0]} cy={c[1]} r={222} style="stroke" strokeWidth={4} color="#e8e0ff" opacity={0.5} />
        <Path path={`M${c[0] - 150} ${c[1] - 120} A190 190 0 0 1 ${c[0] + 40} ${c[1] - 200}`} style="stroke" strokeWidth={10} strokeCap="round" color="#ffffff" opacity={0.35} />
        {[
          [560, 880, 0.8, false],
          [1360, 880, 0.82, true],
          [1180, 940, 0.62, true],
        ].map(([x, y, s, f], i) => (
          <Critter key={i} x={x as number} y={y as number} s={s as number} flip={f as boolean} pose={{ sit: 0.85, lift: 0.4, glow: 0.4 + k * 0.6, look: [1, -0.6] }} silhouette={0.75} rim="#c8a8ff" rimSide={f ? -1 : 1} />
        ))}
        <Motes t={t} seed={501} n={40} color="#d8c8ff" size={2} blur={1.5} drift={[0, -14]} opacity={0.4 + 0.5 * k} />
      </Group>
    </Shot>
  );
};

// ---------- 光之海 ----------
const LIGHTSEA = effect(`
uniform float2 size;
uniform float t;
uniform float horizon;
uniform float merge;
${NOISE}
half4 main(float2 p) {
  float3 c;
  if (p.y < horizon) {
    float h = (horizon - p.y) / horizon;
    c = mix(float3(0.28, 0.12, 0.38), float3(0.03, 0.02, 0.08), pow(h, 0.5));
    c += float3(0.8, 0.5, 0.9) * exp(-h * 9.0) * 0.4;
  } else {
    float z = 60.0 / (p.y - horizon + 6.0);
    float2 q = float2((p.x - size.x * 0.5) * z * 0.01, z * 1.6 - t * 0.35);
    float n = warped(q, t);
    float3 a = mix(float3(0.6, 0.3, 1.0), float3(1.0, 0.72, 0.4), merge);
    float3 b = mix(float3(0.2, 0.9, 0.9), float3(1.0, 0.86, 0.6), merge);
    c = mix(a, b, smoothstep(0.35, 0.7, n)) * (0.35 + 0.9 * pow(n, 2.0));
    c *= 0.5 + 0.8 * exp(-(p.y - horizon) / 260.0);
    c += float3(1.0, 0.9, 1.0) * pow(smoothstep(0.62, 0.8, n), 3.0) * 0.6;
  }
  return half4(half3(c), 1.0);
}
`);

// 2 · 不是机器，也不是血肉，而是一片能让意识交汇的海（192.4–198.6 秒）：一片会发光的海，几个生灵站在里面，它们的符号升起来，化进光里
export const LightSea: React.FC = () => {
  const t = useT();
  const people = [
    { x: 520, y: 760, s: 0.7, f: false },
    { x: 1250, y: 700, s: 0.45, f: true },
    { x: 1560, y: 830, s: 0.85, f: true },
  ];
  return (
    <Shot>
      <Fill>
        <Shader source={LIGHTSEA} uniforms={{ size: [W, H], t, horizon: 520, merge: 0 }} />
      </Fill>
      <StarLayer t={t} seed={511} n={200} spikes={false} opacity={0.5} />
      {people.map((p, i) => (
        <Critter key={i} x={p.x} y={p.y} s={p.s} flip={p.f} pose={{ sit: 0.6, lift: 0.5, glow: 1, look: [1, -0.8] }} silhouette={0.85} rim="#ffe0ff" rimSide={p.f ? -1 : 1} />
      ))}
      <Bloom radius={18} strength={1} threshold={0.45}>
        {people.map((p, i) =>
          [0, 1, 2].map((k) => {
            const age = ((t - 192.4 + k * 1.3 + i * 0.7) % 3.9) / 3.9;
            return <Glyph key={`${i}-${k}`} i={(i * 3 + k) % 12} x={p.x + Math.sin(age * 6 + k) * 30} y={p.y - 160 * p.s - age * 380} size={50 * p.s + 20} color="#ffe0ff" opacity={Math.sin(age * Math.PI) * (1 - age)} glow={1.4} />;
          }),
        )}
      </Bloom>
    </Shot>
  );
};

// 3 · 相隔几千光年的两个世界，连成了同一个念头（198.2–203.6 秒）：两颗行星，一道光瞬间连上，头顶同时亮起同一个符号
export const OneThought: React.FC = () => {
  const t = useT();
  const a: [number, number] = [380, 600];
  const b: [number, number] = [1560, 470];
  const link = smooth(198.9, 199.2, t);
  const sign = smooth(199.4, 199.9, t);
  const flash = Math.max(0, 1 - Math.abs(t - 199.5) / 0.6);
  return (
    <Shot>
      <Nebula t={t} cam={[13.0, 0.3]} glow={0.5} tintA={[0.45, 0.2, 0.8]} />
      <StarLayer t={t} seed={521} n={700} spikes={false} />
      <Planet x={a[0]} y={a[1]} R={160} t={t} rot={1 + t * 0.04} light={[0.7, 0.4, 0.5]} cities={1} />
      <Planet x={b[0]} y={b[1]} R={130} t={t} rot={2 + t * 0.03} light={[-0.7, 0.4, 0.5]} cities={1} look={{ sea: [0.3, 0.18, 0.4], land: [0.55, 0.42, 0.6], air: [0.8, 0.6, 1.0] }} />
      <Bloom radius={26} strength={1} threshold={0.4}>
        <Path path={`M${a[0] + 140} ${a[1] - 60} Q960 ${300} ${b[0] - 110} ${b[1] - 40}`} style="stroke" strokeWidth={4} color="#f0d8ff" end={link} opacity={0.9}>
          <BlurMask blur={2} style="normal" />
        </Path>
        <Glyph i={7} x={a[0]} y={a[1] - 260} size={120} draw={sign} color="#e8c8ff" glow={1.6} />
        <Glyph i={7} x={b[0]} y={b[1] - 230} size={110} draw={sign} color="#e8c8ff" glow={1.6} />
        <Circle cx={960} cy={420} r={600} color="#e8d0ff" opacity={flash * 0.25}>
          <BlurMask blur={240} style="normal" />
        </Circle>
      </Bloom>
    </Shot>
  );
};

// 4 · 有人说，这是文明最后的跃迁（203.2–207.8 秒）：一层层往上：火、城、带环的星球、星系里的疆域、最上面是光之海
const NET2 = () => makeNet(81, 260, [960, 560], [500, 300, 900, 520]);
export const Ladder: React.FC = () => {
  const t = useT();
  const k = smooth(203.2, 207.4, t);
  const y = k * 4 * H;
  const tier = (i: number, node: React.ReactNode) => {
    const top = y - i * H;
    if (top > H || top < -H) return null;
    return (
      <Group key={i} transform={[{ translateY: top }]}>
        {node}
      </Group>
    );
  };
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#140a2a", "#0a0618"]} />
      </Rect>
      {tier(
        0,
        <Group>
          <Rect x={0} y={0} width={W} height={H} color="#0c0814" />
          <Flame x={960} y={760} w={80} h={220} t={t} />
        </Group>,
      )}
      {tier(
        1,
        <Group>
          <Skyline seed={9} base={H} x0={0} x1={W} minH={100} maxH={360} color="#0d0818" window="#ffb85a" />
        </Group>,
      )}
      {tier(
        2,
        <Group>
          <StarLayer t={t} seed={531} n={400} spikes={false} />
          <Planet x={960} y={560} R={230} t={t} rot={2.6} light={[-0.7, 0.4, 0.5]} cities={1} />
          <Path path="M570 560 A390 86 0 0 0 1350 560" style="stroke" strokeWidth={8} color="#bfe0ff" opacity={0.6} />
        </Group>,
      )}
      {tier(
        3,
        <Group>
          <Bloom radius={22} strength={0.9} threshold={0.45}>
            <SpiralGalaxy x={960} y={560} R={420} spin={t * 0.05} tilt={0.48} angle={-14} seed={31} />
            <NetMap net={NET2()} count={260} dot={0.5} scale={0.8} within={[960, 560, 460, 260]} />
          </Bloom>
        </Group>,
      )}
      {tier(
        4,
        <Group>
          <Fill>
            <Shader source={LIGHTSEA} uniforms={{ size: [W, H], t, horizon: 600, merge: 0.4 }} />
          </Fill>
        </Group>,
      )}
      <Rect x={0} y={0} width={W} height={H} color="#ffffff" opacity={smooth(206.8, 207.8, t) * 0.25} />
    </Shot>
  );
};

// 5 · 不知从哪天起，彼此的念头再也无法剥离（207.4–212.6 秒）：十几股彩色的光流从左往右，越缠越紧，颜色混成一种
const STREAMS = ["#ff8ab0", "#8fe8e0", "#ffd06b", "#b89aff", "#7affb0", "#ff9a6b", "#9fc4ff", "#ffb3e6", "#e8ff8a", "#6be0ff", "#ffcf9a", "#c8a0ff"];
const mixColor = (a: string, b: string, p: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - p) + ((pb >> s) & 255) * p);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
export const Braid: React.FC = () => {
  const t = useT();
  const tight = smooth(207.6, 212.0, t);
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={["#0a0618", "#160a28", "#0a0618"]} />
      </Rect>
      <Bloom radius={22} strength={1} threshold={0.35}>
        {STREAMS.map((c, i) => {
          const p = Skia.Path.Make();
          for (let k = 0; k <= 90; k++) {
            const x = -100 + (k / 90) * (W + 200);
            const u = x / W;
            const spread = lerp(260, 26, tight * smooth(0, 0.7, u + tight * 0.5));
            const y = 540 + Math.sin(i * 1.7 + u * 6 + t * 1.6) * spread * (0.6 + 0.4 * Math.sin(i * 2.3)) + Math.sin(u * 3 + t + i) * spread * 0.3;
            if (k === 0) p.moveTo(x, y);
            else p.lineTo(x, y);
          }
          return (
            <Path key={i} path={p} style="stroke" strokeWidth={5} strokeCap="round" color={mixColor(c, "#ffd8a0", tight)} opacity={0.75}>
              <BlurMask blur={2} style="normal" />
            </Path>
          );
        })}
      </Bloom>
    </Shot>
  );
};

// 6 · 没有了「你」和「我」的分别（212.2–216.6 秒）：两个生灵额头相抵，身上的光越来越亮，两个轮廓化成一团
export const Merge: React.FC = () => {
  const t = useT();
  const m = smooth(212.8, 216.0, t);
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H} color="#07050f" />
      <Circle cx={960} cy={480} r={lerp(120, 900, m)} color="#ffd8a0" opacity={lerp(0.1, 0.5, m)}>
        <BlurMask blur={lerp(80, 300, m)} style="normal" />
      </Circle>
      <Group opacity={1 - m * 0.85}>
        <Critter x={720 + m * 60} y={720} s={1.3} pose={{ sit: 0.85, lift: 0.15, glow: 0.6 + m, look: [1, 0] }} rimSide={1} rim="#ffe8c0" silhouette={0.5} />
        <Critter x={1200 - m * 60} y={720} s={1.3} flip pose={{ sit: 0.85, lift: 0.15, glow: 0.6 + m, look: [1, 0] }} rimSide={-1} rim="#ffe8c0" silhouette={0.5} body="#e8845f" />
      </Group>
      <Bloom radius={40} strength={1} threshold={0.3}>
        <Circle cx={960} cy={470} r={lerp(20, 260, m)} color="#fff4dc" opacity={smooth(213, 215, t)}>
          <BlurMask blur={lerp(10, 120, m)} style="normal" />
        </Circle>
      </Bloom>
      <Motes t={t} seed={541} n={30} color="#ffe8c0" size={2.5} blur={2} drift={[0, -20]} opacity={m} />
    </Shot>
  );
};

// 7 · 不再需要飞船，也不再需要文字（216.0–220.8 秒）：机库里停着一排飞船，灯一盏盏灭；墙上的文字散成灰
export const Unneeded: React.FC = () => {
  const t = useT();
  const ships = [0, 1, 2, 3, 4];
  const r = rng(551);
  const glyphs = Array.from({ length: 18 }, (_, i) => ({ x: 200 + (i % 9) * 190, y: 140 + Math.floor(i / 9) * 110, g: Math.floor(r() * 12), d: r() }));
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#0c0a12", "#16121e", "#0a080e"]} />
      </Rect>
      <Bloom radius={14} strength={0.9} threshold={0.5}>
        {glyphs.map((g, i) => {
          const gone = smooth(216.4 + g.d * 2.6, 218.6 + g.d * 2.6, t);
          return <Glyph key={i} i={g.g} x={g.x} y={g.y - gone * 40} size={60} color="#ffb86a" opacity={(1 - gone) * 0.8} glow={0.6} />;
        })}
      </Bloom>
      <Motes t={t} seed={552} n={60} color="#d8c0a0" size={1.6} blur={1} drift={[4, 10]} opacity={smooth(216.6, 218, t) * 0.8} />
      <Rect x={0} y={860} width={W} height={H - 860} color="#08060c" />
      {ships.map((i) => {
        const x = 260 + i * 350;
        const off = smooth(216.6 + i * 0.7, 217.2 + i * 0.7, t);
        return (
          <Group key={i}>
            <Path path={`M${x - 130} 850 Q${x} 720 ${x + 140} 830 L${x + 120} 860 L${x - 120} 860 Z`} color="#1e1a26" />
            <Path path={`M${x - 100} 820 Q${x} 740 ${x + 110} 812`} style="stroke" strokeWidth={2} color="#6a6280" opacity={0.6} />
            <Circle cx={x + 60} cy={800} r={8} color="#ffcf7a" opacity={1 - off} />
            <Circle cx={x + 60} cy={800} r={30} color="#ffcf7a" opacity={(1 - off) * 0.3}>
              <BlurMask blur={16} style="normal" />
            </Circle>
          </Group>
        );
      })}
    </Shot>
  );
};

// ---------- 光之曼陀罗 ----------
const MANDALA = effect(`
uniform float2 size;
uniform float t;
uniform float k;
uniform float pulse;
${NOISE}
half4 main(float2 p) {
  float2 d = (p - size * 0.5) / size.y;
  float r = length(d);
  float a = atan(d.y, d.x) + t * 0.05;
  float seg = 6.2831853 / 12.0;
  float am = abs(mod(a, seg) - seg * 0.5);
  float2 q = float2(cos(am), sin(am)) * r;
  float n = warped(q * 3.2 + float2(0.0, -t * 0.08), t);
  float rings = 0.5 + 0.5 * cos(r * 38.0 - t * 1.6);
  float petal = smoothstep(0.35, 0.8, n) * (0.6 + 0.4 * rings);
  float3 col = mix(float3(0.45, 0.2, 0.75), float3(1.0, 0.78, 0.45), smoothstep(0.2, 0.75, n));
  col = mix(col, float3(1.0, 0.97, 0.9), pow(petal, 2.5));
  float fall = exp(-r * mix(4.5, 1.6, k));
  col *= petal * fall * (0.95 + pulse * 0.4) * k;
  col += float3(1.0, 0.9, 0.75) * exp(-r * 16.0) * k * (0.45 + pulse * 0.25);
  return half4(half3(col), 1.0);
}
`);

// 8 · 当一切都已通晓，所有渴望都有了答案（220.2–226.0 秒）：一朵巨大的、对称的光之花，随着全曲的最高处一起呼吸
export const Mandala: React.FC = () => {
  const t = useT();
  const k = smooth(220.2, 223.4, t);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <Shot>
      <Bloom radius={34} strength={1} threshold={0.45}>
        <Fill>
          <Shader source={MANDALA} uniforms={{ size: [W, H], t, k, pulse }} />
        </Fill>
      </Bloom>
      <Motes t={t} seed={561} n={60} color="#fff0d0" size={2} blur={1.5} drift={[0, -8]} opacity={k * 0.8} />
    </Shot>
  );
};

// 9 · 继续向前走，突然失去了意义（225.4–232.6 秒）：一条发光的路通向远方，一个生灵沿着它走；路的前方一点点暗掉，它停下，坐下
export const Path9: React.FC = () => {
  const t = useT();
  const walkP = smooth(225.4, 228.6, t);
  const fadeFrom = lerp(1, 0.2, smooth(228.0, 231.2, t));
  const sit = smooth(229.0, 230.4, t);
  const horizon = 520;
  // 路：从画面下方，透视地通向地平线；宽度随远近变
  const center = (u: number): [number, number] => [960 + Math.sin(u * 2.4 + 0.6) * 160 * (1 - u), H + 40 - Math.pow(u, 0.75) * (H + 40 - horizon)];
  const width = (u: number) => lerp(300, 4, Math.pow(u, 0.6));
  const ribbon = (u0: number, u1: number) => {
    const p = Skia.Path.Make();
    const n = 50;
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const u = u0 + ((u1 - u0) * i) / n;
      const [x, y] = center(u);
      left.push([x - width(u) / 2, y]);
      right.push([x + width(u) / 2, y]);
    }
    [...left, ...right.reverse()].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.close();
    return p;
  };
  const u = lerp(0.03, 0.2, walkP);
  const [cx, cy] = center(u);
  const scale = lerp(1.3, 0.75, u / 0.2);
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={horizon}>
        <LinearGradient start={vec(0, 0)} end={vec(0, horizon)} colors={["#040310", "#1a0f30"]} />
      </Rect>
      <StarLayer t={t} seed={571} n={500} spikes={false} opacity={0.8} />
      <Ridge pts={ridgeLine(0, W, horizon, 24, 581)} color="#0a0712" bottom={horizon + 2} />
      <Rect x={0} y={horizon} width={W} height={H - horizon}>
        <LinearGradient start={vec(0, horizon)} end={vec(0, H)} colors={["#0c0818", "#05040a"]} />
      </Rect>
      <Path path={ribbon(fadeFrom, 1)} color="#ffd8a0" opacity={0.06} />
      <Bloom radius={24} strength={0.8} threshold={0.62}>
        <Path path={ribbon(0, fadeFrom)}>
          <LinearGradient start={vec(0, H)} end={vec(0, horizon)} colors={["rgba(255,190,120,0.28)", "rgba(255,226,180,0.75)"]} />
        </Path>
        <Path path={ribbon(0, fadeFrom)} style="stroke" strokeWidth={2} color="#ffe2b0" opacity={0.7} />
      </Bloom>
      <Critter x={cx - 20} y={cy - 70 * scale} s={scale} pose={{ walk: walkP * 9, sit: sit * 0.9, lift: lerp(0.2, 0.45, sit), glow: lerp(1, 0.4, sit), look: [1, -0.3] }} silhouette={0.85} rim="#ffd8a0" />
    </Shot>
  );
};