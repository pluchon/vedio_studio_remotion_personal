// 《奶糖的萌部落手帐》总装（40 帧/秒）：桌上一本线圈手帐，一幕一页，翻页落在小节线上、三种翻法轮着来；
// 每页有镜头慢推、念白开口时的一下推近、每小节强拍的轻微鼓动。奶糖只在开场、讲她自己、离线、结尾出现：
// 开口那两句用桌宠分层图对口型，其余是 GIF 动图（挥手、举星星、犯困）。念白一句一个 Audio，配乐在念白时压低
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { useFonts } from "../kit";
import { C, ZH, asset } from "../theme";
import { Naitang } from "./Naitang";
import { Account, Cover, Detail, Editor, Home } from "./pages1";
import { Creator, Growth, Messages, Profile, Search } from "./pages2";
import { Arch, NaitangPage, Outro, Resilience } from "./pages3";
import { DotPaper, INK, InkFilter, rnd } from "./paper";
import { Gif } from "./parts";
import { BAR, LINES, SCENES, scene } from "./timeline";

export const PAGE = { x: 150, y: 96, w: 1580, h: 900 };
const FLIP = 13; // 翻页用的帧数，翻完正好落在下一幕的第一拍
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const VOICE_VOLUME = 0.72;
const MUSIC_VOLUME = 0.62;

const PAGES: Record<string, React.FC<{ f: number }>> = {
  intro: Cover, account: Account, home: Home, editor: Editor, detail: Detail, search: Search, growth: Growth,
  creator: Creator, messages: Messages, profile: Profile, naitang: NaitangPage, resilience: Resilience, arch: Arch, outro: Outro,
};

// 桌面：粉色格子布慢慢斜着走，飘几颗小星星
const Desk: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill
    style={{
      background: "#F7D9E3",
      backgroundImage: "linear-gradient(rgba(255,255,255,0.45) 50%, transparent 50%), linear-gradient(90deg, rgba(255,255,255,0.45) 50%, transparent 50%)",
      backgroundSize: "64px 64px",
      backgroundPosition: `${f * 0.5}px ${f * 0.5}px`,
    }}
  >
    {Array.from({ length: 12 }, (_, i) => {
      const x = (rnd(i, 1) * 1920 + f * (0.3 + rnd(i, 2) * 0.5)) % 1960 - 20;
      const y = (rnd(i, 3) * 1080 - f * (0.2 + rnd(i, 4) * 0.4) + 2000) % 1120 - 20;
      const s = 14 + rnd(i, 5) * 16;
      return (
        <svg key={i} style={{ position: "absolute", left: x, top: y, opacity: 0.8 }} width={s * 2} height={s * 2} viewBox="-12 -12 24 24">
          <path d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z" fill={[C.lemon, "#fff", C.blue, C.pink][i % 4]} transform={`rotate(${f * (1 + i % 3)})`} />
        </svg>
      );
    })}
    <div style={{ position: "absolute", right: 30, top: -50, width: 190, height: 190, borderRadius: "50%", border: `46px solid ${C.mint}`, boxSizing: "border-box", opacity: 0.9, transform: `rotate(${f}deg)` }} />
    <div style={{ position: "absolute", left: 20, top: 20, width: 120, height: 120, borderRadius: "50%", border: `30px solid ${C.lilac}`, boxSizing: "border-box", opacity: 0.85 }} />
  </AbsoluteFill>
);

// 线圈：一排圈在页面顶上
const Rings: React.FC = () => (
  <svg style={{ position: "absolute", left: PAGE.x, top: PAGE.y - 34, overflow: "visible" }} width={PAGE.w} height={80}>
    {Array.from({ length: 27 }, (_, i) => {
      const x = 70 + i * 55;
      return (
        <g key={i}>
          <ellipse cx={x} cy={52} rx={9} ry={9} fill="#E6DCCF" />
          <path d={`M ${x - 7} 52 C ${x - 9} 10, ${x + 9} 10, ${x + 7} 52`} fill="none" stroke="#8C97A8" strokeWidth={7} strokeLinecap="round" />
          <path d={`M ${x - 7} 52 C ${x - 9} 10, ${x + 9} 10, ${x + 7} 52`} fill="none" stroke="#DCE3EC" strokeWidth={2.5} strokeLinecap="round" transform="translate(-1.5,-2)" />
        </g>
      );
    })}
  </svg>
);

// 镜头：整页慢慢推近，念白开口时推一下，小节强拍轻轻鼓一下
const camera = (id: string, f: number) => {
  const sc = scene(id);
  let s = 1 + 0.03 * Math.min(1, Math.max(0, f / sc.frames));
  for (const l of sc.lines) {
    const t = l.at - sc.from;
    if (f >= t) s += 0.022 * Math.exp(-(f - t) / 9);
  }
  const p = ((f % BAR) + BAR) % BAR;
  s += 0.006 * Math.exp(-p / 5);
  return s;
};

type Mode = "flip" | "slide" | "zoom";
const Sheet: React.FC<{ id: string; f: number; mode?: Mode; p?: number; shade?: number }> = ({ id, f, mode = "flip", p = 0, shade = 0 }) => {
  const Body = PAGES[id];
  const cover = id === "intro";
  const cam = camera(id, f);
  const tf =
    mode === "flip" ? `perspective(2600px) rotateX(${p * 180}deg)` :
    mode === "slide" ? `translateX(${-p * 1900}px) translateY(${p * 80}px) rotate(${-p * 12}deg)` :
    `scale(${1 + p * 0.5})`;
  return (
    <div
      style={{
        position: "absolute", left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h,
        transformOrigin: mode === "flip" ? "50% 0%" : mode === "slide" ? "0% 100%" : "50% 50%", transform: tf, backfaceVisibility: "hidden",
        opacity: mode === "zoom" ? 1 - p : 1,
        borderRadius: "10px 10px 22px 22px", overflow: "hidden",
        boxShadow: p > 0 ? `0 ${30 + p * 60}px ${40 + p * 80}px rgba(41,72,106,${0.2 + p * 0.2})` : "0 18px 30px rgba(41,72,106,0.16)",
      }}
    >
      {cover ? null : <DotPaper />}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${cam})`, transformOrigin: "50% 45%" }}>
        <Body f={f} />
      </div>
      {shade > 0 ? <AbsoluteFill style={{ background: `rgba(41,72,106,${shade})` }} /> : null}
    </div>
  );
};

// 页面的厚度：底下露出几层纸边
const Stack: React.FC = () => (
  <>
    {[3, 2, 1].map((k) => (
      <div key={k} style={{ position: "absolute", left: PAGE.x + k * 3, top: PAGE.y + k * 5, width: PAGE.w, height: PAGE.h, borderRadius: "10px 10px 22px 22px", background: k % 2 ? "#F4F1EA" : "#FBF8F2", boxShadow: "0 6px 12px rgba(41,72,106,0.08)" }} />
    ))}
  </>
);

// 太长的句子在最靠中间的逗号处切成两段，按字数分时间先后出
const pieces = (text: string) => {
  if (text.length <= 26) return [{ t: text, a: 0, b: 1 }];
  const mid = text.length / 2;
  let cut = -1;
  [...text].forEach((ch, i) => {
    if ("，；：、".includes(ch) && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
  });
  if (cut < 0) return [{ t: text, a: 0, b: 1 }];
  const k = (cut + 1) / text.length;
  return [{ t: text.slice(0, cut + 1), a: 0, b: k }, { t: text.slice(cut + 1), a: k, b: 1 }];
};

const Subtitle: React.FC<{ f: number }> = ({ f }) => {
  const i = LINES.findIndex((l, k) => {
    const next = LINES[k + 1]?.at ?? Infinity;
    return f >= l.at - 5 && f < Math.min(l.at + l.dur + 16, next - 5);
  });
  if (i < 0) return null;
  const l = LINES[i];
  const next = LINES[i + 1]?.at ?? Infinity;
  const end = Math.min(l.at + l.dur + 16, next - 5);
  const o = Math.min(interpolate(f, [l.at - 5, l.at + 4], [0, 1], clamp), interpolate(f, [end - 8, end], [1, 0], clamp));
  const parts = pieces(l.text);
  const p = (f - l.at) / l.dur;
  const part = parts.find((x) => p < x.b) ?? parts[parts.length - 1];
  return (
    <div style={{ position: "absolute", left: PAGE.x + 40, width: PAGE.w - 80, top: PAGE.y + PAGE.h - 100, display: "flex", justifyContent: "center", opacity: o, transform: `translateY(${(1 - o) * 12}px)` }}>
      <div style={{ fontFamily: ZH, fontSize: 44, color: INK, background: "rgba(255,255,255,0.94)", border: `3px dashed ${C.blue}`, borderRadius: 20, padding: "8px 30px", textAlign: "center", lineHeight: 1.3, boxShadow: "0 6px 14px rgba(41,72,106,0.1)" }}>
        {part.t}
      </div>
    </div>
  );
};

// 念白时配乐压低
const duck = (f: number) => {
  let w = 0;
  for (const l of LINES) {
    const a = interpolate(f, [l.at - 10, l.at], [0, 1], clamp);
    const b = interpolate(f, [l.at + l.dur, l.at + l.dur + 16], [1, 0], clamp);
    w = Math.max(w, Math.min(a, b));
  }
  return 1 - 0.55 * w;
};

const MODES: Mode[] = ["flip", "slide", "zoom"];

export const Journal: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFonts();
  if (!ready) return null;

  const k = Math.max(0, SCENES.findIndex((s) => f >= s.from && f < s.from + s.frames));
  const cur = SCENES[k];
  const next = SCENES[k + 1];
  const mode = MODES[k % MODES.length];
  const flipping = next && f >= next.from - FLIP;
  const p = flipping ? interpolate(f, [next.from - FLIP, next.from], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.35, 1) }) : 0;
  const showCur = !flipping || mode !== "flip" || p < 0.5;

  // 奶糖出场的几处
  const intro = scene("intro");
  const nt = scene("naitang");
  const rs = scene("resilience");
  const outro = scene("outro");
  const l0 = LINES[0];
  const n0 = LINES.find((l) => l.i === nt.lines[0].i)!;
  const talkIntro = f >= intro.from + 60 && f < l0.at + l0.dur + 10;
  const talkNt = f >= nt.from - 4 && f < n0.at + n0.dur + 8;

  return (
    <AbsoluteFill style={{ background: "#F7D9E3", overflow: "hidden" }}>
      <InkFilter />
      <Desk f={f} />
      <Stack />
      {flipping ? <Sheet id={next.id} f={f - next.from} shade={0.14 * (1 - p)} /> : null}
      {showCur ? <Sheet id={cur.id} f={f - cur.from} mode={flipping ? mode : "flip"} p={p} /> : null}
      <Rings />

      {/* 对口型：开场打招呼、「当然，还有我！」 */}
      {talkIntro ? <Naitang f={f} x={1530} feet={1000} height={560} cheers={[l0.at - 2]} enter={intro.from + 60} /> : null}
      {talkNt ? <Naitang f={f} x={1560} feet={1010} height={600} cheers={[n0.at - 2]} enter={nt.from - 4} /> : null}
      {/* GIF 动图 */}
      <Gif f={f} name="wave" x={1530} feet={1000} height={600} from={l0.at + l0.dur + 6} to={intro.from + intro.frames - 14} />
      <Gif f={f} name="star" x={1580} feet={1020} height={640} from={n0.at + n0.dur + 4} to={nt.from + nt.frames - 14} />
      <Gif f={f} name="sleepy" x={1590} feet={1010} height={600} from={rs.from + 6} to={rs.from + rs.frames - 14} />
      <Gif f={f} name="wave" x={1640} feet={1030} height={560} from={outro.lines[1].at - 30} to={outro.from + outro.frames + 40} />
      <Subtitle f={f} />

      <Audio src={asset("audio/journal-bgm.wav")} volume={(g) => duck(g) * MUSIC_VOLUME} />
      {LINES.map((l) => (
        <Sequence key={l.i} from={l.at} durationInFrames={l.dur + 12} layout="none">
          <Audio src={asset(`audio/journal/${String(l.i).padStart(2, "0")}.wav`)} volume={VOICE_VOLUME} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
