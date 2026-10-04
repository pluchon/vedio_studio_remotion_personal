# 《我们一直在仰望》（成片 ID `LookingUp`）

> 人类仰望星空的历史，32 幕，按年代换画法（铜版画、海报、写实深空、光与回路），three.js 3D
> 第 3 期 · 5 分钟 · 渲染：`npm run render -- LookingUp`（带 `--gl=angle`）

## 文件

- `Compositions.tsx`：成片 `LookingUp` 与每一幕的单独预览
- `theme.ts`：墨、海报、深空三套配色，宋体，配乐乐句点与每一幕的起止秒数
- `components/`：年份地点标 Locator、旁白字幕、逐行跳出的记录 Rows、编年 Ticker、宣纸、纸上的星
- `three/`：昼夜地球、平涂行星、旅行者号、韦布、点云、深空背景（three.js）
- `scenes/`：按年代换画法——ink 铜版画 → poster 复古海报 → deep 写实深空 → light 光与回路

## 素材与不入库的东西

- 配乐 `public/looking-up/audio/if-i-should-return.mp3` 不入库。铜版画与海报插图、史料图版、3D 贴图、字体在 `public/looking-up/`（入库）。

## 要点

- 有 3D 画面，渲染要走显卡（`--gl=angle`）。
