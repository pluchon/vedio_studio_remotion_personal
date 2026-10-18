// 开头和结尾：片名一个字一个字蹦出来；结尾是萌部落的封面，最后一个和弦撒一把彩纸
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Background, C, Kao, Snowflake, Sparkle, Sticker, TEXT, ZH, at, hop, lerp, pop, thump } from "../kit";
import { img, shot } from "../shots";
import { BAR } from "../theme";

const TITLE = ["萌", "部", "落"];
const CHIPS = [
  { text: "社区", color: C.pink },
  { text: "创作", color: C.blue },
  { text: "成长", color: C.mint },
  { text: "AI 萌萌", color: C.lemon },
];

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const bow = pop(f, at(4));
  return (
    <AbsoluteFill>
      <Background f={f} tint="#E8F4FC" check />
      {/* 片名：三个字踩着钟琴的前三个音落下，之后每拍跳一下 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", gap: 30 }}>
        {TITLE.map((ch, i) => {
          const p = pop(f, at(i));
          return (
            <div
              key={ch}
              style={{
                fontFamily: ZH,
                fontSize: 250,
                lineHeight: 1,
                color: C.blueDeep,
                WebkitTextStroke: `18px ${C.white}`,
                paintOrder: "stroke fill",
                textShadow: `0 14px 0 ${C.blueLight}, 0 24px 40px rgba(47,100,176,0.25)`,
                scale: `${p}`,
                rotate: `${(i - 1) * 5 + (1 - p) * 30}deg`,
                translate: `0 ${-hop(f, i * 2) * 16 * (f > 48 ? 1 : 0)}px`,
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>
      {/* 蝴蝶结标志：从上面掉下来转一圈 */}
      <Img
        src={img("logo")}
        style={{
          position: "absolute",
          left: 960 - 95,
          top: 150 - (1 - bow) * 300,
          width: 190,
          height: 190,
          scale: `${bow * thump(f, 0.06)}`,
          rotate: `${(1 - bow) * -180 + Math.sin(f / 10) * 6}deg`,
          opacity: bow > 0 ? 1 : 0,
        }}
      />
      {/* 副标题 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "14px 46px", borderRadius: 999, background: C.white, border: `4px solid ${C.pink}`, boxShadow: `0 8px 0 ${C.pink}55`, display: "flex", gap: 4, scale: `${pop(f, at(6))}` }}>
          {"分享热爱，收集日常".split("").map((ch, i) => (
            <span key={i} style={{ fontFamily: ZH, fontSize: 60, color: C.ink, opacity: lerp(f, at(6) + i * 2, at(6) + i * 2 + 6), display: "inline-block", translate: `0 ${-hop(f, i) * 6}px` }}>
              {ch}
            </span>
          ))}
        </div>
      </div>
      {[0.5, 1.5, 3, 3.5, 5.5, 7].map((b, i) => (
        <Sparkle key={b} f={f} at={at(b)} x={[620, 1300, 560, 1360, 700, 1240][i]} y={[300, 330, 520, 500, 260, 600][i]} size={58} color={i % 2 ? C.pink : C.lemon} />
      ))}
      {/* 第三小节：四只琪露诺贴纸，一拍一只 */}
      <Sticker f={f} src={img("emo-hooray")} at={at(8)} x={300} y={300} size={300} rot={-8} />
      <Sticker f={f} src={img("emo-love")} at={at(9)} x={1630} y={290} size={290} rot={7} />
      <Sticker f={f} src={img("emo-awesome")} at={at(10)} x={250} y={790} size={280} rot={6} />
      <Sticker f={f} src={img("emo-cheer")} at={at(11)} x={1660} y={800} size={280} rot={-6} />
      <Kao f={f} at={at(12)} x={1340} y={160} text="(≧▽≦)" color={C.blue} rot={6} />
      {/* 第四小节：木鱼的四下，四张小卡片 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center", gap: 34 }}>
        {CHIPS.map((c, i) => {
          const p = pop(f, at(14 + i * 0.5));
          return (
            <div key={c.text} style={{ padding: "12px 34px", borderRadius: 20, background: c.color, color: C.white, fontFamily: ZH, fontSize: 46, scale: `${p}`, rotate: `${(i % 2 ? 4 : -4) * p}deg`, boxShadow: `0 7px 0 ${C.ink}22`, textShadow: `0 3px 0 ${C.ink}33` }}>
              {c.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 结尾
const confetti = Array.from({ length: 70 }, (_, i) => {
  const a = (i / 70) * Math.PI * 2 + (i % 5) * 0.13;
  const v = 14 + ((i * 37) % 11);
  return { vx: Math.cos(a) * v * 1.3, vy: Math.sin(a) * v - 10, kind: i % 4, spin: ((i * 53) % 9) - 4 };
});

export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const card = pop(f, 0, true);
  const boom = 3 * BAR;
  const fadeOut = lerp(f, 236, 264, 0, 1);
  const cover = shot("cover");
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EAF5FC" check />
      <div
        style={{
          position: "absolute",
          left: 960 - 640,
          top: 120,
          width: 1280,
          height: 640,
          borderRadius: 30,
          overflow: "hidden",
          border: `10px solid ${C.white}`,
          boxShadow: `0 16px 0 ${C.blueLight}, 0 34px 70px rgba(47,100,176,0.25)`,
          scale: `${card * (f > boom ? thump(f - boom, 0.05) : 1)}`,
          rotate: `${-2 + (1 - card) * -12}deg`,
        }}
      >
        <Img src={cover.src} style={{ width: 1260, height: 630, scale: `${1 + f / 3000}` }} />
      </div>
      {/* 纸胶带 */}
      {[
        [370, 110, -18, C.pink],
        [1540, 116, 16, C.blue],
      ].map(([x, y, r, c], i) => (
        <div key={i} style={{ position: "absolute", left: (x as number) - 90, top: (y as number) - 22, width: 180, height: 46, background: `repeating-linear-gradient(45deg, ${c} 0 14px, ${c}aa 14px 28px)`, rotate: `${r}deg`, opacity: 0.92 * lerp(f, 10 + i * 4, 18 + i * 4) }} />
      ))}
      <Sticker f={f} src={img("emo-hooray")} at={at(1)} x={190} y={300} size={260} rot={-10} />
      <Sticker f={f} src={img("emo-love")} at={at(2)} x={1740} y={320} size={250} rot={8} />
      <Sticker f={f} src={img("emo-headpat")} at={at(3)} x={210} y={780} size={240} rot={6} />
      <Sticker f={f} src={img("emo-popsicle")} at={at(4)} x={1720} y={790} size={240} rot={-6} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 840, display: "flex", justifyContent: "center", gap: 26 }}>
        {["Java 微服务", "Python AI", "Vue 3"].map((t, i) => (
          <div key={t} style={{ padding: "12px 34px", borderRadius: 999, background: C.white, border: `4px solid ${[C.blue, C.mint, C.pink][i]}`, fontFamily: TEXT, fontSize: 42, color: C.ink, scale: `${pop(f, at(6 + i * 0.5))}`, boxShadow: `0 7px 0 ${[C.blue, C.mint, C.pink][i]}55` }}>
            {t}
          </div>
        ))}
      </div>
      <Kao f={f} at={at(9)} x={960} y={985} text="ありがとう ♪ (｡･ω･｡)ﾉ" color={C.lemon} size={40} />
      {/* 最后一个和弦：彩纸 */}
      {f >= boom
        ? confetti.map((p, i) => {
            const t = (f - boom) / 1.2;
            const x = 960 + p.vx * t;
            const y = 450 + p.vy * t + 0.32 * t * t;
            const color = [C.pink, C.blue, C.lemon, C.mint][p.kind];
            return p.kind === 1 ? (
              <Snowflake key={i} size={40} color={color} style={{ position: "absolute", left: x - 20, top: y - 20, rotate: `${t * p.spin * 4}deg` }} />
            ) : (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 10 + (i % 3) * 6, background: color, borderRadius: p.kind === 2 ? 9 : 3, rotate: `${t * p.spin * 6}deg` }} />
            );
          })
        : null}
      <AbsoluteFill style={{ background: C.paper, opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
