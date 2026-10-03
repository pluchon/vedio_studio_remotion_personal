// 《那一天》的组合登记：参数由表单编辑（schema），片长由留言的字数算（calculateMetadata）
// 另有两个导出用的小组合：透明底的日期角标、循环的月相动图；三者共用同一套参数
import React from "react";
import { Composition, Folder } from "remotion";
import { Badge, Phases } from "./Extras";
import { Film } from "./Film";
import { FPS, HEIGHT, WIDTH, schema, totalSeconds } from "./theme";

export const ThatDayCompositions: React.FC = () => {
  return (
    <Folder name="ThatDay">
      <Composition
        id="ThatDay"
        component={Film}
        schema={schema}
        defaultProps={{
          date: "2000-01-01",
          city: "北京",
          lat: 39.9042,
          lon: 116.4074,
          utcOffset: 8,
          name: "",
          message: "",
          asOf: "2026-10-03",
          accent: "#e8a25c",
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round(totalSeconds(props.message) * FPS),
        })}
        durationInFrames={Math.round(totalSeconds("") * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ThatDay-Badge"
        component={Badge}
        schema={schema}
        defaultProps={{
          date: "2000-01-01",
          city: "北京",
          lat: 39.9042,
          lon: 116.4074,
          utcOffset: 8,
          name: "",
          message: "",
          asOf: "2026-10-03",
          accent: "#e8a25c",
        }}
        durationInFrames={4 * FPS}
        fps={FPS}
        width={960}
        height={260}
      />
      <Composition
        id="ThatDay-Phases"
        component={Phases}
        schema={schema}
        defaultProps={{
          date: "2000-01-01",
          city: "北京",
          lat: 39.9042,
          lon: 116.4074,
          utcOffset: 8,
          name: "",
          message: "",
          asOf: "2026-10-03",
          accent: "#e8a25c",
        }}
        durationInFrames={4 * FPS}
        fps={FPS}
        width={480}
        height={480}
      />
    </Folder>
  );
};
