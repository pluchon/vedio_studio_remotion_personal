# 《风经过的地方》（成片 ID `WindDiary`）

> 日常生活三则：2D 程序化画面、手写式字幕、拍立得
> 第 1 期 · 约 90 秒 · 渲染：`npm run render -- WindDiary`

## 文件

- `Compositions.tsx`：成片 `WindDiary` 与片头、三则、尾声各章
- `theme.ts`：各章配色、霞鹜文楷、配乐节拍网格与章节起止拍
- `components/`、`scenes/`

## 素材与不入库的东西

- 配乐 `public/wind-diary/audio/hanagoyomi.mp3` 和照片 `public/wind-diary/photos/` 不入库（版权、个人照片），克隆后要自己放。字体（霞鹜文楷）在 `public/wind-diary/fonts/`。

## 要点

- 日常生活系列的第一期，用到公用组件 `Polaroid`（拍立得）、`WindLines`、`Caption`（手写式字幕）。
