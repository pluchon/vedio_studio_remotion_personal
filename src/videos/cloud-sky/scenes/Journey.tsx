// 云的旅程：从云层里飞出来，一幅长卷往左展开。海面的水汽聚成一小朵云，风来了就跟着走；翻山时被撕成几缕又聚拢，
// 影子掠过麦浪，和炊烟擦肩；音乐最亮处落一场雨，汇成溪、成河；草地上的孩子把它看成羊、又看成龙；最后镜头抬起来望向天空
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, useCurrentFrame } from "remotion";
import { Grain } from "../../../shared/Grain";
import { WindLines } from "../../../shared/WindLines";
import { Caption } from "../components/Caption";
import { Cloud, DRAGON, SHEEP, ShapeKey, cumulus, shapeAt, tear, vapor } from "../components/Cloud";
import { CloudVeil } from "../components/CloudVeil";
import { PaperTexture } from "../components/PaperTexture";
import { DAY, EASE_IN_OUT, HIGH, PLAIN, ROOM } from "../theme";
import { FarHills, Ground, Sea } from "./journey/Land";
import { Meadow, pointAt } from "./journey/Meadow";
import { Village } from "./journey/Village";
import { Water } from "./journey/Water";
import { cameraX, cloudScreen, cloudWorldX, t } from "./journey/world";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 主角这朵云的几种样子（都是 36 团）
const SMALL = cumulus("hero", 36, 300, 150);
const RAINY = SMALL.map((p) => ({ ...p, y: p.y * 0.7, r: p.r * 1.08 }));
const LIGHTER = SMALL.map((p) => ({ ...p, r: p.r * 0.9 }));
const HERO: ShapeKey[] = [
  { f: t(17.1), shape: vapor("birth", 36, 560, 160) },
  { f: t(21.6), shape: SMALL, spread: 0.5 },
  { f: t(25.4), shape: SMALL },
  { f: t(26.6), shape: tear(SMALL) },
  { f: t(27.6), shape: tear(SMALL) },
  { f: t(29.0), shape: SMALL, spread: 0.35 },
  { f: t(32.8), shape: SMALL },
  { f: t(33.6), shape: RAINY },
  { f: t(36.6), shape: RAINY },
  { f: t(37.4), shape: LIGHTER },
  { f: t(38.6), shape: LIGHTER },
  { f: t(39.4), shape: SHEEP },
  { f: t(40.2), shape: SHEEP },
  { f: t(41.2), shape: DRAGON },
];

const RAIN = Array.from({ length: 80 }, (_, i) => {
  const r = (k: string) => random(`rain-${i}-${k}`);
  return { dx: (r("x") - 0.5) * 340, phase: r("p") * 560, speed: 20 + r("s") * 8, len: 30 + r("l") * 30 };
});

// 刚出生时，海面上一点点水汽升起来，往云的位置聚拢
const MIST = Array.from({ length: 30 }, (_, i) => {
  const r = (k: string) => random(`mist-${i}-${k}`);
  return { dx: (r("x") - 0.5) * 760, delay: r("d"), size: 16 + r("s") * 26 };
});

const Vapor: React.FC<{ x: number; y: number; from: number; to: number }> = ({ x, y, from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const span = to - from;
  return (
    <AbsoluteFill>
      {MIST.map((m, i) => {
        const start = from + m.delay * span * 0.6;
        const p = interpolate(frame, [start, start + span * 0.4], [0, 1], clamp);
        if (p <= 0 || p >= 1) return null;
        const size = m.size * (0.6 + p);
        const cx = x + m.dx * (1 - 0.7 * EASE_IN_OUT(p));
        const cy = 700 + (y + 30 - 700) * EASE_IN_OUT(p);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - size,
              top: cy - size,
              width: size * 2,
              height: size * 2,
              borderRadius: "50%",
              opacity: 0.7 * Math.sin(p * Math.PI),
              background: "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0))",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const ink = { color: ROOM.ink, enColor: ROOM.inkSoft };
const topLeft = { left: 110, top: 90 };

export const Journey: React.FC = () => {
  const frame = useCurrentFrame();
  const camX = cameraX(frame);
  const hero = cloudScreen(frame);
  // 最后抬头：地面和云一起往下沉出画面，天色变成更深的蓝
  const ty = interpolate(frame, [t(43.2), t(44.1)], [0, 1150], { ...clamp, easing: EASE_IN_OUT });
  const tilt = interpolate(frame, [t(43.2), t(44.1)], [0, 1], clamp);
  const sky = {
    top: interpolateColors(tilt, [0, 1], [PLAIN.top, HIGH.top]),
    mid: interpolateColors(tilt, [0, 1], [PLAIN.mid, HIGH.mid]),
    low: interpolateColors(tilt, [0, 1], [PLAIN.low, HIGH.low]),
  };

  const rain = interpolate(frame, [t(33.3), t(33.9), t(36.2), t(36.9)], [0, 1, 1, 0], clamp);
  const heavy = interpolate(frame, [t(33.0), t(33.6), t(36.6), t(37.4)], [0, 1, 1, 0], clamp);
  const base = interpolate(frame, [t(20.5), t(21.6), t(38.2), t(38.8)], [320, 15, 15, 320], clamp);
  const scale = interpolate(frame, [t(40.2), t(41.2)], [1, 0.85], { ...clamp, easing: EASE_IN_OUT });
  const heroY = hero.y + ty;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${sky.top} 0%, ${sky.mid} ${50 + tilt * 8}%, ${sky.low} 100%)` }}>
      <Sea camX={camX} ty={ty} />
      <FarHills camX={camX} ty={ty} />
      <Vapor x={hero.x} y={hero.y} from={t(17.2)} to={t(21.8)} />
      {rain > 0 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: rain }}>
          {RAIN.map((d, i) => {
            const y = heroY + 30 + ((frame * d.speed + d.phase) % 560);
            const x = hero.x + d.dx - (y - heroY) * 0.12;
            return <line key={i} x1={x} y1={y} x2={x + d.len * 0.12} y2={y - d.len} stroke="rgba(110, 130, 160, 0.6)" strokeWidth={1.6} strokeLinecap="round" />;
          })}
        </svg>
      )}
      <Cloud
        id="hero"
        puffs={shapeAt(frame, HERO)}
        x={hero.x}
        y={heroY}
        scale={scale}
        base={base}
        light={interpolateColors(heavy, [0, 1], [DAY.cloud, "#dfe3ea"])}
        mid={interpolateColors(heavy, [0, 1], [DAY.cloudMid, "#c3cad6"])}
        shade={interpolateColors(heavy, [0, 1], [DAY.cloudShade, "#6c7a92"])}
        tint={{ top: DAY.cloud, topOpacity: 0, bottomOpacity: 0.5 + heavy * 0.25 }}
      />
      <Ground camX={camX} ty={ty} shadowX={cloudWorldX(frame) + 60} />
      <Water camX={camX} ty={ty} frame={frame} streamAt={[t(34.0), t(35.4)]} riverAt={[t(35.0), t(37.6)]} />
      <Village camX={camX} ty={ty} cloudX={cloudWorldX(frame)} />
      <Meadow camX={camX} ty={ty} point={pointAt(frame, [t(38.4), t(39.2)], [t(42.2), t(43.2)])} />
      <WindLines at={t(21.6)} duration={84} color="rgba(70, 80, 95, 0.55)" count={12} band={[140, 620]} seed="journey" />
      <PaperTexture opacity={0.18} />

      <Caption
        {...ink}
        zh={["它出生在很远的海面，", "最初只是一小团水汽，没有名字。", "风来了，它就跟着走。"]}
        en={["It was born far out over the sea,", "at first just a little vapor, with no name.", "When the wind came, it followed."]}
        at={t(17.7)}
        out={t(23.6)}
        size={48}
        enSize={23}
        stagger={2.2}
        style={topLeft}
      />
      <Caption
        {...ink}
        zh={["它翻过山，被山撕成几缕，", "到山的另一侧又重新聚拢，", "不记得丢了什么。"]}
        en={["It crossed the mountains and was torn into wisps,", "then gathered again on the far side,", "not remembering what it lost."]}
        at={t(24.0)}
        out={t(30.4)}
        size={48}
        enSize={23}
        stagger={2.2}
        style={topLeft}
      />
      <Caption
        {...ink}
        zh={["一个孩子躺在草地上，", "把它看成一只羊，"]}
        en={["A child lying in the grass saw a sheep in it,"]}
        at={t(37.6)}
        out={t(43.4)}
        size={48}
        enSize={23}
        style={topLeft}
      />
      <Caption
        {...ink}
        zh={["又看成一条龙，", "那个下午因此变得很长。"]}
        en={["then a dragon, and that afternoon grew very long."]}
        at={t(39.9)}
        out={t(43.4)}
        size={48}
        enSize={23}
        style={{ ...topLeft, top: 330 }}
      />
      <CloudVeil from={0} to={t(18.2)} mode="reveal" />
      <Grain opacity={0.05} vignette={0.3} />
    </AbsoluteFill>
  );
};
