// 二 · 火（60–91 秒）：火种从它背上的光点跳到枯枝上；一群生灵围着火；会变形的符号在头与头之间传递；
// 洞壁上，火光把它们投成巨大的影子，一个在壁上刻字；刻痕一代代越积越多；最后化成光点飞出去
// 注意：Skia 画布里拿不到外面的 React context，时间 t 都在画布外算好再传进去
import { Blur, BlurMask, Circle, Group, LinearGradient, Oval, Paint, Path, Rect, Skia, vec } from "@shopify/react-native-skia";
import React from "react";
import { useT } from "../time";
import { Critter } from "./critter";
import { CaveWall, Embers, Flame, Glyph } from "./props";
import { Bloom, H, Shot, W, clamp01, lerp, rng, smooth } from "./sk";
import { StarLayer } from "./space";
import { DuskWorld, MilkyWay, Motes, Ridge, ridgeLine } from "./world";

const COLORS = ["#f2994a", "#e8845f", "#f0a860", "#d98a5c", "#f6b06a"];
const blinkAt = (t: number, period: number, ph: number) => Math.max(0, 1 - Math.abs(((t + ph) % period) - period / 2) / 0.1);

// 一棵枝杈横生的树的剪影
const tree = (x: number, y: number, s: number) => {
  const p = Skia.Path.Make();
  p.moveTo(x - 6 * s, y);
  p.lineTo(x - 3 * s, y - 120 * s);
  p.lineTo(x - 60 * s, y - 170 * s);
  p.lineTo(x - 2 * s, y - 135 * s);
  p.lineTo(x + 4 * s, y - 190 * s);
  p.lineTo(x + 70 * s, y - 165 * s);
  p.lineTo(x + 6 * s, y - 128 * s);
  p.lineTo(x + 6 * s, y);
  p.close();
  p.addOval(Skia.XYWHRect(x - 120 * s, y - 210 * s, 150 * s, 50 * s));
  p.addOval(Skia.XYWHRect(x - 20 * s, y - 225 * s, 160 * s, 54 * s));
  return p;
};

// 1 · 它们学会了用火（60.4–65.8 秒）：近景，它低头凑近一堆枯枝，背上的一点光跳出去，枯枝着了，它往后一缩
export const Spark: React.FC = () => {
  const t = useT();
  const fire: [number, number] = [1180, 880];
  const ignite = smooth(62.2, 63.6, t);
  const hop = clamp01((t - 61.4) / 0.8);
  const startP: [number, number] = [760, 600];
  const sx = lerp(startP[0], fire[0], hop);
  const sy = lerp(startP[1], fire[1] - 30, hop) - Math.sin(hop * Math.PI) * 160;
  const flinch = smooth(62.3, 62.8, t) * (1 - smooth(63.4, 64.8, t) * 0.5);
  const push = lerp(1, 1.06, smooth(60.4, 65.8, t));
  return (
    <Shot>
      <Group transform={[{ translateX: W / 2 }, { translateY: H / 2 }, { scale: push }, { translateX: -W / 2 }, { translateY: -H / 2 }]}>
        <DuskWorld t={t} sun={[300, 900]} horizon={640} night={0.84} />
        <Group opacity={0.75}>
          <MilkyWay t={t} amount={0.8} angle={-0.3} />
        </Group>
        <StarLayer t={t} seed={91} n={260} spikes={false} opacity={0.7} />
        <Ridge pts={ridgeLine(0, W, 644, 30, 31)} color="#1a1128" rim="#5a3b62" rimWidth={2} />
        <Path path={tree(260, 690, 1.2)} color="#0d0817" />
        <Path path={tree(1720, 670, 0.8)} color="#120b1e" />
        <Rect x={0} y={660} width={W} height={H - 660} color="#0b0714" />
        <Oval x={fire[0] - 620} y={fire[1] - 120} width={1240} height={240} color="#ff8a3a" opacity={0.26 * ignite}>
          <BlurMask blur={70} style="normal" />
        </Oval>
        {[
          [-80, 10, 70, -30],
          [-60, 14, 80, -8],
          [-30, 16, 60, -46],
          [-90, 12, 50, -2],
        ].map(([ax, ay, bx, by], i) => (
          <Path key={i} path={`M${fire[0] + ax} ${fire[1] + ay} L${fire[0] + bx} ${fire[1] + by}`} style="stroke" strokeWidth={11} strokeCap="round" color={ignite > 0.3 ? "#3a1a10" : "#4a3428"} />
        ))}
        <Critter
          x={700 - flinch * 50}
          y={720}
          s={1.75}
          pose={{ lift: lerp(-0.4, 0.2, flinch), walk: 0, look: [1, lerp(0.4, -0.1, flinch)], glow: lerp(1, 0.55, ignite), blink: blinkAt(t, 3.6, 1.2) }}
          rimSide={1}
          rim={ignite > 0.2 ? "#ffb070" : "#c9a8ff"}
        />
        <Bloom radius={26} strength={1} threshold={0.55}>
          <Flame x={fire[0]} y={fire[1]} w={90} h={240} t={t} k={ignite} />
          {hop > 0 && hop < 1 ? (
            <Circle cx={sx} cy={sy} r={10} color="#fff0c0">
              <BlurMask blur={5} style="normal" />
            </Circle>
          ) : null}
          <Embers x={fire[0]} y={fire[1] - 70} t={t} k={ignite} />
        </Bloom>
        <Motes t={t} seed={33} n={16} color="#ffd27a" size={3} blur={3} drift={[4, -4]} opacity={0.6} />
      </Group>
    </Shot>
  );
};

// 2 · 火让夜晚变短，生灵围坐在一起（65.2–70.8 秒）：一圈生灵，火光把黑夜推开，影子拖得很长
const RING = [
  { x: 720, y: 640, s: 0.62, flip: false, sil: 0.05 },
  { x: 1200, y: 636, s: 0.6, flip: true, sil: 0.05 },
  { x: 990, y: 596, s: 0.46, flip: true, sil: 0.12 },
  { x: 470, y: 840, s: 1.05, flip: false, sil: 0.72 },
  { x: 1470, y: 850, s: 1.1, flip: true, sil: 0.72 },
];
export const Circle5: React.FC = () => {
  const t = useT();
  const fire: [number, number] = [960, 770];
  const pan = smooth(65.2, 70.8, t) * 60;
  const dome = lerp(0.8, 1.15, smooth(65.6, 70.4, t));
  return (
    <Shot>
      <DuskWorld t={t} sun={[960, 900]} horizon={560} night={0.92} />
      <Group opacity={0.8}>
        <MilkyWay t={t} amount={0.9} angle={-0.25} offset={[pan * 0.3, 0]} />
      </Group>
      <Ridge pts={ridgeLine(-100, W + 100, 566, 40, 41).map(([x, y]) => [x - pan * 0.3, y] as [number, number])} color="#170f25" rim="#4c335a" rimWidth={2} />
      <Rect x={0} y={570} width={W} height={H - 570} color="#0c0814" />
      <Circle cx={fire[0]} cy={fire[1]} r={760 * dome} color="#ff8a3a" opacity={0.14}>
        <BlurMask blur={260} style="normal" />
      </Circle>
      <Oval x={fire[0] - 640} y={fire[1] - 150} width={1280} height={300} color="#ff9440" opacity={0.28}>
        <BlurMask blur={80} style="normal" />
      </Oval>
      {RING.map((c, i) => {
        const dx = c.x - fire[0];
        const l = Math.abs(dx) || 1;
        return (
          <Oval key={i} x={c.x - pan * 0.6 + (dx / l) * 140 * c.s - 170 * c.s} y={c.y + 46 * c.s - 16} width={340 * c.s} height={32} color="#000" opacity={0.55}>
            <BlurMask blur={10} style="normal" />
          </Oval>
        );
      })}
      {RING.slice(0, 3).map((c, i) => (
        <Critter key={i} x={c.x - pan * 0.6} y={c.y} s={c.s} flip={c.flip} pose={{ sit: 0.9, lift: 0.1, glow: 0.55, walk: t + i, blink: blinkAt(t, 4.2, i * 1.3) }} rimSide={c.flip ? -1 : 1} rim="#ffb070" body={COLORS[i]} silhouette={c.sil} />
      ))}
      <Bloom radius={24} strength={0.95} threshold={0.55}>
        <Flame x={fire[0] - pan * 0.7} y={fire[1]} w={84} h={230} t={t} />
        <Embers x={fire[0] - pan * 0.7} y={fire[1] - 80} t={t} n={50} rise={440} />
      </Bloom>
      {RING.slice(3).map((c, i) => (
        <Critter key={i} x={c.x - pan} y={c.y} s={c.s} flip={c.flip} pose={{ sit: 0.85, lift: 0.05, glow: 0.45, walk: t * 0.5 + i }} rimSide={c.flip ? -1 : 1} rim="#ffc080" body={COLORS[i + 3]} silhouette={c.sil} />
      ))}
    </Shot>
  );
};

// 3 · 语言，把念头传进另一个脑海（70.6–75.2 秒）：两个生灵面对面，发光的符号从一个飘向另一个，对方背上的光跟着亮
const TALK = [
  { from: 0, at: 71.0, g: 0, c: "#ffd08a" },
  { from: 1, at: 72.3, g: 4, c: "#8fe8e0" },
  { from: 0, at: 73.4, g: 9, c: "#ffb3d0" },
];
export const Talk: React.FC = () => {
  const t = useT();
  const fire: [number, number] = [960, 920];
  const heads: [number, number][] = [
    [790, 540],
    [1130, 540],
  ];
  const received = (who: number) => TALK.reduce((m, s) => (s.from !== who ? Math.max(m, Math.max(0, 1 - Math.abs(t - s.at - 1.25) / 0.45)) : m), 0);
  const speaking = (who: number) => TALK.reduce((m, s) => (s.from === who ? Math.max(m, Math.max(0, 1 - Math.abs(t - s.at - 0.1) / 0.3)) : m), 0);
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#08061a", "#1a0f22", "#2a140f"]} />
      </Rect>
      <StarLayer t={t} seed={95} n={180} spikes={false} opacity={0.5} />
      <Circle cx={fire[0]} cy={fire[1]} r={760} color="#ff8a3a" opacity={0.22}>
        <BlurMask blur={240} style="normal" />
      </Circle>
      <Critter x={640} y={760} s={1.25} pose={{ sit: 0.75, lift: 0.25, glow: 0.45 + received(0) * 0.9, mouth: speaking(0), look: [1, -0.1], walk: t, blink: blinkAt(t, 3.1, 0.4) }} rimSide={1} rim="#ffb070" body={COLORS[0]} />
      <Critter x={1280} y={764} s={1.22} flip pose={{ sit: 0.75, lift: 0.2, glow: 0.45 + received(1) * 0.9, mouth: speaking(1), look: [1, -0.1], walk: t + 1, blink: blinkAt(t, 3.7, 2.0) }} rimSide={-1} rim="#ffb070" body={COLORS[3]} />
      <Bloom radius={22} strength={1} threshold={0.5}>
        {TALK.map((s, i) => {
          const p = smooth(s.at, s.at + 1.3, t);
          if (p <= 0 || p >= 1) return null;
          const [x0, y0] = heads[s.from];
          const [x1, y1] = heads[1 - s.from];
          const x = lerp(x0, x1, p);
          const y = lerp(y0, y1, p) - Math.sin(p * Math.PI) * 190;
          return <Glyph key={i} i={s.g + Math.floor(p * 2.99)} x={x} y={y} size={lerp(50, 130, Math.sin(p * Math.PI))} color={s.c} glow={1.5} opacity={Math.min(1, Math.sin(p * Math.PI) * 2)} width={4} />;
        })}
        <Flame x={fire[0]} y={fire[1] + 40} w={90} h={200} t={t} />
        <Embers x={fire[0]} y={fire[1] - 40} t={t} n={30} />
      </Bloom>
    </Shot>
  );
};

// 4 · 文字，把这一代的念头留给下一代（75.0–79.8 秒）：洞壁，火光从左下照上来，把它的影子投得巨大；它在壁上刻下发光的符号
const MARKS = (() => {
  const r = rng(7);
  const out: { x: number; y: number; g: number; at: number }[] = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 11; col++) {
      out.push({ x: 640 + col * 92 + (row % 2) * 30 + (r() - 0.5) * 16, y: 210 + row * 92 + (r() - 0.5) * 10, g: Math.floor(r() * 12), at: 0 });
    }
  }
  // 从它鼻尖前那一处开始刻：最近的四个慢慢刻，之后一圈圈往外，越来越快（跨好几代）
  const start: [number, number] = [1010, 404];
  const byDist = out.map((m, i) => [Math.hypot(m.x - start[0], (m.y - start[1]) * 1.6) + r() * 40, i]).sort((a, b) => a[0] - b[0]);
  byDist.forEach(([, i], k) => (out[i].at = k < 4 ? 75.6 + k * 1.0 : 79.6 + Math.pow((k - 4) / (out.length - 4), 0.7) * 5.2));
  return out;
})();

const WallShot: React.FC<{ t: number; zoom: number; cx: number; cy: number; lift?: number }> = ({ t, zoom, cx, cy, lift = 0 }) => {
  const fire: [number, number] = [260, 1060];
  const flick = 1 + 0.05 * Math.sin(t * 9) * Math.sin(t * 4.7 + 1);
  const memory = smooth(84.0, 85.6, t);
  // 影子：火光投在壁上的巨大剪影；后面一代代换成不同大小的身影
  const gen = Math.floor(Math.max(0, t - 79.4) / 1.1);
  const shadowS = 2.6 * flick * (1 + (gen % 3) * 0.12);
  return (
    <Group transform={[{ translateX: W / 2 }, { translateY: H / 2 }, { scale: zoom }, { translateX: -cx }, { translateY: -cy }]}>
      <CaveWall light={fire} t={t} k={1} />
      <Group opacity={0.78} layer={<Paint><Blur blur={8} /></Paint>}>
        <Critter x={760 + Math.sin(t * 0.7) * 20} y={900} s={shadowS} pose={{ sit: 0.6, lift: 0.3 + Math.sin(t * 1.3) * 0.05, glow: 0 }} silhouette={1} ink="#000000" rim="#000000" />
      </Group>
      <Bloom radius={18} strength={1} threshold={0.45}>
        {MARKS.map((m, i) => {
          const draw = smooth(m.at, m.at + (i < 4 ? 0.8 : 0.3), t);
          if (draw <= 0) return null;
          const age = Math.max(0, t - m.at - 0.8);
          const hot = Math.exp(-age / 1.2);
          const rise = smooth(86.2 + (i % 11) * 0.08, 89.6 + (i % 7) * 0.1, t) * lift;
          return (
            <Glyph
              key={i}
              i={m.g}
              x={m.x + Math.sin(i * 1.7 + t) * 30 * rise}
              y={m.y - rise * (500 + (i % 5) * 80)}
              size={58}
              draw={draw}
              color={hot > 0.3 ? "#ffcf7a" : "#ff8a4a"}
              glow={0.6 + hot + memory * 0.9}
              opacity={(0.6 + 0.4 * hot + memory * 0.4) * (1 - rise * 0.5)}
              width={3}
            />
          );
        })}
      </Bloom>
    </Group>
  );
};

export const Carve: React.FC = () => {
  const t = useT();
  const nose = smooth(75.4, 76.0, t) * (1 - smooth(79.2, 79.8, t));
  return (
    <Shot>
      <WallShot t={t} zoom={lerp(1.35, 1.25, smooth(75, 79.8, t))} cx={900} cy={420} />
      <Critter x={1330} y={860} s={1.05} flip pose={{ sit: 0.55, lift: lerp(0.2, 0.55, nose), mouth: nose * Math.max(0, Math.sin(t * 6)), glow: 0.5, look: [1, -0.6], blink: blinkAt(t, 3.3, 0.8) }} rimSide={-1} rim="#ffb070" body={COLORS[2]} silhouette={0.45} />
      <Circle cx={60} cy={H + 60} r={520} color="#ff8a3a" opacity={0.28}>
        <BlurMask blur={200} style="normal" />
      </Circle>
    </Shot>
  );
};

// 5 · 自此，它们不再只是活着（79.4–84.6 秒）：退开，整面墙被一代代刻满；壁上的影子换了一个又一个
export const Generations: React.FC = () => {
  const t = useT();
  return (
    <Shot>
      <WallShot t={t} zoom={lerp(1.15, 0.96, smooth(79.4, 84.6, t))} cx={960} cy={470} />
    </Shot>
  );
};

// 6 · 它们开始记得（84.0–91.2 秒）：满墙的刻痕一起亮起来，然后一个个离开墙面，像火星一样往上飘
export const Remember: React.FC = () => {
  const t = useT();
  const fade = smooth(88.6, 91.0, t);
  return (
    <Shot>
      <Group opacity={1 - fade * 0.75}>
        <WallShot t={t} zoom={lerp(0.96, 0.92, smooth(84, 91, t))} cx={960} cy={lerp(470, 380, smooth(86, 91, t))} lift={1} />
      </Group>
      <Rect x={0} y={0} width={W} height={H} color="#05040c" opacity={fade * 0.6} />
      <Motes t={t} seed={44} n={40} color="#ffcf7a" size={3} blur={2} drift={[6, -60]} opacity={smooth(86, 88, t)} />
    </Shot>
  );
};
