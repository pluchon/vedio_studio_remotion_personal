// 功能场景的统一版式：羊皮纸底 + 章节标记 + 左侧图版 + 右侧旁注
import React from "react";
import { ChapterMark } from "./ChapterMark";
import { Paper } from "./Paper";
import { CameraKey, Plate } from "../../../shared/Plate";
import { SideNote } from "./SideNote";

export const FeatureScene: React.FC<{
  numeral: string;
  chapter: string;
  fig: string;
  title: string;
  desc: string;
  chips?: string[];
  camera: CameraKey[];
  plate: React.ReactNode;
  note?: React.ReactNode;
}> = ({ numeral, chapter, fig, title, desc, chips, camera, plate, note }) => (
  <Paper>
    <ChapterMark numeral={numeral} label={chapter} />
    <Plate camera={camera}>{plate}</Plate>
    <SideNote fig={fig} title={title} desc={desc} chips={chips}>
      {note}
    </SideNote>
  </Paper>
);
