// 深空的底：一颗很大的银河天球，外加一层有纵深的星点；深空段和「光」「未知」几幕共用
import React from "react";
import type * as THREE from "three";
import { SkySphere, StarField } from "./StarField";

export const DeepSky: React.FC<{ sky: THREE.Texture; brightness?: number; stars?: number }> = ({ sky, brightness = 0.5, stars = 1 }) => (
  <>
    <SkySphere map={sky} radius={3000} brightness={brightness} />
    <StarField seed="deep" count={5000} near={1200} far={-1800} spread={1400} hole={60} opacity={stars} />
  </>
);
