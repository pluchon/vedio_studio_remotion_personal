import "./index.css";
import React from "react";
import { CloudSkyCompositions } from "./videos/cloud-sky/Compositions";
import { MohengOJCompositions } from "./videos/moheng-oj/Compositions";
import { WindDiaryCompositions } from "./videos/wind-diary/Compositions";

// 所有视频在这里登记，每个视频一个文件夹（src/videos/<名字>/Compositions.tsx）
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MohengOJCompositions />
      <WindDiaryCompositions />
      <CloudSkyCompositions />
    </>
  );
};
