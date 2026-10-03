// 第二幕「地球有尽头」：一颗墨线地球，画出半径和体积——半径是 6371 千米，所以地球有边
import React from "react";
import { Draw } from "../ink";
import type { Pt } from "../ink";
import { Big, Frac, Tag } from "../labels";
import { COLORS, FONT } from "../theme";
import { ease, easeOut, mix, ramp, useT } from "../time";
import land from "../land110.json";

const CX = 960;
const CY = 520;
const R = 330;
const TILT = 0.38;

type Ring = [number, number][];

// 把 GeoJSON 里的所有外环取出来
export const RINGS: Ring[] = [];
for (const feature of land.features) {
  const g = feature.geometry as { type: string; coordinates: unknown };
  if (g.type === "Polygon") RINGS.push((g.coordinates as Ring[])[0]);
  else if (g.type === "MultiPolygon")
    for (const poly of g.coordinates as Ring[][]) RINGS.push(poly[0]);
}

// 经纬度投到球面（正射），看不见的点贴到边缘上
const project = (
  lon: number,
  lat: number,
  lon0: number,
  r: number,
): { x: number; y: number; z: number } => {
  const phi = (lat * Math.PI) / 180;
  const dl = ((lon - lon0) * Math.PI) / 180;
  const x = r * Math.cos(phi) * Math.sin(dl);
  const y =
    -r *
    (Math.sin(phi) * Math.cos(TILT) -
      Math.cos(phi) * Math.cos(dl) * Math.sin(TILT));
  const z =
    Math.sin(phi) * Math.sin(TILT) +
    Math.cos(phi) * Math.cos(dl) * Math.cos(TILT);
  return { x, y, z };
};

export const ringPath = (ring: Ring, lon0: number, r: number, cx = CX, cy = CY): string | null => {
  let any = false;
  const pts: string[] = ring.map(([lon, lat]) => {
    const p = project(lon, lat, lon0, r);
    let { x, y } = p;
    if (p.z > 0) any = true;
    else {
      const m = Math.hypot(x, y) || 1;
      x = (x / m) * r;
      y = (y / m) * r;
    }
    return `${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`;
  });
  return any ? `M${pts.join(" L")}Z` : null;
};

// 经线或纬线：采样后按看得见的段拆开
const graticule = (
  kind: "lon" | "lat",
  v: number,
  lon0: number,
  r: number,
): string => {
  const runs: string[] = [];
  let run: string[] = [];
  for (let i = 0; i <= 90; i++) {
    const u = i / 90;
    const lon = kind === "lon" ? v : -180 + 360 * u;
    const lat = kind === "lon" ? -90 + 180 * u : v;
    const p = project(lon, lat, lon0, r);
    if (p.z > 0) run.push(`${(CX + p.x).toFixed(1)},${(CY + p.y).toFixed(1)}`);
    else if (run.length) {
      runs.push(`M${run.join(" L")}`);
      run = [];
    }
  }
  if (run.length) runs.push(`M${run.join(" L")}`);
  return runs.join(" ");
};

export const Globe: React.FC = () => {
  const t = useT();
  // 地球从上一幕缩进来的那个位置长出来，结尾再缩小成圆心的一点
  const grow = easeOut(t, 18.9, 21.2);
  const away = ease(t, 31.3, 33.4);
  const scale = mix(0.3, 1, grow) * mix(1, 0.2, away);
  const lon0 = 75 + t * 3.2;
  const r = R;

  const meridians = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
  const parallels = [-60, -30, 0, 30, 60];

  // 半径线：从球心到右上方的海岸
  const angle = -0.36;
  const tipX = CX + Math.cos(angle) * r;
  const tipY = CY + Math.sin(angle) * r;
  const radiusPath = `M${CX},${CY} L${tipX},${tipY}`;
  const radiusDraw = ease(t, 22.4, 24.2);

  const volumeWash = ease(t, 27.4, 29.4);

  return (
    <>
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id="edge-globe-disc">
            <circle cx={CX} cy={CY} r={r} />
          </clipPath>
          <radialGradient id="edge-globe-shade" cx="0.34" cy="0.3" r="0.9">
            <stop offset="0%" stopColor={COLORS.paperLight} stopOpacity={0.9} />
            <stop offset="55%" stopColor="#d8c79b" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#a58a55" stopOpacity={0.75} />
          </radialGradient>
        </defs>
        <g
          transform={`translate(${CX} ${CY}) scale(${scale}) translate(${-CX} ${-CY})`}
          opacity={ramp(t, 18.8, 19.8)}
        >
          <g filter="url(#edge-rough)">
            {/* 海 */}
            <circle cx={CX} cy={CY} r={r} fill={COLORS.sea} fillOpacity={0.7} />
            {/* 陆地 */}
            <g clipPath="url(#edge-globe-disc)">
              {RINGS.map((ring, i) => {
                const d = ringPath(ring, lon0, r);
                return d ? (
                  <path
                    key={i}
                    d={d}
                    fill={COLORS.land}
                    stroke={COLORS.ink}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                    opacity={ramp(t, 19.6 + (i % 7) * 0.12, 21)}
                  />
                ) : null;
              })}
              {meridians.map((m) => (
                <path
                  key={`m${m}`}
                  d={graticule("lon", m, lon0, r)}
                  fill="none"
                  stroke={COLORS.ink}
                  strokeWidth={1}
                  opacity={0.3 * ramp(t, 20.2, 21.8)}
                />
              ))}
              {parallels.map((p) => (
                <path
                  key={`p${p}`}
                  d={graticule("lat", p, lon0, r)}
                  fill="none"
                  stroke={COLORS.ink}
                  strokeWidth={1}
                  opacity={0.3 * ramp(t, 20.2, 21.8)}
                />
              ))}
              {/* 体积：整个球被一层赭色洇满 */}
              <circle
                cx={CX}
                cy={CY}
                r={r}
                fill="url(#edge-globe-shade)"
                opacity={volumeWash * 0.85}
              />
            </g>
            <Draw
              d={`M${CX - r},${CY} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`}
              p={ease(t, 19.0, 20.8)}
              width={4}
            />
            {/* 地球有边：朱砂描一圈 */}
            <Draw
              d={`M${CX - r - 12},${CY} a${r + 12},${r + 12} 0 1,0 ${2 * (r + 12)},0 a${r + 12},${r + 12} 0 1,0 ${-2 * (r + 12)},0`}
              p={ease(t, 30.4, 32.2)}
              width={5}
              color={COLORS.red}
              opacity={0.9}
            />
          </g>

          {/* 半径线、球心和刻度 */}
          <g filter="url(#edge-rough)">
            <Draw
              d={radiusPath}
              p={radiusDraw}
              width={4.5}
              color={COLORS.red}
            />
            {radiusDraw > 0.2
              ? Array.from({ length: 9 }, (_, i) => {
                  const u = (i + 1) / 10;
                  if (u > radiusDraw) return null;
                  const x = mix(CX, tipX, u);
                  const y = mix(CY, tipY, u);
                  return (
                    <line
                      key={i}
                      x1={x - Math.sin(angle) * 11}
                      y1={y + Math.cos(angle) * 11}
                      x2={x + Math.sin(angle) * 11}
                      y2={y - Math.cos(angle) * 11}
                      stroke={COLORS.red}
                      strokeWidth={2.4}
                    />
                  );
                })
              : null}
            <circle
              cx={CX}
              cy={CY}
              r={9 * ramp(t, 22.2, 22.8)}
              fill={COLORS.red}
            />
          </g>
        </g>
      </svg>
      <div style={{ position: "absolute", inset: 0 }}>
        <Tag
          x={mix(CX, tipX, 0.5) - 30}
          y={mix(CY, tipY, 0.5) - 96}
          p={ramp(t, 24.0, 25.2) * (1 - ease(t, 30.6, 31.6))}
          size={44}
          red
        >
          r ≈ 6371 千米
        </Tag>
        <div
          style={{
            position: "absolute",
            left: 1360,
            top: 420,
            opacity: ramp(t, 28.2, 29.6) * (1 - ease(t, 30.6, 31.6)),
            fontFamily: FONT,
            fontSize: 64,
            color: COLORS.ink,
            background: "rgba(243, 235, 210, 0.9)",
            border: `1.6px solid ${COLORS.ink}`,
            padding: "14px 34px 18px",
            whiteSpace: "nowrap",
          }}
        >
          V = <Frac top="4" bottom="3" /> π r³
          <div
            style={{
              fontSize: 36,
              marginTop: 6,
              letterSpacing: 3,
              color: COLORS.inkSoft,
            }}
          >
            ≈ 1.08 × 10¹² 立方千米
          </div>
        </div>
        <Big
          x={CX}
          y={CY + 430}
          p={ramp(t, 30.8, 31.8) * (1 - ease(t, 31.6, 32.4))}
          size={60}
          color={COLORS.red}
          black={false}
          spacing={0.5}
        >
          有尽头
        </Big>
      </div>
    </>
  );
};

export type { Pt };
