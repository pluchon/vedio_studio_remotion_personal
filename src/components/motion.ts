// 通用动效：淡入上浮、区间淡入淡出
import { interpolate } from "remotion";
import { EASE_OUT } from "../theme";

// 从 start 帧开始淡入并上浮到位
export const enter = (frame: number, start: number, duration = 24, distance = 24) => ({
  opacity: interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  }),
  translate: `0px ${interpolate(frame, [start, start + duration], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  })}px`,
});

// 在 [from, to] 区间内可见，两端各用 fade 帧淡入淡出
export const visibleBetween = (frame: number, from: number, to: number, fade = 15) =>
  interpolate(frame, [from, from + fade, to - fade, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
