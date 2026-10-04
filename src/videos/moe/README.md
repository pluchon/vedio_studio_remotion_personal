# 《萌系手帐》（成片 ID `Moe`）

> 手帐底图里嵌动漫镜头，换镜头跟着配乐的起音，一格一格动的步进动画
> 第 6 期 · 82 秒 · 渲染：`npm run render -- Moe`（带 `--color-space=bt709`）

## 文件

- `Compositions.tsx`：成片 `Moe`
- `Film.tsx`：整片的总装：底图、卡片里的镜头、拍立得、花瓣、小人
- `plan.ts`：从配乐的起音里挑换镜头的时刻，小人的姿势和走位，步进与线条抖动
- `theme.ts`：卡片位置、配乐分段、合集里每个镜头的起止

## 素材与不入库的东西

- 配乐 `public/moe/audio/senko.mp3` 和动漫片段 `public/moe/clips/` 不入库，由 `tools/moe/prepare.py` 从自备的素材（`refer/二次元萌系/`）整理生成；手帐底图、Q 版小人的八个姿势在 `public/moe/`（入库）。

## 要点

- 高调的画面渲染要用 `--color-space=bt709`，否则不少播放器里会发白。`Freeze` 包住 `OffthreadVideo` 做任意时间的定格；一秒十张左右的步进动画加线条抖动，做出手绘动画的味道。
