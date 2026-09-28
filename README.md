# video-studio

公用的 Remotion 视频工作室。无论是项目介绍还是自己的想法，视频都放在这一个工程里，共用一份依赖（Remotion 4.0.529）和通用组件，不必每次重装一遍。

## 目录

```
src/
├─ Root.tsx                 # 登记所有视频
├─ shared/                  # 通用组件
│  ├─ motion.ts             # 缓动曲线、淡入上浮 enter、区间可见 visibleBetween
│  └─ Plate.tsx             # 截图图版与镜头推拉、Shot、朱砂圈注 InkCircle、流光边框 GlowRing、流式展开 StreamReveal
└─ videos/
   └─ moheng-oj/            # 墨衡 OJ 介绍视频（120 秒）
      ├─ Compositions.tsx   # 本视频的成片与各场景
      ├─ theme.ts           # 配色、字体、时长，asset() 拼素材路径
      ├─ components/ scenes/
public/
└─ moheng-oj/               # 本视频的截图、底图、配乐
tools/
├─ shoot.mjs                # 批量截图（puppeteer-core + 本机 Chrome）
├─ stills.mjs               # 批量渲染静帧，自查画面用
├─ music.py                 # 纯 Python 合成配乐
└─ moheng-oj/               # 墨衡 OJ 的截图清单、登录与清理脚本
```

## 常用命令

```bash
npm i                                              # 首次安装
npm run dev                                        # 打开 Studio 预览
npx remotion render MohengOJ out/moheng-oj.mp4     # 渲染成片
npm run lint                                       # ESLint + 类型检查
```

## 新增一个视频

1. 在 `src/videos/<名字>/` 下建 `Compositions.tsx`，外层用 `<Folder name="...">` 包住；组合 ID 带上视频前缀，避免与其他视频重名。
2. 在 `src/Root.tsx` 里加上这个组件。
3. 素材放 `public/<名字>/`，在 `theme.ts` 里写一个 `asset()` 拼路径。
4. 需要网页截图时，在 `tools/<名字>/` 放 `site.json`（各端地址、登录 Cookie、视口）和截图清单，用 `tools/shoot.mjs` 拍。不涉及网页的视频用不到这一步。

截图统一按 1600×900 视口、2 倍像素拍，`shared/Plate.tsx` 里的镜头与叠加层都用这套 CSS 坐标。

## 工具

**截图**：`node tools/shoot.mjs <site.json> <清单.json> <输出目录> [只拍的名字...]`

清单里每个镜头可以带步骤：`click`、`clickText`、`eval`、`waitFor`、`waitGone`、`shot`（中途截一张）、`rect`（把元素位置记进 `rects.json`）。

**配乐**：`python tools/music.py <输出.wav> [秒数] [随机种子]`

D 宫五声音阶的拨弦、铺底加低音，经 FFmpeg 混响并归一到 -16 LUFS，需要 PATH 上有 ffmpeg。

**静帧自查**：`node tools/stills.mjs <输出目录> MohengOJ-Tutor:150 MohengOJ:1800`

## 墨衡 OJ 的截图流程

先在本地启动墨衡 OJ 两端和后端，然后：

```bash
python tools/moheng-oj/tokens.py                                               # 登录，令牌写入 tools/moheng-oj/tokens.json（不入库）
node tools/shoot.mjs tools/moheng-oj/site.json tools/moheng-oj/pages.json public/moheng-oj/shots
node tools/shoot.mjs tools/moheng-oj/site.json tools/moheng-oj/ai.json public/moheng-oj/shots
python tools/moheng-oj/cleanup.py "2026-09-28 11:37:00"                         # 填开拍 ai.json 前记下的时间
```

`ai.json` 会真实调用 AI，写入辅导会话、赛后复盘、难题分析缓存和当日次数。开拍前记下时间，拍完用 `cleanup.py` 按这个时间删掉。
