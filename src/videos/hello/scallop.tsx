// 自己写的一种转场：下一段的画面从一侧盖过来，盖过来的那条边是一排圆圆的花边
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React from "react";
import { AbsoluteFill } from "remotion";
import { HEIGHT, WIDTH } from "./theme";

type ScallopProps = { direction: "from-left" | "from-bottom" };

const BUMP = 90;

// 进场画面露出来的区域。p 从 0 到 1；花边会多走出去一个半径，保证最后整屏都露出来
const reveal = (p: number, direction: ScallopProps["direction"]) => {
  if (direction === "from-left") {
    const edge = -BUMP + (WIDTH + BUMP * 2) * p;
    let d = `M ${-BUMP * 2} ${-BUMP} L ${edge} ${-BUMP}`;
    for (let y = -BUMP; y < HEIGHT + BUMP; y += BUMP * 2) {
      d += ` A ${BUMP} ${BUMP} 0 0 1 ${edge} ${y + BUMP * 2}`;
    }
    return `${d} L ${-BUMP * 2} ${HEIGHT + BUMP * 2} Z`;
  }
  const edge = HEIGHT + BUMP - (HEIGHT + BUMP * 2) * p;
  let d = `M ${-BUMP} ${HEIGHT + BUMP * 2} L ${-BUMP} ${edge}`;
  for (let x = -BUMP; x < WIDTH + BUMP; x += BUMP * 2) {
    d += ` A ${BUMP} ${BUMP} 0 0 1 ${x + BUMP * 2} ${edge}`;
  }
  return `${d} L ${WIDTH + BUMP * 2} ${HEIGHT + BUMP * 2} Z`;
};

const Scallop: React.FC<TransitionPresentationComponentProps<ScallopProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => (
  <AbsoluteFill
    style={
      presentationDirection === "entering"
        ? {
            clipPath: `path("${reveal(presentationProgress, passedProps.direction)}")`,
          }
        : undefined
    }
  >
    {children}
  </AbsoluteFill>
);

export const scallop = (
  props: ScallopProps,
): TransitionPresentation<ScallopProps> => ({ component: Scallop, props });
