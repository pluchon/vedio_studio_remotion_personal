// 手帐最后几页：奶糖自己、出状况也不怕、背后的服务、结尾（40 帧/秒；这几页右边站着奶糖，内容放左边）
import React from "react";
import { Img, Loop, OffthreadVideo, interpolate } from "remotion";
import { C, TEXT, ZH, asset } from "../theme";
import { Mock, when } from "./pages1";
import { Card, Chip, Draw, Header, INK, INK_SOFT, Marker, Note, RED, Sticker, Stamp, Tape, Twinkle, pop, ramp, rnd, wobble } from "./paper";
import { Burst, Ico, Shot } from "./parts";
import { BAR, LINES, cue, scene } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const v2 = (n: string) => asset(`img/v2/${n}`);

const Avatar: React.FC<{ size: number; grey?: boolean }> = ({ size, grey }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", background: C.blueLight, flex: "none", filter: grey ? "grayscale(1) opacity(0.7)" : undefined }}>
    <Img src={asset("img/neko.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

const Bubble: React.FC<{ f: number; at: number; me?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, at, me, children, style }) => {
  const s = pop(f, at, true);
  if (f < at) return null;
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 12, transform: `scale(${s})`, transformOrigin: me ? "right bottom" : "left bottom", ...style }}>
      {me ? null : <Avatar size={56} />}
      <div style={{ padding: "12px 22px", borderRadius: me ? "24px 24px 6px 24px" : "24px 24px 24px 6px", background: me ? C.blue : "#F1F6FB", color: me ? "#fff" : INK, fontFamily: ZH, fontSize: 30, maxWidth: 560 }}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------- 奶糖：看图、找帖子、联网带来源、记忆、气泡语音、表情（聊天是示意）
const EMOS = ["emo-hooray", "emo-love", "emo-wow", "emo-cheer", "emo-shy", "emo-awesome", "emo-headpat", "emo-popsicle"];
const SPOTS = [[880, 120], [1040, 90], [1200, 130], [960, 640], [1110, 720], [1230, 600], [720, 110], [880, 760]];

export const NaitangPage: React.FC<{ f: number }> = ({ f }) => {
  const id = "naitang";
  const sc = scene(id);
  const l1 = cue(id, 1);
  const l2 = cue(id, 2);
  const l3 = cue(id, 3);
  const voice = LINES[LINES.findIndex((l) => l.i === sc.lines[2].i)];
  const play = when(id, 2, 0.55);
  return (
    <>
      <Header f={f} no="10" title="奶糖" en="That's me!" color={C.blue} />
      <Burst f={f} at={cue(id, 0)} x={640} y={440} text="当然，还有我！" color={C.blueDeep} size={120} hold={l1 - cue(id, 0) - 8} rot={-4} />

      {/* 看图 + 找帖子 + 联网 */}
      <Card x={70} y={190} w={800} h={430} rot={-1} s={pop(f, l1 - 4, true)} border={C.blueLight}>
        <Mock x={710} y={14} />
        <div style={{ position: "absolute", left: 24, top: 16, display: "flex", gap: 10 }}>
          {[["image", "看图", when(id, 1, 0.05)], ["doc", "找帖子", when(id, 1, 0.38)], ["globe", "联网 + 来源", when(id, 1, 0.66)]].map(([ic, t, at]) => (
            <span key={t as string} style={{ transform: `scale(${pop(f, at as number)})`, display: "inline-flex", alignItems: "center", gap: 6, background: C.pink, color: "#fff", borderRadius: 20, padding: "4px 14px", fontFamily: ZH, fontSize: 24 }}>
              <Ico name={ic as "image"} size={24} color="#fff" />{t as string}
            </span>
          ))}
        </div>
        <div style={{ position: "absolute", left: 24, right: 24, top: 70, display: "flex", flexDirection: "column", gap: 14 }}>
          <Bubble f={f} at={l1 + 2} me>
            <Img src={asset("img/cover.png")} style={{ width: 300, height: 100, objectFit: "cover", borderRadius: 12, display: "block" }} />
          </Bubble>
          <Bubble f={f} at={when(id, 1, 0.2)}>是萌部落的横幅！奶糖在上面挥手呢～</Bubble>
          <div style={{ display: "flex", gap: 10, marginLeft: 68, flexWrap: "wrap" }}>
            {["站内帖子：手帐分享", "站内帖子：新人报到"].map((t, i) => (
              <span key={t} style={{ transform: `scale(${pop(f, when(id, 1, 0.42) + i * 4)})`, display: "inline-flex", alignItems: "center", gap: 6 }}><Chip text={t} size={22} bg={C.lemonLight} /></span>
            ))}
            {["网页来源 1", "网页来源 2"].map((t, i) => (
              <span key={t} style={{ transform: `scale(${pop(f, when(id, 1, 0.72) + i * 4)})`, display: "inline-flex", alignItems: "center", gap: 6, background: C.mintLight, borderRadius: 22, padding: "4px 14px", fontFamily: ZH, fontSize: 22, color: INK }}>
                <Ico name="globe" size={22} color={C.blueDeep} />{t}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* 记忆 */}
      <Note f={f} at={l2} x={910} y={220} w={400} h={290} color={C.lemonLight} rot={3}>
        <div style={{ fontFamily: ZH, fontSize: 34, color: INK, display: "flex", alignItems: "center", gap: 10 }}><Ico name="memo" size={34} color={C.blueDeep} />奶糖记得</div>
        {["你最爱草莓蛋糕", "周末在追新番", "下周要考试，加油！"].map((t, i) => (
          <div key={t} style={{ fontFamily: ZH, fontSize: 30, color: INK, marginTop: 14, opacity: ramp(f, when(id, 2, 0.05) + i * 6, when(id, 2, 0.05) + i * 6 + 5), transform: `translateX(${(1 - ramp(f, when(id, 2, 0.05) + i * 6, when(id, 2, 0.05) + i * 6 + 6)) * 20}px)` }}>· {t}</div>
        ))}
      </Note>
      {/* 气泡语音：声波用奶糖这一句真实的响度 */}
      {f >= when(id, 2, 0.4) ? (
        <div style={{ position: "absolute", left: 90, top: 660, width: 700, height: 116, borderRadius: 58, background: "#fff", border: `4px solid ${C.blue}`, display: "flex", alignItems: "center", gap: 18, padding: "0 30px", boxSizing: "border-box", transform: `scale(${pop(f, when(id, 2, 0.4), true)})`, boxShadow: "0 8px 18px rgba(41,72,106,0.12)" }}>
          <Avatar size={64} />
          <div style={{ width: 64, height: 64, borderRadius: 32, background: f >= play ? C.pink : C.blue, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${f >= play && f < play + 6 ? 0.88 : 1})` }}>
            <Ico name="play" size={34} color="#fff" width={2} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, height: 70, flex: 1 }}>
            {Array.from({ length: 26 }, (_, i) => {
              const g = sc.from + f;
              const k = g - voice.at - i;
              const v = f >= play && k >= 0 && k < voice.mouth.length ? voice.mouth[k] : 0.08 + 0.06 * rnd(i, 2);
              return <div key={i} style={{ width: 9, height: 10 + v * 56, borderRadius: 5, background: f >= play ? C.pink : C.blueLight }} />;
            })}
          </div>
          <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 32, color: INK_SOFT }}>4″</span>
        </div>
      ) : null}
      <Burst f={f} at={play} x={1080} y={600} text="点一下就能听" color={C.pink} size={60} hold={36} />

      {/* 表情：从奶糖那边撒出来 */}
      {EMOS.map((name, i) => {
        const at = l3 + 6 + i * 3;
        const t = ramp(f, at, at + 14);
        if (f < at) return null;
        const [tx, ty] = SPOTS[i % SPOTS.length];
        const x = interpolate(t, [0, 1], [1420, tx]);
        const y = interpolate(t, [0, 1], [600, ty]) - Math.sin(t * Math.PI) * 180;
        return <Sticker key={name} f={f} at={at} x={x} y={y} size={120 + rnd(i, 3) * 30} name={name} rot={(rnd(i, 4) - 0.5) * 30} />;
      })}
      <Burst f={f} at={l3 + 4} x={640} y={470} text="发表情！" color={C.pink} size={110} hold={40} />
    </>
  );
};

// ---------------------------------------------------------------- 出状况也不怕：奶糖离线（真截图），AI 服务停了别处照样用（示意）
const SERVICES = ["发帖", "评论", "私信", "签到", "搜索", "AI"];

export const Resilience: React.FC<{ f: number }> = ({ f }) => {
  const id = "resilience";
  const down = when(id, 0, 0.4);
  const ok = when(id, 0, 0.78);
  return (
    <>
      <Header f={f} no="11" title="出状况也不怕" en="Still works" color={C.lemon} />
      <Shot f={f} at={4} src={v2("chat.png")} imgW={250} imgH={370} x={70} y={215} w={300} rot={-3} caption="奶糖离线时"
        marks={[{ at: when(id, 0, 0.12), x: 0, y: 254, w: 168, h: 28, color: RED, label: "离线提示 + 语音", side: "bottom" }]} />
      <div style={{ position: "absolute", left: 440, top: 230, display: "flex", alignItems: "center", gap: 12, fontFamily: ZH, fontSize: 34, color: INK_SOFT, opacity: ramp(f, 12, 20) }}>
        <Ico name="wifiOff" size={40} color={INK_SOFT} />离线也会好好说一声
      </div>
      {SERVICES.map((s, i) => {
        const x = 460 + (i % 3) * 205;
        const y = 300 + Math.floor(i / 3) * 210;
        const bad = s === "AI" && f >= down;
        const shake = bad ? Math.sin((f - down) * 2.2) * 8 * Math.exp(-(f - down) / 12) : 0;
        return (
          <div key={s} style={{ position: "absolute", left: x, top: y, width: 180, height: 180, borderRadius: 30, background: bad ? "#E7EAEE" : [C.blueLight, C.pinkLight, C.mintLight, C.lemonLight, C.lilacLight, C.blueLight][i], border: `4px solid ${bad ? "#B8C2CE" : "#fff"}`, boxShadow: "0 8px 16px rgba(41,72,106,0.1)", transform: `scale(${pop(f, 6 + i * 4)}) translateX(${shake}px) rotate(${bad ? 6 : wobble(f, i, 1.5)}deg)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 40, color: bad ? INK_SOFT : INK }}>{bad ? "×_×" : "•ᴗ•"}</div>
            <div style={{ fontFamily: ZH, fontSize: 34, color: INK, marginTop: 6 }}>{s}</div>
            {!bad && f >= ok ? <div style={{ position: "absolute", right: -10, top: -10, width: 46, height: 46, borderRadius: 23, background: C.mint, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop(f, ok + i * 2)})` }}><Ico name="check" size={30} color="#fff" width={3} /></div> : null}
          </div>
        );
      })}
      <Mock x={460} y={720} />
      {f >= down ? <div style={{ position: "absolute", left: 880, top: 730, fontFamily: ZH, fontSize: 28, color: INK_SOFT, opacity: ramp(f, down + 8, down + 14), transform: "rotate(-3deg)" }}>搜索 → 退回关键词检索</div> : null}
      <Burst f={f} at={ok} x={770} y={470} text="照样能逛！" color={RED} size={96} hold={40} />
    </>
  );
};

// ---------------------------------------------------------------- 背后：六个 Java 服务、一个 Python 服务、消息队列传话
const JAVA = [["gateway", "网关"], ["user", "用户"], ["content", "内容"], ["growth", "成长"], ["im", "消息"], ["companion", "奶糖"]];

export const Arch: React.FC<{ f: number }> = ({ f }) => {
  const id = "arch";
  const java0 = when(id, 0, 0.04);
  const py = when(id, 0, 0.42);
  const mq = when(id, 0, 0.66);
  const box = (x: number, y: number, w: number, h: number, at: number, color: string, name: string, zh: string, tag: string) => (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 24, background: color, border: "4px solid #fff", boxShadow: "0 8px 16px rgba(41,72,106,0.12)", transform: `scale(${pop(f, at)}) rotate(${wobble(f, x, 1)}deg)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 30, color: INK }}>{name}</div>
      <div style={{ fontFamily: ZH, fontSize: 28, color: INK_SOFT }}>{zh} · {tag}</div>
    </div>
  );
  const pos = JAVA.map((_, i) => (i === 0 ? [640, 190] : [80 + (i - 1) * 285, 370]));
  const ai = [1100, 590];
  const mqC = [660, 650];
  const ends = [...pos.slice(1), ai];
  return (
    <>
      <Header f={f} no="12" title="背后" en="Behind the scenes" color={C.lilac} />
      {f >= mq ? (
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={1580} height={900}>
          {ends.map(([x, y], i) => {
            const cx = x + 120;
            const cy = y + 60;
            const p = ramp(f, mq + i * 2, mq + i * 2 + 8);
            return <line key={i} x1={mqC[0]} y1={mqC[1]} x2={mqC[0] + (cx - mqC[0]) * p} y2={mqC[1] + (cy - mqC[1]) * p} stroke={C.blue} strokeWidth={5} strokeDasharray="12 12" strokeDashoffset={-f * 2} />;
          })}
        </svg>
      ) : null}
      {f >= mq + 12
        ? ends.map(([x, y], i) => {
            const cx = x + 120;
            const cy = y + 60;
            const ph = ((f - mq) / BAR + i * 0.37) % 1;
            const back = Math.floor((f - mq) / BAR + i * 0.37) % 2 === 1;
            const t = back ? 1 - ph : ph;
            return (
              <div key={i} style={{ position: "absolute", left: mqC[0] + (cx - mqC[0]) * t - 24, top: mqC[1] + (cy - mqC[1]) * t - 20, width: 48, height: 40, borderRadius: 8, background: "#fff", boxShadow: "0 3px 8px rgba(41,72,106,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico name="mail" size={34} color={C.pink} />
              </div>
            );
          })
        : null}
      {JAVA.map(([name, zh], i) => box(pos[i][0], pos[i][1], 240, 120, java0 + i * 5, [C.lemonLight, C.blueLight, C.pinkLight, C.mintLight, C.lilacLight, C.blueLight][i], name, zh, "Java"))}
      {box(ai[0], ai[1], 240, 120, py, "#E9F6EE", "ai", "Python", "AI")}
      <div style={{ position: "absolute", left: mqC[0] - 180, top: mqC[1] - 70, width: 360, height: 140, borderRadius: 30, background: C.pink, border: "5px solid #fff", boxShadow: "0 10px 20px rgba(41,72,106,0.16)", transform: `scale(${pop(f, mq)})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 36, display: "flex", alignItems: "center", gap: 10 }}><Ico name="mail" size={38} color="#fff" />RabbitMQ</div>
        <div style={{ fontFamily: ZH, fontSize: 28 }}>消息队列 · 传话筒</div>
      </div>
      <Note f={f} at={java0 + 24} x={1150} y={160} w={300} h={150} color={C.lemonLight} rot={4}>
        <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 36, color: INK, lineHeight: 1.4 }}>Java × 6<br /><span style={{ color: f >= py ? C.blueDeep : "transparent" }}>Python × 1</span></div>
      </Note>
      <Burst f={f} at={mq + 4} x={1100} y={480} text="互相传话" color={C.pink} size={70} hold={34} />
    </>
  );
};

// ---------------------------------------------------------------- 结尾：横幅、口号、举着星星的奶糖、彩纸
const Confetti: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const t = (f - at) / 40;
  if (t < 0) return null;
  const colors = [C.pink, C.lemon, C.blue, C.mint, C.lilac, "#fff"];
  return (
    <>
      {Array.from({ length: 90 }, (_, i) => {
        const ang = rnd(i, 1) * Math.PI * 2;
        const v = 400 + rnd(i, 2) * 800;
        const x = 700 + Math.cos(ang) * v * Math.min(t, 0.7) * 1.3;
        const y = 380 + Math.sin(ang) * v * Math.min(t, 0.7) * 0.8 + 300 * t * t;
        const o = interpolate(t, [0, 0.1, 3, 4], [0, 1, 1, 0], clamp);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 16 + rnd(i, 3) * 10, height: 10 + rnd(i, 4) * 6, borderRadius: 3, background: colors[i % colors.length], opacity: o, transform: `rotate(${(rnd(i, 5) * 720 + f * (4 + rnd(i, 6) * 8)) % 360}deg)` }} />;
      })}
    </>
  );
};

export const Outro: React.FC<{ f: number }> = ({ f }) => {
  const id = "outro";
  const sc = scene(id);
  const l0 = cue(id, 0);
  const l1 = cue(id, 1);
  const end = sc.frames - BAR;
  const slogan = ["分享热爱，", "收集日常"];
  const star = pop(f, l1 - 12, true);
  return (
    <>
      <Shot f={f} at={2} src={asset("img/cover.png")} imgW={1600} imgH={533} x={60} y={150} w={820} rot={-3} caption="萌部落 · Meng Center" tape="rgba(244,163,188,0.8)" />
      <div style={{ position: "absolute", left: 100, top: 540, display: "flex" }}>
        {slogan.join("").split("").map((ch, i) => {
          const at = l0 + 12 + i * 6;
          const s = pop(f, at);
          return <span key={i} style={{ fontFamily: ZH, fontSize: 92, color: i < 5 ? C.blueDeep : RED, display: "inline-block", transform: `translateY(${(1 - s) * -40}px) scale(${s}) rotate(${wobble(f, i, 2)}deg)` }}>{ch}</span>;
        })}
      </div>
      <Marker f={f} at={l0 + 70} x={100} y={640} w={830} h={24} color="rgba(246,213,126,0.7)" />
      {/* 举着星星的奶糖（ElevenLabs 出的动图，补帧抠图后的透明 webm） */}
      {f >= l1 - 12 ? (
        <div style={{ position: "absolute", left: 920, top: 110, width: 400, height: 600, transform: `rotate(${5 - (1 - star) * 10}deg) scale(${1.15 - 0.15 * star})`, opacity: Math.min(1, star * 1.5), background: "#fff", borderRadius: 4, boxShadow: "0 14px 28px rgba(41,72,106,0.18)" }}>
          <div style={{ position: "absolute", left: 18, top: 18, width: 364, height: 500, background: `linear-gradient(${C.blueLight}, ${C.pinkLight})`, overflow: "hidden" }}>
            <Loop durationInFrames={BAR}>
              <OffthreadVideo src={asset("naitang/star.webm")} transparent muted style={{ position: "absolute", left: 22, top: 10, width: 320, height: 570 }} />
            </Loop>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, textAlign: "center", fontFamily: ZH, fontSize: 38, color: INK }}>等你来玩哦！</div>
          <Tape x={90} y={6} w={150} rot={-12} color="rgba(142,212,181,0.85)" />
          <Tape x={320} y={8} w={140} rot={10} color="rgba(246,213,126,0.85)" pattern="dot" />
        </div>
      ) : null}
      <Confetti f={f} at={l1 + 30} />
      <Sticker f={f} at={l1 + 34} x={60} y={720} size={150} name="emo-hooray" rot={-8} />
      <Sticker f={f} at={l1 + 38} x={60} y={130} size={130} name="emo-love" rot={10} />
      <Sticker f={f} at={l1 + 42} x={860} y={110} size={130} name="emo-cheer" rot={-6} />
      <Twinkle f={f} at={l1 + 30} x={1180} y={90} kind="star" size={50} />
      <Twinkle f={f} at={l1 + 60} x={700} y={620} kind="heart" color={C.pink} size={46} />
      <Stamp f={f} at={end} x={520} y={750} text="下次见！" size={64} rot={-8} />
      {f >= end ? <Draw f={f} at={end + 4} dur={14} x={0} y={0} w={1580} h={900} d="M 720 760 C 760 700, 840 690, 880 730" color={RED} width={6} /> : null}
    </>
  );
};

