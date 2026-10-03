// 那晚的月亮：NASA 的月面贴图铺在球上，按那晚真实的月相打光，亮的一侧朝着太阳；右边写月相和月出
import React, { useMemo } from "react";
import { SkiaCanvas } from "@remotion/skia";
import {
  BlurMask,
  Circle,
  Fill,
  ImageShader,
  Points,
  Shader,
  vec,
} from "@shopify/react-native-skia";
import {
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clock, moonAt, phaseName, sunAt } from "./astro";
import type { Day } from "./day";
import { panorama } from "./Sky";
import { effect, useSkiaImage } from "./skia";
import { COLORS, FONT, HEIGHT, WIDTH, asset } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const MAP = { width: 2048, height: 1024 };

// 球面上每一点：查月面贴图的颜色，按光照方向算明暗；暗面留一点地照
const MOON = effect(`
uniform shader map;
uniform float2 centre;
uniform float radius;
uniform float2 mapSize;
uniform float3 light;

half4 main(float2 p) {
  float2 q = (p - centre) / radius;
  float r2 = dot(q, q);
  if (r2 > 1.0) return half4(0.0);
  float3 n = float3(q.x, -q.y, sqrt(1.0 - r2));
  float lon = atan(n.x, n.z);
  float lat = asin(clamp(n.y, -1.0, 1.0));
  float2 uv = float2((lon / 6.2831853 + 0.5) * mapSize.x, (0.5 - lat / 3.1415927) * mapSize.y);
  half3 albedo = map.eval(uv).rgb;
  float lit = dot(n, light);
  float shade = smoothstep(-0.03, 0.12, lit) * (0.35 + 0.65 * pow(max(lit, 0.0), 0.35));
  half3 c = albedo * (shade * 1.25 + 0.035);
  float edge = clamp((1.0 - sqrt(r2)) * radius, 0.0, 1.0);
  return half4(c * edge, edge);
}
`);

const STARS = Array.from({ length: 220 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  return vec((a - Math.floor(a)) * WIDTH, (b - Math.floor(b)) * HEIGHT);
});

export const Moon: React.FC<{ day: Day }> = ({ day }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const image = useSkiaImage(staticFile(asset("textures/moon.jpg")));

  // 用晚上 11 点的月亮：亮了几成、亮的一侧朝哪
  const view = useMemo(() => {
    const at = 23 * 60;
    const moon = moonAt(day.date, at, day.place);
    const sun = sunAt(day.date, at, day.place);
    const sky = panorama(day);
    const toward = Math.atan2(
      sky.y(sun.alt) - sky.y(moon.alt),
      sky.x(sun.az) - sky.x(moon.az),
    );
    // 相位角：照亮的比例反推回来
    const phase = Math.acos(2 * moon.illuminated - 1);
    return {
      illuminated: moon.illuminated,
      waxing: moon.waxing,
      light: [
        Math.sin(phase) * Math.cos(toward),
        -Math.sin(phase) * Math.sin(toward),
        Math.cos(phase),
      ],
    };
  }, [day]);

  if (!image) return null;

  const t = frame / fps;
  const radius = interpolate(frame, [0, durationInFrames], [318, 336]);
  const cx = 720;
  const cy = 540;
  const fade = interpolate(
    frame,
    [0, 0.6 * fps, durationInFrames - 0.8 * fps, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const line = (start: number) => ({
    opacity: interpolate(t, [start, start + 0.8], [0, 1], clamp),
    translate: `0px ${interpolate(t, [start, start + 0.8], [10, 0], clamp)}px`,
  });
  const percent = Math.round(view.illuminated * 100);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <SkiaCanvas width={WIDTH} height={HEIGHT}>
        <Fill color={COLORS.ink} />
        <Points
          points={STARS}
          mode="points"
          color={COLORS.cream}
          strokeWidth={1.6}
          strokeCap="round"
          opacity={0.35}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius * 1.08}
          color={`rgba(225, 222, 210, ${0.08 + 0.1 * view.illuminated})`}
        >
          <BlurMask blur={60} style="normal" />
        </Circle>
        <Fill>
          <Shader
            source={MOON}
            uniforms={{
              centre: [cx, cy],
              radius,
              mapSize: [MAP.width, MAP.height],
              light: view.light,
            }}
          >
            <ImageShader image={image} tx="repeat" ty="clamp" />
          </Shader>
        </Fill>
      </SkiaCanvas>
      <div
        style={{
          position: "absolute",
          left: 1210,
          top: 360,
          fontFamily: FONT,
          color: COLORS.cream,
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            color: COLORS.soft,
            ...line(0.6),
          }}
        >
          那天夜里的月亮
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 84,
            letterSpacing: 10,
            ...line(1.4),
          }}
        >
          {phaseName(view.illuminated, view.waxing)}
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 32,
            letterSpacing: 4,
            color: COLORS.soft,
            ...line(2.4),
          }}
        >
          照亮了 {percent}%
        </div>
        {day.moonrise !== null ? (
          <div
            style={{
              marginTop: 14,
              fontSize: 32,
              letterSpacing: 4,
              color: COLORS.soft,
              ...line(3.2),
            }}
          >
            {clock(day.moonrise)} 从东方升起
          </div>
        ) : null}
      </div>
    </div>
  );
};
