// 一 · 微光（36–61 秒）：一颗不起眼的恒星和一颗寻常的行星；海里的分子学会复制自己、长成细胞、分裂；
// 生灵朝着黄昏的光游上岸；天黑下来，它抬起头，第一次看见满天的星
import { BlurMask, Group, Line, LinearGradient, Path, Rect, Skia, vec } from "@shopify/react-native-skia";
import React from "react";
import { useT } from "../time";
import { Planet, Sun } from "./bodies";
import { Critter } from "./critter";
import { Bloom, H, Shot, W, clamp01, lerp, pop, rng, smooth } from "./sk";
import { Nebula, StarLayer } from "./space";
import { Ball, Bubbles, DuskWorld, Membrane, MilkyWay, Motes, Ridge, Underwater, ridgeLine } from "./world";

// 9 · 某颗不起眼的恒星旁，一颗寻常的行星（36.2–41.8 秒）：行星沿轨道转过来，镜头推近，穿过云层扎进它的海
export const World: React.FC = () => {
  const t = useT();
  const sun: [number, number] = [330, 560];
  const ang = lerp(-0.5, 0.12, smooth(36.2, 40.0, t));
  const orbitR: [number, number] = [1050, 260];
  const planet: [number, number] = [sun[0] + Math.cos(ang) * orbitR[0], sun[1] + Math.sin(ang) * orbitR[1]];
  const push = smooth(38.0, 40.2, t);
  const dive = smooth(40.2, 41.8, t);
  const R = lerp(70, 150, push) * Math.exp(dive * dive * 3.2);
  const pc: [number, number] = [lerp(planet[0], W * 0.62, push), lerp(planet[1], H * 0.5, push) + dive * R * 0.35];
  const toSun = [sun[0] - pc[0], -(sun[1] - pc[1])];
  const l = Math.hypot(toSun[0], toSun[1]);
  const light: [number, number, number] = [toSun[0] / l, toSun[1] / l, 0.35];
  const sunShift = push * -260;
  return (
    <Shot>
      <Nebula t={t} cam={[4.0, 0.1]} glow={0.45} />
      <StarLayer t={t} seed={61} n={700} spikes={false} dx={sunShift * 0.2} />
      <Path
        path={`M${sun[0] + sunShift - orbitR[0]} ${sun[1]} A${orbitR[0]} ${orbitR[1]} 0 1 1 ${sun[0] + sunShift + orbitR[0]} ${sun[1]} A${orbitR[0]} ${orbitR[1]} 0 1 1 ${sun[0] + sunShift - orbitR[0]} ${sun[1]}`}
        style="stroke"
        strokeWidth={1.6}
        color="#bcd3ff"
        opacity={0.28 * (1 - push)}
      />
      <Bloom radius={28} strength={0.9} threshold={0.5}>
        <Sun x={sun[0] + sunShift} y={sun[1]} R={70} t={t} />
      </Bloom>
      <Planet x={pc[0]} y={pc[1]} R={R} t={t} rot={t * 0.05} light={light} />
      {/* 冲进云层：一片白，再变成海的蓝 */}
      <Rect x={0} y={0} width={W} height={H} color="#e8f6ff" opacity={smooth(41.0, 41.6, t) * 0.7} />
      <Rect x={0} y={0} width={W} height={H} color="#0b4a63" opacity={smooth(41.5, 41.8, t)} />
    </Shot>
  );
};

// 10 · 海里的一团分子学会复制自己（41.4–47.0 秒）
const PALETTE = ["#ff8a6b", "#ffd66b", "#5fe0c8", "#8fb4ff", "#ff9fd0"];
const SOUP = (() => {
  const r = rng(17);
  return Array.from({ length: 30 }, (_, i) => ({ x: 160 + r() * 1600, y: 140 + r() * 760, c: i % 5, ph: r() * 10, s: 11 + r() * 7 }));
})();
const CHAIN = [0, 2, 1, 3, 4];
export const Molecules: React.FC = () => {
  const t = useT();
  const chainA = smooth(42.0, 43.5, t);
  const chainB = (k: number) => smooth(44.0 + k * 0.22, 44.7 + k * 0.22, t);
  const membrane = pop(45.3, 0.6, t);
  const split = smooth(46.0, 46.9, t);
  const cx = W / 2;
  const cy = H / 2 - 30;
  const cellA: [number, number] = [cx - 180 * split, cy - 40 * split];
  const cellB: [number, number] = [cx + 180 * split, cy + 40 * split];
  const zoom = lerp(1.45, 1.6, smooth(41.4, 47, t));
  const chainPos = (k: number, row: number): [number, number] => {
    const base = row === 0 ? cellA : cellB;
    return [base[0] - 76 + k * 38, base[1] + (row === 0 ? -24 : 24) * (1 - split) + Math.sin(t * 2 + k) * 3];
  };
  const balls = SOUP.map((m, i) => {
    let x = m.x + Math.sin(t * 0.6 + m.ph) * 34;
    let y = m.y + Math.cos(t * 0.5 + m.ph) * 26;
    let c = m.c;
    if (i < 5) {
      const [tx, ty] = chainPos(i, 0);
      x = lerp(x, tx, chainA);
      y = lerp(y, ty, chainA);
      c = CHAIN[i];
    } else if (i < 10) {
      const p = chainB(i - 5);
      const [tx, ty] = chainPos(i - 5, 1);
      x = lerp(x, tx, p);
      y = lerp(y, ty, p);
      c = CHAIN[i - 5];
    }
    return { x, y, c, s: i < 10 ? 14 : m.s };
  });
  return (
    <Shot>
      <Group transform={[{ translateX: W / 2 }, { translateY: H / 2 }, { scale: zoom }, { translateX: -W / 2 }, { translateY: -H / 2 }]}>
        <Underwater t={t} />
        <Motes t={t} seed={9} n={60} color="#bff6ff" size={2} blur={1} drift={[4, -6]} opacity={0.6} />
        <Bubbles t={t - 41} seed={3} n={18} />
        <Bloom radius={18} strength={0.6} threshold={0.55}>
          {[0, 1].map((row) =>
            [0, 1, 2, 3].map((k) => {
              const on = row === 0 ? chainA : chainB(k + 1);
              if (on < 0.95) return null;
              const [x1, y1] = chainPos(k, row);
              const [x2, y2] = chainPos(k + 1, row);
              return <Line key={`${row}-${k}`} p1={vec(x1, y1)} p2={vec(x2, y2)} color="#e8fbff" strokeWidth={5} opacity={0.7} />;
            }),
          )}
          {balls.map((b, i) => (
            <Ball key={i} x={b.x} y={b.y} r={b.s} color={PALETTE[b.c]} />
          ))}
          {membrane > 0 ? (
            split < 0.55 ? (
              <Membrane x={cx} y={cy} rx={(140 + split * 280) * membrane} ry={(126 - split * 46) * membrane} t={t} />
            ) : (
              <>
                <Membrane x={cellA[0]} y={cellA[1]} rx={124} ry={124} t={t} />
                <Membrane x={cellB[0]} y={cellB[1]} rx={124} ry={124} t={t + 2} />
              </>
            )
          ) : null}
        </Bloom>
        <Motes t={t} seed={10} n={8} color="#bff6ff" size={9} blur={10} drift={[10, -14]} opacity={0.35} />
      </Group>
    </Shot>
  );
};

// 11 · 它看见光，走上岸（46.6–51.4 秒）：一半水上一半水下的切面。水下有落日斜射进来的暖光和摇摆的水草，
// 生灵从左下游上来，在落日正前方爬上岸，变成一个被勾出金边的剪影
const SHORE = 500;
const beachY = (x: number) => 700 - (x - 900) * 0.42;
const SEAWEED = [
  [80, 0.9],
  [150, 1.2],
  [230, 0.8],
  [330, 1.05],
  [1820, 0.9],
] as const;
export const Shore: React.FC = () => {
  const t = useT();
  const sun: [number, number] = [1300, SHORE - 34];
  const swim = 1 - smooth(49.2, 49.8, t);
  const x = lerp(240, 1640, smooth(46.6, 51.4, t));
  const yUnder = lerp(900, SHORE + 70, smooth(46.6, 48.9, t));
  const y = swim > 0.5 ? yUnder : Math.min(yUnder, beachY(x) - 52);
  const rot = lerp(-0.4, -0.36, 1 - swim);
  const beach = Skia.Path.Make();
  beach.moveTo(760, H);
  beach.cubicTo(840, 980, 860, 760, 960, 674);
  beach.lineTo(W, beachY(W));
  beach.lineTo(W, H);
  beach.close();
  const waterClip = Skia.Path.Make();
  waterClip.addRect(Skia.XYWHRect(0, SHORE, W, H - SHORE));
  const rays = [0, 1, 2, 3, 4].map((i) => {
    const x0 = sun[0] - 120 + i * 70 + Math.sin(t * 0.6 + i) * 20;
    const p = Skia.Path.Make();
    p.moveTo(x0 - 20, SHORE);
    p.lineTo(x0 + 26, SHORE);
    p.lineTo(x0 - 520 + i * 40, H);
    p.lineTo(x0 - 640 + i * 40, H);
    p.close();
    return p;
  });
  return (
    <Shot>
      <DuskWorld t={t} sun={sun} horizon={SHORE} />
      <Group clip={waterClip}>
        <Underwater t={t} depth={0.15} />
        <Rect x={0} y={SHORE} width={W} height={H - SHORE} color="#ff8a5b" opacity={0.1} />
        {rays.map((p, i) => (
          <Path key={i} path={p} opacity={0.22}>
            <LinearGradient start={vec(0, SHORE)} end={vec(0, H)} colors={["#ffc58a", "rgba(255,197,138,0)"]} />
            <BlurMask blur={18} style="normal" />
          </Path>
        ))}
        {SEAWEED.map(([sx, k], i) => {
          const sway = Math.sin(t * 1.3 + i) * 26 * k;
          return (
            <Path
              key={i}
              path={`M${sx} ${H + 10} Q${sx + sway} ${H - 160 * k} ${sx + sway * 1.6} ${H - 300 * k}`}
              style="stroke"
              strokeWidth={16 * k}
              strokeCap="round"
              color="#0b2a2e"
            />
          );
        })}
      </Group>
      <Bloom radius={34} strength={0.9} threshold={0.55}>
        <Sun x={sun[0]} y={sun[1]} R={62} t={t} />
      </Bloom>
      <Ridge pts={ridgeLine(0, 760, SHORE - 6, 26, 4)} color="#3a2442" bottom={SHORE + 1} />
      <Path path={beach} color="#24162f" />
      <Path path={`M960 674 L${W} ${beachY(W)}`} style="stroke" strokeWidth={4} color="#ffb38a" opacity={0.75}>
        <BlurMask blur={1.5} style="normal" />
      </Path>
      {[
        [1450, beachY(1450) + 30, 70, 34],
        [1760, beachY(1760) + 40, 90, 42],
        [1120, beachY(1120) + 70, 60, 28],
      ].map(([rx, ry, w, h], i) => (
        <Group key={i}>
          <Path path={`M${rx - w} ${ry + h} Q${rx - w * 0.9} ${ry - h} ${rx} ${ry - h} Q${rx + w * 0.9} ${ry - h} ${rx + w} ${ry + h} Z`} color="#1a0f24" />
          <Path path={`M${rx - w * 0.7} ${ry - h * 0.2} Q${rx} ${ry - h * 1.05} ${rx + w * 0.7} ${ry - h * 0.2}`} style="stroke" strokeWidth={3} color="#ff9f7a" opacity={0.6}>
            <BlurMask blur={1.5} style="normal" />
          </Path>
        </Group>
      ))}
      <Bloom radius={16} strength={0.7} threshold={0.6}>
        <Critter x={x} y={y} s={0.9} rot={rot} pose={{ swim, walk: t * 2.6, look: [0.9, -0.3], glow: 0.4 }} rimSide={1} rim="#ffd0a0" silhouette={smooth(49.4, 50.6, t) * 0.55} />
      </Bloom>
      {/* 水面以下的部分蒙一层水色 */}
      <Group clip={waterClip}>
        <Rect x={0} y={SHORE} width={W} height={H - SHORE} color="#0a3550" opacity={0.22} />
      </Group>
      <Path
        path={`M0 ${SHORE} ${Array.from({ length: 49 }, (_, i) => `L${i * 40} ${SHORE + Math.sin(t * 2.4 + i * 0.7) * 3}`).join(" ")}`}
        style="stroke"
        strokeWidth={2.5}
        color="#ffe0c0"
        opacity={0.7}
      />
      <Motes t={t} seed={12} n={30} color="#bff6ff" size={2} blur={1} drift={[3, -5]} opacity={0.5} />
    </Shot>
  );
};
// 12 · 抬起头，第一次望见夜空（51.0–55.6 秒）：天色从黄昏暗下去，星一颗颗出来，背上的光亮了
export const Nightfall: React.FC = () => {
  const t = useT();
  const night = smooth(51.0, 54.8, t);
  const lift = smooth(52.2, 54.4, t);
  const blink = Math.max(0, 1 - Math.abs(t - 53.1) / 0.12);
  const horizon = 760;
  return (
    <Shot>
      <DuskWorld t={t} sun={[700, horizon + 80]} horizon={horizon} night={night} />
      <Group opacity={night * 0.9}>
        <MilkyWay t={t} amount={night} />
      </Group>
      <StarLayer t={t} seed={71} n={Math.round(500 * night)} opacity={night} spikes={false} />
      <Ridge pts={ridgeLine(0, W, horizon + 6, 40, 9)} color="#1c1230" rim="#7d4a7a" rimWidth={2} />
      <Ridge pts={[[900, H], [980, 860], [1080, 800], [1240, 786], [1380, 812], [1470, 880], [1520, H]]} color="#120b20" rim="#c47a8a" rimWidth={3} />
      <Bloom radius={18} strength={0.8} threshold={0.6}>
        <Critter x={1230} y={738} s={1.0} pose={{ lift, walk: 0, look: [lerp(0.9, 0.3, lift), lerp(0, -1, lift)], blink, glow: lerp(0.3, 1, night) }} rimSide={-1} rim="#ffb3a0" />
      </Bloom>
      <Motes t={t} seed={14} n={14} color="#ffd27a" size={3} blur={4} drift={[5, -3]} opacity={0.8 * night} />
    </Shot>
  );
};

// 13 · 它不知道那些亮点是什么，只是觉得那里很远，很好看（55.2–61.2 秒）：满屏的星和银河，一颗流星；
// 山顶上一个很小的它，仰着头，背上的光一闪一闪
export const Heavens: React.FC = () => {
  const t = useT();
  const tilt = smooth(55.2, 61.2, t) * 110;
  const meteor = clamp01((t - 57.6) / 0.9);
  const mx = lerp(1460, 760, meteor);
  const my = lerp(140, 420, meteor);
  const hill: [number, number][] = [
    [0, 960],
    [300, 930],
    [620, 900],
    [900, 868],
    [1080, 846],
    [1210, 836],
    [1330, 842],
    [1520, 880],
    [1760, 930],
    [W, 950],
  ];
  return (
    <Shot>
      <MilkyWay t={t} offset={[0, -tilt]} angle={-0.5} />
      <Bloom radius={22} strength={0.9} threshold={0.5}>
        <StarLayer t={t} seed={81} n={150} dy={tilt} />
        {meteor > 0 && meteor < 1 ? (
          <Path path={`M${mx + 230} ${my - 92} L${mx} ${my}`} style="stroke" strokeWidth={4} strokeCap="round" opacity={Math.sin(meteor * Math.PI)}>
            <LinearGradient start={vec(mx + 230, my - 92)} end={vec(mx, my)} colors={["rgba(255,255,255,0)", "#ffffff"]} />
          </Path>
        ) : null}
      </Bloom>
      <Ridge pts={ridgeLine(0, W, 990, 30, 21)} color="#0e0a1c" />
      <Ridge pts={hill} color="#07050f" rim="#7f8fd0" rimWidth={2} />
      <Bloom radius={14} strength={1} threshold={0.55}>
        <Critter x={1222} y={792} s={0.42} rot={0} pose={{ lift: 1, look: [0.3, -1], glow: 1 }} silhouette={0.92} rim="#9fb0ff" rimSide={1} />
      </Bloom>
    </Shot>
  );
};