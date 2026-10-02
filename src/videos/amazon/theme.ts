// 亚马逊河这一期的布景：真实的高程、河网和卫星底图铺在一个球面上，镜头从安第斯山的雪线顺着水飞到大西洋。长度单位是公里
// 本视频的素材都在 public/amazon/ 下，如 asset("data/dem.bin")；由 tools/amazon/build_data.py 从 refer/ 里整理出来
import { staticFile } from "remotion";
import * as THREE from "three";

export const asset = (path: string) => `amazon/${path}`;
export const assetUrl = (path: string) => staticFile(asset(path));

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FOV = 34;

export const MUSIC = asset("audio/green-to-blue.mp3");

export const FONT = "Amazon Song";
export const COLORS = { cream: "#efe6d2", soft: "rgba(239, 230, 210, 0.62)" };

export const EARTH = 6371;

// 数据覆盖的范围（度），和 tools/amazon/build_data.py 一致
export const BOX = { west: -81, east: -45, north: 7, south: -18 };
export const DEM_SIZE = { width: 4320, height: 3000 };
// 高程里海面的记号，以及高程一格合多少公里
export const SEA = -100;
export const DEM_CELL = 111.2 / 120;

const RAD = Math.PI / 180;

// 经纬度 → 球面上的位置，和等距圆柱投影的世界贴图对齐
export const place = (lon: number, lat: number, radius = EARTH) => {
  const a = lat * RAD;
  const b = lon * RAD;
  return new THREE.Vector3(Math.cos(a) * Math.cos(b) * radius, Math.sin(a) * radius, -Math.cos(a) * Math.sin(b) * radius);
};

// 某地的东、北、上三个方向
export const compass = (lon: number, lat: number) => {
  const a = lat * RAD;
  const b = lon * RAD;
  return {
    east: new THREE.Vector3(-Math.sin(b), 0, -Math.cos(b)),
    north: new THREE.Vector3(-Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)),
    up: new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)),
  };
};

// 从某地看出去的一个方向：方位角从正北起顺时针，仰角从地平线起
export const heading = (lon: number, lat: number, azimuth: number, elevation: number) => {
  const { east, north, up } = compass(lon, lat);
  const az = azimuth * RAD;
  const el = elevation * RAD;
  return new THREE.Vector3()
    .addScaledVector(east, Math.sin(az) * Math.cos(el))
    .addScaledVector(north, Math.cos(az) * Math.cos(el))
    .addScaledVector(up, Math.sin(el));
};

// 一个机位：盯着哪里、朝哪个方位看、俯角多大、离多远；太阳按盯着的那个地方的方位和高度给
export type View = {
  lon: number;
  lat: number;
  azimuth: number;
  pitch: number;
  distance: number;
  sunAzimuth: number;
  sunElevation: number;
  // 高程夸大多少倍
  relief: number;
};

export const shotOf = (view: View) => {
  const target = place(view.lon, view.lat);
  const { up } = compass(view.lon, view.lat);
  const back = heading(view.lon, view.lat, view.azimuth + 180, view.pitch);
  return {
    position: target.clone().addScaledVector(back, view.distance),
    target,
    up,
    sun: heading(view.lon, view.lat, view.sunAzimuth, view.sunElevation),
  };
};
