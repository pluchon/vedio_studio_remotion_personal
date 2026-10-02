// 《汉字的演变》整片：先是照着东西画的三个字，再是两个字拼出的意思，然后七个字排成一行，一种字体一种字体地变到今天，最后只留下「日」
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Grain } from "../../shared/Grain";
import { loadLocalFont } from "../../shared/fonts";
import { Ink } from "./Ink";
import { Sketch } from "./Sketch";
import type { SketchKind } from "./Sketch";
import { Strip } from "./Strip";
import { Subtitles } from "./Subtitles";
import { useGlyphs } from "./glyphs";
import type { Glyphs } from "./glyphs";
import { COLORS, FONT, FPS, LEAD, MUSIC, SCRIPTS, TOTAL_FRAMES, VOICE } from "./theme";

loadLocalFont(FONT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK: [number, number, number] = [42, 37, 31];
const RED: [number, number, number] = [162, 58, 44];

// 以下的时间都是念白里的秒数
const line = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const ease = (t: number, a: number, b: number) => {
  const p = line(t, a, b);
  return p * p * (3 - 2 * p);
};
const mixTo = (from: number, to: number, p: number) => from + (to - from) * p;

// 变形时旧字收到多细
const REWRITE = 9;

// 排成一行的七个字
const ROW = ["日", "山", "水", "人", "木", "休", "明"];
const ROW_Y = 500;
const ROW_SIZE = 236;
const slot = (i: number) => 960 + (i - 3) * 248;

// 开头三个字各自的位置
const TRIO = [480, 960, 1440];
const TRIO_Y = 480;
const TRIO_SIZE = 380;

// 两个会意字合体的位置
const PAIR_X = [640, 1280];
const PAIR_Y = 480;
const PAIR_SIZE = 460;

// 年代线上五种字体各自亮起来的时刻
const REACHED = [0.4, 36.4, 41.3, 52.5, 62.3];

// 一行字从一种字体变到下一种：什么时候开始、变多久；从左到右依次晚一点
const morphWindow = (step: number, i: number): [number, number] => {
  if (step === 0) return [37.3 + i * 0.1, 1.5];
  if (step === 1) return [41.6 + i * 0.12, 1.9];
  if (step === 2) {
    // 「圆变成了方」那一句留给「日」
    return i === 0 ? [55.9, 2.2] : [53.2 + (i - 1) * 0.14, 2.1];
  }
  return [63.4 + i * 0.1, 1.7];
};

const stageOf = (t: number, i: number) => {
  for (let step = 0; step < 4; step++) {
    const [start, span] = morphWindow(step, i);
    const mix = ease(t, start, start + span);
    if (mix < 1) return { from: SCRIPTS[step], to: SCRIPTS[step + 1], mix };
  }
  return { from: SCRIPTS[4], to: SCRIPTS[4], mix: 0 };
};

const Placed: React.FC<{ x: number; y: number; size: number; children: React.ReactNode }> = ({ x, y, size, children }) => (
  <div style={{ position: "absolute", left: Math.round(x - size / 2), top: Math.round(y - size / 2), width: size, height: size }}>{children}</div>
);

const Label: React.FC<{ x: number; y: number; text: string; opacity: number }> = ({ x, y, text, opacity }) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x - 100,
        top: y,
        width: 200,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 34,
        color: COLORS.muted,
        opacity,
      }}
    >
      {text}
    </div>
  );

// 开头：照着东西画出来的三个字
const Pictures: React.FC<{ glyphs: Glyphs; t: number }> = ({ glyphs, t }) => {
  const leave = 1 - line(t, 23.8, 24.6);
  if (leave <= 0) return null;
  // 「日」先在正中，另外两个字出来之前让到左边
  const aside = ease(t, 9.6, 10.9);
  const sunX = mixTo(960, TRIO[0], aside);
  const sunSize = Math.round(mixTo(520, TRIO_SIZE, aside));
  const carving = t < 7.6;
  // 讲到「字是照着东西画出来的」时，后面的简图再亮一点
  const lift = 0.3 + 0.2 * ease(t, 21.8, 22.6);

  const items: { char: string; kind: SketchKind; x: number; size: number; reveal: number; named: number }[] = [
    { char: "日", kind: "sun", x: sunX, size: sunSize, reveal: 1, named: 8.5 },
    { char: "山", kind: "mountain", x: TRIO[1], size: TRIO_SIZE, reveal: line(t, 11.1, 13.3), named: 13.5 },
    { char: "水", kind: "water", x: TRIO[2], size: TRIO_SIZE, reveal: line(t, 15.2, 18.3), named: 18.7 },
  ];

  return (
    <AbsoluteFill style={{ opacity: leave }}>
      <Sketch kind="shell" x={960} y={TRIO_Y} size={760} draw={line(t, 0.3, 3.8)} opacity={0.55 * (1 - line(t, 7.6, 8.5))} color={COLORS.muted} stroke={0.22} />
      {items.map(({ kind, x, size, named }) => (
        <Sketch key={kind} kind={kind} x={x} y={TRIO_Y} size={size * 1.34} draw={line(t, named - 0.1, named + 1.3)} opacity={lift} color={COLORS.cinnabar} />
      ))}
      {carving ? (
        <Placed x={sunX} y={TRIO_Y} size={sunSize}>
          {/* 先刻外面那一圈，再点中间那一点：同一个字形裁成里外两块，各走各的进度 */}
          <Ink
            glyphs={glyphs}
            from="日-oracle"
            reveal={line(t, 4.0, 5.7)}
            size={sunSize}
            color={INK}
            style={{ position: "absolute", clipPath: "polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 28% 36%, 72% 36%, 72% 64%, 28% 64%, 28% 36%)" }}
          />
          <Ink
            glyphs={glyphs}
            from="日-oracle"
            reveal={0.25 + 0.75 * line(t, 6.4, 7.4)}
            opacity={line(t, 6.4, 6.6)}
            size={sunSize}
            color={INK}
            style={{ position: "absolute", clipPath: "inset(36% 28% 36% 28%)" }}
          />
        </Placed>
      ) : null}
      {items.map(({ char, x, size, reveal }, i) =>
        (i === 0 && carving) || reveal <= 0 ? null : (
          <Placed key={char} x={x} y={TRIO_Y} size={size}>
            <Ink glyphs={glyphs} from={`${char}-oracle`} reveal={reveal} size={size} color={INK} />
          </Placed>
        ),
      )}
      {items.map(({ char, x, size, named }) => (
        <Label key={char} x={x} y={TRIO_Y + size / 2 + 34} text={char} opacity={line(t, named, named + 0.6)} />
      ))}
    </AbsoluteFill>
  );
};

// 一行七个字；「休」「明」是从两个字合出来的，合完再归到队里
const Row: React.FC<{ glyphs: Glyphs; t: number }> = ({ glyphs, t }) => {
  const gather = ease(t, 35.2, 36.5);
  const others = line(t, 35.8, 36.6);
  const alone = 1 - line(t, 67.5, 68.7);
  const centre = ease(t, 67.8, 70.2);

  return (
    <>
      {ROW.map((char, i) => {
        const pair = i >= 5 ? i - 5 : -1;
        if (pair < 0 && others <= 0) return null;
        if (pair >= 0 && t < (pair === 0 ? 26.9 : 32.3)) return null;
        if (i > 0 && alone <= 0) return null;

        let x = slot(i);
        let y = ROW_Y;
        let size = ROW_SIZE;
        if (pair >= 0) {
          x = mixTo(PAIR_X[pair], x, gather);
          y = mixTo(PAIR_Y, y, gather);
          size = mixTo(PAIR_SIZE, size, gather);
        }
        if (i === 0) {
          x = mixTo(x, 960, centre);
          y = mixTo(y, 470, centre);
          size = mixTo(size, 500, centre);
        }
        size = Math.round(size);

        const stage = stageOf(t, i);
        let from = `${char}-${stage.from}`;
        let to = `${char}-${stage.to}`;
        let mix = stage.mix;
        let reveal = 1;
        if (pair >= 0 && t < 35.2) {
          // 两个字先并排写出来，再化成一个字
          const [write, merge] = pair === 0 ? [26.99, 29.96] : [32.3, 33.6];
          reveal = line(t, write, write + (pair === 0 ? 1.6 : 1.2));
          from = pair === 0 ? "人木" : "月日";
          to = `${char}-oracle`;
          mix = ease(t, merge, merge + (pair === 0 ? 1.4 : 1.1));
        }

        return (
          <Placed key={char} x={x} y={y} size={size}>
            <Ink
              glyphs={glyphs}
              from={from}
              to={to}
              mix={mix}
              rewrite={REWRITE}
              reveal={reveal}
              size={size}
              color={INK}
              opacity={(pair >= 0 ? 1 : others) * (i > 0 ? alone : 1)}
            />
          </Placed>
        );
      })}
    </>
  );
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const glyphs = useGlyphs();
  if (!glyphs) return null;
  const t = frame / FPS - LEAD;

  // 两个会意字合体前后，各自下面的小字
  const parts = [
    { x: PAIR_X[0] - 106, y: 150, text: "人", on: line(t, 28.3, 28.9) * (1 - line(t, 29.9, 30.5)) },
    { x: PAIR_X[0] + 106, y: 150, text: "木", on: line(t, 28.3, 28.9) * (1 - line(t, 29.9, 30.5)) },
    { x: PAIR_X[0], y: 205, text: "休", on: line(t, 31.3, 31.9) * (1 - line(t, 35.0, 35.4)) },
    { x: PAIR_X[1] - 115, y: 150, text: "月", on: line(t, 33.0, 33.5) * (1 - line(t, 33.6, 34.1)) },
    { x: PAIR_X[1] + 101, y: 150, text: "日", on: line(t, 33.0, 33.5) * (1 - line(t, 33.6, 34.1)) },
    { x: PAIR_X[1], y: 205, text: "明", on: line(t, 34.4, 35.0) * (1 - line(t, 35.0, 35.4)) },
  ];

  // 「圆变成了方」：套在「日」外面的一圈朱砂线，从圆变成方
  const ring = line(t, 55.7, 56.2) * (1 - line(t, 58.7, 59.5));
  const squared = ease(t, 56.5, 58.2);
  // 「字不再像画」：三张简图回来一下，又淡掉
  const ghost = 0.34 * line(t, 58.7, 59.5) * (1 - line(t, 60.2, 61.4));
  // 结尾：楷书的「日」后面，升起最早那个圆的太阳
  const halo = ease(t, 76.6, 80.6);
  const haloSize = Math.round(mixTo(780, 840, halo));
  const end = line(frame, TOTAL_FRAMES - 34, TOTAL_FRAMES - 4);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 46%, ${COLORS.paper} 30%, ${COLORS.paperDeep} 100%)` }}>
      <Sequence from={Math.round(LEAD * FPS)} layout="none">
        <Audio src={staticFile(VOICE)} />
      </Sequence>
      <Audio src={staticFile(MUSIC)} volume={0.5} />

      <Strip t={t} reached={REACHED} opacity={line(t, -1.2, 0) * (1 - 0.55 * line(t, 67.5, 69))} />

      <Pictures glyphs={glyphs} t={t} />

      {halo > 0 ? (
        <Placed x={960} y={470} size={haloSize}>
          <Ink glyphs={glyphs} from="日-bronze" size={haloSize} color={RED} opacity={0.2 * halo} />
        </Placed>
      ) : null}

      {(["sun", "mountain", "water"] as const).map((kind, i) => (
        <Sketch key={kind} kind={kind} x={slot(i)} y={ROW_Y} size={ROW_SIZE * 1.3} draw={1} opacity={ghost} color={COLORS.cinnabar} stroke={0.8} />
      ))}

      {t > 26.5 ? <Row glyphs={glyphs} t={t} /> : null}

      {ring > 0 ? (
        <div
          style={{
            position: "absolute",
            left: slot(0) - 132,
            top: ROW_Y - 132,
            width: 264,
            height: 264,
            boxSizing: "border-box",
            border: `2.5px solid ${COLORS.cinnabar}`,
            borderRadius: `${mixTo(50, 5, squared)}%`,
            opacity: ring * 0.85,
          }}
        />
      ) : null}

      {parts.map(({ x, y, text, on }) => (
        <Label key={`${text}-${x}`} x={x} y={PAIR_Y + y} text={text} opacity={on} />
      ))}

      <Subtitles ms={t * 1000} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 800,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 30,
          letterSpacing: 16,
          paddingLeft: 16,
          color: COLORS.muted,
          opacity: line(t, 81.6, 83),
        }}
      >
        汉字的演变
      </div>

      <Grain opacity={0.07} vignette={0.16} />
      <AbsoluteFill style={{ background: COLORS.paperDeep, opacity: end }} />
    </AbsoluteFill>
  );
};
