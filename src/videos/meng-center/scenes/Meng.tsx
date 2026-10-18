// 副歌：萌萌——三个 AI 角色、聊天、记忆、语气档位与关系阶段
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Background, C, Card, Icon, Kao, Sparkle, Sticker, Tape, Window, ZH, at, hop, lerp, pop, thump } from "../kit";
import { img, shot } from "../shots";

const CHARS = [
  { id: "rin", name: "白濑凛", tag: "傲娇", line: "嘴硬心软，关心藏不住", hi: "来啦。今天过得怎么样？", c: C.blue, light: C.blueLight, kao: "(￣^￣)" },
  { id: "aoi", name: "日向小葵", tag: "元气", line: "直球热情，什么都想分享", hi: "你来得正好，聊会儿？", c: C.lemon, light: C.lemonLight, kao: "ヽ(＾▽＾)ノ" },
  { id: "neko", name: "奶糖", tag: "猫娘", line: "随性撒娇，会突然黏过来", hi: "刚睡醒……你在做什么？", c: C.pink, light: C.pinkLight, kao: "(=^･ω･^=)" },
];

// ---------------------------------------------------------------- 三个角色
export const MengCast: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background f={f} tint="#F3F1FC" grid="#E3DDF7" check />
      <Tape f={f} at={0} x={960} y={40} title="萌萌的小屋" color={C.pink} rot={-2} size={78} align="center" />
      {CHARS.map((ch, i) => {
        const p = pop(f, at(1 + i));
        const cx = 400 + i * 560;
        const bob = f > at(4) ? hop(f, i * 4) * 12 : 0;
        return (
          <Card key={ch.id} x={cx - 240} y={230 - bob} w={480} h={640} color={ch.c} style={{ scale: `${p}`, rotate: `${(i - 1) * 3 * p + (1 - p) * 20}deg`, background: `radial-gradient(circle at 50% 30%, ${ch.light} 0 45%, ${C.white} 46%)` }}>
            <div style={{ position: "absolute", left: 240 - 140, top: 40, width: 280, height: 280, borderRadius: 140, overflow: "hidden", border: `8px solid ${C.white}`, boxShadow: `0 0 0 5px ${ch.c}` }}>
              <Img src={img(ch.id)} style={{ width: 280, height: 280, objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", right: 24, top: 26, padding: "6px 20px", borderRadius: 999, background: ch.c, color: C.white, fontSize: 32 }}>{ch.tag}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 350, textAlign: "center", fontSize: 62 }}>{ch.name}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 438, textAlign: "center", fontSize: 30, color: C.inkSoft }}>{ch.line}</div>
            <div style={{ position: "absolute", left: 40, right: 40, top: 510, padding: "16px 0", textAlign: "center", borderRadius: 24, background: ch.light, fontSize: 30, scale: `${pop(f, at(4.5 + i))}` }}>{ch.hi}</div>
          </Card>
        );
      })}
      {CHARS.map((ch, i) => (
        <Kao key={ch.id} f={f} at={at(9 + i)} x={400 + i * 560 - 130} y={215} text={ch.kao} color={ch.c} size={36} rot={i % 2 ? -6 : 6} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontFamily: ZH, fontSize: 40, color: C.ink, opacity: lerp(f, at(8), at(8) + 8), translate: `0 ${(1 - lerp(f, at(8), at(8) + 8)) * 20}px` }}>
        三个 AI 角色 · 各记各的事 · 关系最高到好友，不会发展成恋人
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 聊天：一个个完整的气泡
type Line = { who: "her" | "me"; text: string; beat: number };
const LINES: Line[] = [
  { who: "her", text: "喂，站在那儿做什么？有话就说，我又没赶你走。", beat: 1 },
  { who: "me", text: "今天去看雪了，好冷！", beat: 4 },
  { who: "her", text: "……哼，谁问你冷不冷了。", beat: 8 },
  { who: "her", text: "下次多穿一点。", beat: 9.5 },
];

export const MengChat: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("meng-chat");
  const w = 1060;
  const typing = f >= at(5) && f < at(8);
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EAF4FB" />
      <Window f={f} {...s} x={620} y={610} w={w} h={Math.round((w * s.imgH) / s.imgW)} tilt={-1.2} />
      <Tape f={f} at={0} x={60} y={50} title="和萌萌聊天" sub="检查通过后，一个个完整的气泡送过来" color={C.blue} />
      <Card x={1220} y={220} w={630} h={680} color={C.blue} style={{ scale: `${pop(f, at(0.5), true)}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", background: C.blueLight }}>
          <Img src={img("rin")} style={{ width: 70, height: 70, borderRadius: 35, border: `4px solid ${C.white}` }} />
          <span style={{ fontSize: 38 }}>白濑凛</span>
          <span style={{ padding: "2px 14px", borderRadius: 999, background: C.white, fontSize: 24, color: C.blueDeep }}>初识</span>
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
        <div style={{ position: "absolute", right: 22, bottom: 14, fontSize: 22, color: C.inkSoft }}>第一句取自截图，其余为示意</div>
      </Card>
      <Kao f={f} at={at(12)} x={620} y={1000} text="刷新、断线也不中断：这一轮在服务端照样聊完" color={C.lemon} size={30} />
      <Sticker f={f} src={img("emo-shy")} at={at(9)} x={150} y={930} size={210} rot={-8} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 记忆：五层叠起来
const LAYERS = [
  { t: "核心档案", d: "300 字以内，每轮都带上", c: C.pink },
  { t: "事实", d: "称呼、喜好、约定，旧的只标失效", c: C.lemon },
  { t: "回忆卡", d: "一段聊天的小结", c: C.mint },
  { t: "会话摘要", d: "较早的部分压缩一下", c: C.lilac },
  { t: "最近对话", d: "按 token 预算取", c: C.blue },
];

export const MengMemory: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("memory");
  const w = 860;
  return (
    <AbsoluteFill>
      <Background f={f} tint="#FDF0F4" grid="#F6DCE5" />
      <Tape f={f} at={0} x={60} y={50} title="萌萌记得" sub="对话之后慢慢整理，不占回复的时间" color={C.pink} />
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
      <Window f={f} {...s} x={1380} y={430} w={w} h={Math.round((w * s.imgH) / s.imgW)} enter={at(6)} from="right" tilt={2} url="萌萌 · 奶糖记得的事" />
      {/* 各记各的：三个角色、三个小盒子 */}
      <div style={{ position: "absolute", left: 1000, top: 760, width: 800, display: "flex", justifyContent: "space-between" }}>
        {CHARS.map((ch, i) => {
          const p = pop(f, at(9 + i * 0.5));
          return (
            <div key={ch.id} style={{ width: 240, height: 150, borderRadius: 26, background: C.white, border: `4px solid ${ch.c}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, scale: `${p}`, boxShadow: `0 7px 0 ${ch.c}66` }}>
              <Img src={img(ch.id)} style={{ width: 96, height: 96, borderRadius: 48 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: ZH, fontSize: 28, color: C.ink }}>
                <Icon kind="heart" size={44} color={ch.c} />
                {ch.name.length > 2 ? ch.name.slice(-2) : ch.name}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 1000, top: 945, width: 800, textAlign: "center", fontFamily: ZH, fontSize: 36, color: C.ink, opacity: lerp(f, at(11), at(11) + 8) }}>
        跟凛说过的事，小葵不知道
      </div>
      <Sparkle f={f} at={at(6.5)} x={1760} y={250} size={64} color={C.pink} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 语气档位和关系阶段
const TIERS = [
  { id: "rin", opts: ["收着点", "标准傲娇", "傲娇全开"], c: C.blue },
  { id: "aoi", opts: ["安静元气", "标准元气", "超级元气"], c: C.lemon },
  { id: "neko", opts: ["正常", "撒娇", "撒娇卖萌"], c: C.pink },
];
const RIN_KAO = ["(・へ・)", "(￣^￣)", "(≧ヘ≦)"];
const STAGES = ["初识", "熟悉", "朋友", "亲近", "羁绊"];

export const MengTone: React.FC = () => {
  const f = useCurrentFrame();
  const pick = f >= at(5) ? 2 : f >= at(3) ? 1 : 0;
  const heart = Math.max(0, Math.min(4, (f - at(8)) / 12));
  const hk = Math.floor(heart);
  const hf = hk >= 4 ? 0 : Math.min(1, (heart - hk) * 1.6);
  const sx = (i: number) => 330 + i * 315;
  const hx = sx(hk) + (sx(Math.min(4, hk + 1)) - sx(hk)) * hf;
  return (
    <AbsoluteFill>
      <Background f={f} tint="#F1F7FD" />
      <Tape f={f} at={0} x={60} y={50} title="三档语气 · 五个阶段" sub="档位管语气浓度，阶段管亲密程度" color={C.lilac} />
      {TIERS.map((row, r) => {
        const p = pop(f, r === 0 ? at(0.5) : at(5.5 + r * 0.5));
        const sel = r === 0 ? pick : 1;
        return (
          <div key={row.id} style={{ position: "absolute", left: 300, top: 250 + r * 125, display: "flex", alignItems: "center", gap: 22, scale: `${p}`, transformOrigin: "left center" }}>
            <Img src={img(row.id)} style={{ width: r === 0 ? 104 : 86, height: r === 0 ? 104 : 86, borderRadius: 52, border: `5px solid ${row.c}`, background: C.white }} />
            {row.opts.map((o, i) => (
              <div key={o} style={{ padding: "12px 30px", borderRadius: 999, fontFamily: ZH, fontSize: r === 0 ? 40 : 34, color: i === sel ? C.white : C.ink, background: i === sel ? row.c : C.white, border: `4px solid ${row.c}`, boxShadow: i === sel ? `0 6px 0 ${C.ink}22` : "none", scale: `${r === 0 && i === sel ? thump(f, 0.08) : 1}` }}>
                {o}
              </div>
            ))}
          </div>
        );
      })}
      {/* 凛的语气浓度 */}
      <div style={{ position: "absolute", left: 1400, top: 250, width: 400, scale: `${pop(f, at(1))}` }}>
        <div style={{ fontFamily: ZH, fontSize: 34, color: C.ink }}>傲娇浓度</div>
        <div style={{ marginTop: 12, height: 40, borderRadius: 20, background: C.white, border: `4px solid ${C.blue}`, overflow: "hidden" }}>
          <div style={{ width: `${[34, 67, 100][pick] * lerp(f, at([1, 3, 5][pick]), at([1, 3, 5][pick]) + 8, 0.7, 1)}%`, height: "100%", background: `repeating-linear-gradient(45deg, ${C.blue} 0 14px, ${C.blueDeep}66 14px 28px)` }} />
        </div>
      </div>
      <Kao key={pick} f={f} at={at([1, 3, 5][pick])} x={1600} y={420} text={RIN_KAO[pick]} color={C.blue} size={56} rot={-5} />
      {/* 关系阶段：小心心一拍走一格 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: lerp(f, at(7.5), at(8)) }}>
        <line x1={sx(0)} y1={800} x2={sx(4)} y2={800} stroke={C.pinkLight} strokeWidth={20} strokeLinecap="round" />
        <line x1={sx(0)} y1={800} x2={hx} y2={800} stroke={C.pink} strokeWidth={20} strokeLinecap="round" />
      </svg>
      {STAGES.map((st, i) => {
        const p = pop(f, at(7.5 + i * 0.25));
        return (
          <div key={st} style={{ position: "absolute", left: sx(i) - 80, top: 840, width: 160, textAlign: "center", fontFamily: ZH, fontSize: 40, color: i <= hk ? C.pink : C.inkSoft, scale: `${p}` }}>
            {st}
          </div>
        );
      })}
      {f >= at(8) ? (
        <div style={{ position: "absolute", left: hx - 45, top: 755 - Math.sin(Math.PI * hf) * 70, scale: `${thump(f, 0.15)}` }}>
          <Icon kind="heart" size={90} color={C.pink} />
        </div>
      ) : null}
      <Kao f={f} at={at(13)} x={1700} y={690} text="只升不降阶 (*´▽`*)" color={C.pink} size={34} />
      <Sticker f={f} src={img("emo-love")} at={at(12)} x={1790} y={540} size={170} rot={8} />
    </AbsoluteFill>
  );
};
