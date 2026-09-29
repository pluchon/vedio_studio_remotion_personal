// 天空：镜头定住不动（天空一步也没有走过）。清晨的雾、一行飞鸟、一只风筝从它面前路过；
// 一阵乌云压过来、落一场雨，又散开，天还是那片天；雨停后一朵大积云从下面升起来，交给黄昏
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Grain } from "../../../shared/Grain";
import { Caption } from "../components/Caption";
import { Cloud, cumulus } from "../components/Cloud";
import { Heaven } from "../components/Heaven";
import { PaperTexture } from "../components/PaperTexture";
import { DUSK, EASE_IN_OUT, EASE_OUT, SEGMENTS, localTime, segFrom } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.sky);

// 飞鸟：一行小小的「人」字，一边扇翅膀一边横穿画面
const BIRDS = Array.from({ length: 7 }, (_, i) => {
  const r = (k: string) => random(`bird-${i}-${k}`);
  return { dx: -i * 70 - r("x") * 40, dy: (i % 2) * 34 + r("y") * 30 - i * 8, phase: r("p") * 6, s: 0.8 + r("s") * 0.5 };
});

const Birds: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, to], [0, 1], clamp);
  if (p <= 0 || p >= 1) return null;
  const lead = { x: -100 + p * 2400, y: 640 - p * 140 };
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {BIRDS.map((b, i) => {
        const flap = Math.sin(frame / 3.5 + b.phase);
        return (
          <path
            key={i}
            transform={`translate(${lead.x + b.dx} ${lead.y + b.dy + 6 * Math.sin(frame / 20 + i)}) scale(${b.s})`}
            d={`M-16 ${-2 - flap * 8} Q -7 ${-4 - flap * 6} 0 2 Q 7 ${-4 - flap * 6} 16 ${-2 - flap * 8}`}
            stroke="#39414f"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
};

// 风筝：线从画面左下角外面牵上来，风筝在风里一晃一晃，乌云来时被收了回去
const Kite: React.FC<{ rise: [number, number]; leave: [number, number] }> = ({ rise, leave }) => {
  const frame = useCurrentFrame();
  const up = interpolate(frame, [rise[0], rise[1]], [0, 1], { ...clamp, easing: EASE_OUT });
  const down = interpolate(frame, [leave[0], leave[1]], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  if (up <= 0 || down >= 1) return null;
  const x = 560 + 40 * Math.sin(frame / 37) - down * 700;
  const y = 1250 - up * 860 + 24 * Math.sin(frame / 29) + down * 900;
  const tilt = 10 * Math.sin(frame / 23);
  const tail = Array.from({ length: 12 }, (_, k) => `${(6 * Math.sin(frame / 6 + k * 0.8)).toFixed(1)},${54 + k * 14}`).join(" L");
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={`M${x} ${y + 50} Q ${x - 180} ${y + 420} -80 1180`} stroke="rgba(60, 60, 70, 0.55)" strokeWidth={1.4} fill="none" />
      <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
        <path d={`M0 -56 L40 0 L0 54 L-40 0 Z`} fill="#f4eee2" stroke="#4a3f3a" strokeWidth={2} />
        <path d={`M0 -56 L40 0 L0 0 Z M0 54 L-40 0 L0 0 Z`} fill="#c65b4a" />
        <path d="M0 -56 L0 54 M-40 0 L40 0" stroke="#4a3f3a" strokeWidth={1.5} />
        <path d={`M0 54 L${tail}`} stroke="#c65b4a" strokeWidth={2} fill="none" />
      </g>
    </svg>
  );
};

// 乌云：三大片扁平的灰云从左边压过来，停一阵，再往右边散去
const STORM = [
  { puffs: cumulus("storm-a", 120, 1300, 280, 0.55), y: 330, scale: 1, lag: 0 },
  { puffs: cumulus("storm-b", 100, 1100, 240, 0.55), y: 610, scale: 1.1, lag: 12 },
  { puffs: cumulus("storm-c", 90, 900, 200, 0.55), y: 150, scale: 1, lag: 24 },
];

const RAIN = Array.from({ length: 140 }, (_, i) => {
  const r = (k: string) => random(`sky-rain-${i}-${k}`);
  return { x: r("x") * 2200, phase: r("p") * 1200, speed: 26 + r("s") * 10, len: 34 + r("l") * 30 };
});

const glow = { color: DUSK.cream, enColor: "rgba(248, 239, 227, 0.85)" };
const shadow = { textShadow: "0 2px 14px rgba(30, 40, 70, 0.45)" };

export const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  const abs = frame + segFrom(SEGMENTS.sky);
  const dark = interpolate(frame, [t(50.4), t(52.0), t(54.6), t(56.0)], [0, 0.42, 0.42, 0], clamp);
  const rain = interpolate(frame, [t(51.4), t(52.2), t(54.6), t(55.6)], [0, 1, 1, 0], clamp);
  const mist = interpolate(frame, [0, t(45.0), t(48.6)], [0, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <Heaven abs={abs} />
      {/* 清晨的雾：画面下方一抹白，慢慢飘走 */}
      <AbsoluteFill
        style={{
          opacity: mist * 0.8,
          transform: `translateX(${frame * 1.2}px)`,
          background: "radial-gradient(ellipse 70% 30% at 40% 100%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <Birds from={t(44.6)} to={t(50.2)} />
      <Kite rise={[t(45.4), t(47.4)]} leave={[t(51.4), t(52.8)]} />
      <AbsoluteFill style={{ backgroundColor: "#28324a", opacity: dark }} />
      {STORM.map((s, i) => {
        const x = interpolate(frame, [t(50.4) + s.lag, t(52.4) + s.lag, t(54.4) + s.lag, t(56.2) + s.lag], [-900, 760, 900, 2900], {
          ...clamp,
          easing: EASE_IN_OUT,
        });
        return (
          <Cloud
            key={i}
            id={`storm-${i}`}
            puffs={s.puffs}
            x={x + i * 180}
            y={s.y}
            scale={s.scale}
            base={40}
            light="#a7afbd"
            mid="#88919f"
            shade="#4f586a"
            tint={{ top: "#c3c9d4", topOpacity: 0.3, bottomOpacity: 0.7 }}
            fluff={18}
            soft={3}
          />
        );
      })}
      {rain > 0 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: rain }}>
          {RAIN.map((d, i) => {
            const y = ((frame * d.speed + d.phase) % 1260) - 120;
            const x = d.x - y * 0.18 - 100;
            return <line key={i} x1={x} y1={y} x2={x + d.len * 0.18} y2={y - d.len} stroke="rgba(220, 228, 240, 0.55)" strokeWidth={1.5} strokeLinecap="round" />;
          })}
        </svg>
      )}

      <Caption
        {...glow}
        zh={["天空一步也没有走过，", "却见过所有的路。"]}
        en={["The sky has never taken a single step,", "yet it has seen every road."]}
        at={t(44.6)}
        out={t(50.2)}
        size={54}
        enSize={25}
        align="center"
        style={{ left: 0, right: 0, top: 150, ...shadow }}
      />
      <Caption
        {...glow}
        zh={["天气会来去，", "天空是让天气路过的地方。"]}
        en={["Weather comes and goes;", "the sky is where the weather passes through."]}
        at={t(50.8)}
        out={t(56.4)}
        size={54}
        enSize={25}
        align="center"
        style={{ left: 0, right: 0, top: 150, ...shadow }}
      />
      <PaperTexture opacity={0.18} />
      <Grain opacity={0.05} vignette={0.3} />
    </AbsoluteFill>
  );
};
