// 间奏：架构。服务一个个冒出来，再看一次发帖的事件怎么在服务之间跑，最后是技术栈
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background, C, Sparkle, Sticker, Tape, TEXT, ZH, at, hop, lerp, pop, thump } from "../kit";
import { img } from "../shots";

type Node = { id: string; x: number; y: number; t: string; sub: string; c: string; beat: number; w?: number };
const NODES: Node[] = [
  { id: "fe", x: 960, y: 200, t: "用户端", sub: "Vue 3", c: C.pink, beat: 0, w: 260 },
  { id: "gw", x: 960, y: 340, t: "gateway", sub: "8080 · 鉴权和路由", c: C.lilac, beat: 0.5, w: 360 },
  { id: "user", x: 330, y: 510, t: "user", sub: "8101 · 账号", c: C.blue, beat: 1 },
  { id: "content", x: 650, y: 510, t: "content", sub: "8102 · 帖子", c: C.blue, beat: 1.5 },
  { id: "growth", x: 970, y: 510, t: "growth", sub: "8103 · 成长", c: C.blue, beat: 2 },
  { id: "im", x: 1290, y: 510, t: "im", sub: "8104 · 消息", c: C.blue, beat: 2.5 },
  { id: "companion", x: 1610, y: 510, t: "companion", sub: "8107 · 萌萌", c: C.blue, beat: 3 },
  { id: "mq", x: 560, y: 730, t: "RabbitMQ", sub: "跨服务事件", c: C.lemon, beat: 4, w: 300 },
  { id: "ai", x: 1180, y: 730, t: "ai", sub: "8106 · Python", c: C.mint, beat: 4.5, w: 300 },
];
const pos = Object.fromEntries(NODES.map((n) => [n.id, n]));
const LINKS: [string, string, boolean][] = [
  ["fe", "gw", false],
  ["gw", "user", false],
  ["gw", "content", false],
  ["gw", "growth", false],
  ["gw", "im", false],
  ["gw", "companion", false],
  ["content", "mq", true],
  ["growth", "mq", true],
  ["im", "mq", true],
  ["content", "ai", false],
  ["growth", "ai", false],
  ["companion", "ai", false],
];
const INFRA = ["MySQL · 每个服务一个库", "Redis", "Elasticsearch", "Nacos", "xxl-job"];
const STACK = [
  "Spring Boot 4", "Spring Cloud Alibaba", "MyBatis-Plus", "Flyway", "JDK 17", "FastAPI", "LangChain", "LangGraph",
  "Qwen3.8 Flash", "Vue 3", "Pinia", "Element Plus", "Vite", "Docker Compose", "uv", "SCSS",
];

// 信封从 a 跳到 b：起拍、拍数
const travel = (f: number, a: string, b: string, beat: number, beats: number) => {
  const s = at(beat);
  const e = s + beats * 12;
  if (f < s || f > e) return null;
  const k = (f - s) / (e - s);
  const A = pos[a];
  const B = pos[b];
  return { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k - Math.sin(Math.PI * k) * 80 };
};

const Envelope: React.FC<{ x: number; y: number; label: string; color: string }> = ({ x, y, label, color }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 16, background: color, color: C.white, fontFamily: TEXT, fontWeight: 600, fontSize: 30, boxShadow: `0 6px 0 ${C.ink}33`, whiteSpace: "nowrap" }}>
    <svg width={34} height={26} viewBox="0 0 34 26">
      <rect x={1} y={1} width={32} height={24} rx={4} fill={C.white} />
      <path d="M 2 3 L 17 15 L 32 3" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
    </svg>
    {label}
  </div>
);

export const Arch: React.FC = () => {
  const f = useCurrentFrame();
  const dim = 1 - 0.7 * lerp(f, at(24), at(25), 0, 1);
  const subs = [
    { b: 0, t: "6 个 Java 服务 + 1 个 Python AI 服务" },
    { b: 8, t: "一次发帖：事件走 RabbitMQ，事务提交后才发" },
    { b: 24, t: "AI 只做计算和建议，最终状态由 Java 决定" },
  ];
  const sub = [...subs].reverse().find((s) => f >= at(s.b))!;
  const published = [travel(f, "content", "mq", 8, 2), travel(f, "mq", "growth", 10, 2), travel(f, "mq", "ai", 10, 2)];
  const analyzed = [travel(f, "ai", "mq", 16, 2), travel(f, "mq", "content", 18, 2)];
  const thinking = f >= at(12) && f < at(16);
  return (
    <AbsoluteFill>
      <Background f={f} tint="#F2F8FD" />
      <div style={{ position: "absolute", inset: 0, opacity: dim }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {LINKS.map(([a, b, dashed], i) => {
            const A = pos[a];
            const B = pos[b];
            const k = lerp(f, at(Math.max(A.beat, B.beat)) + 4, at(Math.max(A.beat, B.beat)) + 14, 0, 1);
            return (
              <line key={i} x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * k} y2={A.y + (B.y - A.y) * k} stroke={dashed ? C.lemon : `${C.inkSoft}55`} strokeWidth={dashed ? 6 : 5} strokeDasharray={dashed ? "14 12" : undefined} strokeDashoffset={dashed ? -f * 1.5 : 0} strokeLinecap="round" />
            );
          })}
        </svg>
        {NODES.map((n) => {
          const p = pop(f, at(n.beat));
          const w = n.w ?? 270;
          const busy = (n.id === "ai" && thinking) || (n.id === "growth" && f >= at(12) && f < at(14)) || (n.id === "content" && f >= at(20) && f < at(22));
          return (
            <div key={n.id} style={{ position: "absolute", left: n.x - w / 2, top: n.y - 55, width: w, height: 110, borderRadius: 30, background: C.white, border: `5px solid ${n.c}`, boxShadow: `0 8px 0 ${n.c}77`, textAlign: "center", scale: `${p * (busy ? thump(f, 0.08) : 1)}` }}>
              <div style={{ marginTop: 12, fontFamily: TEXT, fontWeight: 600, fontSize: 40, color: C.ink }}>{n.t}</div>
              <div style={{ fontFamily: ZH, fontSize: 26, color: C.inkSoft }}>{n.sub}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 900, display: "flex", justifyContent: "center", gap: 22 }}>
          {INFRA.map((t, i) => (
            <div key={t} style={{ padding: "10px 26px", borderRadius: 999, background: C.white, border: `3px solid ${C.inkSoft}55`, fontFamily: TEXT, fontSize: 30, color: C.ink, scale: `${pop(f, at(5 + i * 0.5))}` }}>
              {t}
            </div>
          ))}
        </div>
        {/* 事件 */}
        {published.map((p, i) => (p ? <Envelope key={i} x={p.x} y={p.y} label="post.published" color={C.pink} /> : null))}
        {analyzed.map((p, i) => (p ? <Envelope key={i} x={p.x} y={p.y} label="post.analyzed" color={C.mint} /> : null))}
        {[
          { b: 9, x: 650, y: 428, t: "发帖不用等 AI", c: C.blue },
          { b: 12, x: 970, y: 428, t: "+ 经验", c: C.mint },
          { b: 12.5, x: 1460, y: 680, t: "抽主题", c: C.mint },
          { b: 13, x: 1480, y: 740, t: "判质量和审核", c: C.mint },
          { b: 13.5, x: 1460, y: 800, t: "算向量", c: C.mint },
          { b: 20, x: 650, y: 428, t: "写入特征和向量索引", c: C.blue },
        ].map((n) => {
          const p = pop(f, at(n.b));
          const gone = n.b === 9 ? 1 - lerp(f, at(19), at(19.5), 0, 1) : n.b === 12 ? 1 - lerp(f, at(16), at(16.5), 0, 1) : 1;
          if (p <= 0 || gone <= 0) return null;
          return (
            <div key={n.t} style={{ position: "absolute", left: n.x, top: n.y, transform: "translate(-50%, -50%)", padding: "6px 20px", borderRadius: 999, background: n.c, color: C.white, fontFamily: ZH, fontSize: 30, whiteSpace: "nowrap", scale: `${p * gone}`, translate: `0 ${-hop(f) * 6}px` }}>
              {n.t}
            </div>
          );
        })}
      </div>
      {/* 技术栈：最后两小节，一个八分音符一块，自动换行排开 */}
      <div style={{ position: "absolute", left: 210, top: 250, width: 1500, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "34px 30px" }}>
        {STACK.map((t, i) => {
          const p = pop(f, at(24 + i * 0.5));
          const color = [C.blue, C.pink, C.mint, C.lemon, C.lilac][i % 5];
          return (
            <div key={t} style={{ padding: "14px 30px", borderRadius: 22, background: C.white, border: `5px solid ${color}`, boxShadow: `0 8px 0 ${color}77`, fontFamily: TEXT, fontWeight: 600, fontSize: 40, color: C.ink, whiteSpace: "nowrap", scale: `${p}`, opacity: p > 0 ? 1 : 0, rotate: `${((i * 37) % 7) - 3}deg`, translate: `0 ${p > 0.9 ? -hop(f, i * 2) * 6 : 0}px` }}>
              {t}
            </div>
          );
        })}
      </div>
      <Tape f={f} at={0} x={60} y={40} title="架构" sub={sub.t} color={C.lemon} />
      <Sparkle f={f} at={at(11.5)} x={970} y={450} size={56} color={C.mint} />
      <Sticker f={f} src={img("emo-expert")} at={at(26)} x={1760} y={900} size={250} rot={6} />
      <Sticker f={f} src={img("emo-airplane")} at={at(28)} x={170} y={920} size={230} rot={-6} />
    </AbsoluteFill>
  );
};
