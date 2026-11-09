// 竖屏小样：抠好的奶糖动图（ElevenLabs GPT 2.6 出 GIF → tools/common/sprite_gif.py 补帧抠图）叠在排版画面下层，
// 试"科普短视频里有个会动的角色"这种做法：标题牌弹出、星标数字滚动、放射光、彩纸，奶糖在下面举着星星蹦
import React from "react";
import { AbsoluteFill, Audio, Img, Loop, OffthreadVideo, Sequence, interpolate, useCurrentFrame } from "remotion";
import { EASE, lerp, pop, useFonts } from "./kit";
import { C, TEXT, ZH, asset } from "./theme";

export const DEMO = { fps: 40, width: 1080, height: 1920, duration: 360 };
const SPRITE_FRAMES = 64; // star.webm：16 帧 × 4 = 64 帧，40 帧/秒

// 三句念白（时长见 public/meng-center/naitang/voice/lines.json）：标题弹出时念第一句，名字出来后第二句，数字滚到头时第三句
const LINES = [
  { at: 14, dur: 1.62, zh: "萌部落开源啦！", en: "Meng Center is now open source!" },
  { at: 92, dur: 2.42, zh: "这是一个可爱的二次元社区哦", en: "It's a cute community for anime fans" },
  { at: 196, dur: 2.6, zh: "GitHub 上已经有一千多颗星啦！", en: "Over 1,000 stars on GitHub already!" },
];
const LAND = 206; // 星标数字落定、彩纸炸开（第三句说到"一千多"附近）

const GREEN_DEEP = "#0d3b1f";
const GREEN = "#2f9e57";
const STARS_FROM = 0;
const STARS_TO = 1024;

// 背后转动的放射光
const Rays: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill
    style={{
      background: `repeating-conic-gradient(from ${f * 0.25}deg at 50% 34%, rgba(170,255,190,0.10) 0deg 7deg, rgba(0,0,0,0) 7deg 18deg)`,
      maskImage: "radial-gradient(circle at 50% 34%, #000 0%, #000 22%, transparent 62%)",
      WebkitMaskImage: "radial-gradient(circle at 50% 34%, #000 0%, #000 22%, transparent 62%)",
    }}
  />
);

// 顶上一排进度条 + 编号牌
const TopBar: React.FC<{ f: number }> = ({ f }) => (
  <>
    <div style={{ position: "absolute", top: 34, left: 40, right: 40, display: "flex", gap: 12 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 7, borderRadius: 4, background: i === 0 ? "#fff" : "rgba(255,255,255,0.25)" }} />
      ))}
    </div>
    <div
      style={{
        position: "absolute", top: 76, left: "50%", transform: `translateX(-50%) scale(${pop(f, 4)})`,
        display: "flex", alignItems: "center", gap: 14, padding: "10px 26px 10px 12px", borderRadius: 40,
        background: "rgba(10,30,18,0.75)", border: "2px solid rgba(255,255,255,0.35)",
      }}
    >
      <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 30, color: GREEN_DEEP, background: "#c9f27a", borderRadius: 24, padding: "2px 16px" }}>NO.01</span>
      <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 34, color: "#fff" }}>Meng Center</span>
    </div>
  </>
);

// 彩纸：数字滚到头时从中间炸开再落下
const Confetti: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const t = (f - at) / 40;
  if (t < 0) return null;
  const colors = [C.pink, C.lemon, C.blue, C.mint, C.lilac, "#fff"];
  return (
    <>
      {Array.from({ length: 70 }, (_, i) => {
        const r = (k: number) => {
          const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        const ang = r(1) * Math.PI * 2;
        const v = 500 + r(2) * 900;
        const x = 540 + Math.cos(ang) * v * Math.min(t, 0.6) * 1.2;
        const y = 760 + Math.sin(ang) * v * Math.min(t, 0.6) * 0.9 + 420 * t * t;
        const op = interpolate(t, [0, 0.1, 2.2, 3], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: 14 + r(3) * 10, height: 9 + r(4) * 6, borderRadius: 3,
              background: colors[i % colors.length], opacity: op, transform: `rotate(${(r(5) * 720 + f * (4 + r(6) * 8)) % 360}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

export const NaitangDemo: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFonts();
  if (!ready) return null;

  const title = pop(f, 10);
  const logo = pop(f, 22);
  const name = pop(f, 34, true);
  const badge = pop(f, 44);
  const count = Math.round(lerp(f, LAND - 80, LAND, STARS_FROM, STARS_TO, EASE));
  const landed = f >= LAND;
  const bump = landed ? 1 + 0.12 * Math.exp(-(f - LAND) / 6) * Math.cos((f - LAND) / 2.2) : 1;
  const girl = pop(f, 30, true);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 34%, ${GREEN} 0%, ${GREEN_DEEP} 62%, #06190d 100%)`, overflow: "hidden" }}>
      <Rays f={f} />

      {/* 奶糖：透明底动图循环，外面一圈白描边；放在最底层，星标框压在她举的星星上面 */}
      <div
        style={{
          position: "absolute", left: "50%", bottom: 120, width: 540, height: 962,
          transform: `translateX(-50%) translateY(${(1 - girl) * 500}px)`,
          filter: "drop-shadow(0 0 3px #fff) drop-shadow(0 0 3px #fff) drop-shadow(0 14px 22px rgba(0,0,0,0.35))",
        }}
      >
        <Loop durationInFrames={SPRITE_FRAMES}>
          <OffthreadVideo src={asset("naitang/star.webm")} transparent muted style={{ width: "100%", height: "100%" }} />
        </Loop>
      </div>

      <TopBar f={f} />

      {/* 标题牌 */}
      <div
        style={{
          position: "absolute", top: 190, left: "50%", transform: `translateX(-50%) rotate(-3deg) scale(${title})`,
          padding: "14px 54px", borderRadius: 22, background: "linear-gradient(#45c06d,#2a8f4c)",
          border: "6px solid #fff", boxShadow: "0 10px 0 rgba(0,0,0,0.25)",
        }}
      >
        <span style={{ fontFamily: ZH, fontSize: 104, color: "#fff", whiteSpace: "nowrap", textShadow: "0 5px 0 #1d6a37" }}>萌部落开源啦</span>
      </div>

      {/* 图标 */}
      <div
        style={{
          position: "absolute", top: 420, left: "50%", width: 230, height: 230, transform: `translateX(-50%) scale(${logo})`,
          borderRadius: 50, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 8px rgba(255,255,255,0.25), 0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <Img src={asset("img/logo.png")} style={{ width: 170, height: 170, objectFit: "contain" }} />
      </div>

      {/* 名字 */}
      <div style={{ position: "absolute", top: 690, width: "100%", textAlign: "center", opacity: name, transform: `translateY(${(1 - name) * 30}px)` }}>
        <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 112, color: "#fff7c2", textShadow: "0 6px 0 rgba(0,0,0,0.3)" }}>Meng Center</span>
        <div style={{ margin: "6px auto 0", width: 620 * name, height: 10, borderRadius: 5, background: "#c9f27a" }} />
      </div>

      {/* 星标数字 */}
      <div
        style={{
          position: "absolute", top: 880, left: "50%", transform: `translateX(-50%) scale(${badge * bump})`,
          display: "flex", alignItems: "center", gap: 26, padding: "18px 56px", borderRadius: 80,
          background: "#101a14", border: "5px solid #c9f27a", boxShadow: "0 0 40px rgba(201,242,122,0.35)",
        }}
      >
        <svg width="78" height="78" viewBox="0 0 16 16" fill="#fff">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span style={{ fontSize: 76 }}>⭐</span>
        <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 112, color: "#fff", minWidth: 270, fontVariantNumeric: "tabular-nums" }}>{count}</span>
      </div>

      <Confetti f={f} at={LAND} />

      {/* 念白（Lulu，public/meng-center/naitang/voice/，不入库）和逐句字幕 */}
      {LINES.map((l, i) => (
        <Sequence key={i} from={l.at} durationInFrames={Math.round(l.dur * DEMO.fps) + 10} layout="none">
          <Audio src={asset(`naitang/voice/line${i}.wav`)} volume={0.9} />
        </Sequence>
      ))}
      {LINES.map((l, i) => {
        const end = l.at + Math.round(l.dur * DEMO.fps) + 14;
        const next = LINES[i + 1]?.at ?? DEMO.duration;
        const op = Math.min(lerp(f, l.at - 4, l.at + 6), 1 - lerp(f, Math.min(end, next - 6), Math.min(end, next - 6) + 8));
        if (op <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", bottom: 70, width: "100%", textAlign: "center", opacity: op, transform: `translateY(${(1 - op) * 10}px)` }}>
            <div style={{ fontFamily: ZH, fontSize: 62, color: "#fff", WebkitTextStroke: "10px #10301c", paintOrder: "stroke" }}>
              {l.zh.split("GitHub").map((part, k) => (
                <React.Fragment key={k}>
                  {k > 0 ? <span style={{ color: "#ffe066" }}>GitHub</span> : null}
                  {part}
                </React.Fragment>
              ))}
            </div>
            <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 30, color: "#fff", marginTop: 4, WebkitTextStroke: "6px #10301c", paintOrder: "stroke" }}>{l.en}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
