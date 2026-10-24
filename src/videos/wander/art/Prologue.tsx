// 序 · 星海（0–31 秒）与冲进星系（31–36.6 秒）
import { BlurMask, Circle, DashPathEffect, Group, Paint, Blur, Path, Skia } from "@shopify/react-native-skia";
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { asset } from "../theme";
import { useT } from "../time";
import { Sun } from "./bodies";
import { Bloom, H, Shot, W, clamp01, lerp, pop, rng, smooth } from "./sk";
import { EllipticalGalaxy, Nebula, Photon, SpiralGalaxy, StarLayer } from "./space";
import { Motes } from "./world";

// 超深场原图里几条显眼的星系在第一帧里的位置；扁平宇宙在同样的地方画上星系
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

// 1 · 超深场原图（0–3.4 秒）
export const Photo: React.FC = () => {
  const t = useT();
  const s = 1 + 0.03 * smooth(0, 3.4, t);
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

const Field: React.FC<{ t: number; drift: number; grow: number; appear?: number }> = ({ t, drift, grow, appear = 2.4 }) => (
  <>
    {FIELD.map((g, i) => {
      const a = pop(appear + i * 0.12, 0.7, t);
      if (a <= 0) return null;
      const x = g.x - drift;
      return g.spiral ? (
        <SpiralGalaxy key={i} x={x} y={g.y} R={g.R * a * grow} spin={t * 0.2 + i} tilt={g.tilt} angle={g.angle} seed={i + 2} />
      ) : (
        <EllipticalGalaxy key={i} x={x} y={g.y} R={g.R * 1.5 * a * grow} tilt={g.tilt} angle={g.angle} />
      );
    })}
  </>
);

// 2 · 片名（2.2–8.8 秒）：照片里的星系在原地被画出来，慢慢变大
export const TitleShot: React.FC = () => {
  const t = useT();
  const drift = (t - 2.2) * 9;
  return (
    <Shot>
      <Nebula t={t} cam={[t * 0.004, 0.02]} />
      <StarLayer t={t} seed={11} n={900} dx={-drift * 0.4} spikes={false} />
      <Bloom radius={22} strength={0.8} threshold={0.5}>
        <StarLayer t={t} seed={12} n={70} dx={-drift * 0.8} />
        <Field t={t} drift={drift * 0.6} grow={lerp(1, 1.6, smooth(3.4, 8, t))} />
      </Bloom>
      <Motes t={t} seed={5} n={12} color="#b9c8ff" size={10} blur={14} drift={[-16, 0]} opacity={0.35} />
    </Shot>
  );
};

// 3 · 平常时刻（8.4–13.2 秒）：一大片星云和星系，镜头慢慢横移，一颗彗星划过
export const Vista: React.FC = () => {
  const t = useT();
  const drift = (t - 8.4) * 22;
  const c = clamp01((t - 9.6) / 3.0);
  return (
    <Shot>
      <Nebula t={t} cam={[0.6 + t * 0.006, -0.1]} tintA={[0.36, 0.2, 0.72]} tintB={[0.1, 0.42, 0.62]} />
      <StarLayer t={t} seed={21} n={1000} dx={-drift * 0.3} spikes={false} />
      <Bloom radius={24} strength={0.85} threshold={0.5}>
        <SpiralGalaxy x={1480 - drift * 0.7} y={640} R={300} spin={t * 0.12} tilt={0.42} angle={-14} seed={61} />
        <SpiralGalaxy x={420 - drift * 0.5} y={300} R={70} spin={t * 0.2} tilt={0.75} angle={30} seed={62} warmth={0} />
        <EllipticalGalaxy x={760 - drift * 0.5} y={820} R={44} tilt={0.6} angle={-30} />
        <EllipticalGalaxy x={1080 - drift * 0.6} y={190} R={30} tilt={0.8} angle={10} warm={false} />
        <StarLayer t={t} seed={22} n={60} dx={-drift * 0.9} />
        {c > 0 && c < 1 ? <Photon x={lerp(200, 1300, c)} y={lerp(160, 440, c)} dir={Math.atan2(280, 1100)} len={320} opacity={Math.sin(c * Math.PI)} t={t} /> : null}
      </Bloom>
      <Motes t={t} seed={6} n={10} color="#c9b8ff" size={12} blur={16} drift={[-30, 0]} opacity={0.3} />
    </Shot>
  );
};

// 4 · 几千亿颗恒星，聚成一条星河（12.8–17.8 秒）：星流从四面八方旋进来
const STREAM = (() => {
  const r = rng(71);
  return Array.from({ length: 360 }, () => ({ a: r() * Math.PI * 2, r0: 500 + r() * 900, k: 0.6 + r() * 0.8, c: r() < 0.3 ? "#ffd2a8" : "#cfe0ff" }));
})();
export const Gather: React.FC = () => {
  const t = useT();
  const form = smooth(12.9, 16.6, t);
  const cx = W / 2;
  const cy = H / 2 - 10;
  const path = Skia.Path.Make();
  STREAM.forEach((s) => {
    const p = clamp01(smooth(12.8, 16.2, t) * s.k * 1.1);
    const rad = s.r0 * (1 - p) + 40;
    const th = s.a + p * 3.2;
    const th2 = s.a + Math.max(0, p - 0.06) * 3.2;
    const rad2 = s.r0 * (1 - Math.max(0, p - 0.06)) + 40;
    if (p > 0.98) return;
    path.moveTo(cx + Math.cos(th2) * rad2, cy + Math.sin(th2) * rad2 * 0.55);
    path.lineTo(cx + Math.cos(th) * rad, cy + Math.sin(th) * rad * 0.55);
  });
  return (
    <Shot>
      <Nebula t={t} cam={[1.4, 0.3]} glow={0.8} />
      <StarLayer t={t} seed={31} n={800} spikes={false} />
      <Bloom radius={26} strength={0.9} threshold={0.45}>
        <Path path={path} style="stroke" strokeWidth={2.2} strokeCap="round" color="#dfe8ff" opacity={0.7 * (1 - form * 0.6)}>
          <BlurMask blur={1} style="normal" />
        </Path>
        <SpiralGalaxy x={cx} y={cy} R={lerp(330, 380, smooth(12.8, 17.8, t))} spin={t * 0.25} tilt={0.5} angle={-16} seed={31} form={form} />
      </Bloom>
    </Shot>
  );
};

// 5 · 数不清的星河（17.4–22.4 秒）：退开，远近不同的星系一个个亮起来，之间连着淡淡的宇宙网
const CROWD = (() => {
  const r = rng(77);
  return Array.from({ length: 34 }, (_, i) => ({
    x: 80 + r() * (W - 160),
    y: 70 + r() * (H - 200),
    R: 16 + Math.pow(r(), 2) * 70,
    spiral: r() < 0.6,
    tilt: 0.3 + r() * 0.6,
    angle: (r() - 0.5) * 140,
    delay: 17.8 + i * 0.09 + r() * 0.2,
    seed: 80 + i,
    warm: r() < 0.6,
  })).filter((g) => Math.hypot(g.x - W / 2, g.y - H / 2) > 190);
})();
export const Crowd: React.FC = () => {
  const t = useT();
  const back = smooth(17.4, 19.4, t);
  const web = Skia.Path.Make();
  CROWD.forEach((g, i) => {
    const h = CROWD[(i * 7 + 3) % CROWD.length];
    if (Math.hypot(g.x - h.x, g.y - h.y) < 520) {
      web.moveTo(g.x, g.y);
      web.quadTo((g.x + h.x) / 2 + 40, (g.y + h.y) / 2 - 30, h.x, h.y);
    }
  });
  return (
    <Shot>
      <Nebula t={t} cam={[1.4, 0.3]} glow={0.7} zoom={lerp(1, 0.75, back)} />
      <StarLayer t={t} seed={31} n={800} spikes={false} zoom={lerp(1, 0.8, back)} />
      <Path path={web} style="stroke" strokeWidth={2} color="#9fb6ff" opacity={0.18 * smooth(18.4, 20.4, t)}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <Bloom radius={22} strength={0.85} threshold={0.45}>
        <SpiralGalaxy x={W / 2} y={H / 2 - 10} R={lerp(380, 74, back)} spin={t * 0.25} tilt={0.5} angle={-16} seed={31} />
        {CROWD.map((g, i) => {
          const a = pop(g.delay, 0.6, t);
          if (a <= 0) return null;
          const el = g.spiral ? (
            <SpiralGalaxy key={i} x={g.x} y={g.y} R={g.R * a} spin={t * 0.22 + i} tilt={g.tilt} angle={g.angle} seed={g.seed} warmth={g.warm ? 1 : 0} />
          ) : (
            <EllipticalGalaxy key={i} x={g.x} y={g.y} R={g.R * 1.2 * a} tilt={g.tilt} angle={g.angle} warm={g.warm} />
          );
          // 近处的大星系稍微虚一点，像镜头的景深
          return g.R > 60 ? (
            <Group key={i} layer={<Paint><Blur blur={3} /></Paint>}>
              {el}
            </Group>
          ) : (
            el
          );
        })}
      </Bloom>
    </Shot>
  );
};

// 6 · 光从一条星河出发，要走几百万年（22.0–27.2 秒）：光子沿弧线慢慢爬，五秒只走了一小段
export const Voyage: React.FC = () => {
  const t = useT();
  const pan = smooth(22, 27.2, t) * 220;
  const a: [number, number] = [360 - pan, 620];
  const b: [number, number] = [1620 - pan, 440];
  const ctl: [number, number] = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 200];
  const p = lerp(0.05, 0.3, smooth(22.6, 27.2, t));
  const bez = (u: number): [number, number] => [
    (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * ctl[0] + u * u * b[0],
    (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * ctl[1] + u * u * b[1],
  ];
  const [px, py] = bez(p);
  const [qx, qy] = bez(p - 0.01);
  return (
    <Shot>
      <Nebula t={t} cam={[2.2 + pan * 0.0004, 0.1]} glow={0.75} tintA={[0.3, 0.16, 0.6]} />
      <StarLayer t={t} seed={41} n={900} dx={-pan * 0.3} spikes={false} />
      <Path path={`M${a[0]} ${a[1]} Q${ctl[0]} ${ctl[1]} ${b[0]} ${b[1]}`} style="stroke" strokeWidth={2.4} color="#cfe0ff" opacity={0.4 * smooth(22.2, 23.4, t)}>
        <DashPathEffect intervals={[6, 16]} />
      </Path>
      <Bloom radius={26} strength={0.9} threshold={0.45}>
        <SpiralGalaxy x={a[0]} y={a[1]} R={190} spin={t * 0.2} tilt={0.55} angle={-24} seed={31} />
        <SpiralGalaxy x={b[0]} y={b[1]} R={160} spin={t * 0.18 + 2} tilt={0.42} angle={32} seed={52} warmth={0} />
        <Photon x={px} y={py} dir={Math.atan2(py - qy, px - qx)} len={200} opacity={smooth(22.4, 23.0, t)} t={t} />
      </Bloom>
    </Shot>
  );
};

// 7 · 大多数时候，这里什么也没有发生（26.8–31.2 秒）：一条星系静静地转；最后一秒半往里推
export const Stillness: React.FC = () => {
  const t = useT();
  const push = Math.exp(Math.pow(smooth(29.6, 31.2, t), 2) * 1.3);
  return (
    <Shot>
      <Nebula t={t} cam={[3.1, -0.2]} glow={0.6} zoom={push} />
      <StarLayer t={t} seed={51} n={900} zoom={push} spikes={false} />
      <Bloom radius={24} strength={0.85} threshold={0.45}>
        <SpiralGalaxy x={W / 2} y={H / 2 - 10} R={230 * push} spin={t * 0.12} tilt={0.5} angle={-16} seed={31} />
      </Bloom>
    </Shot>
  );
};

// 8 · 冲进星系（31.0–36.6 秒）：星系放大到看不见，星云一层层扑面而来，四周的星拉成光线；慢下来时正中是一颗不起眼的恒星
const WARP = (() => {
  const r = rng(91);
  return Array.from({ length: 300 }, () => ({ a: r() * Math.PI * 2, u: r(), c: r() < 0.25 ? "#ffd2a8" : r() < 0.4 ? "#ffc4dc" : "#dfe8ff", w: 1 + r() * 2.4 }));
})();
export const Dive: React.FC = () => {
  const t = useT();
  const R = 600 * Math.exp((t - 31) * 2.6);
  const galaxy = 1 - smooth(31.1, 31.75, t);
  const speed = lerp(0.15, 1, smooth(31, 31.5, t)) * (1 - smooth(34.4, 36.2, t) * 0.94);
  const travel = (t - 31) * 0.85 - smooth(34.4, 36.4, t) * 0.75;
  const zoom = Math.exp(smooth(31, 36, t) * 3.2);
  const star = smooth(34.2, 36.2, t);
  const lines = Skia.Path.Make();
  WARP.forEach((s) => {
    const u = (s.u + travel * 0.6) % 1;
    const rad = 40 * Math.exp(u * 3.7);
    const len = rad * 0.3 * speed + 1.5;
    const x = W / 2 + Math.cos(s.a) * rad;
    const y = H / 2 + Math.sin(s.a) * rad;
    lines.moveTo(x - Math.cos(s.a) * len, y - Math.sin(s.a) * len);
    lines.lineTo(x, y);
  });
  return (
    <Shot>
      <Nebula t={t} cam={[3.1, -0.2]} glow={lerp(0.6, 1.1, smooth(31, 33, t))} zoom={zoom} tintA={[0.5, 0.22, 0.72]} tintB={[0.1, 0.5, 0.62]} />
      <Bloom radius={26} strength={0.9} threshold={0.45}>
        {galaxy > 0 ? <SpiralGalaxy x={W / 2} y={H / 2 - 10} R={R} spin={t * 0.12} tilt={0.5} angle={-16} seed={31} opacity={galaxy} /> : null}
        <Path path={lines} style="stroke" strokeWidth={2.2} strokeCap="round" color="#e6eeff" opacity={0.85}>
          <BlurMask blur={0.8} style="normal" />
        </Path>
        <Group opacity={star}>
          <Sun x={W / 2} y={H / 2} R={lerp(6, 40, star)} t={t} />
        </Group>
      </Bloom>
      <Circle cx={W / 2} cy={H / 2} r={900} color="#ffffff" opacity={0.1 * Math.max(0, 1 - Math.abs(t - 31.1) / 0.3)}>
        <BlurMask blur={300} style="normal" />
      </Circle>
    </Shot>
  );
};
