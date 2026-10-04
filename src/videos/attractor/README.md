# 《巨引源》（成片 ID `Attractor`）

> 放松助眠的科普：从床上的夜空升到银河系，用真实的微波背景、2MRS 和 Cosmicflows-4 数据自己建模，论文页上划线标注，讲「巨引源」这三十多年的追寻；深邃静谧配乐循环续长
> 第 13 期 · 约 6 分 44 秒（念白 6 分 31 秒，前有片名 5.5 秒、后留 7.8 秒） · 渲染：`npm run render -- Attractor`（带 `--gl=angle --color-space=bt709 --concurrency=3`）

## 文件

- `Compositions.tsx`、`Film.tsx`：成片 `Attractor`，总装：十幕、字幕、片名、颗粒
- `theme.ts`：帧率、总时长（配乐的 428.5 秒）、颜色、`SCENES`（每一幕的起止秒）
- `time.tsx`、`labels.tsx`：时间轴外壳与关键帧；小标注、圈注、论文页高亮框、英文原句加小字中文、来源小字
- `space.tsx`：三维基础件——画布（半分辨率再放大）、镜头、银道坐标、天球（银河贴图加随机的星）、地球、星系点云、细线
- `data.ts`：读二进制数据
- `script.json`、`phrases.json`、`script.ts`、`Subtitles.tsx`：念白与字幕。`script.json` 由 `tools/attractor/make_script.py` 从 `refer/巨引源/文案.md` 生成；`phrases.json` 是 `align.py` 对着录音量出来的每个小句的起止秒和每一幕的起止秒（做法见该脚本开头：只在录音的真实停顿处切开，Whisper 的粗窗口防止整体漂移；结尾几句是对着能量图手工校的）
- `scenes/`：`Sky`（入睡：银河延时、从空间站看的地球、银河系）、`Cmb`（微波背景加偶极）、`Stream`（二维的落叶与漩涡）、`Leaves`（哈勃流与特殊速度，Cosmicflows-4）、`Paper`（1987 年论文页、大望远镜快切、全天剩余速度图、2MASS 全天图）、`Zone`（银河盘面的尘埃；2MRS 全天图上的隐匿带；红外与可见光的对比；射电 Parkes 与 MeerKAT）、`MollGrid`（椭圆全天图的经纬网）、`Norma`（矩尺座星系团的三张照片）、`Laniakea`（Cosmicflows-4 与论文页）、`PushPull`（沙普利、船帆座、偶极排斥体）、`Maybe`（2026 年那篇论文，CLUES 模拟）、`Night`（晚安）

## 素材与不入库的东西

`public/attractor/` 下的内容全部由 `python tools/attractor/prepare.py all` 生成，不入库（授权不同，且体积大）。需要：

| 生成什么 | 命令 | 来源 |
| --- | --- | --- |
| 贴图、论文页、真实照片 `img/` | `prepare.py images` | `library/images/`（地球、银河、微波背景）；`refer/巨引源/素材/图/`、`refer/巨引源/论文/页/` |
| 视频 `video/` | `prepare.py videos` | `refer/巨引源/素材/视频/`（ESO VISTA、CLUES 模拟） |
| 数据 `data/galaxies.bin`、`cf4.bin` | `prepare.py data` | `refer/光速_时间/catalog/2mrs_1175_done.dat`（2MRS，使用条款不允许再分发）；`refer/巨引源/数据/cf4_groups.tsv`（Cosmicflows-4，VizieR J/ApJ/944/94/groups） |
| 念白 `audio/voice.wav` | `python tools/attractor/voice.py <录音> public/attractor/audio/voice.wav`（默认只做音色，不降调） | `refer/巨引源/巨引源_念白.mp3`；用户自己录的，不入库 |
| 配乐 `audio/bgm.wav` | `prepare.py music`（即 `loop_music.py 15`，15 个乐句，404.6 秒） | `library/music/深邃静谧旋律 (Inst.).flac`，作者与授权没查到 |

`refer/巨引源/` 里有资料（`资料.md`）、文案、素材清单、GPT 的核对结果、论文 PDF 和下载素材，都不入库。

## 做法

- 时间轴跟着念白走：各幕的动画是按「设计时间」（总长 428.5 秒，当初跟着配乐写的）写的，`time.tsx` 按念白里每一幕的真实起止把设计时间分段线性映射到放映时间，所以改了念白只要重跑 `align.py`，幕里不用改。配乐：原曲 2:21 是 80 bpm、每小节 3 秒、每 8 小节一个乐句，前奏 12 秒后是一段稳定的循环。`loop_music.py` 把前奏、中段循环 4 遍、收尾拼起来，切点落在乐句边界，接缝交叉淡化 1.5 秒。原文件是 6 声道 5.1，响的是后三个声道，直接 `-ac 2` 会被压低约 8 dB，所以手工混音再补回响度（−18.8 LUFS）。
- 坐标：银道直角坐标 x 朝银心、y 朝 l=90°、z 朝银北极，进 three 时换成 (x, z, −y)。红移直接除以 70 换成距离，所以星系团会被拉成指向我们的「手指」，只用来展示分布和隐匿带的缺口，不当作精确的三维位置。
- 微波背景的偶极是**示意**：真实的偶极比图上的起伏大三十倍左右，画面用颜色表示方向，并写明了。
- Cosmicflows-4 的特殊速度是视向的（沿视线），所以以我们为中心画出来的线是放射状的。点按 Vpec 的正负上色（橙：比膨胀多出的速度是远离我们；蓝：朝我们来）。线只画 6–75 Mpc 的组，|Vpec| 在 120–900 km/s 之间，长度放大了。
- 拉尼亚凯亚的圈是**示意**：论文说近似为圆、直径约 160 Mpc，没给中心；画面把它放在巨引源这一边，我们在里面。
- 巨引源、沙普利、船帆座、偶极排斥体的位置来自论文，银道坐标与速度见 `refer/巨引源/资料.md`；偶极排斥体的 (93°, −18°) 是由论文给的超星系直角坐标向量换算的，论文没列银道数值。
- 论文页：PyMuPDF 渲成 200 dpi 的图，再缩到 1500 px 宽；高亮框的坐标是图片自己的像素。

## 来源与署名

- 哈勃 POTW1302a：ESA/Hubble & NASA，CC BY 4.0
- 开头银河延时（Joshua tree）：Commons，公有领域；地球夜景：ESA / NASA，Alexander Gerst，CC BY-SA 3.0 IGO
- 望远镜照片：Kitt Peak、Cerro Tololo：NOIRLab / NSF / AURA，CC BY 4.0；威尔逊山 Hooker：CC BY-SA 4.0
- 射电：Parkes 望远镜黄昏，CSIRO ScienceImage 4350，CC BY 3.0；MeerKAT 延时，CC BY-SA 3.0
- 邻近超星系团飞行：Galaxies3D，CC BY-SA 4.0
- DECaPS 矩尺座星系团：DECaPS / Legacy Surveys / D. Lang（Perimeter Institute），CC BY 4.0
- Chandra：X-ray NASA/CXC/UVa/M. Sun 等；Hα SOAR（公有领域）
- 2MASS 全天星系图：IPAC/Caltech，T. Jarrett（公有领域）
- ESO VISTA 红外与可见光对比：ESO / VVV Consortium / Nick Risinger，CC BY 4.0
- CLUES 约束模拟：CLUES，CC BY 4.0
- 普朗克微波背景：ESA / Planck Collaboration；地球与银河贴图：Solar System Scope（基于 NASA 数据），CC BY 4.0
- 数据：2MRS（Huchra 等 2012）；Cosmicflows-4（Tully 等 2023, ApJ 944, 94）
- 论文页（摘要处划线标注，出处写在画面上）：Dressler 等 1987；Stiskalek 等 2026；Tully 等 2014

## 已知局限

- 隐匿带的红色高亮是按银纬 ±10° 画的，不是严格的 20% 天区。
- 配乐授权没查到，不入库；成片发到哪里由用户决定。
