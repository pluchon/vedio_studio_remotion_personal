// B 段的快切，一幕两小节：创作中心、成长、消息、个人中心
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Background, C, Card, Icon, Kao, Sparkle, Sticker, Tape, TEXT, Window, ZH, at, lerp, pop, thump } from "../kit";
import { img, shot } from "../shots";

// ---------------------------------------------------------------- 创作中心
const STATS = [
  { t: "帖子", v: 25, c: C.blue },
  { t: "浏览", v: 10607, c: C.mint },
  { t: "喜欢", v: 47, c: C.pink },
  { t: "评论", v: 37, c: C.lilac },
  { t: "收藏", v: 48, c: C.lemon },
];

export const Creator: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("creator");
  const w = 1040;
  const draw = lerp(f, at(4), at(7.5), 0, 1);
  return (
    <AbsoluteFill>
      <Background f={f} tint="#F4F0FC" grid="#E4DCF7" />
      <Window f={f} {...s} x={640} y={610} w={w} h={Math.round((w * s.imgH) / s.imgW)} tilt={-1.2} />
      <Tape f={f} at={0} x={70} y={50} title="创作中心" sub="看见创作的回响" color={C.lilac} />
      {STATS.map((st, i) => {
        const start = at(0.5 + i * 0.5);
        const p = pop(f, start);
        const n = Math.round(st.v * lerp(f, start, start + 14, 0, 1));
        return (
          <Card key={st.t} x={1230 + (i % 2) * 320} y={170 + Math.floor(i / 2) * 150} w={290} h={120} color={st.c} style={{ scale: `${p * thump(f, 0.03, i * 3)}` }}>
            <div style={{ position: "absolute", left: 22, top: 36, fontSize: 36 }}>{st.t}</div>
            <div style={{ position: "absolute", right: 22, top: 26, fontFamily: TEXT, fontWeight: 600, fontSize: 48, color: st.c }}>{n.toLocaleString("en-US")}</div>
          </Card>
        );
      })}
      {/* 趋势：一条线画出来 */}
      <svg width={620} height={220} style={{ position: "absolute", left: 1230, top: 640 }}>
        <rect x={0} y={0} width={610} height={210} rx={26} fill={C.white} stroke={C.mint} strokeWidth={4} opacity={lerp(f, at(3.5), at(4))} />
        <path d="M 30 170 L 120 150 L 210 120 L 300 50 L 390 170 L 480 160 L 580 140" fill="none" stroke={C.mint} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
      <Sparkle f={f} at={at(6)} x={1530} y={680} size={56} />
      <Sticker f={f} src={img("emo-awesome")} at={at(5)} x={1760} y={930} size={210} rot={6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 成长：等级之路
const LEVELS = ["小水滴", "小溪", "池塘", "小河", "湖泊", "大河", "海湾", "大海", "云海", "星海"];
const XP = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000];
const LCOL = [C.blue, C.mint, C.lemon, C.pink, C.lilac, C.blue, C.mint, C.lemon, C.pink, C.lilac];
const nodeX = (i: number) => 160 + i * 178;
const nodeY = (i: number) => 560 + Math.sin(i * 1.1) * 70;

export const Growth: React.FC = () => {
  const f = useCurrentFrame();
  // 小人一拍跳一格：第 0 拍在 Lv.1，第 5 拍落到 Lv.6
  const beat = Math.max(0, (f - at(0.5)) / 12);
  const k = Math.min(5, Math.floor(beat));
  const frac = k >= 5 ? 0 : Math.min(1, (beat - k) * 1.6);
  const x = nodeX(k) + (nodeX(k + 1) - nodeX(k)) * frac;
  const y = nodeY(k) + (nodeY(k + 1) - nodeY(k)) * frac - Math.sin(Math.PI * frac) * 110;
  const lvUp = pop(f, at(6));
  const xp = lerp(f, at(0.5), at(6), 0, 870);
  const path = LEVELS.map((_, i) => `${i ? "L" : "M"} ${nodeX(i)} ${nodeY(i)}`).join(" ");
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EEF9F3" grid="#D5EFE2" />
      <Tape f={f} at={0} x={70} y={50} title="成长" sub="签到、发帖、评论都加经验，经验定等级" color={C.mint} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d={path} fill="none" stroke={C.white} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke={C.blueLight} strokeWidth={12} strokeLinecap="round" strokeDasharray="2 22" />
      </svg>
      {LEVELS.map((name, i) => {
        const p = pop(f, Math.round(i * 2.2));
        const reached = i <= k;
        return (
          <div key={name} style={{ position: "absolute", left: nodeX(i) - 60, top: nodeY(i) - 46, width: 120, textAlign: "center", scale: `${p}` }}>
            <div style={{ margin: "0 auto", width: 92, height: 92, borderRadius: 46, background: reached ? LCOL[i] : C.white, border: `5px solid ${LCOL[i]}`, color: reached ? C.white : LCOL[i], fontFamily: TEXT, fontWeight: 600, fontSize: 42, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 0 ${LCOL[i]}66` }}>
              {i + 1}
            </div>
            <div style={{ marginTop: 10, fontFamily: ZH, fontSize: 32, color: C.ink }}>{name}</div>
            <div style={{ fontFamily: TEXT, fontSize: 24, color: C.inkSoft }}>{XP[i]}</div>
          </div>
        );
      })}
      <Img src={img("emo-cheer")} style={{ position: "absolute", left: x - 85, top: y - 200, width: 170, height: 170, rotate: `${Math.sin(f / 4) * 8}deg` }} />
      {lvUp > 0 ? (
        <div style={{ position: "absolute", left: nodeX(5) - 260, top: nodeY(5) - 370, width: 520, textAlign: "center", whiteSpace: "nowrap", fontFamily: ZH, fontSize: 70, color: C.white, WebkitTextStroke: `10px ${C.blueDeep}`, paintOrder: "stroke fill", scale: `${lvUp}`, rotate: "-6deg" }}>
          Lv.6 大河！
        </div>
      ) : null}
      {[6, 6.5, 7].map((b, i) => (
        <Sparkle key={b} f={f} at={at(b)} x={nodeX(5) + [-160, 170, 0][i]} y={nodeY(5) - [300, 280, 390][i]} size={64} color={[C.lemon, C.pink, C.mint][i]} />
      ))}
      {/* 经验条 */}
      <div style={{ position: "absolute", left: 360, top: 860, width: 1200, height: 46, borderRadius: 23, background: C.white, border: `4px solid ${C.mint}`, overflow: "hidden" }}>
        <div style={{ width: `${(xp / 1200) * 100}%`, height: "100%", background: `repeating-linear-gradient(45deg, ${C.mint} 0 16px, #7BC8A6 16px 32px)` }} />
      </div>
      <div style={{ position: "absolute", left: 360, top: 920, width: 1200, display: "flex", justifyContent: "space-between", fontFamily: TEXT, fontSize: 32, color: C.ink }}>
        <span>Lv.{k + 1}</span>
        <span>{Math.round(xp)} / 1200</span>
      </div>
      <Kao f={f} at={at(2)} x={1650} y={230} text="ヽ(＾▽＾)ノ" color={C.mint} size={40} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 消息
export const Messages: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("messages");
  const w = 1140;
  const unread = f >= at(5) ? 3 : f >= at(4) ? 2 : f >= at(3) ? 1 : 0;
  const bubble = (start: number): React.CSSProperties => ({ scale: `${pop(f, start)}`, opacity: f >= start ? 1 : 0 });
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EAF4FB" />
      <Window f={f} {...s} x={1220} y={610} w={w} h={Math.round((w * s.imgH) / s.imgW)} from="right" tilt={1.2} />
      <Tape f={f} at={0} x={60} y={50} title="消息" sub="私信 · 表情 · 已读 · 撤回 · 在线" color={C.blue} />
      <div style={{ position: "absolute", left: 90, top: 300, width: 520, display: "flex", flexDirection: "column", gap: 22, fontFamily: ZH, fontSize: 34, color: C.ink }}>
        <div style={{ alignSelf: "flex-start", padding: "16px 26px", borderRadius: "26px 26px 26px 6px", background: C.white, border: `3px solid ${C.blueLight}`, transformOrigin: "left bottom", ...bubble(at(1)) }}>今天的云像棉花糖一样～</div>
        <div style={{ alignSelf: "flex-end", display: "flex", alignItems: "flex-end", gap: 8, transformOrigin: "right bottom", ...bubble(at(2)) }}>
          <span style={{ fontSize: 22, color: C.inkSoft }}>已读</span>
          <Img src={img("emo-love")} style={{ width: 150, height: 150, borderRadius: 24, background: C.white, border: `3px solid ${C.pinkLight}` }} />
        </div>
        <div style={{ alignSelf: "center", padding: "6px 20px", borderRadius: 999, background: `${C.inkSoft}22`, fontSize: 24, color: C.inkSoft, ...bubble(at(4)) }}>你撤回了一条消息</div>
        <div style={{ alignSelf: "flex-end", padding: "16px 26px", borderRadius: "26px 26px 6px 26px", background: C.blue, color: C.white, transformOrigin: "right bottom", ...bubble(at(5.5)) }}>拍到啦，发你看！</div>
      </div>
      {/* 铃铛和未读数：一条 WebSocket 推过来 */}
      <div style={{ position: "absolute", left: 100, top: 840, scale: `${pop(f, at(0.5)) * (unread ? thump(f, 0.12) : 1)}`, rotate: `${unread ? Math.sin(f / 2) * 8 : 0}deg` }}>
        <Icon kind="bell" size={96} color={C.lemon} />
        {unread ? <div style={{ position: "absolute", right: -8, top: -6, width: 44, height: 44, borderRadius: 22, background: C.pink, color: C.white, fontFamily: TEXT, fontWeight: 600, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${C.white}` }}>{unread}</div> : null}
      </div>
      <Kao f={f} at={at(3)} x={470} y={890} text="未读数走 WebSocket，实时跳" color={C.lemon} size={30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 个人中心
const ME = [
  { t: "收藏夹", c: C.lemon },
  { t: "关注和粉丝", c: C.pink },
  { t: "登录设备，一键下线", c: C.blue },
  { t: "昵称头像过 AI 审核", c: C.mint },
];

export const Profile: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("profile");
  const w = 1200;
  const zoom = 1 + 0.25 * lerp(f, at(2), at(6), 0, 1);
  return (
    <AbsoluteFill>
      <Background f={f} tint="#FFF6EE" grid="#F5E3CF" />
      <Window f={f} {...s} x={760} y={610} w={w} h={Math.round((w * s.imgH) / s.imgW)} zoom={zoom} focus={[700, 600]} tilt={-1} from="left" />
      <Tape f={f} at={0} x={60} y={50} title="个人中心" sub="收藏自己的小世界" color={C.lemon} />
      {ME.map((m, i) => (
        <div key={m.t} style={{ position: "absolute", left: 1420, top: 290 + i * 130, padding: "14px 30px", borderRadius: 22, background: C.white, border: `4px solid ${m.c}`, boxShadow: `0 7px 0 ${m.c}66`, fontFamily: ZH, fontSize: 38, color: C.ink, scale: `${pop(f, at(1 + i))}`, rotate: `${i % 2 ? 2 : -2}deg`, whiteSpace: "nowrap" }}>
          {m.t}
        </div>
      ))}
      {/* 铃鼓滚奏：贴纸从天上掉下来，接进萌萌 */}
      {["emo-hooray", "emo-love", "emo-headpat", "emo-cheer", "emo-popsicle"].map((n, i) => {
        const start = at(6 + i * 0.4);
        if (f < start) return null;
        const t = (f - start) / 30;
        return <Img key={n} src={img(n)} style={{ position: "absolute", left: 200 + i * 360, top: -220 + t * t * 900, width: 200, height: 200, rotate: `${(i % 2 ? 1 : -1) * t * 120}deg` }} />;
      })}
    </AbsoluteFill>
  );
};
