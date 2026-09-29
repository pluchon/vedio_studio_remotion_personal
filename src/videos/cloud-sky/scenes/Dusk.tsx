// 黄昏的秘密：镜头略微放低，城市的剪影从下面升上来；天一点点暗下去，把光借给那朵大云。
// 快门一响，三张天空的照片落下来——那是云路过时留下的痕迹
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { ColorFade } from "../../../shared/ColorFade";
import { Grain } from "../../../shared/Grain";
import { Caption } from "../components/Caption";
import { Heaven } from "../components/Heaven";
import { PaperTexture } from "../components/PaperTexture";
import { Polaroid } from "../components/Polaroid";
import { DIP, DUSK, EASE_OUT, ROOM, SEGMENTS, asset, localTime, segFrom } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = localTime(SEGMENTS.dusk);
const SHUTTER = t(62.8);

// 城市剪影：一排高低错落的楼、几根路灯、楼前的树；窗户一格一格亮起来
const BLOCKS = Array.from({ length: 22 }, (_, i) => {
  const r = (k: string) => random(`city-${i}-${k}`);
  const tall = i === 15 || i === 18;
  return { x: i * 92 - 20 + r("x") * 30, w: 70 + r("w") * 60, h: tall ? 300 + r("h") * 60 : 80 + r("h") * 130 };
});
const LAMPS = [240, 610, 1010, 1420, 1760];

const City: React.FC<{ rise: number; lights: number }> = ({ rise, lights }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - rise) * 460}px)` }}>
    {BLOCKS.map((b, i) => (
      <g key={i}>
        <rect x={b.x} y={1080 - b.h} width={b.w} height={b.h} fill={DUSK.skyline} />
        {Array.from({ length: Math.floor(b.h / 30) * 2 }, (_, k) => {
          const on = random(`win-${i}-${k}`) < lights * 0.5;
          return on ? (
            <rect key={k} x={b.x + 10 + (k % 2) * (b.w / 2 - 6)} y={1080 - b.h + 14 + Math.floor(k / 2) * 30} width={8} height={10} fill="#ffcf8a" opacity={0.85} />
          ) : null;
        })}
      </g>
    ))}
    {Array.from({ length: 40 }, (_, i) => (
      <circle key={`tree${i}`} cx={i * 50} cy={1080} r={32 + ((i * 29) % 22)} fill="#231f28" />
    ))}
    {LAMPS.map((x) => (
      <g key={x}>
        <rect x={x} y={760} width={5} height={320} fill="#1d1a21" />
        <rect x={x - 16} y={756} width={26} height={6} rx={3} fill="#1d1a21" />
        <circle cx={x - 12} cy={764} r={5} fill="#ffe2ad" opacity={lights} />
        <circle cx={x - 12} cy={764} r={24} fill="#ffcf8a" opacity={lights * 0.25} />
      </g>
    ))}
  </svg>
);

// 快门：一下白闪
const Shutter: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [at, at + 2, at + 12], [0, 0.8, 0], clamp);
  return flash > 0 ? <AbsoluteFill style={{ backgroundColor: "#fff8ee", opacity: flash }} /> : null;
};

// 照片分在两边和下方，把中间那朵亮着的云让出来
const PHOTOS = [
  { src: "photos/cloud_sky_02.png", aspect: 1819 / 1025, caption: "梧桐山 · 半山腰", at: t(63.2), left: 100, top: 540, rotate: -6 },
  { src: "photos/cloud_sky_03.png", aspect: 1819 / 1025, caption: "傍晚 · 积云", at: t(63.7), left: 800, top: 790, rotate: 2 },
  { src: "photos/cloud_sky_01.png", aspect: 1821 / 1025, caption: "坪山 · 火烧云", at: t(64.3), left: 1480, top: 520, rotate: 4 },
];

const glow = { color: DUSK.cream, enColor: "rgba(248, 239, 227, 0.85)" };
const shadow = { textShadow: "0 2px 14px rgba(30, 24, 50, 0.5)" };

export const Dusk: React.FC = () => {
  const frame = useCurrentFrame();
  const abs = frame + segFrom(SEGMENTS.dusk);
  const rise = interpolate(frame, [0, t(58.8)], [0, 1], { ...clamp, easing: EASE_OUT });
  const lights = interpolate(frame, [t(60), t(65)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Heaven abs={abs} />
      <City rise={rise} lights={lights} />
      {PHOTOS.map((p) => (
        <Polaroid
          key={p.src}
          src={asset(p.src)}
          width={340}
          aspect={p.aspect}
          at={p.at}
          out={t(66.8)}
          rotate={p.rotate}
          caption={p.caption}
          paper="#fbf6ec"
          ink={ROOM.ink}
          style={{ left: p.left, top: p.top }}
        />
      ))}
      <Shutter at={SHUTTER} />
      <Caption
        {...glow}
        zh={["太阳要落的时候，", "天空把这一天最好的光，一点一点借给云。"]}
        en={["As the sun goes down, the sky lends the day's best light,", "little by little, to the cloud."]}
        at={t(57.4)}
        out={t(62.6)}
        size={50}
        enSize={24}
        stagger={2.2}
        align="center"
        style={{ left: 0, right: 0, top: 70, ...shadow }}
      />
      <Caption
        {...glow}
        zh={["痕迹是它路过时自己长出来的，", "从来不是它想留下的。"]}
        en={["The traces grew on their own as it passed;", "it never meant to leave them."]}
        at={t(63.0)}
        out={t(67.0)}
        size={50}
        enSize={24}
        stagger={2.2}
        align="center"
        style={{ left: 0, right: 0, top: 70, ...shadow }}
      />
      <PaperTexture opacity={0.18} />
      <Grain opacity={0.05} vignette={0.3} />
      <ColorFade color={DIP} from={t(66.5)} to={t(67.2)} mode="out" />
    </AbsoluteFill>
  );
};
