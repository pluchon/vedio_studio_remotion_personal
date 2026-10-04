// 第五幕「银河系挡住了路」：
//   DustWide  银河全景里的尘埃带（对着「视线被银河系自己的盘面挡了个正着」）
//   SkyGap    2MRS 的星系摊在全天上，银道面两边那条没有星系的带，标出来（对着「隐匿带」）
//   Dust      红外与可见光的对比（对着「遮不住红外线」）
//   Radio     射电：Parkes 和 MeerKAT（对着「射电电波」「更敏锐的波段」）
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { useBinary } from "../data";
import { Credit, Tag } from "../labels";
import { mollweide } from "../space";
import { COLORS, asset } from "../theme";
import { ramp, useT } from "../time";
import { MollGrid } from "./MollGrid";

const dim = "brightness(0.8) saturate(0.92)";

// ---------------------------------------------------------------- 尘埃带
export const DustWide: React.FC = () => {
  const t = useT();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: ramp(t, 185.4, 187.6) * (1 - ramp(t, 198.6, 200.6)), background: "#000" }}>
        <OffthreadVideo src={staticFile(asset("video/vista_a.mp4"))} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover", filter: dim }} />
      </div>
      <Tag chip x={960} y={118} p={ramp(t, 188, 190.5) * (1 - ramp(t, 197.4, 199))} size={34} sub="恒星、尘埃和气体，都挤在这个盘面里 · 我们朝巨引源看，视线要穿过它">
        银河系的盘面
      </Tag>
      <Credit p={ramp(t, 188, 190) * (1 - ramp(t, 197.4, 199))}>ESO / VVV Consortium / Nick Risinger（CC BY 4.0）</Credit>
    </>
  );
};

// ---------------------------------------------------------------- 全天上的缺口
const HW = 760;
const HH = 380;
const CX = 960;
const CY = 520;

type Dot = { x: number; y: number; s: number; k: number };

export const SkyGap: React.FC = () => {
  const t = useT();
  const data = useBinary("galaxies.bin");
  const ref = useRef<HTMLCanvasElement>(null);
  // 按距离分成 6 档颜色（近处偏蓝白，远处偏橙），省得每个点都换一次笔
  const groups = useMemo(() => {
    const buckets: Dot[][] = Array.from({ length: 6 }, () => []);
    if (!data) return buckets;
    for (let i = 0; i < data.length / 4; i++) {
      const x = data[i * 4];
      const y = data[i * 4 + 1];
      const z = data[i * 4 + 2];
      const kmag = data[i * 4 + 3];
      const d = Math.hypot(x, y, z);
      const l = (Math.atan2(y, x) * 180) / Math.PI;
      const b = (Math.asin(z / d) * 180) / Math.PI;
      const [nx, ny] = mollweide(l, b);
      const bucket = Math.min(5, Math.floor((d / 260) * 6));
      buckets[bucket].push({ x: CX + nx * HW, y: CY - ny * HH, s: 1.4 + 2.2 * Math.max(0, Math.min(1, (11.5 - kmag) / 6)), k: ((i * 7919) % 1000) / 1000 });
    }
    return buckets;
  }, [data]);
  const appear = ramp(t, 199.6, 201) * (1 - ramp(t, 214.2, 215.6));
  const reveal = ramp(t, 200.4, 206.5);
  const band = ramp(t, 207.4, 210.4) * (1 - ramp(t, 214.2, 215.6));

  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, 1920, 1080);
    if (appear <= 0.003) return;
    const colors = ["190,215,255", "205,222,255", "225,228,240", "245,228,205", "255,208,160", "255,188,120"];
    groups.forEach((dots, g) => {
      ctx.fillStyle = `rgba(${colors[g]},${0.85 * appear})`;
      for (const p of dots) {
        if (p.k > reveal) continue;
        ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
    });
  }, [groups, appear, reveal]);

  // 银纬 ±10° 的那条带
  const bandPath = useMemo(() => {
    const top: string[] = [];
    const bottom: string[] = [];
    for (let l = -180; l <= 180; l += 4) {
      const [ax, ay] = mollweide(l, 10);
      const [bx, by] = mollweide(l, -10);
      top.push(`${(CX + ax * HW).toFixed(1)},${(CY - ay * HH).toFixed(1)}`);
      bottom.push(`${(CX + bx * HW).toFixed(1)},${(CY - by * HH).toFixed(1)}`);
    }
    return { fill: `M ${top.join(" L ")} L ${[...bottom].reverse().join(" L ")} Z`, top: top.join(" "), bottom: bottom.join(" ") };
  }, []);

  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: appear, background: "radial-gradient(ellipse at center, #0c1424 0%, #04070d 80%)" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: appear }}>
        <MollGrid cx={CX} cy={CY} hw={HW} hh={HH} />
      </svg>
      <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: band }}>
        <path d={bandPath.fill} fill="rgba(232,143,166,0.16)" />
        <polyline points={bandPath.top} fill="none" stroke={COLORS.rose} strokeWidth={2} strokeDasharray="9 8" strokeOpacity={0.9} />
        <polyline points={bandPath.bottom} fill="none" stroke={COLORS.rose} strokeWidth={2} strokeDasharray="9 8" strokeOpacity={0.9} />
        <circle cx={CX} cy={CY} r={11} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.6} />
      </svg>
      <Tag chip x={960} y={96} p={ramp(t, 201, 203.6) * (1 - ramp(t, 209.4, 211))} size={34} sub="2MASS 红移巡天 · 4 万多个星系 · 摊在整个天空上 · 越偏橙越远">
        星系们
      </Tag>
      <Tag x={CX + 40} y={CY + 52} p={ramp(t, 209, 211) * (1 - ramp(t, 214.2, 215.6))} size={24} sub="银心方向">
        银河系的盘面
      </Tag>
      <Tag chip x={960} y={96} p={ramp(t, 211.6, 214) * (1 - ramp(t, 214.6, 215.6))} size={36} color={COLORS.rose} sub="红色标出银纬 ±10° 以内（约占天空的 17%）· 被挡住的约五分之一，随波段和标准而定">
        隐匿带
      </Tag>
    </>
  );
};

// ---------------------------------------------------------------- 红外与可见光的对比
export const Dust: React.FC = () => {
  const t = useT();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: ramp(t, 214.6, 216) * (1 - ramp(t, 223.4, 224.6)), background: "#000" }}>
        <OffthreadVideo src={staticFile(asset("video/vista.mp4"))} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover", filter: dim }} />
      </div>
      <Tag chip x={960} y={118} p={ramp(t, 216.5, 218.5) * (1 - ramp(t, 222.4, 223.8))} size={34} sub="同一片银河：可见光被尘埃挡住，红外看穿了尘埃（画面里是两个波段的对比）">
        银河系的尘埃
      </Tag>
      <Credit p={ramp(t, 216.5, 218.5) * (1 - ramp(t, 222.4, 223.8))}>ESO / VVV Consortium / Nick Risinger（CC BY 4.0）</Credit>
    </>
  );
};

// ---------------------------------------------------------------- 射电：先是 Parkes 望远镜（澳大利亚），再是 MeerKAT 的延时（南非）
export const Radio: React.FC = () => {
  const t = useT();
  const photo = ramp(t, 223.4, 225) * (1 - ramp(t, 228, 229));
  const video = ramp(t, 227.6, 229) * (1 - ramp(t, 231.4, 233));
  const zoom = 1.0 + 0.05 * ramp(t, 224, 229);
  const src = staticFile(asset("img/radio_parkes_moon.jpg"));
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: photo, overflow: "hidden", background: "#05040a" }}>
        <Img src={src} style={{ position: "absolute", left: -120, top: -120, width: 2160, height: 1320, objectFit: "cover", filter: "blur(46px) brightness(0.42)" }} />
        <Img src={src} style={{ position: "absolute", left: 960 - 432, top: 0, width: 864, height: 1080, objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: "50% 60%", boxShadow: "0 0 80px rgba(0,0,0,0.7)" }} />
      </div>
      {video > 0.003 ? (
        <div style={{ position: "absolute", inset: 0, opacity: video }}>
          <OffthreadVideo src={staticFile(asset("video/meerkat.mp4"))} muted style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover" }} />
        </div>
      ) : null}
      <Tag chip x={420} y={500} p={ramp(t, 224.4, 226.4) * (1 - ramp(t, 227.4, 228.6))} size={34} align="center" sub="无线电波穿得过尘埃 · 21 厘米氢线可以在银河背后找到星系">
        射电：Parkes 望远镜（澳大利亚）
      </Tag>
      <Tag chip x={960} y={118} p={ramp(t, 228.4, 230) * (1 - ramp(t, 231.4, 232.6))} size={34} sub="天文学家开始换用更敏锐的波段">
        MeerKAT 阵列（南非）
      </Tag>
      <Credit p={photo}>CSIRO ScienceImage 4350 · CSIRO（CC BY 3.0）</Credit>
      <Credit p={video}>MeerKAT night time-lapse（CC BY-SA 3.0）</Credit>
    </>
  );
};
