// 四 · 时间的尘埃（124–156 秒）：配乐抽空，画面也褪了色。信号发出去没有回音；世代方舟爬了几百年；
// 一来一回的信，窗口里的身影没等到回信；广场上的雕像在昼夜飞转里风化；提灯在古星图上找母星；
// 镜头从档案馆一路退远，它们小得看不见
import { BlurMask, Circle, Fill, Group, LinearGradient, Oval, Path, RadialGradient, Rect, RoundedRect, Shader, Skia, vec } from "@shopify/react-native-skia";
import React from "react";
import { useT } from "../time";
import { Planet, Sun } from "./bodies";
import { Critter } from "./critter";
import { GLYPHS, Glyph } from "./props";
import { Bloom, H, NOISE, Shot, W, effect, lerp, rng, smooth } from "./sk";
import { Nebula, StarLayer } from "./space";
import { DuskWorld, Motes, Ridge, ridgeLine } from "./world";

// 褪色：把下面画好的东西的饱和度压掉一部分
const Fade: React.FC<{ amount: number }> = ({ amount }) => <Rect x={0} y={0} width={W} height={H} color="#808080" blendMode="saturation" opacity={amount} />;
// 落下来的灰
const Dust: React.FC<{ t: number; opacity?: number }> = ({ t, opacity = 1 }) => (
  <>
    <Motes t={t} seed={201} n={70} color="#d8cfc0" size={1.6} blur={0.8} drift={[3, 16]} opacity={0.7 * opacity} />
    <Motes t={t} seed={202} n={12} color="#d8cfc0" size={7} blur={8} drift={[6, 24]} opacity={0.3 * opacity} />
  </>
);

// 1 · 可宇宙并不急着回答（125.0–130.8 秒）：山顶的天线朝天发出一圈圈信号，散进空无一物的黑暗里，什么也没回来
export const Silence: React.FC = () => {
  const t = useT();
  const src: [number, number] = [430, 830];
  const rings = [0, 1, 2, 3, 4, 5].map((i) => {
    const age = (t - 125.4 - i * 0.9) / 4.4;
    return { r: 60 + age * 1500, a: age > 0 && age < 1 ? (1 - age) * 0.8 : 0 };
  });
  return (
    <Shot>
      <Nebula t={t} cam={[8.0, 0.2]} glow={0.18} />
      <StarLayer t={t} seed={211} n={260} spikes={false} opacity={0.6} />
      {rings.map((g, i) =>
        g.a > 0 ? (
          <Path key={i} path={`M${src[0] + Math.cos(-1.95) * g.r} ${src[1] + Math.sin(-1.95) * g.r} A${g.r} ${g.r} 0 0 1 ${src[0] + Math.cos(-0.25) * g.r} ${src[1] + Math.sin(-0.25) * g.r}`} style="stroke" strokeWidth={3} color="#cfd8e8" opacity={g.a}>
            <BlurMask blur={2} style="normal" />
          </Path>
        ) : null,
      )}
      <Ridge pts={[[0, 980], [200, 920], [380, 860], [500, 850], [640, 900], [900, 990], [W, 1040]]} color="#0b0910" rim="#6a6a80" rimWidth={2} />
      <Group transform={[{ translateX: src[0] }, { translateY: src[1] }, { rotate: -0.85 }]}>
        <Path path="M-90 0 Q0 64 90 0 Z" color="#1c1a24" />
        <Path path="M-90 0 Q0 64 90 0" style="stroke" strokeWidth={3} color="#a0a8c0" opacity={0.6} />
        <Circle cx={0} cy={-60} r={5} color="#ffd38a" />
      </Group>
      <Fade amount={smooth(125, 127, t) * 0.7} />
      <Dust t={t} opacity={smooth(125.5, 128, t)} />
    </Shot>
  );
};

// 2 · 飞向最近的恒星，要几百年（130.4–136.0 秒）：一艘长长的世代方舟，在一大片黑里慢慢爬；舷窗里的身影一代代换
export const Ark: React.FC = () => {
  const t = useT();
  const x = lerp(300, 520, smooth(130.4, 136, t));
  const y = 560;
  const L = 1100;
  const wins = Array.from({ length: 18 }, (_, i) => i);
  const gen = (t - 130.4) * 1.6;
  return (
    <Shot>
      <Nebula t={t} cam={[8.6, 0.4]} glow={0.15} />
      <StarLayer t={t} seed={221} n={500} spikes={false} dx={-(t - 130) * 6} opacity={0.7} />
      <Bloom radius={22} strength={0.8} threshold={0.55}>
        <Sun x={1820} y={300} R={10} t={t} />
      </Bloom>
      <Group transform={[{ translateX: x }, { translateY: y }]}>
        {/* 船身：几段胶囊连成一串，中间转着的环 */}
        <RoundedRect x={0} y={-40} width={L} height={80} r={40} color="#2a2832" />
        <RoundedRect x={0} y={-40} width={L} height={30} r={20} color="#3a3844" />
        {[0.25, 0.55].map((u, i) => (
          <Oval key={i} x={L * u - 30} y={-130} width={60} height={260} style="stroke" strokeWidth={14} color="#4a4856" />
        ))}
        <Path path={`M${L} -30 L${L + 160} 0 L${L} 30 Z`} color="#3a3844" />
        <Circle cx={-10} cy={0} r={34} color="#8fd8ff" opacity={0.5}>
          <BlurMask blur={20} style="normal" />
        </Circle>
        {wins.map((i) => {
          const wx = 70 + i * 56;
          const life = (gen + i * 0.37) % 3;
          const lit = life < 2.5;
          return (
            <Group key={i}>
              <RoundedRect x={wx} y={-14} width={30} height={22} r={6} color={lit ? "#ffcf7a" : "#3a3020"} opacity={lit ? 0.9 : 1} />
              {lit && i % 3 === 0 ? (
                <Critter x={wx + 15} y={-2} s={0.05} pose={{ sit: 0.8, lift: 0.3, glow: 0 }} silhouette={1} ink="#3a2414" rim="#3a2414" />
              ) : null}
            </Group>
          );
        })}
      </Group>
      <Fade amount={0.65} />
      <Dust t={t} opacity={0.8} />
    </Shot>
  );
};

// 3 · 回信抵达时，写信的人早已不在（135.6–141.4 秒）：左边家里的窗口，右边远处的新家；信的光从左飞到右，回信从右飞回来——窗口里已经没有人了
export const Letter: React.FC = () => {
  const t = useT();
  const home: [number, number] = [360, 610];
  const far: [number, number] = [1610, 470];
  const out = smooth(136.0, 137.8, t);
  const back = smooth(138.0, 140.4, t);
  const gone = smooth(138.8, 139.5, t);
  const orb = (p: number, a: [number, number], b: [number, number]): [number, number] => [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - Math.sin(p * Math.PI) * 90];
  const o1 = orb(out, home, far);
  const o2 = orb(back, far, home);
  return (
    <Shot>
      <Nebula t={t} cam={[9.2, 0.1]} glow={0.15} />
      <StarLayer t={t} seed={231} n={400} spikes={false} opacity={0.6} />
      {/* 家：一面墙上的一扇圆窗，里面一盏灯、一个身影 */}
      <Rect x={0} y={0} width={620} height={H} color="#16121c" />
      <Circle cx={home[0]} cy={home[1]} r={150} color="#0a0810" />
      <Circle cx={home[0]} cy={home[1]} r={140} color={gone < 1 ? "#ffcf8a" : "#e8c48a"} opacity={0.85} />
      <Circle cx={home[0]} cy={home[1]} r={140}>
        <RadialGradient c={vec(home[0] - 40, home[1] - 40)} r={200} colors={["#fff0d0", "#e8a868", "#8a5a3a"]} />
      </Circle>
      <Group opacity={1 - gone}>
        <Critter x={home[0] - 10} y={home[1] + 90} s={0.55} pose={{ sit: 0.85, lift: lerp(0.2, -0.1, gone), glow: 0.3 }} silhouette={0.9} ink="#4a2a1a" rim="#4a2a1a" />
      </Group>
      <Rect x={home[0] - 140} y={home[1] + 110} width={280} height={30} color="#5a3a24" />
      <Circle cx={home[0]} cy={home[1]} r={146} style="stroke" strokeWidth={10} color="#2a2230" />
      {/* 远处的新家 */}
      <Planet x={far[0]} y={far[1]} R={70} t={t} rot={1} light={[-0.6, 0.3, 0.4]} cities={0.4} look={{ sea: [0.4, 0.2, 0.18], land: [0.62, 0.36, 0.22], air: [1.0, 0.6, 0.45] }} clouds={0.2} />
      <Bloom radius={20} strength={1} threshold={0.5}>
        {out > 0 && out < 1 ? (
          <Circle cx={o1[0]} cy={o1[1]} r={10} color="#fff0c8">
            <BlurMask blur={6} style="normal" />
          </Circle>
        ) : null}
        {back > 0 && back < 1 ? (
          <Circle cx={o2[0]} cy={o2[1]} r={10} color="#c8f0ff">
            <BlurMask blur={6} style="normal" />
          </Circle>
        ) : null}
        <Circle cx={home[0]} cy={home[1]} r={160} color="#c8f0ff" opacity={Math.max(0, 1 - Math.abs(t - 140.5) / 0.4) * 0.5}>
          <BlurMask blur={40} style="normal" />
        </Circle>
      </Bloom>
      <Fade amount={0.55} />
      <Dust t={t} />
    </Shot>
  );
};

// 4 · 时间落满万物，细如微尘（141.0–146.4 秒）：广场上的一尊雕像，天色飞快地明暗交替，沙子一点点埋上来，雕像裂了
export const Statue: React.FC = () => {
  const t = useT();
  const k = smooth(141, 146.4, t);
  const day = 0.5 + 0.5 * Math.sin((t - 141) * 5.4);
  const sand = lerp(1000, 820, k);
  const cracks = Skia.Path.Make();
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const on = smooth(141.6 + i * 0.4, 142.2 + i * 0.4, t);
    if (on <= 0) continue;
    let x = 820 + r() * 280;
    let y = 520 + r() * 260;
    cracks.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (r() - 0.5) * 50 * on;
      y += r() * 40 * on;
      cracks.lineTo(x, y);
    }
  }
  return (
    <Shot>
      <DuskWorld t={t * 6} sun={[lerp(200, 1700, ((t - 141) * 0.86) % 1), 500]} horizon={760} night={lerp(0.85, 0.15, day)} />
      <Ridge pts={ridgeLine(0, W, 770, 30, 81)} color="#3a3040" />
      {/* 基座和雕像 */}
      <Rect x={790} y={780} width={340} height={240} color="#4a4450" />
      <Rect x={770} y={760} width={380} height={30} color="#5a5460" />
      <Critter x={960} y={700} s={1.0} rot={lerp(0, 0.05, k)} pose={{ sit: 0.95, lift: 0.5, glow: 0 }} body="#8a8490" belly="#5a5460" rim="#c8c0d0" silhouette={0} />
      <Path path={cracks} style="stroke" strokeWidth={3} color="#2a2430" />
      {/* 沙 */}
      <Path path={`M0 ${sand + 60} Q480 ${sand - 40} 960 ${sand + 10} T${W} ${sand - 20} L${W} ${H} L0 ${H} Z`}>
        <LinearGradient start={vec(0, sand - 40)} end={vec(0, H)} colors={["#b8a07a", "#6a5a48"]} />
      </Path>
      <Rect x={0} y={0} width={W} height={H} color="#000" opacity={(1 - day) * 0.25} />
      <Fade amount={0.55} />
      <Dust t={t} />
      <Motes t={t} seed={241} n={40} color="#e8d8b8" size={2} blur={1} drift={[90, 10]} opacity={0.6} />
    </Shot>
  );
};

// 5 · 连母星的方位，都得翻找古老的星图（145.8–150.8 秒）：一张羊皮纸星图，提灯的光在上面慢慢移动，停在一个被圈起来的点上
const PAPER = effect(`
uniform float2 size;
uniform float2 lamp;
uniform float r;
${NOISE}
half4 main(float2 p) {
  float fib = fbm(float2(p.x * 0.004, p.y * 0.03)) * 0.5 + fbm(p * 0.02) * 0.5;
  float stain = smoothstep(0.55, 0.8, fbm(p * 0.003 + 7.0));
  float3 c = mix(float3(0.78, 0.66, 0.46), float3(0.62, 0.5, 0.34), fib);
  c = mix(c, float3(0.45, 0.33, 0.2), stain * 0.6);
  float edge = smoothstep(0.0, 0.18, min(min(p.x, size.x - p.x), min(p.y, size.y - p.y)) / size.y);
  c *= 0.55 + 0.45 * edge;
  float lit = exp(-pow(distance(p, lamp) / r, 2.0));
  c *= 0.18 + 0.95 * lit;
  return half4(half3(c), 1.0);
}
`);
const CHART = (() => {
  const r = rng(91);
  const stars = Array.from({ length: 80 }, () => [140 + r() * 1640, 120 + r() * 840, r()] as [number, number, number]);
  const lines: [number, number][] = [];
  for (let i = 0; i < 40; i++) lines.push([Math.floor(r() * 80), Math.floor(r() * 80)]);
  return { stars, lines: lines.filter(([a, b]) => Math.hypot(stars[a][0] - stars[b][0], stars[a][1] - stars[b][1]) < 260) };
})();
export const Chart: React.FC = () => {
  const t = useT();
  const target: [number, number] = [1260, 640];
  const p = smooth(146.2, 149.6, t);
  const lamp: [number, number] = [lerp(420, target[0], p) + Math.sin(p * 9) * 60 * (1 - p), lerp(300, target[1], p) + Math.cos(p * 7) * 40 * (1 - p)];
  const ring = smooth(149.6, 150.4, t);
  const zoom = lerp(1.0, 1.12, smooth(145.8, 150.8, t));
  const con = Skia.Path.Make();
  CHART.lines.forEach(([a, b]) => {
    con.moveTo(CHART.stars[a][0], CHART.stars[a][1]);
    con.lineTo(CHART.stars[b][0], CHART.stars[b][1]);
  });
  return (
    <Shot>
      <Group transform={[{ translateX: W / 2 }, { translateY: H / 2 }, { scale: zoom }, { translateX: -lerp(W / 2, target[0], p * 0.4) }, { translateY: -lerp(H / 2, target[1], p * 0.4) }]}>
        <Fill>
          <Shader source={PAPER} uniforms={{ size: [W, H], lamp, r: 420 }} />
        </Fill>
        <Group opacity={0.75}>
          <Circle cx={960} cy={540} r={430} style="stroke" strokeWidth={2} color="#3a2414" />
          <Circle cx={960} cy={540} r={300} style="stroke" strokeWidth={1.5} color="#3a2414" />
          <Path path={con} style="stroke" strokeWidth={1.6} color="#3a2414" />
          {CHART.stars.map(([x, y, b], i) => (
            <Circle key={i} cx={x} cy={y} r={2 + b * 4} color="#2a1a0c" />
          ))}
          {GLYPHS.map((_, i) => (
            <Glyph key={i} i={i} x={220 + i * 130} y={i % 2 ? 980 : 90} size={34} color="#3a2414" glow={0} width={2} />
          ))}
        </Group>
        <Circle cx={target[0]} cy={target[1]} r={6} color="#2a1a0c" />
        <Circle cx={target[0]} cy={target[1]} r={34} style="stroke" strokeWidth={3} color="#8a3a1a" opacity={ring} />
      </Group>
      <Circle cx={W / 2} cy={H / 2} r={900} color="#ffb86a" opacity={0.06}>
        <BlurMask blur={300} style="normal" />
      </Circle>
      <Fade amount={0.35} />
      <Dust t={t} />
    </Shot>
  );
};

// 6 · 它们第一次觉得，自己很小（150.4–155.6 秒）：档案馆里一个提灯的身影，镜头一路退远：书架、屋顶、行星、恒星，最后什么都看不见
export const Small: React.FC = () => {
  const t = useT();
  const z1 = Math.exp(-smooth(150.4, 153.0, t) * 2.6);
  const cosmos = smooth(152.4, 153.4, t);
  const z2 = Math.exp(-smooth(152.8, 155.4, t) * 3.2);
  const shelves = Array.from({ length: 14 }, (_, i) => i);
  return (
    <Shot>
      <Group opacity={1 - cosmos}>
        <Group transform={[{ translateX: 960 }, { translateY: 640 }, { scale: z1 * 2.2 }, { translateX: -960 }, { translateY: -640 }]}>
          <Rect x={-4000} y={-4000} width={10000} height={10000} color="#0c0a10" />
          {shelves.map((i) => (
            <Group key={i}>
              <Rect x={-2400 + i * 360} y={-1600} width={220} height={2400} color="#16121c" />
              {Array.from({ length: 14 }, (_, k) => (
                <Rect key={k} x={-2390 + i * 360} y={-1560 + k * 170} width={200} height={10} color="#2a2230" />
              ))}
            </Group>
          ))}
          <Circle cx={960} cy={640} r={260} color="#ffb86a" opacity={0.35}>
            <BlurMask blur={140} style="normal" />
          </Circle>
          <Critter x={940} y={650} s={0.18} pose={{ sit: 0.6, lift: 0.2, glow: 0.6 }} silhouette={0.6} rim="#ffb86a" />
          <Circle cx={985} cy={630} r={5} color="#fff0c0" />
        </Group>
      </Group>
      <Group opacity={cosmos}>
        <Nebula t={t} cam={[9.8, 0.3]} glow={0.2} zoom={lerp(1.6, 1, smooth(152.8, 155.4, t))} />
        <StarLayer t={t} seed={251} n={700} spikes={false} zoom={lerp(1.8, 1, smooth(152.8, 155.4, t))} />
        <Planet x={960} y={540} R={300 * z2} t={t} rot={2} light={[-0.9, 0.2, 0.3]} cities={0.9} />
        <Bloom radius={22} strength={0.8} threshold={0.5}>
          <Sun x={960 - 1600 * z2} y={540 - 200 * z2} R={Math.max(4, 120 * z2)} t={t} />
        </Bloom>
      </Group>
      <Fade amount={0.45} />
      <Dust t={t} opacity={1 - cosmos * 0.5} />
    </Shot>
  );
};
