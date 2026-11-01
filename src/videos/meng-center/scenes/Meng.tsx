// 副歌：奶糖助手——她会什么、聊天、记忆、气泡语音与桌宠
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Background, C, Card, Icon, Kao, Sparkle, Sticker, Tape, Window, ZH, at, hop, lerp, pop, thump } from "../kit";
import { img, shot } from "../shots";

const CARDS = [
  { id: "look", icon: "star" as const, name: "看懂图片", tag: "图片", line: "你发的图，她都能看", hi: "发张图给她看看", c: C.blue, light: C.blueLight, kao: "(・ω・)" },
  { id: "neko", icon: null, name: "奶糖", tag: "猫娘", line: "有自己独特的说话口吻", hi: "嗯？有事喵？", c: C.pink, light: C.pinkLight, kao: "(=^･ω･^=)" },
  { id: "find", icon: "search" as const, name: "帮你查", tag: "工具", line: "站内帖子、成长数据、联网搜索", hi: "回复下方附网页来源", c: C.lemon, light: C.lemonLight, kao: "ヽ(＾▽＾)ノ" },
];

// ---------------------------------------------------------------- 她会什么
export const MengCast: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background f={f} tint="#F3F1FC" grid="#E3DDF7" check />
      <Tape f={f} at={0} x={960} y={40} title="奶糖助手" color={C.pink} rot={-2} size={78} align="center" />
      {CARDS.map((ch, i) => {
        const p = pop(f, at(1 + i));
        const cx = 400 + i * 560;
        const bob = f > at(4) ? hop(f, i * 4) * 12 : 0;
        return (
          <Card key={ch.id} x={cx - 240} y={230 - bob} w={480} h={640} color={ch.c} style={{ scale: `${p}`, rotate: `${(i - 1) * 3 * p + (1 - p) * 20}deg`, background: `radial-gradient(circle at 50% 30%, ${ch.light} 0 45%, ${C.white} 46%)` }}>
            <div style={{ position: "absolute", left: 240 - 140, top: 40, width: 280, height: 280, borderRadius: 140, overflow: "hidden", border: `8px solid ${C.white}`, boxShadow: `0 0 0 5px ${ch.c}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ch.icon ? <Icon kind={ch.icon} size={150} color={ch.c} /> : <Img src={img(ch.id)} style={{ width: 280, height: 280, objectFit: "cover" }} />}
            </div>
            <div style={{ position: "absolute", right: 24, top: 26, padding: "6px 20px", borderRadius: 999, background: ch.c, color: C.white, fontSize: 32 }}>{ch.tag}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 350, textAlign: "center", fontSize: 62 }}>{ch.name}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 438, textAlign: "center", fontSize: 30, color: C.inkSoft }}>{ch.line}</div>
            <div style={{ position: "absolute", left: 40, right: 40, top: 510, padding: "16px 0", textAlign: "center", borderRadius: 24, background: ch.light, fontSize: 30, scale: `${pop(f, at(4.5 + i))}` }}>{ch.hi}</div>
          </Card>
        );
      })}
      {CARDS.map((ch, i) => (
        <Kao key={ch.id} f={f} at={at(9 + i)} x={400 + i * 560 - 130} y={215} text={ch.kao} color={ch.c} size={36} rot={i % 2 ? -6 : 6} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontFamily: ZH, fontSize: 40, color: C.ink, opacity: lerp(f, at(8), at(8) + 8), translate: `0 ${(1 - lerp(f, at(8), at(8) + 8)) * 20}px` }}>
        住在主页右下角 · 记得聊过的事 · 关系最高到朋友，不会发展成恋人
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 聊天：一个个完整的气泡（截图里的原话）
type Line = { who: "her" | "me"; text: string; beat: number };
const LINES: Line[] = [
  { who: "her", text: "嗯？有事喵？这边还空着，想坐就坐。", beat: 1 },
  { who: "me", text: "你是不是最可爱的喵？", beat: 4 },
  { who: "her", text: "你这问法，我耳朵都要竖起来了。", beat: 8 },
  { who: "her", text: "可爱这种事，谁说了算啊。(=・ω・=)", beat: 9.5 },
];

export const MengChat: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("naitang");
  const w = 1060;
  const typing = f >= at(5) && f < at(8);
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EAF4FB" />
      <Window f={f} {...s} x={620} y={610} w={w} h={Math.round((w * s.imgH) / s.imgW)} tilt={-1.2} />
      <Tape f={f} at={0} x={60} y={50} title="和奶糖聊天" sub="检查通过后，一个个完整的气泡送过来" color={C.blue} />
      <Card x={1220} y={220} w={630} h={680} color={C.blue} style={{ scale: `${pop(f, at(0.5), true)}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", background: C.blueLight }}>
          <Img src={img("neko")} style={{ width: 70, height: 70, borderRadius: 35, border: `4px solid ${C.white}` }} />
          <span style={{ fontSize: 38 }}>奶糖助手</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24 }}>
          {LINES.map((l) => {
            const start = at(l.beat);
            if (f < start) return null;
            const p = pop(f, start);
            const her = l.who === "her";
            return (
              <div key={l.text} style={{ alignSelf: her ? "flex-start" : "flex-end", maxWidth: 470, padding: "16px 24px", borderRadius: her ? "24px 24px 24px 6px" : "24px 24px 6px 24px", background: her ? C.blueLight : C.pink, color: her ? C.ink : C.white, fontSize: 32, lineHeight: 1.35, scale: `${p}`, transformOrigin: her ? "left bottom" : "right bottom" }}>
                {l.text}
              </div>
            );
          })}
          {typing ? (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: 10, padding: "18px 26px", borderRadius: 24, background: C.blueLight }}>
              {[0, 1, 2].map((d) => (
                <div key={d} style={{ width: 16, height: 16, borderRadius: 8, background: C.blue, translate: `0 ${-hop(f, d * 3) * 10}px` }} />
              ))}
            </div>
          ) : null}
        </div>
      </Card>
      <Kao f={f} at={at(12)} x={620} y={1000} text="关掉对话框也不中断：这一轮在后台照样聊完" color={C.lemon} size={30} />
      <Sticker f={f} src={img("emo-shy")} at={at(9)} x={150} y={930} size={210} rot={-8} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 记忆：五层叠起来
const LAYERS = [
  { t: "核心档案", d: "「她眼中的你」，300 字以内", c: C.pink },
  { t: "显式记忆", d: "你说「记住……」的事", c: C.lemon },
  { t: "隐式事实", d: "称呼、喜好、近况，旧的只标失效", c: C.mint },
  { t: "角色自述", d: "她说过的自己，防止前后矛盾", c: C.lilac },
  { t: "前情提要", d: "较早的对话压缩一下", c: C.blue },
];
const STEPS = [
  { t: "聊完提炼", c: C.pink },
  { t: "冲突标失效", c: C.lemon },
  { t: "闲置压缩", c: C.blue },
];

export const MengMemory: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("naitang");
  const w = 860;
  return (
    <AbsoluteFill>
      <Background f={f} tint="#FDF0F4" grid="#F6DCE5" />
      <Tape f={f} at={0} x={60} y={50} title="奶糖记得" sub="对话之后慢慢整理，不占回复的时间" color={C.pink} />
      {LAYERS.map((l, i) => {
        // 从最下面一层开始，一拍落一层
        const order = LAYERS.length - 1 - i;
        const start = at(1 + order);
        const p = pop(f, start);
        const y = 300 + i * 128;
        return (
          <Card key={l.t} x={100} y={y - (1 - p) * 500} w={820} h={108} color={l.c} style={{ opacity: f >= start ? 1 : 0, rotate: `${(i % 2 ? 1.5 : -1.5)}deg` }}>
            <div style={{ position: "absolute", left: 26, top: 26, fontSize: 44, color: l.c, WebkitTextStroke: `1px ${C.ink}22` }}>{l.t}</div>
            <div style={{ position: "absolute", left: 230, top: 36, fontSize: 30, color: C.inkSoft, whiteSpace: "nowrap" }}>{l.d}</div>
          </Card>
        );
      })}
      <Window f={f} {...s} x={1380} y={430} w={w} h={Math.round((w * s.imgH) / s.imgW)} enter={at(6)} from="right" tilt={2} url="萌部落 · 奶糖助手" zoom={1.7} focus={[1190, 480]} />
      {/* 记忆怎么来：聊完提炼、有冲突只标失效、闲置 30 分钟压缩 */}
      <div style={{ position: "absolute", left: 1000, top: 760, width: 800, display: "flex", justifyContent: "space-between" }}>
        {STEPS.map((st, i) => {
          const p = pop(f, at(9 + i * 0.5));
          return (
            <div key={st.t} style={{ width: 240, height: 150, borderRadius: 26, background: C.white, border: `4px solid ${st.c}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: ZH, fontSize: 32, color: C.ink, scale: `${p}`, boxShadow: `0 7px 0 ${st.c}66` }}>
              <Icon kind="heart" size={50} color={st.c} />
              {st.t}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 1000, top: 945, width: 800, textAlign: "center", fontFamily: ZH, fontSize: 36, color: C.ink, opacity: lerp(f, at(11), at(11) + 8) }}>
        不想被记住？标题栏的扫把一键清空
      </div>
      <Sparkle f={f} at={at(6.5)} x={1760} y={250} size={64} color={C.pink} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 气泡语音和桌宠
const VOICE = ["语速", "音高", "音量"];
const STATES = [
  { t: "待机", d: "摆尾、呼吸、眨眼" },
  { t: "说话", d: "切换嘴型" },
  { t: "开心", d: "小跳一下" },
];

export const MengTone: React.FC = () => {
  const f = useCurrentFrame();
  const pos = Math.max(0, Math.min(2, (f - at(8)) / 24));
  const k = Math.floor(pos);
  const hf = k >= 2 ? 0 : Math.min(1, (pos - k) * 1.6);
  const sx = (i: number) => 480 + i * 480;
  const px = sx(k) + (sx(Math.min(2, k + 1)) - sx(k)) * hf;
  const leap = k >= 2;
  const barsOn = f >= at(3);
  return (
    <AbsoluteFill>
      <Background f={f} tint="#F1F7FD" />
      <Tape f={f} at={0} x={60} y={50} title="奶糖会说话" sub="点一下才播放，念的是改写过的口语稿" color={C.lilac} />
      {/* 语音海报 */}
      <div style={{ position: "absolute", left: 90, top: 230, width: 900, height: 280, borderRadius: 26, overflow: "hidden", border: `8px solid ${C.white}`, boxShadow: `0 10px 0 ${C.blueLight}`, scale: `${pop(f, at(0.5))}`, rotate: "-1.5deg" }}>
        <Img src={img("poster-voice")} style={{ width: 884, height: 264, objectFit: "cover" }} />
      </div>
      {/* 带声波和时长的气泡 */}
      <div style={{ position: "absolute", left: 1060, top: 240, display: "flex", alignItems: "center", gap: 18, scale: `${pop(f, at(1))}`, transformOrigin: "left center" }}>
        <Img src={img("neko")} style={{ width: 96, height: 96, borderRadius: 48, border: `5px solid ${C.lilac}`, background: C.white }} />
        <div style={{ padding: "18px 26px", borderRadius: "26px 26px 26px 6px", background: C.white, border: `4px solid ${C.lilac}`, fontFamily: ZH, fontSize: 32, color: C.ink, whiteSpace: "nowrap" }}>你这问法，我耳朵都要竖起来了。</div>
      </div>
      <div style={{ position: "absolute", left: 1174, top: 355, display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 999, background: C.lilac, scale: `${pop(f, at(2)) * (barsOn ? thump(f, 0.06) : 1)}` }}>
        {[0, 1, 2, 3, 4, 5].map((b) => (
          <div key={b} style={{ width: 7, height: barsOn ? 12 + hop(f, b * 2) * 24 : 12, borderRadius: 4, background: C.white }} />
        ))}
        <span style={{ marginLeft: 8, fontFamily: ZH, fontSize: 30, color: C.white }}>4″</span>
      </div>
      {VOICE.map((v, i) => (
        <div key={v} style={{ position: "absolute", left: 1174 + i * 190, top: 440, padding: "8px 30px", borderRadius: 999, background: C.white, border: `4px solid ${C.lilac}`, fontFamily: ZH, fontSize: 32, color: C.ink, scale: `${pop(f, at(4 + i * 0.5))}`, boxShadow: `0 5px 0 ${C.lilac}55` }}>
          {v}
        </div>
      ))}
      {/* 桌宠的三种状态：她沿着线走过去 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: lerp(f, at(7.5), at(8)) }}>
        <line x1={sx(0)} y1={800} x2={sx(2)} y2={800} stroke={C.pinkLight} strokeWidth={20} strokeLinecap="round" />
        <line x1={sx(0)} y1={800} x2={px} y2={800} stroke={C.pink} strokeWidth={20} strokeLinecap="round" />
      </svg>
      {STATES.map((st, i) => {
        const p = pop(f, at(7.5 + i * 0.25));
        return (
          <div key={st.t} style={{ position: "absolute", left: sx(i) - 180, top: 830, width: 360, textAlign: "center", fontFamily: ZH, scale: `${p}` }}>
            <div style={{ fontSize: 44, color: i <= k ? C.pink : C.inkSoft }}>{st.t}</div>
            <div style={{ fontSize: 28, color: C.inkSoft }}>{st.d}</div>
          </div>
        );
      })}
      {f >= at(8) ? <Img src={img(leap ? "pet-leap" : "pet-smile")} style={{ position: "absolute", left: px - 90, top: 545 - Math.sin(Math.PI * hf) * 60 - (leap ? hop(f) * 30 : 0), width: 180, height: 245 }} /> : null}
      <Kao f={f} at={at(13)} x={1700} y={690} text="关掉对话框，她还在动嘴" color={C.pink} size={30} />
      <Sticker f={f} src={img("emo-love")} at={at(12)} x={1790} y={540} size={170} rot={8} />
    </AbsoluteFill>
  );
};
