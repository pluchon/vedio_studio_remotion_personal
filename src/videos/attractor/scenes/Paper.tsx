// 第四幕「七位天文学家」：1987 年那篇论文的摘要，框出关键的话；再看 2MASS 全天图上它指的方向
import React, { useMemo } from "react";
import { Img, staticFile } from "remotion";
import { useBinary } from "../data";
import { Box, Callout, Credit, Quote, Tag } from "../labels";
import { mollweide } from "../space";
import { MollGrid } from "./MollGrid";
import { COLORS, asset } from "../theme";
import { ease, ramp, track, useT } from "../time";

// 页面图片自己的像素尺寸（public/attractor/img/paper_*.jpg）
export const PAGE = { w: 1500, h: 1941 };

// 一页论文：focus 是图片上要放在 (ax, ay) 屏幕位置的那一点，zoom 是放大倍数
export const Page: React.FC<{ src: string; ax: number; ay: number; fx: number; fy: number; zoom: number; opacity?: number; children?: React.ReactNode }> = ({
  src,
  ax,
  ay,
  fx,
  fy,
  zoom,
  opacity = 1,
  children,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PAGE.w, height: PAGE.h, transformOrigin: "0 0", transform: `translate(${ax - fx * zoom}px, ${ay - fy * zoom}px) scale(${zoom})`, opacity, boxShadow: "0 0 60px rgba(0,0,0,0.6)" }}>
    <Img src={staticFile(asset(src))} style={{ width: PAGE.w, height: PAGE.h, filter: "brightness(0.93)" }} />
    {children}
  </div>
);

export const Dressler: React.FC = () => {
  const t = useT();
  // 页面一出现就已经推在摘要上（先从整页的一角冲进来 1.5 秒），不再停在整页上
  const zoom = track(t, [[139.4, 0.62], [141.2, 0.82]]);
  const fy = track(t, [[139.4, 1000], [141.2, 1085]]);
  const page = 1 - ramp(t, 147.2, 148.4);
  const b1 = ramp(t, 142, 145);
  return (
    <>
      <div style={{ opacity: ramp(t, 138.8, 140) * page }}>
        <Page src="img/paper_dressler1987.jpg" ax={560} ay={540} fx={750} fy={fy} zoom={zoom}>
          <Box x={195} y={1060} w={1115} h={52} p={b1} />
        </Page>
      </div>
      <Quote
        x={1060}
        y={520}
        w={760}
        p={ramp(t, 143.5, 145.5) * page}
        en="…a mean motion of the ellipticals with respect to the microwave background of 599 ± 104 km s⁻¹…"
        zh="椭圆星系整体，相对微波背景，在朝一个方向运动"
        source="Dressler 等，ApJ 313, L37（1987）· 摘要"
      />
    </>
  );
};

// 2MASS 的全天图：Norma & Great Attractor 的方向
export const Lss: React.FC = () => {
  const t = useT();
  const zoom = 1.3;
  const w = 1239 * zoom;
  const h = 627 * zoom;
  const left = 960 - w / 2;
  const top = 560 - h / 2;
  const gx = left + 722 * zoom;
  const gy = top + 343 * zoom;
  const slide = 1 + 0.03 * ease(t, 169, 186);
  return (
    <>
      <div style={{ position: "absolute", left, top, width: w, height: h, transform: `scale(${slide})`, transformOrigin: `${722 * zoom}px ${343 * zoom}px`, boxShadow: "0 0 60px rgba(0,0,0,0.7)" }}>
        <Img src={staticFile(asset("img/lss_2mass.jpg"))} style={{ width: w, height: h }} />
      </div>
      <Callout x={gx} y={gy} tx={gx - 60} ty={gy + 150} p={ramp(t, 183, 185)} size={34} r={22} sub="Norma & Great Attractor · 红移约 0.016 · 约两亿光年">
        巨引源 · 矩尺座一带
      </Callout>
      <Tag x={960} y={70} p={ramp(t, 172, 174.5)} size={34} sub="全天的星系，银河系在正中，银河面上下有一条没有星系的带">
        2MASS 红外巡天 · 4 万多个星系
      </Tag>
      <Credit p={ramp(t, 172, 174)}>2MASS / IPAC-Caltech / T. H. Jarrett（公有领域）</Credit>
    </>
  );
};

// 当年测量用的那一类大望远镜：三张照片，一张两秒多，快切
const OBS = [
  { src: "img/obs_mayall.jpg", w: 2400, h: 1600, label: "Kitt Peak 4 米望远镜（美国）", credit: "NOIRLab / NSF / AURA（CC BY 4.0）", from: 148.2, fy: 800 },
  { src: "img/obs_blanco.jpg", w: 2400, h: 1600, label: "Cerro Tololo 的 Blanco 4 米望远镜（智利）", credit: "NOIRLab / NSF / AURA（CC BY 4.0）", from: 150.8, fy: 800 },
  { src: "img/obs_hooker.jpg", w: 1600, h: 2133, label: "威尔逊山 100 英寸望远镜（美国）", credit: "Hooker Telescope Mount Wilson（CC BY-SA 4.0）", from: 153.4, fy: 1066 },
] as const;

export const Montage: React.FC = () => {
  const t = useT();
  return (
    <>
      {OBS.map((o, i) => {
        const a = o.from;
        const b = i < OBS.length - 1 ? OBS[i + 1].from : 156.4;
        const p = ramp(t, a - 0.15, a + 0.35) * (1 - ramp(t, b - 0.25, b + 0.25));
        if (p <= 0.003) return null;
        const zoom = (1920 / o.w) * (1.0 + 0.07 * ramp(t, a, b));
        return (
          <div key={o.src}>
            <div style={{ position: "absolute", left: 0, top: 0, width: o.w, height: o.h, transformOrigin: "0 0", transform: `translate(${960 - (o.w / 2) * zoom}px, ${540 - o.fy * zoom}px) scale(${zoom})`, opacity: p }}>
              <Img src={staticFile(asset(o.src))} style={{ width: o.w, height: o.h }} />
            </div>
            <Tag chip x={960} y={900} p={p * ramp(t, a + 0.1, a + 0.6)} size={30}>
              {o.label}
            </Tag>
            <Credit p={p}>{o.credit}</Credit>
          </div>
        );
      })}
      <Tag chip x={960} y={96} p={ramp(t, 148.6, 150.4) * (1 - ramp(t, 155, 156.4))} size={34} sub="一个星系一个星系地量它的距离和速度 · 照片只是这一类望远镜的示例">
        地面上的大望远镜
      </Tag>
    </>
  );
};

// 1987 年那张图的画法：天空摊成椭圆，每个点是一个星系群，实心是比膨胀多出来的速度在远离我们，空心是朝我们来。
// 用的是现代的 Cosmicflows-4，不是当年的数据
export const VelMap: React.FC = () => {
  const t = useT();
  const data = useBinary("cf4.bin");
  const HW = 760;
  const HH = 380;
  const CX = 960;
  const CY = 520;
  const pts = useMemo(() => {
    if (!data) return [];
    const out: { x: number; y: number; v: number; k: number }[] = [];
    for (let i = 0; i < data.length / 5; i++) {
      const x = data[i * 5];
      const y = data[i * 5 + 1];
      const z = data[i * 5 + 2];
      const v = data[i * 5 + 3];
      const d = data[i * 5 + 4];
      if (d < 20 || d > 90 || Math.abs(v) < 130) continue;
      const l = (Math.atan2(y, x) * 180) / Math.PI;
      const b = (Math.asin(z / Math.hypot(x, y, z)) * 180) / Math.PI;
      const [nx, ny] = mollweide(l, b);
      if ((i * 7919) % 100 < 45) out.push({ x: CX + nx * HW, y: CY - ny * HH, v, k: (i * 7919) % 1000 });
    }
    return out;
  }, [data]);
  const appear = ramp(t, 154.8, 156.4) * (1 - ramp(t, 169, 170.4));
  const reveal = ramp(t, 155.5, 160);
  const [gx, gy] = mollweide(312, 6);
  const GX = CX + gx * HW;
  const GY = CY - gy * HH;
  const mark = ramp(t, 162.2, 164);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: appear }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, #0c1424 0%, #04070d 80%)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <MollGrid cx={CX} cy={CY} hw={HW} hh={HH} />
          {pts.map((p, i) => {
            if (p.k / 1000 > reveal) return null;
            const r = Math.min(6, 1.3 + Math.sqrt(Math.abs(p.v)) * 0.13);
            return p.v > 0 ? (
              <circle key={i} cx={p.x} cy={p.y} r={r} fill={COLORS.amber} fillOpacity={0.55} />
            ) : (
              <circle key={i} cx={p.x} cy={p.y} r={r} fill="none" stroke={COLORS.blue} strokeOpacity={0.85} strokeWidth={1.3} />
            );
          })}
          <g opacity={mark}>
            <circle cx={GX} cy={GY} r={46} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="7 6" />
          </g>
        </svg>
      </div>
      <Tag chip x={960} y={96} p={ramp(t, 155.6, 158) * (1 - ramp(t, 169, 170))} size={34} sub="每个点是一个星系群 · 实心：比膨胀多出的速度是远离我们 · 空心：朝我们来 · Cosmicflows-4，20–90 Mpc，画法仿 1987 年那张图">
        整个天空上，剩余的速度
      </Tag>
      <Tag chip x={960} y={880} p={ramp(t, 159.6, 162) * (1 - ramp(t, 169, 170))} size={60} color={COLORS.amber} sub="1987：相对宇宙微波背景，289 个近处的椭圆星系">
        599 ± 104 km/s
      </Tag>
      <Tag chip x={GX} y={GY - 100} p={ramp(t, 163, 165.2) * (1 - ramp(t, 169, 170))} size={28} color={COLORS.amber} sub="银经 312° ± 11°，银纬 6° ± 10°">
        朝向 南天矩尺座一带
      </Tag>
    </>
  );
};
