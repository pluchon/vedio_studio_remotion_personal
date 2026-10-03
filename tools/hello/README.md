# 《你好，我是 Claude》这一期

Claude 的自我介绍，由 Claude Opus 5.5 自己写文案、画画面、编配乐。画面全部是代码画的，没有图片素材。

主角照着 Claude Code 里那只像素小螃蟹画：原图是 12 格宽的像素画，这里按格子重画成十几个方块，所以能压扁、眨眼、挥手、迈步。家里另外三位（Haiku、Sonnet、Fable）是同一副骨架换了颜色和大小，是这支片子自己的设计，不是官方形象。

## 时间表

各段的长短、每句台词的时刻都写在 `src/videos/hello/script.json` 里。画面（`timeline.ts`）和声音（`music.py`）读的是同一份，改了台词以后重新合成一遍声音就能对上。

相邻两段叠 0.7 秒做转场；小家伙不在转场里，它在两段之间从上一个姿势走到下一个姿势。

## 声音

```bash
python tools/hello/music.py
```

输出 `public/hello/audio/bgm.wav`（配乐和音效）和 `voice.wav`（说话声），都不入库。只用 Python 标准库，不需要 ffmpeg，半分钟左右跑完。

- 配乐是游戏机风格的芯片音乐：只有方波、三角波、噪声三种波形。A 大调，每分钟 132 拍。主题一用在见面和介绍自己的段落，主题二（附点节奏、走路似的低音）用在赶路和干活的段落；「一家四口」里四个人各有一句自己的声音；「老实交代」那段鼓停下来，转到小调，音拉得很长。
- 各段的起点对不上小节线，所以每段末尾有一小段长短不定的过门（一串小鼓加一个滑音），让下一段正好从自己的起点开始。
- 说话声：每个字一声短促的方波，音高在几个音之间上下走，问句结尾上扬，句尾下落，标点处停。
- 脚本最后会分轨、分段打印音量。听不到声音的时候就靠这些数字核对各轨的平衡。

## 参数

`asOf`（做片子的日期，`年-月-日`）：用来算日历旁边那句「出来第几天」。在 Remotion Studio 右侧的表单里可以改，命令行用 `--props` 传。

## 渲染

```bash
npx remotion render Hello out/hello.mp4 --gl=angle --color-space=bt709
npx remotion render Hello-Sticker out/hello-sticker.webm --codec=vp9 --image-format=png --pixel-format=yuva420p
npx remotion render Hello-Sticker out/hello-sticker.gif --codec=gif --every-nth-frame=2
```

第一条是成片（里面有一段三维的书堆，要走显卡）。后两条是透明底的挥手贴纸，分别导出成带透明通道的视频和动图。

## 用到的 Remotion 工具

| 工具 | 用在哪 |
| --- | --- |
| `spring`、`interpolate`、`Easing` | 所有的弹出、跳跃、落地压扁（`motion.ts`） |
| `@remotion/transitions` | 八段之间的七次转场：圆形展开、推入、擦除、钟面擦除、淡入 |
| `@remotion/captions` | 台词按字分页，每个字一个时间戳 |
| `@remotion/layout-utils` | 量整句的宽度定字幕条大小；片名自动定字号 |
| `@remotion/shapes` | 火花、背景里的小图形、彩色碎片、背后的光芒 |
| `@remotion/paths` | 片名下面那道波浪线一笔画出来 |
| `@remotion/noise` | 背景色块和小图形的漂动、心形的晃动 |
| `@remotion/motion-blur` | Haiku 冲进来时的拖影 |
| `@remotion/three` | 「一百万词元」那一摞三维的书 |
| `@remotion/skia` | 「老实交代」的夜色、光束和星星（着色器逐像素算） |
| `@remotion/lottie` | 结尾的彩纸屑（Lottie 的 JSON 是代码拼出来的） |
| `@remotion/media-utils` | 编辑器时间线上的波形，读的是这支片子自己的配乐 |
| 参数和表单（zod） | `asOf` |
| 透明导出 | `Hello-Sticker` |

## 来源

- 资料：Anthropic 的 Opus 5.5 发布页、模型总览文档、Claude 的「宪法」，以及维基百科的 Claude、Anthropic 条目和一份发布时间线。整理稿在 `refer/介绍你自己_Claude/资料.md`（不入库）。没有官方确认的说法（比如名字的由来）没有进片子。
- 字体（都在 `public/hello/fonts/`，SIL OFL 许可）：站酷快乐体（ZCOOL KuaiLe）、Fredoka、JetBrains Mono，取自 Google Fonts 的仓库。
- 「9.11 和 9.9 哪个大」是语言模型出过的一类有名的错，这里拿来当例子。
