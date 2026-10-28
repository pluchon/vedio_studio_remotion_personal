// 一张很长的纸：八叠海报和贴纸按念白从左铺到右。
import React from "react";
import {
  Breath,
  CalendarDraw,
  CarDraw,
  DoorDraw,
  DuvetDraw,
  EvenRain,
  EyeBadge,
  FourIcons,
  LampDraw,
  PapersDraw,
  ProspectSplit,
  Quilt,
  SnowTV,
  Spectrum,
  SunDraw,
  Waveform,
  WindowNight,
  WorldRoom,
  DropSticker,
} from "./art";
import { Card, Halftone, Kicker, Note, PaperSheet, Stamp, Sticker, Tape, Title, appear, pop, ramp } from "./kit";
import { at } from "./script";
import { C, FONT_EN, FONT_ITAL, FONT_NUM, FONT_ZH, WORLD } from "./theme";

export const Desk: React.FC<{ t: number }> = ({ t }) => {
  const dim = ramp(t, at("天替你关了灯"), at("注意力就缩进去了"));
  const cover = ramp(t, at("像一层毯子"), at("是突然"));
  const flat = ramp(t, at("雨把背景垫高"), at("落差就平了"));
  const shut = ramp(t, at("是雨把世界关小了") - 0.4, at("晚安"));
  const cancel = ramp(t, at("计划取消了"), at("世界暂时不来找你"));
  const shrink = ramp(t, at("桌上那一小圈暖黄"), at("注意力就缩进去了"));
  const doorOpen = pop(t, at("一声关门"), 0.8);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WORLD.w, height: WORLD.h }}>
      <PaperSheet w={WORLD.w} h={WORLD.h} />
      {Array.from({ length: 28 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 180 + ((i * 437) % 12000),
            top: 80 + ((i * 211) % 1900),
            transform: `rotate(${(i * 17) % 50 - 25}deg)`,
            opacity: 0.55,
          }}
        >
          <DropSticker size={28 + (i % 5) * 8} />
        </div>
      ))}

      {/* — 窗 — */}
      <Card x={60} y={80} w={920} h={380} rot={-1.8} t={t} fill={C.cream}>
        <div style={{ padding: "36px 48px" }}>
          <Kicker>WHY RAIN HELPS YOU SLEEP</Kicker>
          <div style={{ height: 10 }} />
          <Title size={92} tracking={10}>
            雨未愁眠
          </Title>
          <div style={{ marginTop: 16, fontFamily: FONT_ITAL, fontSize: 26, color: C.inkSoft }}>外面在下雨。不大，也不停。</div>
          <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
            <DropSticker size={36} />
            <DropSticker size={28} />
            <DropSticker size={44} />
          </div>
        </div>
        <Tape x={40} y={-10} w={120} rot={-8} />
        <Tape x={760} y={350} w={110} rot={6} />
      </Card>

      <Card x={720} y={40} w={1200} h={780} rot={1.1} t={t} fill={C.navyDeep} radius={6} thick={10}>
        <WindowNight t={t} />
        <div style={{ position: "absolute", left: 36, bottom: 36 }}>
          <Kicker color={C.lamp}>01  ·  窗</Kicker>
        </div>
      </Card>

      <Sticker x={90} y={520} rot={-7} t={t} at={at("屋里没开大灯") - 0.8} pad={18} radius={28}>
        <LampDraw glow={1} />
      </Sticker>

      <Stamp x={1180} y={860} t={t} at={at("自己困了") - 0.35} label="困了" sub="SLEEPY" rot={-14} />

      <Sticker x={1560} y={820} rot={8} t={t} at={at("不大") - 0.6} pad={12} radius={18}>
        <div style={{ width: 280, height: 200, overflow: "hidden", borderRadius: 8 }}>
          <WindowNight t={t * 0.4} w={280} h={200} />
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontFamily: FONT_EN, fontSize: 12, letterSpacing: 3, color: C.muted }}>NIGHT · CITY</div>
      </Sticker>

      {/* — 声 — */}
      <Card x={2080} y={80} w={640} h={860} rot={-2.2} t={t} at={at("很多人说") - 0.8} fill={C.cream}>
        <div style={{ padding: 28 }}>
          <Kicker>WHITE NOISE</Kicker>
          <Title size={48}>白噪音</Title>
          <Note>每个频率一样响。像没信号的电视，又尖又硬。</Note>
          <div style={{ height: 12 }} />
          <SnowTV t={t} />
          <Spectrum kind="white" t={t} />
        </div>
        <Halftone opacity={0.08} />
      </Card>

      <Card x={2780} y={40} w={660} h={900} rot={1.6} t={t} at={at("其实不是") - 0.4} fill={C.navy} radius={8}>
        <div style={{ padding: 28 }}>
          <Kicker color={C.lamp}>RAIN · PINK-ISH</Kicker>
          <Title size={48} color={C.cream}>
            雨的力气在低处
          </Title>
          <Note color={C.rain}>听感更接近粉红，不是实验室标定的 −3 dB/oct。</Note>
          <Spectrum kind="rain" />
          <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
            {["厚", "软", "像毯子"].map((w) => (
              <div
                key={w}
                style={{
                  padding: "8px 14px",
                  background: C.navyDeep,
                  color: C.lamp,
                  fontFamily: FONT_ZH,
                  fontSize: 22,
                  borderRadius: 8,
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card x={2280} y={980} w={1240} h={600} rot={-0.8} t={t} at={at("像一层毯子") - 0.5} fill={C.cream}>
        <div style={{ position: "absolute", left: 36, top: 28 }}>
          <Kicker>MASKING</Kicker>
          <Title size={44}>毯子盖住的，是突然</Title>
        </div>
        <div style={{ position: "absolute", left: 40, top: 140 }}>
          <Waveform flat={flat} />
        </div>
        <div
          style={{
            position: "absolute",
            left: mix(780, 220, cover),
            top: 160,
            transform: `rotate(${-8 + cover * 6}deg)`,
            filter: "drop-shadow(8px 12px 12px rgba(30,20,10,0.25))",
          }}
        >
          <Quilt />
        </div>
      </Card>

      <Sticker x={3180} y={-20} rot={-9} t={t} at={at("一声关门") - 0.85}>
        <DoorDraw open={doorOpen} />
        <div style={{ textAlign: "center", fontFamily: FONT_ZH, fontSize: 18, color: C.ink, marginTop: 6 }}>关门</div>
      </Sticker>

      <Sticker x={3220} y={520} rot={5} t={t} at={at("一声喇叭") - 0.8}>
        <CarDraw />
        <div style={{ textAlign: "center", fontFamily: FONT_ZH, fontSize: 18, color: C.ink, marginTop: 4 }}>喇叭</div>
      </Sticker>

      <Sticker x={3480} y={980} rot={-4} t={t} at={at("听了一会儿") - 0.7} radius={110} pad={16}>
        <EyeBadge />
        <div style={{ textAlign: "center", fontFamily: FONT_ZH, fontSize: 22, color: C.ink, marginTop: 6 }}>这里没事</div>
      </Sticker>

      <Card x={2100} y={1620} w={2000} h={280} rot={0.4} t={t} at={at("雨把背景垫高") - 0.4} fill={C.paperLight}>
        <div style={{ padding: "20px 36px", display: "flex", alignItems: "center", gap: 28 }}>
          <Kicker>STANCHINA 2005</Kicker>
          <Note size={22}>吵醒人的往往不是峰值，是相对背景跳出来的那一截。垫高之后，落差就平了。</Note>
        </div>
      </Card>

      {/* — 光 — */}
      <Card x={4300} y={50} w={1500} h={940} rot={-0.6} t={t} at={at("阴天常常") - 0.7} fill={C.cream}>
        <div style={{ padding: "32px 40px" }}>
          <Kicker>ILLUMINANCE</Kicker>
          <Title size={56}>天替你关了灯</Title>
          <div style={{ display: "flex", marginTop: 20, gap: 20 }}>
            {[
              { label: "大晴天正午", n: "100,000", unit: "lux", dim: 0, w: 1 },
              { label: "阴天正午", n: "1–10k", unit: "lux", dim: 0.55, w: 0.72 },
              { label: "台灯桌面", n: "200–500", unit: "lux", dim: 0.82, w: 0.5 },
            ].map((col) => (
              <div key={col.label} style={{ flex: 1, background: C.paperDeep, borderRadius: 12, padding: 20, textAlign: "center" }}>
                <SunDraw dim={mix(col.dim, 0.92, dim)} size={160} />
                <div style={{ fontFamily: FONT_NUM, fontSize: 36, color: C.ink, marginTop: 8 }}>{col.n}</div>
                <div style={{ fontFamily: FONT_EN, fontSize: 14, letterSpacing: 2, color: C.muted }}>{col.unit}</div>
                <div style={{ fontFamily: FONT_ZH, fontSize: 20, color: C.inkSoft, marginTop: 8 }}>{col.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, fontFamily: FONT_ITAL, fontSize: 20, color: C.inkSoft }}>阴天常常只有大晴天的几十分之一亮。</div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "flex-end", gap: 16, height: 120 }}>
            <div style={{ width: "70%", height: 120, background: C.gold, borderRadius: 8 }} />
            <div style={{ width: "18%", height: 36, background: C.slate, borderRadius: 8 }} />
            <div style={{ width: "8%", height: 10, background: C.lamp, borderRadius: 8 }} />
          </div>
          <div style={{ display: "flex", marginTop: 8, fontFamily: FONT_EN, fontSize: 13, letterSpacing: 1, color: C.muted }}>
            <div style={{ width: "70%" }}>SUN</div>
            <div style={{ width: "18%" }}>OVERCAST</div>
            <div style={{ width: "12%" }}>LAMP</div>
          </div>
        </div>
      </Card>

      <Card x={4460} y={1080} w={1080} h={740} rot={1.4} t={t} at={at("桌上那一小圈暖黄") - 0.45} fill={C.navyDeep}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 46%, ${C.lamp} 0%, ${C.gold} ${18 + (1 - shrink) * 28}%, ${C.navyDeep} ${32 + (1 - shrink) * 40}%)` }} />
        <div style={{ position: "absolute", left: 400, top: 180 }}>
          <LampDraw glow={1.1} w={280} h={360} />
        </div>
        <div style={{ position: "absolute", left: 40, top: 36 }}>
          <Kicker color={C.lamp}>ATTENTION</Kicker>
          <Title size={44} color={C.cream}>
            注意力缩进这一圈
          </Title>
        </div>
        <Halftone color={C.gold} opacity={0.12} />
      </Card>

      {/* — 窗与被 — */}
      <Card x={5680} y={40} w={1480} h={820} rot={-0.5} t={t} at={at("有人说") - 0.55} fill={C.cream} radius={6} thick={10}>
        <ProspectSplit t={t} />
      </Card>

      <Card x={5720} y={900} w={480} h={280} rot={-6} t={t} at={at("有人说")} fill={C.cream}>
        <div style={{ padding: 24 }}>
          <Kicker>APPLETON 1975</Kicker>
          <Note>看得见外面，外面却碰不到自己。理论转述，不是定律。</Note>
        </div>
        <Tape x={180} y={-12} w={100} rot={4} />
      </Card>

      <Sticker x={6380} y={1040} rot={4} t={t} at={at("被子也一样") - 0.7} pad={16} radius={26}>
        <DuvetDraw w={640} h={400} />
        <div style={{ textAlign: "center", fontFamily: FONT_ZH, fontSize: 22, color: C.ink, marginTop: 4 }}>被子也一样</div>
      </Sticker>

      {/* — 许可 — */}
      <Card x={7280} y={50} w={760} h={920} rot={-1.2} t={t} at={at("下雨天") - 0.5} fill={C.cream}>
        <CalendarDraw cancel={cancel} />
      </Card>

      <Card x={8120} y={70} w={720} h={540} rot={2.2} t={t} at={at("世界暂时不来找你") - 0.35} fill={C.navy}>
        <div style={{ padding: 28 }}>
          <Kicker color={C.lamp}>RAIN CHECK</Kicker>
          <Title size={48} color={C.cream}>
            世界暂时不来找你
          </Title>
          <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
            {["计划", "出门", "等人"].map((w) => (
              <div
                key={w}
                style={{
                  flex: 1,
                  height: 160,
                  background: C.navyDeep,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_ZH,
                  fontSize: 28,
                  color: C.muted,
                  textDecoration: "line-through",
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Sticker x={8160} y={660} rot={7} t={t} at={at("什么都不做") - 0.55} pad={22} radius={16}>
        <div style={{ width: 340, fontFamily: FONT_ZH, fontSize: 36, color: C.ink, lineHeight: 1.35 }}>什么都不做，也不用愧疚。</div>
      </Sticker>

      <Stamp x={7680} y={980} t={t} at={at("计划取消了")} label="取消" sub="CANCELLED" rot={12} />

      {/* — 匀速 — */}
      <Card x={8880} y={50} w={720} h={900} rot={-0.8} t={t} at={at("雨是匀速的") - 0.45} fill={C.navyDeep} radius={8}>
        <EvenRain t={t} />
        <div style={{ position: "absolute", left: 28, top: 28 }}>
          <Kicker color={C.lamp}>STEADY</Kicker>
          <Title size={48} color={C.cream}>
            雨是匀速的
          </Title>
        </div>
      </Card>

      <Card x={9000} y={1040} w={680} h={680} rot={3} t={t} at={at("呼吸跟着慢下来") - 0.3} fill={C.cream}>
        <div style={{ padding: 24, textAlign: "center" }}>
          <Kicker>BREATH</Kicker>
          <Title size={40}>呼吸跟着慢下来</Title>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <Breath t={t} />
          </div>
        </div>
      </Card>

      {/* — 实话 — */}
      <Card x={10100} y={30} w={900} h={1000} rot={-1} t={t} at={at("说句实话") - 0.5} fill={C.cream} thick={12}>
        <div style={{ padding: 20 }}>
          <PapersDraw />
        </div>
      </Card>

      <Stamp x={10740} y={620} t={t} at={at("并没有定论")} label="没有定论" sub="VERY LOW" rot={-18} />

      <Card x={10120} y={1080} w={1480} h={720} rot={0.6} t={t} at={at("剩下的") - 0.35} fill={C.paperLight}>
        <div style={{ padding: "28px 32px" }}>
          <Kicker>THE REST</Kicker>
          <Title size={44}>灰天、小灯、一扇窗、一床被子</Title>
          <div style={{ display: "flex", gap: 18, marginTop: 24 }}>
            {(
              [
                ["sky", "灰天"],
                ["lamp", "小灯"],
                ["window", "一扇窗"],
                ["duvet", "一床被子"],
              ] as const
            ).map(([id, label], i) => (
              <div
                key={id}
                style={{
                  flex: 1,
                  background: C.white,
                  borderRadius: 14,
                  padding: 12,
                  boxShadow: "0 8px 0 rgba(30,22,16,0.12)",
                  transform: `rotate(${[-3, 2, -1.5, 3][i]}deg) scale(${appear(t, at("剩下的") + i * 0.18)})`,
                }}
              >
                <div style={{ overflow: "hidden", borderRadius: 8, height: 150 }}>
                  <FourIcons which={id} />
                </div>
                <div style={{ textAlign: "center", fontFamily: FONT_ZH, fontSize: 22, marginTop: 10, color: C.ink }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* — 关小 — */}
      <Card x={11500} y={40} w={980} h={980} rot={-0.4} t={t} at={at("让人安心的") - 0.5} fill={C.navyDeep} radius={8} thick={12}>
        <WorldRoom shut={shut} />
        <div style={{ position: "absolute", left: 32, top: 32 }}>
          <Kicker color={C.lamp}>THE WORLD, SMALLER</Kicker>
          <Title size={48} color={C.cream}>
            雨把世界关小了
          </Title>
        </div>
      </Card>

      <Card x={11620} y={1080} w={900} h={520} rot={1.2} t={t} at={at("晚安") - 0.55} fill={C.cream}>
        <div style={{ padding: "36px 40px", textAlign: "center" }}>
          <Title size={108} tracking={16}>
            晚安
          </Title>
          <div style={{ marginTop: 8, fontFamily: FONT_ITAL, fontSize: 22, color: C.inkSoft }}>灯可以关了。</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <LampDraw glow={0.15} w={160} h={180} />
          </div>
          <div style={{ marginTop: 8, fontFamily: FONT_EN, fontSize: 12, letterSpacing: 1, color: C.muted }}>
            Meditation Impromptu 02 — Kevin MacLeod (incompetech.com) — CC BY
          </div>
        </div>
        <Tape x={60} y={-8} w={130} rot={-6} />
        <Tape x={700} y={490} w={120} rot={8} />
      </Card>
    </div>
  );
};

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
