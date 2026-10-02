// 地图上的地名：城市是一个小点加名字，支流只写河名，停靠的地方多一圈涟漪和一行说明。
// 位置用和画面同一套机位算出来，所以会跟着地图一起移动
import React from "react";
import { interpolate } from "remotion";
import * as THREE from "three";
import type { Place, Station } from "./sites";
import { COLORS, DEM_SIZE, BOX, EARTH, FONT, FOV, HEIGHT, type View, WIDTH, place, shotOf } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LATIN = "Georgia, serif";
const SHADOW = "0 0 10px rgba(0, 8, 20, 0.95), 0 0 3px rgba(0, 8, 20, 0.9)";

const camera = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, 5, 40000);

// 经纬度 → 屏幕上的位置；转到地球背面或出了画面就不画
const projector = (view: View, meters: Int16Array) => {
  const shot = shotOf(view);
  camera.position.copy(shot.position);
  camera.up.copy(shot.up);
  camera.lookAt(shot.target);
  camera.updateMatrixWorld(true);
  return (lon: number, lat: number) => {
    const col = Math.min(Math.max(Math.floor(((lon - BOX.west) / (BOX.east - BOX.west)) * DEM_SIZE.width), 0), DEM_SIZE.width - 1);
    const row = Math.min(Math.max(Math.floor(((BOX.north - lat) / (BOX.north - BOX.south)) * DEM_SIZE.height), 0), DEM_SIZE.height - 1);
    const height = (Math.max(meters[row * DEM_SIZE.width + col], 0) / 1000) * view.relief;
    const spot = place(lon, lat, EARTH + height);
    if (spot.clone().normalize().dot(shot.position.clone().sub(spot)) <= 0) return null;
    const p = spot.project(camera);
    const x = ((p.x + 1) / 2) * WIDTH;
    const y = ((1 - p.y) / 2) * HEIGHT;
    if (x < -60 || x > WIDTH + 60 || y < -40 || y > HEIGHT + 40) return null;
    return { x, y };
  };
};

// 右上角是水系小图，底下是读数：名字走到这两块里就让开
// 中间偏下那一行是旁白：有旁白时，落在那一带的名字也让开
const clear = (x: number, y: number, chart: number, caption: number) => {
  const underChart = x > 1340 && y < 410 ? 1 - chart : 1;
  const overReadout = interpolate(y, [900, 950], [1, 0], clamp);
  const inCaption = x > 300 && x < 1560 && y > 735 && y < 880 ? 1 - caption : 1;
  return underChart * overReadout * inCaption;
};

export const Places: React.FC<{
  view: View;
  meters: Int16Array;
  places: Place[];
  stations: Station[];
  // 每个地名出现的时刻（秒），和 places 一一对应
  appear: number[];
  t: number;
  // 水系小图现在有多不透明
  chart: number;
  // 现在有没有旁白
  caption: number;
  // 支流名在最后拉远时淡掉，免得挤成一团
  rivers: number;
}> = ({ view, meters, places, stations, appear, t, chart, caption, rivers }) => {
  const project = projector(view, meters);
  return (
    <>
      {places.map((item, i) => {
        const p = project(item.lon, item.lat);
        const shown = interpolate(t, [appear[i], appear[i] + 0.9], [0, 1], clamp);
        if (!p || shown <= 0) return null;
        const opacity = shown * clear(p.x, p.y, chart, caption) * (item.kind === "river" ? rivers : 1);
        if (opacity <= 0.01) return null;
        if (item.kind === "river") {
          return (
            <div
              key={item.zh}
              style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -150%)", opacity: opacity * 0.9, color: "#cfe4f7", textShadow: SHADOW, whiteSpace: "nowrap", textAlign: "center" }}
            >
              <span style={{ fontFamily: FONT, fontSize: 19, letterSpacing: "0.3em", paddingLeft: "0.3em" }}>{item.zh}</span>
            </div>
          );
        }
        return (
          <div key={item.zh} style={{ position: "absolute", left: p.x, top: p.y, opacity, color: COLORS.cream, textShadow: SHADOW, whiteSpace: "nowrap" }}>
            <div style={{ position: "absolute", left: -4, top: -4, width: 8, height: 8, borderRadius: 4, background: COLORS.cream, boxShadow: "0 0 8px 2px rgba(0, 8, 20, 0.8)" }} />
            <div style={{ position: "absolute", left: 14, top: -15 }}>
              <span style={{ fontFamily: FONT, fontSize: 22, letterSpacing: "0.14em" }}>{item.zh}</span>
              <span style={{ fontFamily: LATIN, fontStyle: "italic", fontSize: 15, marginLeft: 10, color: COLORS.soft }}>{item.en}</span>
            </div>
          </div>
        );
      })}
      {stations.map((item) => {
        const p = project(item.lon, item.lat);
        const shown = interpolate(t, [item.arrive - 1.2, item.arrive - 0.2], [0, 1], clamp);
        if (!p || shown <= 0) return null;
        const opacity = shown * clear(p.x, p.y, chart, 0);
        if (opacity <= 0.01) return null;
        // 停着的时候展开：字大一号，带一行说明；走了以后收回成普通的地名
        const open = interpolate(t, [item.arrive - 0.6, item.arrive + 0.3, item.leave + 0.6, item.leave + 1.8], [0, 1, 1, 0], clamp);
        const ripple = ((t - item.arrive + 1) % 1.8) / 1.8;
        return (
          <div key={item.zh} style={{ position: "absolute", left: p.x, top: p.y, opacity, color: COLORS.cream, textShadow: SHADOW, whiteSpace: "nowrap" }}>
            <div
              style={{
                position: "absolute",
                left: -6,
                top: -6,
                width: 12,
                height: 12,
                borderRadius: 6,
                border: `2px solid ${COLORS.cream}`,
                background: "rgba(0, 8, 20, 0.5)",
                boxSizing: "border-box",
              }}
            />
            {open > 0.02 && (
              <div
                style={{
                  position: "absolute",
                  left: -6 - ripple * 34,
                  top: -6 - ripple * 34,
                  width: 12 + ripple * 68,
                  height: 12 + ripple * 68,
                  borderRadius: "50%",
                  border: `1.5px solid ${COLORS.cream}`,
                  boxSizing: "border-box",
                  opacity: (1 - ripple) * open * 0.8,
                }}
              />
            )}
            <div
              style={
                item.left
                  ? { position: "absolute", right: 26 + open * 22, top: -18 - open * 12, textAlign: "right" }
                  : { position: "absolute", left: 26 + open * 22, top: -18 - open * 12 }
              }
            >
              <span style={{ fontFamily: FONT, fontSize: 24 + open * 14, letterSpacing: "0.16em" }}>{item.zh}</span>
              <span style={{ fontFamily: LATIN, fontStyle: "italic", fontSize: 16 + open * 4, marginLeft: 12, color: COLORS.soft }}>{item.en}</span>
              <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 21, letterSpacing: "0.12em", opacity: open, color: "#dfe9f3" }}>{item.note}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};
