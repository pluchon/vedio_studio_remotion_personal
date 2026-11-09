# 《萌部落》（成片 ID `MengCenter`）

> 萌部落社区的项目演示：网页截图装进会弹的浏览器窗口，琪露诺贴纸踩着拍子蹦，奶糖助手的聊天、记忆、语音和架构都画成小动画；日系可爱配乐用真实乐器采样渲染
> 第 14 期 · 92 秒 · 渲染：`npm run render -- MengCenter`（带 `--color-space=bt709`）

## 文件

- `Compositions.tsx`、`Film.tsx`：成片 `MengCenter`；`Film` 按小节排各幕，幕与幕之间是一阵彩色圆泡的转场
- `theme.ts`：帧率、节拍（一拍 12 帧、一小节 48 帧）、颜色、字体、`SCENES`（每一幕的起止小节）
- `kit.tsx`：字体载入、跟拍子的动效（`pop` 弹出、`hop` 每拍跳一下、`thump` 每拍鼓一下、`at(拍)` 拍点帧，后半拍按配乐的摇摆推迟）、背景、浏览器窗口（截图、镜头放大、截图坐标里的圈注）、胶带标题、贴纸、颜文字、闪光、卡片、小图标
- `shots.ts`：截图文件名和像素尺寸
- `NaitangDemo.tsx`：竖屏小样 `MengCenter-NaitangDemo`（1080×1920，40 帧/秒，9 秒）：标题牌、星标数字滚动、彩纸，下层是会动的奶糖。奶糖动图 `public/meng-center/naitang/star.webm` 由 ElevenLabs「图片生成/GIF动图生成」工作流出绿幕 GIF，再用 `tools/common/sprite_gif.py` 补帧抠图；念白（Lulu 声音）在 `public/meng-center/naitang/voice/`，不入库。星标数是占位
- `journal/`：更新特辑 `MengCenter-Journal`（成片 `out/meng-journal.mp4`）（1920×1080，40 帧/秒，约 2 分钟），「奶糖的萌部落手帐」：桌上一本线圈手帐，一幕翻一页，翻页落在小节线上，三种翻法（往上翻、滑走、放大淡出）轮着来。奶糖用 Lulu 的声音讲 2026-11-01 以后的更新。
  - `script.json` 是念白稿，里面也写了音色和参数。
  - `voice.json` 记每句的时长和每帧的嘴型包络，由 `tools/meng-center/journal_voice.py` 生成。
  - `plan.json` 记每幕的小节和每句的起点，由 `tools/meng-center/journal_music.py` 生成，它也渲配乐。
  - 画面文件：
    - `Journal.tsx` 总装：翻页、镜头推近、字幕、配乐压低、奶糖在哪儿出场。
    - `Naitang.tsx` 对口型的桌宠分层图。
    - `paper.tsx`、`parts.tsx` 手帐积木：胶带、印章、带圈注和推镜的截图拍立得、关键词大字、手画小图标（画面里不用 emoji）、GIF 角色。
    - `pages1–3.tsx` 十四页。
  - 奶糖只在四处出场：开场、讲她自己、离线、结尾。
    - 开口那两句（「大家好」「当然，还有我」）用萌部落已删的桌宠分层图对口型。
    - 其余是 GIF 动图：`naitang/wave.webm` 挥手、`star.webm` 举星星、`sleepy.webm` 犯困。都是 ElevenLabs「图片生成/GIF动图生成」工作流出的 16 帧绿幕 GIF，再用 `tools/common/sprite_gif.py` 补到 40 帧并抠图；64 帧正好一小节。
  - 截图分两批：
    - 注册、发帖、评论区、创作复盘、成长、收藏夹、改密码、奶糖离线对话，是 2026-11-07 改版后的真截图（`img/v2/`）。
    - 首页、搜索、私信是 11-01 的。
  - 手画的界面卡片角上都标了「示意」。画面上的经验值、等级门槛、换一批次数、撤回时限都按萌部落 `docs/`。
- `scenes/`：`Intro`（片名、结尾封面和彩纸）、`Community`（注册审核、主页、发帖、详情、语义搜索）、`Quick`（创作中心、成长、消息、个人中心）、`Meng`（奶糖助手、聊天、五层记忆、气泡语音与桌宠）、`Arch`（服务、一次发帖的事件、技术栈）

## 素材与不入库的东西

`public/meng-center/` 下的图和配乐都不入库，字体（OFL，从第十期复制）入库。

| 生成什么 | 命令 | 来源 |
| --- | --- | --- |
| 截图、角色图、贴纸 `img/` | `python tools/meng-center/prepare.py [萌部落仓库路径]`（默认 `../meng_center`） | 本机站点 1536×960 重拍的页面（存 `refer/萌部落演示/shots/`，不入库）；README 图床上的登录页和横幅；前端 `src/assets/` 的奶糖头像、桌宠、语音海报、表情贴纸、蝴蝶结标志。琪露诺（《东方Project》）的同人二创 |
| 桌宠分层图 `img/pet/` | `prepare.py`（从萌部落 `698e9e2^` 那次提交里取，桌宠 2026-11-07 已从前端删掉） | 萌部落前端 `src/assets/companion/pet/` |
| 手帐片念白 `audio/journal/` | `python tools/meng-center/journal_voice.py`（要 `ELEVENLABS_API_KEY`） | ElevenLabs v4，Lulu 音色 |
| 手帐片配乐 `audio/journal-bgm.wav` | `~/.venvs/demucs/Scripts/python.exe tools/meng-center/journal_music.py` | G 大调 150 BPM，陶笛、马林巴、拨弦低音提琴、竖琴、钟琴，加鼓组和通鼓过门，都是真实采样（VCSL、VSCO 2 CE） |
| 改版后的截图 `img/v2/` | `prepare.py`（从 `refer/萌部落演示/shots-1107/` 复制） | 萌部落那边 Claude 会话里浏览器截的图，800 宽 |
| 配乐 `audio/bgm.wav` | `~/.venvs/demucs/Scripts/python.exe tools/meng-center/music.py` | 自己写的 MIDI，用 `samples/` 里的 VCSL、VSCO 2 CE（CC0）真实采样经 sfizz 渲染 |

## 做法

- 没有念白，时间轴就是配乐：E 大调、150 BPM、八分音符摇摆。段落是前奏 4 小节、A 8、A' 8、B 8、副歌 8 + 8、间奏 8、尾声 4，各幕的切换、弹出、跳动都落在拍点上（`at(拍)`）。B 段每两小节换一幕，副歌讲奶糖，间奏的钟琴分解和弦对着架构图里跑来跑去的事件。
- 配乐的乐器：竖笛主旋律（短音断奏采样、长音持续采样），钟琴叠高八度，弹拨琴 strumstick 像尤克里里一样扫弦，立式钢琴反拍短和弦，大号断奏打「嘭—嚓」；打击乐是大鼓、拍手、木箱鼓、沙锤、铃鼓、三角铁、木鱼、风铃。副歌是王道进行（IV–V–iii–vi）。
- 这两个采样库的文件名都把中央 C 记作 C3，实测后统一升一个八度映射。沙锤、铃鼓、三角铁的采样录得很轻（峰值约 -30 dB），要放大三四十 dB，所以每轨先高通再按「有声音的那些时刻」的平均响度配平，不然录音里的低频隆隆声会被一起放大。整首 -16 LUFS。
- 截图统一 1536 宽，`Window` 按窗口宽度缩放，圈注用截图像素坐标。
- 文字只写萌部落 README 和 `docs/` 里有的事；聊天内容是截图里的原话，详情页的评论是示意，画面上标了。

## 已知局限

- 我听不到声音，配乐的平衡只按各轨响度和频谱图判断。
- 截图是 2026-11-01 重拍的，网页再改版要重新拍。面板只能截 800 宽，重拍做法是把页面放大两倍分四块截、再拼回 1536 宽。
