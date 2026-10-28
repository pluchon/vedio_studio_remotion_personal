# 《雨未愁眠》（成片 ID `Yuwei`）

> 为什么下雨天特别好睡。一张很长的纸上叠着印刷海报和贴纸，镜头跟着念白拐着走。
> 第 18 期 · 约 2 分钟（念白 111.5 秒，前有片名 2.8 秒、后留 6 秒）· 60fps 横屏
> 渲染：`npm run render -- Yuwei`

## 文件

- `Compositions.tsx`、`Film.tsx`：成片 `Yuwei`。总装是镜头在长纸上的平移缩放，上面叠字幕胶带和四条音轨
- `theme.ts`：60fps、1920×1080、印刷配色、字体名、素材路径
- `kit.tsx`：纸、海报卡、贴纸、胶带、印章、镜头插值
- `art.tsx`：窗夜、台灯、频谱、被子、日历、关门、汽车喇叭（声波不是小号）、地球收到房间里
- `Desk.tsx`：八叠海报在世界坐标里的位置
- `camera.ts`：镜头站点，对着 `phrases.json` 的句子
- `script.json`、`phrases.json`、`script.ts`、`Subtitles.tsx`：稿子、对齐结果、字幕

## 素材与不入库的东西

`public/yuwei/fonts/` 入库（OFL）。音频全部不入库，由脚本在本机生成：

| 生成什么 | 命令 | 来源 |
| --- | --- | --- |
| 字体拷到 `public/yuwei/fonts/` | `python tools/yuwei/prepare.py fonts` | `refer/雨未愁眠/资料/fonts/`，宋体从 `public/looking-up/fonts/` 复制 |
| 念白 `audio/voice.wav` | `python tools/yuwei/prepare.py voice` | `refer/雨未愁眠/雨未愁眠_念稿.mp3`，走 `tools/attractor/voice.py`（只做音色） |
| 雨声 + 钢琴垫底 | `python tools/yuwei/prepare.py mix` | Freesound CC0 窗雨预览；Kevin MacLeod《Meditation Impromptu 02》CC BY |
| 音效 `audio/sfx.wav` | `~/.venvs/demucs/Scripts/python.exe tools/yuwei/sfx.py` | 纸张、贴纸、关门、远喇叭、灯开关，numpy 合成 |
| 句子起止 `phrases.json` | `~/.venvs/demucs/Scripts/python.exe tools/yuwei/align.py` | 能量图动态规划，做法同第十三期 |

成片里钢琴要署名：`Meditation Impromptu 02 — Kevin MacLeod (incompetech.com) — CC BY`（已写在「晚安」那张卡上）。

## 做法

画面是一张 12800×2160 的纸。八叠海报稍微重叠，镜头到站慢、赶路快，路线上下拐。贴纸在念到的时候弹出来。

科学说法按 `refer/雨未愁眠/资料/00_总清单报告.md`：雨声不是标准粉红噪音（只说听感）；白噪音海报画的是平坦谱；掩蔽用 Stanchina 2005 的落差，不把 Ngo 那种闭环粉红点击说成雨声；照度用数量级；Appleton 写成「有人说」；Riedy 2021 的结论是证据质量很低、没有定论。

## 已知局限

- Freesound 目前用的是 HQ 预览 mp3，混音登录后可换成官方 wav。
- 「晚安」三个字在录音里很短，镜头在片尾多停了几秒。
