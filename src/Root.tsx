import "./index.css";
import React from "react";
import { AmazonCompositions } from "./videos/amazon/Compositions";
import { EdgeCompositions } from "./videos/edge/Compositions";
import { NebulaCompositions } from "./videos/nebula/Compositions";
import { CloudSkyCompositions } from "./videos/cloud-sky/Compositions";
import { HanziCompositions } from "./videos/hanzi/Compositions";
import { HelloCompositions } from "./videos/hello/Compositions";
import { HorizonCompositions } from "./videos/horizon/Compositions";
import { LookingUpCompositions } from "./videos/looking-up/Compositions";
import { MoeCompositions } from "./videos/moe/Compositions";
import { MohengOJCompositions } from "./videos/moheng-oj/Compositions";
import { RainCompositions } from "./videos/rain/Compositions";
import { ThatDayCompositions } from "./videos/that-day/Compositions";
import { WindDiaryCompositions } from "./videos/wind-diary/Compositions";

// 所有视频在这里登记，每个视频一个文件夹（src/videos/<名字>/Compositions.tsx）
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MohengOJCompositions />
      <WindDiaryCompositions />
      <CloudSkyCompositions />
      <LookingUpCompositions />
      <HorizonCompositions />
      <RainCompositions />
      <MoeCompositions />
      <AmazonCompositions />
      <HanziCompositions />
      <ThatDayCompositions />
      <HelloCompositions />
      <EdgeCompositions />
      <NebulaCompositions />
    </>
  );
};
