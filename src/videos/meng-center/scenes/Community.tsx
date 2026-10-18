// 社区这一半：注册与审核、主页、发帖、帖子详情、语义搜索
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background, C, Card, Icon, Kao, Ring, Snowflake, Sparkle, Sticker, Tape, TEXT, Window, ZH, at, hop, lerp, pop, thump } from "../kit";
import { img, shot } from "../shots";

// 截图在窗口里的缩放：窗口宽 ÷ 截图宽 × 放大倍数
const scaleOf = (w: number, imgW: number, zoom = 1) => (w / imgW) * zoom;

// ---------------------------------------------------------------- 注册与审核
const STEPS = ["滑块验证", "邮箱 / 手机验证码", "等待审核", "管理员通过"];

export const Account: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("login");
  const slide = lerp(f, at(2), at(4), 0, 1);
  const stamp = pop(f, at(13));
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EAF4FB" />
      <Window f={f} {...s} x={680} y={590} w={1040} h={Math.round((1040 * s.imgH) / s.imgW)} tilt={-1.5} />
      <Tape f={f} at={2} x={90} y={56} title="先审核，再入住" sub="滑块 + 验证码注册 · 管理员通过后才能登录" color={C.blue} />
      {STEPS.map((label, i) => {
        const p = pop(f, at(1 + i * 3.5));
        const color = [C.blue, C.mint, C.lemon, C.pink][i];
        return (
          <Card key={label} x={1290} y={250 + i * 190} w={540} h={150} color={color} style={{ scale: `${p}`, rotate: `${(i % 2 ? 2 : -2) * p}deg`, opacity: p > 0 ? 1 : 0 }}>
            <div style={{ position: "absolute", left: 22, top: 18, width: 46, height: 46, borderRadius: 23, background: color, color: C.white, fontFamily: TEXT, fontSize: 30, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
            <div style={{ position: "absolute", left: 86, top: 18, fontSize: 38 }}>{label}</div>
            {i === 0 ? (
              // 滑块：小方块拖到缺口里
              <div style={{ position: "absolute", left: 86, top: 80, width: 360, height: 44, borderRadius: 22, background: C.blueLight }}>
                <div style={{ position: "absolute", left: 300, top: 4, width: 36, height: 36, borderRadius: 8, border: `3px dashed ${C.blueDeep}` }} />
                <div style={{ position: "absolute", left: 4 + slide * 296, top: 2, width: 40, height: 40, borderRadius: 10, background: C.blue, boxShadow: `0 3px 0 ${C.blueDeep}` }} />
                {f > at(4) ? <div style={{ position: "absolute", right: -62, top: -4, scale: `${pop(f, at(4))}` }}><Icon kind="check" size={52} color={C.mint} /></div> : null}
              </div>
            ) : i === 1 ? (
              <div style={{ position: "absolute", left: 86, top: 76, display: "flex", gap: 14 }}>
                {"5201".split("").map((d, j) => (
                  <div key={j} style={{ width: 52, height: 56, borderRadius: 12, border: `3px solid ${C.mint}`, fontFamily: TEXT, fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center", scale: `${pop(f, at(5 + j * 0.5))}` }}>{d}</div>
                ))}
              </div>
            ) : i === 2 ? (
              <div style={{ position: "absolute", left: 86, top: 80, display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: C.inkSoft }}>
                <Snowflake size={44} color={C.lemon} style={{ rotate: `${f * 6}deg` }} />
                账号是「待审核」
              </div>
            ) : (
              <div style={{ position: "absolute", left: 86, top: 80, fontSize: 30, color: C.inkSoft }}>被拒也能看到原因，重新申请</div>
            )}
          </Card>
        );
      })}
      {/* 盖章：通过 */}
      {stamp > 0 ? (
        <div style={{ position: "absolute", left: 1080, top: 840, width: 190, height: 190, borderRadius: 95, border: `8px solid ${C.pink}`, color: C.pink, fontFamily: ZH, fontSize: 64, display: "flex", alignItems: "center", justifyContent: "center", rotate: "-14deg", scale: `${2.2 - 1.2 * stamp}`, opacity: Math.min(1, stamp * 2), background: `${C.white}dd` }}>
          通过
        </div>
      ) : null}
      <Sticker f={f} src={img("emo-shy")} at={at(6)} x={150} y={930} size={220} rot={-6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 主页
const CATS = [
  { t: "追番", c: C.pink },
  { t: "创作", c: C.blue },
  { t: "技术", c: C.mint },
  { t: "日常", c: C.lemon },
];

export const Home: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("home");
  const w = 1300;
  const h = Math.round((w * s.imgH) / s.imgW);
  const zoom = 1 + 0.22 * lerp(f, at(8), at(9.5), 0, 1);
  const focusY = 450 + (640 - 450) * lerp(f, at(8), at(9.5), 0, 1);
  const k = scaleOf(w, s.imgW, zoom);
  const tabs = [1348, 1409, 1469];
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EFF8FC" />
      <Window f={f} {...s} x={1000} y={600} w={w} h={h} zoom={zoom} focus={[1000, focusY]}>
        {tabs.map((x, i) => {
          const start = at(11 + i);
          return f >= start && f < start + 12 ? <Ring key={x} f={f} at={start} x={x} y={671} w={78} h={52} scale={k} color={[C.lilac, C.blue, C.pink][i]} /> : null;
        })}
      </Window>
      <Tape f={f} at={2} x={70} y={50} title="逛一逛主页" sub="分类浏览 · 推荐 / 最新 / 热门" color={C.pink} rot={-3} />
      {CATS.map((c, i) => {
        const p = pop(f, at(4 + i));
        return (
          <div key={c.t} style={{ position: "absolute", left: 120, top: 330 + i * 150, padding: "14px 34px", borderRadius: 22, background: c.c, color: C.white, fontFamily: ZH, fontSize: 48, scale: `${p}`, rotate: `${(i % 2 ? 5 : -5) * p}deg`, translate: `0 ${-hop(f, i * 3) * 8}px`, boxShadow: `0 8px 0 ${C.ink}22`, textShadow: `0 3px 0 ${C.ink}33` }}>
            {c.t}
          </div>
        );
      })}
      {[11, 12, 13].map((b, i) => (
        <Kao key={b} f={f} at={at(b)} x={1520 + i * 90} y={190 - i * 30} text={["推荐！", "最新！", "热门！"][i]} color={[C.lilac, C.blue, C.pink][i]} size={34} rot={(i - 1) * 6} />
      ))}
      <Sticker f={f} src={img("emo-wow")} at={at(2)} x={1790} y={900} size={230} rot={8} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 发帖
export const Create: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("editor");
  const w = 1260;
  const h = Math.round((w * s.imgH) / s.imgW);
  const k = scaleOf(w, s.imgW);
  const rings: [number, number, number][] = [
    [346, 241, 150],
    [1408, 424, 165],
    [1413, 629, 150],
  ];
  return (
    <AbsoluteFill>
      <Background f={f} tint="#FFF8EE" grid="#F6E7CC" />
      <Window f={f} {...s} x={1080} y={590} w={w} h={h} from="right" tilt={1}>
        {rings.map(([x, y, rw], i) => (
          <Ring key={x} f={f} at={at(1 + i * 2)} x={x} y={y} w={rw} h={50} scale={k} color={C.pink} />
        ))}
      </Window>
      {rings.map(([x, y], i) => (
        <Sparkle key={i} f={f} at={at(1.5 + i * 2)} x={1080 - w / 2 + x * k + 70} y={590 - (h + 44) / 2 + 44 + y * k - 30} size={60} />
      ))}
      <Tape f={f} at={0} x={60} y={50} title="写一篇帖子" sub="Markdown · 最多十张配图 · 草稿" color={C.lemon} rot={-2} />
      <Kao f={f} at={at(2)} x={250} y={420} text="AI 帮你找灵感" color={C.pink} size={34} rot={-4} />
      <Kao f={f} at={at(4)} x={250} y={520} text="AI 画封面" color={C.pink} size={34} rot={3} />
      <Kao f={f} at={at(6)} x={250} y={620} text="AI 挑标签" color={C.pink} size={34} rot={-3} />
      <Sticker f={f} src={img("emo-work")} at={at(0.5)} x={230} y={860} size={300} rot={-6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 帖子详情
const REACT = [
  { kind: "heart" as const, label: "喜欢", color: C.pink },
  { kind: "star" as const, label: "收藏", color: C.lemon },
  { kind: "bubble" as const, label: "评论", color: C.blue },
];
const COMMENTS = ["好可爱的云！", "@云朵收藏家 下次一起拍~", "收藏啦 (｡･ω･｡)"];

export const Detail: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("detail");
  const w = 1160;
  return (
    <AbsoluteFill>
      <Background f={f} tint="#EEF9F4" grid="#D3EEE1" />
      <Window f={f} {...s} x={760} y={600} w={w} h={Math.round((w * s.imgH) / s.imgW)} tilt={-1} from="left" />
      <Tape f={f} at={0} x={1240} y={60} title="每次分享，都有回应" sub="评论 · 回复 · @ · 喜欢 · 收藏夹" color={C.mint} rot={2} />
      {REACT.map((r, i) => {
        const p = pop(f, at(1 + i));
        const count = 12 + i * 7 + Math.max(0, Math.floor((f - at(4)) / 12) + 1) * (f >= at(4) ? 1 : 0);
        return (
          <div key={r.label} style={{ position: "absolute", left: 1420, top: 300 + i * 120, display: "flex", alignItems: "center", gap: 14, padding: "10px 30px 10px 18px", borderRadius: 999, background: C.white, border: `4px solid ${r.color}`, boxShadow: `0 7px 0 ${r.color}66`, fontFamily: ZH, fontSize: 40, color: C.ink, scale: `${p * thump(f, 0.06, i * 4)}` }}>
            <Icon kind={r.kind} size={54} color={r.color} />
            {r.label}
            <span style={{ fontFamily: TEXT, fontWeight: 600, color: r.color }}>{count}</span>
          </div>
        );
      })}
      {COMMENTS.map((c, i) => {
        const start = at(4 + i * 1.5);
        const p = pop(f, start);
        return (
          <div key={c} style={{ position: "absolute", left: 1380 + (i % 2) * 60, top: 680 + i * 105, padding: "14px 26px", borderRadius: "26px 26px 26px 6px", background: [C.blueLight, C.pinkLight, C.lemonLight][i], fontFamily: ZH, fontSize: 34, color: C.ink, scale: `${p}`, transformOrigin: "left bottom", boxShadow: `0 5px 0 ${C.ink}14` }}>
            {c}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 1720, top: 1020, fontFamily: ZH, fontSize: 22, color: C.inkSoft, opacity: lerp(f, at(5), at(6)) }}>评论为示意</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 语义搜索
const NODES = [
  { t: "搜索词", sub: "「蓝色」", c: C.blue },
  { t: "向量召回", sub: "最多 20 篇候选", c: C.lilac },
  { t: "AI 把关", sub: "哪些真的相关", c: C.pink },
  { t: "排好返回", sub: "按相关度", c: C.mint },
];

export const Search: React.FC = () => {
  const f = useCurrentFrame();
  const s = shot("search");
  const typed = (f >= at(1) ? "蓝" : "") + (f >= at(2) ? "色" : "");
  const flow = 1 - lerp(f, at(12) - 3, at(12) + 6, 0, 1);
  const xs = [270, 720, 1180, 1640];
  // 小球沿着箭头一拍走半格
  const ballT = Math.max(0, Math.min(6, (f - at(8)) / 6));
  const seg = Math.min(2, Math.floor(ballT / 2));
  const ballX = xs[seg] + (xs[seg + 1] - xs[seg]) * Math.min(1, (ballT - seg * 2) / 2);
  return (
    <AbsoluteFill>
      <Background f={f} tint="#F2F0FC" grid="#E1DBF6" />
      <div style={{ opacity: flow }}>
        {/* 搜索框 */}
        <div style={{ position: "absolute", left: 960 - 520, top: 200, width: 1040, height: 120, borderRadius: 60, background: C.white, border: `5px solid ${C.lilac}`, boxShadow: `0 10px 0 ${C.lilac}66`, display: "flex", alignItems: "center", gap: 24, padding: "0 40px", scale: `${pop(f, 0)}` }}>
          <div style={{ scale: `${thump(f, 0.15)}` }}>
            <Icon kind="search" size={70} color={C.lilac} />
          </div>
          <span style={{ fontFamily: ZH, fontSize: 64, color: C.ink }}>{typed}</span>
          <span style={{ width: 4, height: 64, background: C.ink, opacity: Math.floor(f / 8) % 2 }} />
        </div>
        {NODES.map((n, i) => {
          const p = pop(f, at(4 + i));
          return (
            <React.Fragment key={n.t}>
              {i < 3 ? <div style={{ position: "absolute", left: xs[i] + 150, top: 588, width: (xs[i + 1] - xs[i] - 300) * lerp(f, at(5 + i), at(5 + i) + 8), height: 8, borderRadius: 4, background: C.inkSoft + "66" }} /> : null}
              <Card x={xs[i] - 150} y={500} w={300} h={180} color={n.c} style={{ scale: `${p}`, textAlign: "center" }}>
                <div style={{ marginTop: 34, fontSize: 48 }}>{n.t}</div>
                <div style={{ marginTop: 6, fontSize: 28, color: C.inkSoft }}>{n.sub}</div>
              </Card>
            </React.Fragment>
          );
        })}
        {f >= at(8) && f < at(12) ? <div style={{ position: "absolute", left: ballX - 22, top: 455 - hop(f) * 24, width: 44, height: 44, borderRadius: 22, background: C.lemon, border: `4px solid ${C.white}`, boxShadow: `0 4px 0 ${C.ink}22` }} /> : null}
        {/* 兜底：虚线绕下去 */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: lerp(f, at(10), at(10) + 8) }}>
          <path d="M 720 690 Q 720 820 960 820 Q 1640 820 1640 690" fill="none" stroke={C.pink} strokeWidth={6} strokeDasharray="16 14" strokeDashoffset={-f * 2} />
        </svg>
        <div style={{ position: "absolute", left: 960, top: 830, transform: "translateX(-50%)", padding: "14px 34px", borderRadius: 22, background: C.pinkLight, border: `4px dashed ${C.pink}`, fontFamily: ZH, fontSize: 36, color: C.ink, scale: `${pop(f, at(10.5))}`, whiteSpace: "nowrap" }}>
          AI 或向量服务不在？退回关键词检索，照样有结果
        </div>
      </div>
      {f >= at(12) - 2 ? <Window f={f} {...s} x={960} y={610} w={1200} h={Math.round((1200 * s.imgH) / s.imgW)} enter={at(12)} tilt={-1} /> : null}
      <Tape f={f} at={2} x={60} y={50} title="语义搜索" sub="向量找候选，AI 来把关" color={C.lilac} rot={-2.5} />
      <Sticker f={f} src={img("emo-expert")} at={at(6)} x={1780} y={250} size={230} rot={8} out={at(12) - 4} />
      <Sticker f={f} src={img("emo-confused")} at={at(13)} x={1790} y={880} size={220} rot={-6} />
    </AbsoluteFill>
  );
};
