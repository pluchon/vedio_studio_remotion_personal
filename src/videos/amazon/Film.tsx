// 整片的总装：按旅程算出每一帧的机位，画地面、河网、大气，再叠上旁白和读数
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { PerspectiveCamera } from "three";
import { loadLocalFont } from "../../shared/fonts";
import { Grain } from "../../shared/Grain";
import { Post } from "../horizon/three/Post";
import { Chart } from "./Chart";
import { Line, Readout, type Sentence } from "./Overlay";
import { Places } from "./Places";
import { PLACES, STATIONS } from "./sites";
import { type Journey, makeRoute, travel, viewAt } from "./plan";
import { COLORS, FONT, FOV, FPS, HEIGHT, type View, WIDTH, heading, shotOf } from "./theme";
import { Land } from "./three/Land";
import { Rivers } from "./three/Rivers";
import { Sky } from "./three/Sky";
import { useWorld } from "./three/load";

loadLocalFont(FONT, staticFile("looking-up/fonts/NotoSerifSC-Regular.otf"));

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Rig: React.FC<{ view: View }> = ({ view }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    const shot = shotOf(view);
    camera.position.copy(shot.position);
    camera.up.copy(shot.up);
    camera.lookAt(shot.target);
    camera.fov = FOV;
    camera.near = 5;
    camera.far = 40000;
    camera.updateProjectionMatrix();
  }, [camera, view]);
  return null;
};

export const Film: React.FC<{ journey: Journey; lines: Sentence[] }> = ({ journey, lines }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const world = useWorld();
  const route = useMemo(() => (world ? makeRoute(world.route) : null), [world]);
  const table = useMemo(() => travel(journey), [journey]);
  const sun = useMemo(() => heading(journey.sun.lon, journey.sun.lat, journey.sun.azimuth, journey.sun.elevation), [journey]);
  // 每个地名在线画到它那里的时候出现
  const appear = useMemo(() => {
    if (!route) return [];
    return PLACES.map((item) => {
      for (let f = 0; f < table.length; f++) {
        if (route.at(table[f]).down <= item.down) return f / FPS;
      }
      return journey.seconds;
    });
  }, [route, table, journey]);

  const now = route ? viewAt(route, journey, table, frame) : null;
  const hazeRange = now ? 5000 + now.view.distance * 2.5 : 1;
  const fadeIn = interpolate(t, [1.2, 3.6], [0, 1], clamp);
  const fadeOut = interpolate(t, [journey.seconds - 3.2, journey.seconds - 0.4], [0, 1], clamp);
  const title = interpolate(t, [0.4, 1.6, 3.4, 4.6], [0, 1, 1, 0], clamp);
  // 结尾拉远看全流域时，读数、小图和支流名都收起来
  // 有旁白的时候，压在那一行上的地名先让开
  const speaking = Math.max(0, ...lines.map((line) => interpolate(t, [line.at - 0.4, line.at + 0.2, line.out + 0.3, line.out + 0.9], [0, 1, 1, 0], clamp)));
  const riding = interpolate(t, [2.8, 4.6, journey.finale.from + 0.5, journey.finale.from + 2.5], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#01030a" }}>
      {world && now && (
        <AbsoluteFill style={{ opacity: fadeIn }}>
          <ThreeCanvas width={WIDTH} height={HEIGHT}>
            <Rig view={now.view} />
            <Sky map={world.world} sun={sun} hazeRange={hazeRange} />
            <Land
              land={world.land}
              dem={world.dem}
              nearRiver={world.water}
              reach={world.reach}
              head={now.here.down}
              sun={sun}
              relief={now.view.relief}
              clouds={0.35}
              mist={0.55}
              time={t}
              hazeRange={hazeRange}
            />
            <Rivers data={world.rivers} dem={world.dem} sun={sun} relief={now.view.relief} time={t} hazeRange={hazeRange}
              head={now.here.down}
              gain={interpolate(t, [journey.finale.from, journey.finale.to], [1, 0.5], clamp)}
            />
            <Post strength={0.32} radius={0.6} threshold={0.88} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      <Grain opacity={0.07} vignette={0.62} />
      {world && now && (
        <AbsoluteFill style={{ opacity: fadeIn }}>
          <Places
            view={now.view}
            meters={world.dem.userData.meters as Int16Array}
            places={PLACES}
            stations={STATIONS}
            appear={appear}
            t={t}
            chart={riding}
            caption={speaking}
            rivers={interpolate(t, [journey.finale.from + 1, journey.finale.from + 3], [1, 0], clamp)}
          />
        </AbsoluteFill>
      )}
      {lines.map((line) => (
        <Line key={line.at} line={line} />
      ))}
      {now && <Readout here={now.here} opacity={riding} />}
      {world && now && (
        <Chart rivers={world.rivers} meters={world.dem.userData.meters as Int16Array} head={now.here.down} lon={now.here.lon} lat={now.here.lat} opacity={riding} />
      )}
      {title > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: COLORS.cream, opacity: title }}>
          <div style={{ textAlign: "center", filter: `blur(${(1 - title) * 6}px)`, textShadow: "0 0 30px rgba(0, 8, 20, 0.9)" }}>
            <div style={{ fontFamily: FONT, fontSize: 92, letterSpacing: "0.5em", paddingLeft: "0.5em" }}>亚马逊河</div>
            <div style={{ marginTop: 26, fontFamily: "Georgia, serif", fontSize: 22, letterSpacing: "0.5em", paddingLeft: "0.5em", color: COLORS.soft }}>FROM THE ANDES TO THE ATLANTIC</div>
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#01030a", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
