// 场景着色器登记：名字 → 片元着色器（和渲染比例，体积渲染的场景可以少算一些像素再放大）
import type { ProgramDef } from "../gl/engine";
import { BOARD } from "./board";
import { CAVE } from "./cave";
import { CELLS } from "./cells";
import { DEEP } from "./deep";
import { FIRE } from "./fire";
import { FLOW } from "./flow";
import { GALAXY } from "./galaxy";
import { LAND } from "./land";
import { PLANET } from "./planet";
import { SEA } from "./sea";
import { SHIP } from "./ship";
import { STAR } from "./star";
import { UNDER } from "./under";

export const PROGRAMS: Record<string, ProgramDef> = {
  board: { frag: BOARD },
  cave: { frag: CAVE },
  cells: { frag: CELLS },
  deep: { frag: DEEP },
  fire: { frag: FIRE },
  flow: { frag: FLOW },
  galaxy: { frag: GALAXY },
  land: { frag: LAND },
  planet: { frag: PLANET },
  sea: { frag: SEA },
  ship: { frag: SHIP },
  star: { frag: STAR },
  under: { frag: UNDER },
};
