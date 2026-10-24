// 七 · 熄灭（232–252 秒）与 尾 · 星海（251–284 秒）：
// 空城里灯都亮着，什么都不动；窗灯从楼顶往下一扇扇灭掉；星图从边疆往回暗，只剩母星；山坡上最后一扇窗在 4:07.6 熄灭。
// 镜头退回那条星系；开头那个光子还在路上；长长的时间线上，文明只是一闪；扁平的星海收回去，落回真实的超深场
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, Rect, vec } from "@shopify/react-native-skia";
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BEAT, asset } from "../theme";
import { useT } from "../time";
import { Critter } from "./critter";
import { NetMap, Skyline, makeNet } from "./props";
import { Bloom, H, Shot, W, lerp, smooth } from "./sk";
import { EllipticalGalaxy, Nebula, Photon, SpiralGalaxy, StarLayer } from "./space";
import { MilkyWay, Motes, Ridge, ridgeLine } from "./world";

const NET = () => makeNet(77, 1100, [520, 600], [80, 60, 1760, 960]);

// 城市夜景：off 0..1 窗灯从楼顶往下熄
const City: React.FC<{ t: number; off: number }> = ({ t, off }) => (
  <>
    <MilkyWay t={t} angle={-0.3} offset={[0, -120]} amount={0.9} />
    <Ridge pts={ridgeLine(0, W, 640, 40, 601)} color="#120c1e" rim="#4a3a6a" rimWidth={2} />
    <Skyline seed={3} base={700} x0={-40} x1={W + 40} minH={30} maxH={130} off={off} color="#140e22" window="#ffcf8a" />
    <Rect x={0} y={700} width={W} height={H - 700} color="#0e0918" />
    <Skyline seed={5} base={820} x0={-40} x1={W + 40} minH={60} maxH={280} off={off} color="#100b1c" window="#ffc46a" rim="#8a6aa0" />
    <Path path="M-50 900 C500 860 900 940 1300 880 C1600 840 1800 860 1970 840" style="stroke" strokeWidth={10} color="#1e1530" />
    <Path path="M-50 900 C500 860 900 940 1300 880 C1600 840 1800 860 1970 840" style="stroke" strokeWidth={3} color="#ffb76b" opacity={0.5 * (1 - off)}>
      <BlurMask blur={3} style="normal" />
    </Path>
    <Skyline seed={9} base={H + 4} x0={-40} x1={W + 40} minH={80} maxH={300} off={off} color="#0a0614" window="#ffb85a" rim="#8a6aa0" />
  </>
);

// 1 · 没有交火，也没有挣扎（232.0–236.8 秒）：城市里灯都亮着，什么都不动，只有一点风吹过的灰
export const StillCity: React.FC = () => {
  const t = useT();
  return (
    <Shot>
      <Group transform={[{ translateX: W / 2 }, { translateY: H / 2 }, { scale: lerp(1.06, 1.0, smooth(232, 236.8, t)) }, { translateX: -W / 2 }, { translateY: -H / 2 }]}>
        <City t={t} off={0} />
      </Group>
      <Motes t={t} seed={611} n={30} color="#c8b8d8" size={1.6} blur={1} drift={[30, 4]} opacity={0.5} />
    </Shot>
  );
};

// 2 · 那些灯火，只是不必再亮着了（236.4–240.8 秒）：窗灯从楼顶往下，一扇扇熄掉
export const LightsOut: React.FC = () => {
  const t = useT();
  return (
    <Shot>
      <City t={t} off={smooth(236.6, 240.4, t)} />
    </Shot>
  );
};

// 3 · 先是远疆，再是航道，最后是母星（240.4–245.2 秒）：那张星图，灯从最远处往回熄，最后只剩母星
export const MapDark: React.FC = () => {
  const t = useT();
  const net = NET();
  const z = lerp(1.0, 1.7, smooth(240.4, 245.2, t));
  return (
    <Shot>
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={["#06102a", "#0a1838", "#061026"]} />
      </Rect>
      <Group transform={[{ translateX: 520 }, { translateY: 600 }, { scale: z }, { translateX: -520 }, { translateY: -600 }]}>
        <StarLayer t={t} seed={321} n={900} spikes={false} opacity={0.55} />
        <Bloom radius={14} strength={1} threshold={0.45}>
          <NetMap net={net} count={1100} dim={lerp(0, 0.965, smooth(240.6, 244.8, t))} scale={1 / Math.sqrt(z)} />
        </Bloom>
      </Group>
    </Shot>
  );
};

// 4 · 最后一盏灯熄灭时，没有谁看见（244.8–251.6 秒）：山坡上一座小房子，一扇亮着的窗；配乐静下来的那一刻，它熄了
export const LastLight: React.FC = () => {
  const t = useT();
  const off = smooth(BEAT.silent - 0.25, BEAT.silent + 0.15, t);
  const push = lerp(1, 1.12, smooth(244.8, 251.6, t));
  return (
    <Shot>
      <Group transform={[{ translateX: 1180 }, { translateY: 740 }, { scale: push }, { translateX: -1180 }, { translateY: -740 }]}>
        <MilkyWay t={t} angle={-0.45} amount={1} />
        <StarLayer t={t} seed={621} n={160} />
        <Ridge pts={ridgeLine(0, W, 860, 40, 631)} color="#0c0816" rim="#4a3a6a" rimWidth={2} />
        <Ridge pts={[[700, H], [900, 900], [1100, 800], [1240, 790], [1400, 830], [1700, 940], [W, H]]} color="#07050c" rim="#6a5a8a" rimWidth={2} />
        {/* 小房子 */}
        <Path path="M1110 800 L1110 730 L1170 690 L1230 730 L1230 800 Z" color="#0a0710" />
        <Rect x={1158} y={742} width={26} height={30} color="#ffcf7a" opacity={1 - off} />
        <Circle cx={1171} cy={757} r={80} color="#ffb85a" opacity={0.35 * (1 - off)}>
          <BlurMask blur={40} style="normal" />
        </Circle>
        <Group opacity={1 - off}>
          <Critter x={1171} y={770} s={0.07} pose={{ sit: 0.85, lift: 0.3, glow: 0 }} silhouette={1} ink="#3a2414" rim="#3a2414" />
        </Group>
      </Group>
    </Shot>
  );
};

// 5 · 宇宙还是原来的样子（251.0–257.2 秒）：从那颗暗下去的星旁边一路退出去，退回整条星系
export const Return: React.FC = () => {
  const t = useT();
  const k = smooth(251.0, 256.6, t);
  const R = 300 * Math.exp((1 - k) * 3.4);
  return (
    <Shot>
      <Nebula t={t} cam={[3.1, -0.2]} glow={lerp(0.9, 0.6, k)} zoom={Math.exp((1 - k) * 2.2)} />
      <StarLayer t={t} seed={51} n={900} zoom={Math.exp((1 - k) * 1.2)} spikes={false} />
      <Bloom radius={24} strength={0.85} threshold={0.45}>
        <SpiralGalaxy x={W / 2} y={H / 2 - 10} R={R} spin={t * 0.12} tilt={0.5} angle={-16} seed={31} opacity={smooth(251.4, 253.4, t)} />
      </Bloom>
    </Shot>
  );
};

// 6 · 光从一条星河出发，还在走那几百万年的路（256.8–262.4 秒）：开头那个光子，还在同一条弧线上，只多走了一点点
export const StillTravelling: React.FC = () => {
  const t = useT();
  const a: [number, number] = [360 - 220, 620];
  const b: [number, number] = [1620 - 220, 440];
  const ctl: [number, number] = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 200];
  const p = lerp(0.31, 0.36, smooth(256.8, 262.4, t));
  const bez = (u: number): [number, number] => [
    (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * ctl[0] + u * u * b[0],
    (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * ctl[1] + u * u * b[1],
  ];
  const [px, py] = bez(p);
  const [qx, qy] = bez(p - 0.01);
  return (
    <Shot>
      <Nebula t={t} cam={[2.3, 0.1]} glow={0.75} tintA={[0.3, 0.16, 0.6]} />
      <StarLayer t={t} seed={41} n={900} dx={-66} spikes={false} />
      <Path path={`M${a[0]} ${a[1]} Q${ctl[0]} ${ctl[1]} ${b[0]} ${b[1]}`} style="stroke" strokeWidth={2.4} color="#cfe0ff" opacity={0.4}>
        <DashPathEffect intervals={[6, 16]} />
      </Path>
      <Bloom radius={26} strength={0.9} threshold={0.45}>
        <SpiralGalaxy x={a[0]} y={a[1]} R={190} spin={t * 0.2} tilt={0.55} angle={-24} seed={31} />
        <SpiralGalaxy x={b[0]} y={b[1]} R={160} spin={t * 0.18 + 2} tilt={0.42} angle={32} seed={52} warmth={0} />
        <Photon x={px} y={py} dir={Math.atan2(py - qy, px - qx)} len={200} t={t} />
      </Bloom>
    </Shot>
  );
};

// 7 · 那片绵延几千光年的灯火，在星海里，不过是极短暂的一瞬（262.0–268.0 秒）：
// 星系静静地转；旋臂上一点暖光亮起又灭掉；下面一条长长的时间线，那一瞬只是线上的一个小亮点
export const Blink: React.FC = () => {
  const t = useT();
  const spark = Math.max(0, 1 - Math.abs(t - 264.2) / 0.7);
  const line = smooth(262.4, 263.6, t);
  return (
    <Shot>
      <Nebula t={t} cam={[3.1, -0.2]} glow={0.55} />
      <StarLayer t={t} seed={51} n={900} spikes={false} />
      <Bloom radius={24} strength={0.85} threshold={0.45}>
        <SpiralGalaxy x={W / 2} y={H / 2 - 60} R={330} spin={t * 0.12} tilt={0.5} angle={-16} seed={31} />
        <Circle cx={W / 2 + 160} cy={H / 2 - 30} r={10} color="#ffb85a" opacity={spark}>
          <BlurMask blur={6} style="normal" />
        </Circle>
      </Bloom>
      {/* 时间线 */}
      <Path path={`M140 800 L${140 + (W - 280) * line} 800`} style="stroke" strokeWidth={2} color="#cfd8ff" opacity={0.45} />
      {Array.from({ length: 13 }, (_, i) => (
        <Path key={i} path={`M${140 + ((W - 280) * i) / 12} 792 L${140 + ((W - 280) * i) / 12} 808`} style="stroke" strokeWidth={1.5} color="#cfd8ff" opacity={0.35 * line} />
      ))}
      <Circle cx={140 + (W - 280) * 0.83} cy={800} r={5} color="#ffd38a" opacity={spark}>
        <BlurMask blur={3} style="normal" />
      </Circle>
    </Shot>
  );
};

// 8 · 稍微退远一点看去，这里好像什么都没有发生过（267.6–273.6 秒）：扁平的星海，星系们慢慢缩回超深场里它们原来的大小和位置
const FIELD: { x: number; y: number; R: number; spiral: boolean; tilt: number; angle: number }[] = [
  { x: 1503, y: 738, R: 46, spiral: true, tilt: 0.78, angle: 80 },
  { x: 388, y: 761, R: 30, spiral: false, tilt: 0.55, angle: -25 },
  { x: 888, y: 693, R: 26, spiral: true, tilt: 0.6, angle: 60 },
  { x: 1148, y: 423, R: 22, spiral: false, tilt: 0.9, angle: 0 },
  { x: 634, y: 347, R: 20, spiral: false, tilt: 0.85, angle: 0 },
  { x: 751, y: 809, R: 20, spiral: true, tilt: 0.7, angle: -30 },
  { x: 96, y: 802, R: 26, spiral: false, tilt: 0.3, angle: -20 },
  { x: 445, y: 864, R: 18, spiral: false, tilt: 0.45, angle: 15 },
  { x: 1477, y: 83, R: 20, spiral: false, tilt: 0.9, angle: 0 },
];
export const Afar: React.FC = () => {
  const t = useT();
  const grow = lerp(1.6, 1.0, smooth(267.8, 273.4, t));
  return (
    <Shot>
      <Nebula t={t} cam={[0.03, 0.02]} />
      <StarLayer t={t} seed={11} n={900} spikes={false} />
      <Bloom radius={22} strength={0.8} threshold={0.5}>
        <StarLayer t={t} seed={12} n={70} />
        {FIELD.map((g, i) =>
          g.spiral ? (
            <SpiralGalaxy key={i} x={g.x} y={g.y} R={g.R * grow} spin={t * 0.2 + i} tilt={g.tilt} angle={g.angle} seed={i + 2} />
          ) : (
            <EllipticalGalaxy key={i} x={g.x} y={g.y} R={g.R * 1.5 * grow} tilt={g.tilt} angle={g.angle} />
          ),
        )}
      </Bloom>
    </Shot>
  );
};

// 9 · 星海很亮，也很安静，就像一直以来的那样（272.8–284.0 秒）：落回真实的哈勃超深场，和全片的第一帧一模一样
export const PhotoEnd: React.FC = () => {
  const t = useT();
  const s = lerp(1.03, 1.0, smooth(272.8, 276.0, t));
  const scale = (W / 3100) * s;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Img
        src={staticFile(asset("img/hudf.jpg"))}
        style={{ position: "absolute", width: 3100 * scale, height: 3100 * scale, left: W / 2 - 1550 * scale, top: H / 2 - 2122 * scale, maxWidth: "none" }}
      />
    </AbsoluteFill>
  );
};
