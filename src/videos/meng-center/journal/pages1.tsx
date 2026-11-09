// 手帐前几页：封面、注册、首页、发帖、评论区。坐标都是页面内的（页面 1580×900，40 帧/秒）
// 截图：注册、发帖、评论区是 2026-11-07 改版后的真截图（img/v2/，800 宽）；首页是 11-01 的（这次没大改）
import React from "react";
import { Img, interpolate } from "remotion";
import { C, TEXT, ZH, asset } from "../theme";
import { Button, Card, Chip, Draw, Header, INK, INK_SOFT, Marker, RED, Sticker, Stamp, Tape, Twinkle, Typer, pop, ramp, wobble } from "./paper";
import { Burst, Ico, Shot } from "./parts";
import { BEAT, cue, cueEnd } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const v2 = (n: string) => asset(`img/v2/${n}`);

// 某一幕第 k 句念到 frac 处的本地帧
export const when = (id: string, k: number, frac: number) => Math.round(cue(id, k) + (cueEnd(id, k) - cue(id, k)) * frac);

// 手画的界面卡片角上标一个「示意」
export const Mock: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <span style={{ position: "absolute", left: x, top: y, fontFamily: ZH, fontSize: 22, color: INK_SOFT, background: "#F1F4F8", borderRadius: 8, padding: "2px 10px" }}>示意</span>
);

// ---------------------------------------------------------------- 封面
export const Cover: React.FC<{ f: number }> = ({ f }) => {
  const title = "奶糖的萌部落手帐";
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "#BCDDF5", backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 3px, transparent 3.5px), radial-gradient(rgba(255,255,255,0.4) 2px, transparent 2.5px)", backgroundSize: "56px 56px, 56px 56px", backgroundPosition: `${f * 0.4}px 0, ${28 + f * 0.4}px 28px` }} />
      <div style={{ position: "absolute", right: 380, top: 0, width: 54, height: 900, background: C.pink, opacity: 0.85 }} />
      {/* 标签纸 */}
      <div style={{ position: "absolute", left: 120, top: 190, width: 960, height: 380, transform: `rotate(-2deg) scale(${pop(f, 0, true)})`, background: "#FFFDF6", borderRadius: 34, border: `6px dashed ${C.blue}`, boxShadow: "0 18px 30px rgba(41,72,106,0.18)" }}>
        <div style={{ position: "absolute", left: 60, top: 70, display: "flex" }}>
          {title.split("").map((ch, i) => {
            const s = pop(f, 4 + i * (BEAT / 2));
            return <span key={i} style={{ fontFamily: ZH, fontSize: 104, color: i < 2 ? C.blueDeep : INK, display: "inline-block", transform: `translateY(${(1 - s) * -60}px) scale(${s}) rotate(${wobble(f, i, 2)}deg)` }}>{ch}</span>;
          })}
        </div>
        <Marker f={f} at={70} x={64} y={190} w={820} h={26} color="rgba(244,163,188,0.55)" />
        <div style={{ position: "absolute", left: 66, top: 236, fontFamily: TEXT, fontWeight: 600, fontSize: 46, color: INK_SOFT, opacity: ramp(f, 72, 82) }}>Meng Center · 更新特辑</div>
        <Tape x={40} y={20} w={170} rot={-32} color="rgba(142,212,181,0.85)" />
        <Tape x={920} y={360} w={170} rot={-32} color="rgba(246,213,126,0.85)" pattern="dot" />
      </div>
      <Img src={asset("img/logo.png")} style={{ position: "absolute", left: 960, top: 110, width: 190, height: 190, objectFit: "contain", transform: `rotate(${12 + wobble(f, 2, 2)}deg) scale(${pop(f, 32)})`, filter: "drop-shadow(0 0 0 #fff) drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff)" }} />
      <Stamp f={f} at={64} x={930} y={680} text="2026.11" sub="UPDATE" size={52} rot={-14} round />
      <Sticker f={f} at={16} x={250} y={700} size={190} name="emo-hooray" rot={-8} />
      <Sticker f={f} at={48} x={510} y={730} size={150} name="emo-love" rot={6} />
      <Sticker f={f} at={96} x={130} y={130} size={140} name="emo-awesome" rot={-10} />
      <Twinkle f={f} at={64} x={860} y={150} kind="star" />
      <Twinkle f={f} at={80} x={1150} y={420} kind="heart" color={C.pink} />
      <Burst f={f} at={cue("intro", 0) + 4} x={620} y={110} text="Hi～" color={C.pink} size={80} hold={48} rot={-4} />
    </>
  );
};

// ---------------------------------------------------------------- 注册：滑块拼图、验证码、「免审核」印章；右上是改版后的注册页
export const Account: React.FC<{ f: number }> = ({ f }) => {
  const id = "account";
  const slide0 = when(id, 0, 0.42);
  const slide = interpolate(f, [slide0, slide0 + 24], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const fitted = f >= slide0 + 24;
  const code = "520131";
  const code0 = slide0 + 28;
  return (
    <>
      <Header f={f} no="01" title="注册" en="Sign up" color={C.pink} />
      <Card x={80} y={200} w={620} h={540} rot={-1.5} s={pop(f, 4, true)}>
        <Mock x={530} y={16} />
        <div style={{ position: "absolute", left: 36, top: 26, fontFamily: ZH, fontSize: 38, color: INK }}>滑块验证 + 验证码</div>
        <div style={{ position: "absolute", left: 36, top: 90, width: 548, height: 200, borderRadius: 16, overflow: "hidden" }}>
          <Img src={asset("img/cover.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 400, top: 60, width: 84, height: 84, borderRadius: 14, background: "rgba(255,255,255,0.65)", border: "3px dashed #fff", opacity: fitted ? 0 : 1 }} />
          <div style={{ position: "absolute", left: 20 + slide * 380, top: 60, width: 84, height: 84, borderRadius: 14, overflow: "hidden", boxShadow: "0 0 0 3px #fff, 0 6px 12px rgba(0,0,0,0.3)" }}>
            <Img src={asset("img/cover.png")} style={{ position: "absolute", width: 548, height: 200, left: -400, top: -60, objectFit: "cover" }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 36, top: 312, width: 548, height: 64, borderRadius: 32, background: fitted ? `${C.mint}55` : C.blueLight }}>
          <div style={{ position: "absolute", left: 6 + slide * 380, top: 6, width: 156, height: 52, borderRadius: 26, background: fitted ? C.mint : C.blue, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: ZH, fontSize: 28, color: "#fff" }}>
            {fitted ? <><Ico name="check" size={28} color="#fff" width={3} />通过</> : "》》"}
          </div>
        </div>
        <div style={{ position: "absolute", left: 36, top: 404, display: "flex", gap: 12 }}>
          {code.split("").map((d, i) => {
            const on = f >= code0 + i * 3;
            return (
              <div key={i} style={{ width: 80, height: 86, borderRadius: 14, border: `4px solid ${on ? C.pink : C.blueLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TEXT, fontWeight: 700, fontSize: 50, color: INK, transform: `scale(${on ? pop(f, code0 + i * 3) : 1})` }}>
                {on ? d : ""}
              </div>
            );
          })}
        </div>
      </Card>
      <Shot f={f} at={6} src={v2("register.jpg")} imgW={560} imgH={370} x={860} y={170} w={500} rot={3} caption="改版后的注册页" />
      <div style={{ position: "absolute", left: 790, top: 620, fontFamily: ZH, fontSize: 46, color: INK_SOFT, opacity: ramp(f, 10, 16) }}>注册 → 等管理员审核…</div>
      <Draw f={f} at={when(id, 0, 0.1)} dur={8} x={780} y={610} w={560} h={80} d="M 10 44 C 150 28, 360 52, 550 34" color={RED} width={8} />
      <Stamp f={f} at={when(id, 0, 0.26)} x={1340} y={735} text="免审核" sub="NO WAITING" size={70} rot={-10} />
      <Burst f={f} at={when(id, 0, 0.72)} x={720} y={330} text="直接进来玩！" color={C.blueDeep} size={84} hold={36} />
      <Twinkle f={f} at={when(id, 0, 0.28)} x={1460} y={600} kind="star" />
    </>
  );
};

// ---------------------------------------------------------------- 首页：截图 + 推荐关注（头像、昵称、等级、理由、关注；标题行右边「换一批」）
const PEOPLE = [
  ["emo-work", "像素小画家", 3, "也在画插画"], ["emo-love", "追番的猫", 5, "常看同一类番"], ["emo-sleepy", "早睡冠军", 2, "日常区常客"], ["emo-popsicle", "草莓蛋糕", 4, "也喜欢手帐"], ["emo-expert", "手帐控", 6, "你收藏过 TA 的帖"],
  ["emo-wow", "星星收集家", 3, "也爱拍天空"], ["emo-shy", "雨天读书", 2, "常看同一类帖"], ["emo-headpat", "摸摸头", 4, "游戏区常客"], ["emo-airplane", "去旅行吧", 5, "也爱拍风景"], ["emo-awesome", "今天也元气", 3, "日常区常客"],
] as const;

export const Home: React.FC<{ f: number }> = ({ f }) => {
  const id = "home";
  const rows = when(id, 0, 0.5);
  const swap = when(id, 0, 0.9);
  const flipP = ramp(f, swap, swap + 8);
  const batch = flipP > 0.5 ? 1 : 0;
  return (
    <>
      <Header f={f} no="02" title="首页" en="Home" color={C.blue} />
      <Shot f={f} at={3} src={asset("img/home.png")} imgW={1536} imgH={960} x={70} y={190} w={800} rot={-2.5} caption="推荐 · 最新 · 热门"
        from={{ x: 0, y: 0, w: 1536, h: 960 }} to={{ x: 160, y: 80, w: 1280, h: 800 }} move={[10, 200]} />
      <Burst f={f} at={when(id, 0, 0.12)} x={470} y={330} text="越刷越懂你" color={C.pink} size={78} hold={44} />
      <Card x={930} y={190} w={560} h={590} rot={1.5} s={pop(f, when(id, 0, 0.42), true)} border={C.pinkLight} style={{ borderStyle: "dashed" }}>
        <Mock x={30} y={548} />
        <div style={{ position: "absolute", left: 28, top: 22, fontFamily: ZH, fontSize: 36, color: INK }}>可能想关注的人</div>
        <div style={{ position: "absolute", right: 22, top: 20 }}>
          <Button f={f} press={swap - 2} text="换一批" size={26} color={C.pink} />
        </div>
        {Array.from({ length: 5 }, (_, i) => {
          const [img, name, lv, why] = PEOPLE[i + batch * 5];
          const s = pop(f, rows + i * 3);
          const rot = flipP > 0 && flipP < 1 ? Math.sin(flipP * Math.PI) * 90 : 0;
          return (
            <div key={i} style={{ position: "absolute", left: 22, top: 86 + i * 90, width: 516, height: 78, display: "flex", alignItems: "center", gap: 14, transform: `scale(${s}) rotateX(${rot}deg)`, background: "#FFF7FA", borderRadius: 18 }}>
              <div style={{ width: 62, height: 62, marginLeft: 8, borderRadius: 31, background: C.blueLight, overflow: "hidden", flex: "none" }}>
                <Img src={asset(`img/${img}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ width: 250 }}>
                <div style={{ fontFamily: ZH, fontSize: 28, color: INK }}>{name} <Chip text={`Lv.${lv}`} size={18} bg={C.lemonLight} /></div>
                <div style={{ fontFamily: ZH, fontSize: 22, color: INK_SOFT }}>{why}</div>
              </div>
              <Button f={f} text="关注" size={22} color={C.blue} style={{ marginLeft: "auto", marginRight: 12 }} />
            </div>
          );
        })}
      </Card>
      <Twinkle f={f} at={swap + 4} x={1460} y={210} kind="spark" />
    </>
  );
};

// ---------------------------------------------------------------- 发帖：真截图上逐个圈出来；右边小卡片演一遍 AI 写开头、挑标签、画封面
export const Editor: React.FC<{ f: number }> = ({ f }) => {
  const id = "editor";
  const open = when(id, 1, 0.36);
  const tags = when(id, 1, 0.52);
  const cover = when(id, 1, 0.72);
  const brush = ramp(f, cover, cover + 20);
  return (
    <>
      <Header f={f} no="03" title="发帖" en="Post" color={C.mint} />
      <Shot f={f} at={2} src={v2("editor.jpg")} imgW={800} imgH={507} x={60} y={180} w={880} rot={-1.5}
        marks={[
          { at: when(id, 0, 0.12), x: 553, y: 124, w: 200, h: 78, color: C.blueDeep, label: "最多 10 张配图", side: "bottom" },
          { at: when(id, 0, 0.62), x: 594, y: 102, w: 40, h: 18, color: RED, label: "视频演示" },
          { at: open, x: 166, y: 119, w: 62, h: 17, color: C.lilac, label: "AI 激发灵感", side: "bottom" },
          { at: tags, x: 690, y: 341, w: 64, h: 18, color: C.lilac, label: "AI 挑选标签", side: "bottom" },
          { at: cover, x: 685, y: 224, w: 68, h: 18, color: C.lilac, label: "AI 生成封面图" },
        ]} />
      <Burst f={f} at={cue(id, 1)} x={500} y={460} text="没灵感？" color={C.lilac} size={84} hold={30} />
      {/* 右边：AI 帮帮忙（示意） */}
      <Card x={1010} y={190} w={490} h={590} rot={1.5} s={pop(f, cue(id, 1) + 6, true)} border={C.lilacLight} color="#FCFAFF">
        <Mock x={406} y={16} />
        <div style={{ position: "absolute", left: 28, top: 22, fontFamily: ZH, fontSize: 36, color: INK, display: "flex", alignItems: "center", gap: 10 }}><Ico name="wand" size={36} color={C.lilac} />AI 帮帮忙</div>
        <div style={{ position: "absolute", left: 28, top: 84, width: 434, fontFamily: ZH, fontSize: 28, color: INK, lineHeight: 1.5, minHeight: 84 }}>
          <Typer f={f} at={open} text="今天把这周的小确幸都贴进了手帐里～" cps={14} caret={f >= open} />
        </div>
        <div style={{ position: "absolute", left: 28, top: 176, display: "flex", gap: 10 }}>
          {["#手帐", "#日常", "#二次元"].map((t, i) => (
            <span key={t} style={{ transform: `scale(${pop(f, tags + i * 4)})`, display: "inline-block" }}><Chip text={t} bg={C.lemonLight} size={26} /></span>
          ))}
        </div>
        <div style={{ position: "absolute", left: 28, top: 246, width: 434, height: 244, borderRadius: 16, border: `4px dashed ${C.lilac}`, overflow: "hidden", boxSizing: "border-box", opacity: ramp(f, cover - 6, cover) }}>
          <Img src={asset("img/cover.png")} style={{ width: "100%", height: "100%", objectFit: "cover", clipPath: `polygon(0 0, ${brush * 140}% 0, ${brush * 140 - 40}% 100%, 0 100%)` }} />
          {brush > 0 && brush < 1 ? <div style={{ position: "absolute", left: `${brush * 120 - 20}%`, top: "35%" }}><Ico name="wand" size={70} color={C.pink} width={2.6} /></div> : null}
        </div>
        <div style={{ position: "absolute", right: 30, top: 508, opacity: ramp(f, cover + 20, cover + 24) }}>
          <Chip text="更换" bg={C.mint} color="#fff" size={26} />
        </div>
      </Card>
      <Twinkle f={f} at={cover + 20} x={1450} y={430} kind="star" />
    </>
  );
};

// ---------------------------------------------------------------- 评论区：真截图圈出图片、表情、@；右边几条示意评论
export const Detail: React.FC<{ f: number }> = ({ f }) => {
  const id = "detail";
  const c1 = when(id, 0, 0.36);
  const c2 = when(id, 0, 0.56);
  const c3 = when(id, 0, 0.78);
  const row = (at: number, top: number, avatar: string, name: string, children: React.ReactNode) => {
    const s = pop(f, at, true);
    if (f < at) return null;
    return (
      <div style={{ position: "absolute", left: 24, top, width: 470, display: "flex", gap: 14, opacity: Math.min(1, s * 1.5), transform: `translateX(${(1 - s) * 50}px)` }}>
        <div style={{ width: 58, height: 58, borderRadius: 29, background: C.blueLight, overflow: "hidden", flex: "none" }}>
          <Img src={asset(`img/${avatar}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontFamily: ZH, fontSize: 24, color: INK_SOFT }}>{name}</div>
          <div style={{ fontFamily: ZH, fontSize: 30, color: INK, marginTop: 2, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>{children}</div>
        </div>
      </div>
    );
  };
  return (
    <>
      <Header f={f} no="04" title="评论区" en="Comments" color={C.lilac} />
      <Stamp f={f} at={10} x={790} y={110} text="重做啦" size={44} rot={8} color={C.blueDeep} />
      <Shot f={f} at={2} src={v2("comments.jpg")} imgW={800} imgH={491} x={60} y={180} w={860} rot={-1.5}
        from={{ x: 0, y: 0, w: 800, h: 491 }} to={{ x: 30, y: 110, w: 620, h: 380 }} move={[8, 60]}
        marks={[
          { at: c1, x: 140, y: 380, w: 50, h: 22, color: C.blueDeep, label: "带图", side: "bottom" },
          { at: c2, x: 96, y: 284, w: 200, h: 38, color: C.pink, label: "带表情" },
          { at: c3, x: 90, y: 182, w: 82, h: 17, color: RED, label: "@ 好友" },
        ]} />
      <Card x={1000} y={200} w={500} h={560} rot={2} s={pop(f, when(id, 0, 0.25), true)} border={C.lilacLight}>
        <Mock x={420} y={14} />
        <div style={{ position: "absolute", left: 24, top: 20, fontFamily: ZH, fontSize: 32, color: INK, display: "flex", alignItems: "center", gap: 10 }}><Ico name="chat" size={32} color={C.lilac} />评论</div>
        {row(c1, 84, "emo-love", "追番的猫", <>好可爱！我也想做一本<Img src={asset("img/cover.png")} style={{ width: 150, height: 50, objectFit: "cover", borderRadius: 8 }} /></>)}
        {row(c2, 240, "emo-popsicle", "草莓蛋糕", <>哈哈哈<Img src={asset("img/emo-wow.png")} style={{ width: 64, height: 64 }} /><Img src={asset("img/emo-hooray.png")} style={{ width: 64, height: 64 }} /></>)}
        {row(c3, 380, "emo-expert", "手帐控", <><span style={{ color: C.blueDeep, background: C.blueLight, borderRadius: 10, padding: "0 8px" }}>@像素小画家</span>周末一起去文具店吗？</>)}
      </Card>
      <Twinkle f={f} at={c3 + 4} x={1480} y={640} kind="heart" color={C.pink} />
    </>
  );
};
