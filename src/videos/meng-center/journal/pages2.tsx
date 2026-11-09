// 手帐中间几页：搜索、成长、创作中心、私信、个人中心（40 帧/秒）
// 数字都按萌部落 docs：经验 签到 5 / 发帖 10 / 评论 2 / 点赞 1，Lv.4 要 300 总经验；复盘建议每次复盘能换 2 次
import React from "react";
import { Img, interpolate } from "remotion";
import { C, TEXT, ZH, asset } from "../theme";
import { Mock, when } from "./pages1";
import { Button, Card, Check, Chip, Header, INK, INK_SOFT, Note, RED, Sticker, Stamp, Twinkle, Typer, pop, ramp } from "./paper";
import { Burst, Ico, Shot } from "./parts";
import { cue } from "./timeline";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const v2 = (n: string) => asset(`img/v2/${n}`);

// ---------------------------------------------------------------- 搜索：一句话搜，AI 把相关的排上来（结果卡片是示意）
const RESULTS = [
  { t: "本季新番导视：热门都在这", rel: 1, from: 0, to: 2 },
  { t: "治愈系推荐｜周末宅家慢慢看", rel: 3, from: 1, to: 0 },
  { t: "周末去哪儿玩：城市散步地图", rel: 0, from: 2, to: 3 },
  { t: "一个人也很好：慢节奏动画清单", rel: 3, from: 3, to: 1 },
];

export const Search: React.FC<{ f: number }> = ({ f }) => {
  const id = "search";
  const type0 = cue(id, 0) - 8;
  const list0 = when(id, 0, 0.32);
  const sort0 = when(id, 0, 0.6);
  const sp = ease(ramp(f, sort0, sort0 + 20));
  return (
    <>
      <Header f={f} no="05" title="搜索" en="Search" color={C.blue} />
      <Card x={80} y={200} w={900} h={96} s={pop(f, 3, true)} border={C.blue}>
        <div style={{ position: "absolute", left: 28, top: 22, fontFamily: ZH, fontSize: 38, color: INK, display: "flex", alignItems: "center", gap: 14 }}>
          <Ico name="search" size={40} color={C.blueDeep} width={2.6} />
          <Typer f={f} at={type0} text="适合周末一个人看的治愈番" cps={10} />
        </div>
      </Card>
      {RESULTS.map((r, i) => {
        const s = pop(f, list0 + i * 4, true);
        if (f < list0 + i * 4) return null;
        const y = 330 + interpolate(sp, [0, 1], [r.from, r.to]) * 112;
        const dim = r.rel === 0 ? 1 - 0.5 * sp : 1;
        return (
          <div key={i} style={{ position: "absolute", left: 80, top: y, width: 900, height: 96, borderRadius: 22, background: "#fff", border: `4px solid ${r.rel === 3 && sp > 0.9 ? C.mint : C.blueLight}`, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 26px", gap: 18, transform: `scale(${s}) rotate(${(i % 2 ? 1 : -1) * 0.6}deg)`, opacity: dim, boxShadow: "0 6px 14px rgba(41,72,106,0.08)" }}>
            <Ico name="doc" size={32} color={INK_SOFT} />
            <span style={{ fontFamily: ZH, fontSize: 34, color: INK, flex: 1 }}>{r.t}</span>
            {sp > 0.9 ? <Chip text={r.rel === 3 ? "很相关" : r.rel === 1 ? "有点相关" : "不太相关"} size={24} bg={r.rel === 3 ? C.mintLight : "#F1F4F8"} /> : null}
          </div>
        );
      })}
      <Mock x={900} y={302} />
      <Shot f={f} at={6} src={asset("img/search.png")} imgW={1536} imgH={960} x={1040} y={200} w={420} rot={4} />
      <Note f={f} at={sort0 - 6} x={1060} y={520} w={380} h={190} color={C.mintLight} rot={-3}>
        <div style={{ fontFamily: ZH, fontSize: 34, color: INK, lineHeight: 1.5 }}>向量先找候选<br />AI 再挑真相关的</div>
      </Note>
      <Burst f={f} at={sort0 + 2} x={560} y={520} text="排一排！" color={C.mint} size={84} hold={30} />
    </>
  );
};

// ---------------------------------------------------------------- 成长：真截图里的今日任务 + 打勾、经验条，点赞那一下正好升到 Lv.4
const TASKS = [
  { t: "签到", xp: 5, k: 0.04 },
  { t: "发帖", xp: 10, k: 0.14 },
  { t: "评论", xp: 2, k: 0.26 },
  { t: "点赞", xp: 1, k: 0.6, isNew: true },
];
const START = 282; // 282 + 5 + 10 + 2 + 1 = 300，正好是 Lv.4 的门槛

export const Growth: React.FC<{ f: number }> = ({ f }) => {
  const id = "growth";
  const ticks = TASKS.map((t) => when(id, 0, t.k));
  const xp = START + TASKS.reduce((sum, t, i) => sum + (f >= ticks[i] ? t.xp : 0), 0);
  const up = xp >= 300;
  return (
    <>
      <Header f={f} no="06" title="成长" en="Level up" color={C.lemon} />
      <Shot f={f} at={2} src={v2("growth.jpg")} imgW={800} imgH={507} x={60} y={190} w={780} rot={-2}
        from={{ x: 0, y: 0, w: 800, h: 507 }} to={{ x: 440, y: 60, w: 360, h: 228 }} move={[14, 70]}
        marks={[{ at: ticks[3], x: 486, y: 240, w: 274, h: 52, color: RED, label: "点赞也能涨经验", side: "bottom" }]} />
      <Note f={f} at={6} x={930} y={200} w={560} h={560} color="#FFF8E3" rot={2}>
        <div style={{ fontFamily: ZH, fontSize: 40, color: INK }}>今日任务（每次经验）</div>
        {TASKS.map((t, i) => (
          <div key={i} style={{ position: "absolute", left: 30, top: 100 + i * 90, width: 500, height: 70 }}>
            <Check f={f} at={ticks[i]} x={0} y={8} size={52} />
            <span style={{ position: "absolute", left: 76, top: 6, fontFamily: ZH, fontSize: 38, color: f >= ticks[i] ? INK_SOFT : INK }}>{t.t}</span>
            <span style={{ position: "absolute", left: 210, top: 14, fontFamily: TEXT, fontWeight: 700, fontSize: 32, color: C.blueDeep }}>+{t.xp}</span>
            {t.isNew ? <span style={{ position: "absolute", left: 300, top: 6, display: "inline-block", transform: `rotate(8deg) scale(${pop(f, 12)})` }}><Chip text="新加的" bg={RED} color="#fff" size={26} /></span> : null}
            {f >= ticks[i] && f < ticks[i] + 30 ? (
              <span style={{ position: "absolute", left: 400, top: 0 - (f - ticks[i]) * 2.2, fontFamily: TEXT, fontWeight: 700, fontSize: 34, color: C.pink, opacity: 1 - (f - ticks[i]) / 30 }}>+{t.xp}</span>
            ) : null}
          </div>
        ))}
        <div style={{ position: "absolute", left: 30, top: 470, width: 500, fontFamily: TEXT, fontWeight: 700, fontSize: 30, color: INK }}>
          {up ? "Lv.4" : "Lv.3"} · {xp} / 300
          <div style={{ marginTop: 8, height: 24, borderRadius: 12, background: "#fff", border: `3px solid ${C.blueLight}` }}>
            <div style={{ width: `${Math.min(1, (xp - 150) / 150) * 100}%`, height: "100%", borderRadius: 12, background: `linear-gradient(90deg, ${C.mint}, ${C.blue})` }} />
          </div>
        </div>
      </Note>
      <Burst f={f} at={ticks[3] + 2} x={460} y={300} text="升到 Lv.4！" color={C.blueDeep} size={76} hold={40} />
      <Twinkle f={f} at={ticks[3]} x={1440} y={640} kind="star" size={50} />
    </>
  );
};

// ---------------------------------------------------------------- 创作中心：真截图的「创作复盘」弹窗 + 右边示意卡片演示换一批
const SUGGEST = [
  ["封面换成亮一点的颜色", "标题里点出番剧名字", "周六晚上发，看的人多"],
  ["配图上加几句小标注", "多回复几条评论区留言", "把同主题的帖做成合集"],
];

export const Creator: React.FC<{ f: number }> = ({ f }) => {
  const id = "creator";
  const swap = when(id, 0, 0.72);
  const flipP = ramp(f, swap + 2, swap + 12);
  const set = flipP > 0.5 ? 1 : 0;
  return (
    <>
      <Header f={f} no="07" title="创作中心" en="Creator" color={C.mint} />
      <Shot f={f} at={2} src={v2("review.jpg")} imgW={800} imgH={507} x={60} y={190} w={780} rot={-2.5} caption="创作复盘（AI 建议，仅供参考）"
        from={{ x: 0, y: 0, w: 800, h: 507 }} to={{ x: 330, y: 130, w: 470, h: 298 }} move={[10, 70]}
        marks={[{ at: when(id, 0, 0.35), x: 372, y: 404, w: 96, h: 24, color: RED, label: "AI 给的建议" }]} />
      <Card x={900} y={190} w={590} h={590} rot={1.5} s={pop(f, cue(id, 0) - 6, true)} border={C.mintLight}>
        <Mock x={500} y={16} />
        <div style={{ position: "absolute", left: 28, top: 22, fontFamily: ZH, fontSize: 38, color: INK, display: "flex", alignItems: "center", gap: 10 }}><Ico name="memo" size={38} color={C.mint} />可以试试看</div>
        {[0, 1, 2].map((i) => {
          const s = pop(f, when(id, 0, 0.2) + i * 4, true);
          const rot = flipP > 0 && flipP < 1 ? Math.sin(flipP * Math.PI) * 90 : 0;
          return (
            <div key={i} style={{ position: "absolute", left: 28, top: 100 + i * 100, width: 534, height: 82, borderRadius: 18, background: set ? C.lemonLight : C.mintLight, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", boxSizing: "border-box", transform: `scale(${s}) rotateX(${rot}deg)`, fontFamily: ZH, fontSize: 30, color: INK }}>
              <span style={{ fontFamily: TEXT, fontWeight: 700, color: C.blueDeep }}>{i + 1}</span>
              {SUGGEST[set][i]}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, textAlign: "center" }}>
          <Button f={f} press={swap} text={`换一批（还能换 ${f >= swap ? 1 : 2} 次）`} size={30} color={C.pink} />
        </div>
      </Card>
      <Burst f={f} at={swap + 2} x={1190} y={420} text="换一批！" color={C.pink} size={84} hold={30} />
      <Sticker f={f} at={swap + 12} x={1470} y={170} size={150} name="emo-awesome" rot={10} />
    </>
  );
};

// ---------------------------------------------------------------- 私信：发图、撤回（5 分钟内）、在线状态
export const Messages: React.FC<{ f: number }> = ({ f }) => {
  const id = "messages";
  const b2 = when(id, 0, 0.1);
  const b3 = when(id, 0, 0.28);
  const undo = when(id, 0, 0.44);
  const online = when(id, 0, 0.72);
  const bubble = (at: number, me: boolean, top: number, children: React.ReactNode, out?: number) => {
    const s = pop(f, at, true) * (out === undefined ? 1 : 1 - ramp(f, out, out + 6));
    if (s <= 0) return null;
    return (
      <div style={{ position: "absolute", top, [me ? "right" : "left"]: 36, maxWidth: 440, padding: "14px 22px", borderRadius: me ? "26px 26px 6px 26px" : "26px 26px 26px 6px", background: me ? C.blue : "#F1F6FB", color: me ? "#fff" : INK, fontFamily: ZH, fontSize: 32, transform: `scale(${s})`, transformOrigin: me ? "right bottom" : "left bottom" }}>
        {children}
      </div>
    );
  };
  const live = f >= online;
  return (
    <>
      <Header f={f} no="08" title="私信" en="Messages" color={C.pink} />
      <Card x={200} y={190} w={760} h={600} rot={-1} s={pop(f, 2, true)} border={C.blueLight}>
        <Mock x={670} y={86} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 76, background: "#F7FBFE", display: "flex", alignItems: "center", gap: 16, padding: "0 26px" }}>
          <div style={{ width: 50, height: 50, borderRadius: 25, overflow: "hidden", background: C.blueLight }}>
            <Img src={asset("img/emo-love.png")} style={{ width: "100%", height: "100%" }} />
          </div>
          <span style={{ fontFamily: ZH, fontSize: 32, color: INK }}>追番的猫</span>
          <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: live ? C.mint : "#C5CFDA", boxShadow: live ? `0 0 0 ${6 + 4 * Math.sin((f - online) / 4)}px ${C.mint}44` : "none" }} />
          <span style={{ fontFamily: ZH, fontSize: 26, color: live ? C.mint : INK_SOFT }}>{live ? "在线" : "离线"}</span>
        </div>
        {bubble(4, false, 104, "周末一起逛漫展吗？")}
        {bubble(b2, true, 184, <Img src={asset("img/cover.png")} style={{ width: 280, height: 93, objectFit: "cover", borderRadius: 14, display: "block" }} />)}
        {bubble(b3, true, 320, "啊发错图了…", undo)}
        {f >= undo + 4 ? <div style={{ position: "absolute", top: 334, left: 0, right: 0, textAlign: "center", fontFamily: ZH, fontSize: 26, color: INK_SOFT, opacity: ramp(f, undo + 4, undo + 10), display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}><Ico name="undo" size={26} color={INK_SOFT} />你撤回了一条消息</div> : null}
        {bubble(when(id, 0, 0.58), false, 410, <Img src={asset("img/emo-hooray.png")} style={{ width: 120, height: 120, display: "block" }} />)}
      </Card>
      <Twinkle f={f} at={undo} x={760} y={540} kind="spark" />
      <Shot f={f} at={6} src={asset("img/messages.png")} imgW={1536} imgH={960} x={1030} y={200} w={430} rot={5} />
      <Note f={f} at={b2} x={1060} y={530} w={360} h={200} color={C.blueLight} rot={-3}>
        {[["image", "能发图"], ["undo", "5 分钟内能撤回"], ["eye", "看得到在不在线"]].map(([ic, t]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: ZH, fontSize: 30, color: INK, marginBottom: 10 }}><Ico name={ic as "image"} size={32} color={C.blueDeep} />{t}</div>
        ))}
      </Note>
      <Burst f={f} at={online} x={580} y={420} text="在线！" color={C.mint} size={84} hold={30} />
    </>
  );
};

// ---------------------------------------------------------------- 个人中心：收藏夹（真截图）、裁剪头像（示意）、凭手机验证码改密码（真截图）
export const Profile: React.FC<{ f: number }> = ({ f }) => {
  const id = "profile";
  const crop0 = when(id, 0, 0.2);
  const saved = when(id, 0, 0.42);
  const pw = when(id, 0, 0.6);
  const zoom = 1 + 0.35 * ease(ramp(f, crop0, crop0 + 18));
  return (
    <>
      <Header f={f} no="09" title="个人中心" en="Profile" color={C.lilac} />
      <Stamp f={f} at={8} x={880} y={110} text="翻新" size={44} rot={-8} color={C.lilac} />
      <Shot f={f} at={3} src={v2("folders.jpg")} imgW={800} imgH={491} x={940} y={150} w={540} rot={4} caption="我的收藏"
        from={{ x: 0, y: 0, w: 800, h: 491 }} to={{ x: 0, y: 40, w: 640, h: 393 }} move={[6, 90]} />
      <Card x={80} y={200} w={480} h={560} rot={-1.5} s={pop(f, cue(id, 0) - 4, true)} border={C.lilacLight}>
        <Mock x={390} y={16} />
        <div style={{ position: "absolute", left: 30, top: 24, fontFamily: ZH, fontSize: 38, color: INK }}>裁剪头像</div>
        <div style={{ position: "absolute", left: 40, top: 96, width: 340, height: 340, overflow: "hidden", borderRadius: 12, opacity: f >= saved ? 0.25 : 1 }}>
          <Img src={asset("img/neko.png")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, transparent 150px, rgba(255,255,255,0.65) 151px)" }} />
          <div style={{ position: "absolute", left: 20, top: 20, width: 300, height: 300, borderRadius: 150, border: "4px dashed #fff" }} />
        </div>
        <div style={{ position: "absolute", left: 410, top: 110, width: 14, height: 300, borderRadius: 7, background: C.lilacLight }}>
          <div style={{ position: "absolute", left: -11, top: 260 - 200 * ease(ramp(f, crop0, crop0 + 18)), width: 36, height: 36, borderRadius: 18, background: C.lilac }} />
        </div>
        {f >= saved ? (
          <Img src={asset("img/neko.png")} style={{ position: "absolute", left: 110, top: 150, width: 220, height: 220, borderRadius: 110, objectFit: "cover", border: "6px solid #fff", boxShadow: `0 0 0 5px ${C.lilac}`, transform: `scale(${pop(f, saved)})` }} />
        ) : null}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 28, textAlign: "center" }}>
          <Button f={f} press={saved - 3} text={f >= saved ? "已保存" : "保存"} size={30} color={f >= saved ? C.mint : C.lilac} />
        </div>
      </Card>
      <Shot f={f} at={pw - 6} src={v2("password.jpg")} imgW={800} imgH={491} x={560} y={300} w={620} rot={-2}
        from={{ x: 380, y: 100, w: 420, h: 258 }} to={{ x: 400, y: 120, w: 400, h: 245 }} move={[pw, pw + 60]}
        marks={[{ at: pw + 14, x: 440, y: 220, w: 150, h: 22, color: RED, label: "验证码发到手机", side: "bottom" }]} />
      <Burst f={f} at={when(id, 0, 0.86)} x={870} y={240} text="密码能重置啦" color={C.lilac} size={70} hold={34} />
      <Sticker f={f} at={saved + 4} x={1440} y={780} size={130} name="emo-headpat" rot={-8} />
    </>
  );
};
