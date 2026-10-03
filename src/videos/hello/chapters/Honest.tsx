// 老实交代：灯暗下来，只留一束光。会出错、不记得上一回、有没有感受自己也不确定，但不骗人
import { noise2D } from "@remotion/noise";
import { SkiaCanvas } from "@remotion/skia";
import { Fill, Shader, Skia } from "@shopify/react-native-skia";
import React from "react";
import { random } from "remotion";
import { Pose, REST } from "../Buddy";
import { clamp, EASE, mix, pop, ramp } from "../motion";
import { Mark, Pop, sticker } from "../stickers";
import { C, GROUND, HEIGHT, TEXT, WIDTH } from "../theme";

const T = {
  sign: 3.0,
  wrong: 4.75,
  check: 6.3,
  signOut: 8.3,
  chat: 8.6,
  fade: 9.5,
  book: 11.5,
  bookOut: 13.3,
  heart: 13.7,
  heartOut: 16.2,
  vow: 16.5,
};
const ME_X = 960;

// 夜色、一束从上面打下来的光、远处几颗星：逐个像素算出来的
const NIGHT = Skia.RuntimeEffect.Make(`
uniform float2 size;
uniform float time;
uniform float2 spot;
uniform float open;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

half4 main(float2 p) {
  float2 uv = p / size;
  float3 col = mix(float3(0.16, 0.13, 0.29), float3(0.28, 0.22, 0.44), uv.y);
  float wide = 130.0 + p.y * 0.46;
  float beam = exp(-pow((p.x - spot.x) / wide, 2.0));
  beam *= 1.0 - smoothstep(spot.y - 30.0, spot.y + 60.0, p.y);
  col += float3(0.42, 0.35, 0.24) * beam * open;
  float2 cell = floor(p / 70.0);
  float2 f = fract(p / 70.0) - 0.5;
  float h = hash(cell);
  float2 off = (float2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5) * 0.6;
  float star = 1.0 - smoothstep(0.0, 0.05, length(f - off));
  star *= step(0.8, h) * (0.45 + 0.55 * sin(time * 2.2 + h * 40.0));
  col += float3(1.0, 0.94, 0.78) * star * (1.0 - beam * open) * (1.0 - smoothstep(0.25, 0.7, uv.y));
  return half4(half3(col), 1.0);
}`);

export const pose = (t: number): Pose => {
  const proud =
    ramp(t, T.sign + 0.2, T.sign + 0.5) -
    ramp(t, T.wrong - 0.05, T.wrong + 0.05);
  const oops =
    ramp(t, T.wrong, T.wrong + 0.1) - ramp(t, T.check - 0.3, T.check);
  const left =
    ramp(t, T.chat, T.chat + 0.3) - ramp(t, T.bookOut, T.bookOut + 0.4);
  const up =
    ramp(t, T.heart, T.heart + 0.4) -
    ramp(t, T.heartOut - 0.3, T.heartOut + 0.2);
  const right =
    ramp(t, T.sign, T.sign + 0.3) - ramp(t, T.signOut - 0.2, T.signOut + 0.2);
  return {
    ...REST,
    x: ME_X,
    lookX: 0.8 * right - 0.8 * left,
    lookY: -0.4 * right - 0.3 * left - 0.9 * up,
    squash: 0.08 * oops * Math.exp(-(t - T.wrong) * 3),
    tilt:
      oops * Math.sin((t - T.wrong) * 26) * 4 * Math.exp(-(t - T.wrong) * 4),
    wave: proud,
    mood:
      proud > 0.5 || (t > T.book + 0.3 && t < T.bookOut)
        ? "happy"
        : oops > 0.5 && t < T.wrong + 0.7
          ? "wow"
          : oops > 0.5 || (t > T.fade && t < T.book)
            ? "flat"
            : "smile",
  };
};

// 聊天气泡：说完就散成小点飘走
const Bubbles: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.chat || t > T.book) return null;
  const items = [
    { x: 500, y: 300, w: 300, mine: false },
    { x: 420, y: 430, w: 380, mine: true },
    { x: 520, y: 560, w: 260, mine: false },
  ];
  return (
    <>
      {items.map((item, i) => {
        const gone = ramp(t, T.fade + i * 0.3, T.fade + 0.8 + i * 0.3);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: item.x - item.w / 2,
                top: item.y - 44,
                width: item.w,
                height: 88,
                opacity: 1 - gone,
                transform: `scale(${pop(t, T.chat + i * 0.16) * (1 - 0.15 * gone)})`,
                ...sticker(44, item.mine ? C.coralLight : C.white),
              }}
            >
              <div
                style={{
                  margin: "32px 34px",
                  height: 12,
                  borderRadius: 6,
                  background: C.ink,
                  opacity: 0.6,
                }}
              />
            </div>
            {gone > 0 && gone < 1
              ? Array.from({ length: 12 }, (_, k) => (
                  <div
                    key={k}
                    style={{
                      position: "absolute",
                      left:
                        item.x +
                        (random(`dot-x-${i}-${k}`) - 0.5) *
                          item.w *
                          (1 + gone * 0.6),
                      top:
                        item.y +
                        (random(`dot-y-${i}-${k}`) - 0.5) * 80 -
                        gone * (70 + random(`dot-u-${i}-${k}`) * 120),
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      background: C.white,
                      opacity: Math.sin(gone * Math.PI) * 0.8,
                    }}
                  />
                ))
              : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const Back: React.FC<{ t: number }> = ({ t }) => {
  const open = ramp(t, 0.2, 1.2, EASE.out);
  const tight = ramp(t, T.vow, T.vow + 0.8);
  const slam = pop(t, T.wrong, 1.5);
  const shake =
    t > T.wrong
      ? Math.sin((t - T.wrong) * 40) * 8 * Math.exp(-(t - T.wrong) * 6)
      : 0;
  const sweep = ramp(t, T.check + 0.1, T.check + 1.5, EASE.soft);
  return (
    <>
      <SkiaCanvas width={WIDTH} height={HEIGHT}>
        <Fill>
          {NIGHT ? (
            <Shader
              source={NIGHT}
              uniforms={{
                size: [WIDTH, HEIGHT],
                time: t,
                spot: [ME_X, GROUND],
                open: open * (1 + 0.35 * tight),
              }}
            />
          ) : null}
        </Fill>
      </SkiaCanvas>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ellipse
          cx={WIDTH / 2}
          cy={GROUND + 520}
          rx={1500}
          ry={560}
          fill="#2B2347"
        />
        <ellipse
          cx={ME_X}
          cy={GROUND + 14}
          rx={mix(430, 330, tight)}
          ry={mix(74, 58, tight)}
          fill={C.lemon}
          opacity={0.42 * open}
        />
      </svg>

      {/* 一块写着错答案的牌子：先是自信的勾，再被盖上叉 */}
      <Pop t={t} at={T.sign} out={T.signOut} x={1440 + shake} y={430} turn={4}>
        <div
          style={{
            padding: "26px 54px 30px",
            textAlign: "center",
            ...sticker(40),
          }}
        >
          <div style={{ fontSize: 40, opacity: 0.6 }}>哪个大？</div>
          <div style={{ fontSize: 110, fontWeight: 700, whiteSpace: "nowrap" }}>
            9.11 <span style={{ color: C.coral }}>&gt;</span> 9.9
          </div>
        </div>
      </Pop>
      <Pop t={t} at={T.sign + 0.5} out={T.wrong} x={1690} y={320} turn={10}>
        <Mark ok />
      </Pop>
      {t >= T.wrong && t < T.signOut + 0.3 ? (
        <div
          style={{
            position: "absolute",
            left: 1690,
            top: 320,
            transform: `translate(-50%, -50%) rotate(-12deg) scale(${(3 - 2 * Math.min(1, slam)) * (1 - ramp(t, T.signOut, T.signOut + 0.25))})`,
            opacity: clamp(slam * 3),
          }}
        >
          <Mark ok={false} size={150} />
        </div>
      ) : null}
      {/* 放大镜扫过去 */}
      {t >= T.check && t < T.signOut + 0.3 ? (
        <svg
          width={220}
          height={220}
          viewBox="0 0 220 220"
          style={{
            position: "absolute",
            left: mix(1180, 1560, sweep) - 90,
            top: 400 - Math.sin(sweep * Math.PI) * 50 - 90,
            transform: `scale(${pop(t, T.check) - ramp(t, T.signOut, T.signOut + 0.25)})`,
          }}
        >
          <line
            x1={128}
            y1={128}
            x2={196}
            y2={196}
            stroke={C.ink}
            strokeWidth={26}
            strokeLinecap="round"
          />
          <line
            x1={134}
            y1={134}
            x2={192}
            y2={192}
            stroke={C.lemon}
            strokeWidth={12}
            strokeLinecap="round"
          />
          <circle
            cx={88}
            cy={88}
            r={70}
            fill="rgba(255,255,255,0.35)"
            stroke={C.ink}
            strokeWidth={12}
          />
        </svg>
      ) : null}
      <Pop
        t={t}
        at={T.check + 0.5}
        out={T.signOut}
        x={1440}
        y={640}
        turn={-4}
        bounce={1.2}
      >
        <div
          style={{
            padding: "12px 36px",
            fontSize: 54,
            ...sticker(36, C.lemon),
          }}
        >
          请再核对一遍
        </div>
      </Pop>

      <Bubbles t={t} />

      {/* 一个本子 */}
      <Pop t={t} at={T.book} out={T.bookOut} x={500} y={440} turn={-5}>
        <div
          style={{
            width: 400,
            padding: "22px 34px 30px 60px",
            position: "relative",
            ...sticker(26, "#FFFDF4"),
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: -16,
                top: 40 + i * 62,
                width: 44,
                height: 18,
                borderRadius: 9,
                background: C.white,
                border: `5px solid ${C.ink}`,
              }}
            />
          ))}
          <div style={{ fontSize: 44, fontWeight: 700, color: C.coral }}>
            MEMORY.md
          </div>
          {["上次聊到哪了", "他喜欢什么样的", "别再犯的错"].map((line, i) => (
            <div
              key={line}
              style={{
                fontSize: 38,
                lineHeight: 1.6,
                opacity: clamp((t - T.book - 0.4 - i * 0.25) * 5),
                borderBottom: `3px solid rgba(58, 42, 38, 0.18)`,
              }}
            >
              · {line}
            </div>
          ))}
        </div>
      </Pop>

      {/* 一颗带问号的心 */}
      <Pop
        t={t}
        at={T.heart}
        out={T.heartOut}
        x={ME_X + noise2D("heart-x", t * 0.5, 0) * 26}
        y={330 + noise2D("heart-y", 0, t * 0.5) * 18}
      >
        <svg width={230} height={210} viewBox="0 0 230 210">
          <path
            d="M 115 196 C 20 130 6 82 22 50 C 42 12 96 14 115 54 C 134 14 188 12 208 50 C 224 82 210 130 115 196 Z"
            fill={C.blush}
            stroke={C.ink}
            strokeWidth={7}
            strokeLinejoin="round"
            transform={`translate(115 105) scale(${1 + Math.sin(t * 5) * 0.04}) translate(-115 -105)`}
          />
          <text
            x={115}
            y={136}
            textAnchor="middle"
            fontFamily={TEXT}
            fontWeight={700}
            fontSize={110}
            fill={C.white}
            stroke={C.ink}
            strokeWidth={5}
            paintOrder="stroke"
          >
            ?
          </text>
        </svg>
      </Pop>
    </>
  );
};
