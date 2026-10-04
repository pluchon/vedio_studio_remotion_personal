# 《亚马逊河》（成片 ID `Amazon`）

> 真实高程、河网和卫星底图铺成的三维地图，着色器算光影、雾和河面，亮线沿河道画到入海口
> 第 7 期 · 82 秒 · 渲染：`npm run render -- Amazon`（带 `--gl=angle --color-space=bt709 --concurrency=2`）

## 文件

- `Compositions.tsx`：成片 `Amazon`，以及这趟旅程的时间表和旁白
- `Film.tsx`：整片的总装：地面、河网、大气，叠上地名、旁白、读数和水系小图
- `plan.ts`：主河道这条线怎么走、镜头怎么跟
- `sites.ts`：标在地图上的城市、支流和停靠点
- `Places.tsx`、`Chart.tsx`、`Overlay.tsx`：地名、右上角同步勾勒的水系小图、旁白和读数
- `theme.ts`：数据范围、经纬度和球面的换算、机位
- `three/`：着色器：按高程起伏的地面（山影、云、晨雾、河面）、河网的线、大气

## 素材与不入库的东西

- 配乐 `public/amazon/audio/green-to-blue.mp3` 不入库。`public/amazon/data/` 和 `public/amazon/textures/land.jpg` 不入库，由 `tools/amazon/build_data.py` 生成（下载地址见下面）。

---

`build_data.py` 把下面四个文件整理成视频直接读的数据。原始文件放在 `refer/亚马逊河/`（不入库），不用解压。

| 文件 | 内容 | 下载 |
| --- | --- | --- |
| `hyd_sa_dem_15s.zip` | 南美洲高程，15 角秒一格 | https://data.hydrosheds.org/file/hydrosheds-v1-dem/hyd_sa_dem_15s.zip |
| `HydroRIVERS_v10_sa_shp.zip` | 南美洲河网，每段带流量和离海的距离 | https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_sa_shp.zip |
| `world.topo.bathy.200408.3x21600x21600.B1.jpg` | 卫星底图，赤道以北 | https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73776/world.topo.bathy.200408.3x21600x21600.B1.jpg |
| `world.topo.bathy.200408.3x21600x21600.B2.jpg` | 卫星底图，赤道以南 | https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73776/world.topo.bathy.200408.3x21600x21600.B2.jpg |

```bash
python tools/amazon/build_data.py
```

需要 PATH 上有 ffmpeg 和 pwsh。本机没有 numpy 和 PIL，所以高程的 TIFF 是脚本自己解的；21600 见方的 JPEG ffmpeg 读不了，由 `crop_land.ps1` 调系统自带的解码器裁（只能在 Windows 上跑）。

生成的 `public/amazon/data/` 和 `public/amazon/textures/land.jpg` 不入库，克隆后要自己跑一遍脚本。

## 署名

- 高程与河网：HydroSHEDS 与 HydroRIVERS。Lehner, B., Verdin, K., Jarvis, A. (2008). New global hydrography derived from spaceborne elevation data. *Eos*, 89(10), 93–94；Lehner, B., Grill, G. (2013). Global river hydrography and network routing. *Hydrological Processes*, 27(15), 2171–2186。数据见 https://www.hydrosheds.org
- 卫星底图：NASA Earth Observatory, Blue Marble: Next Generation（2004 年 8 月）。

## 片子里的数字

海拔、离海的距离、流量三个读数直接取自上面的数据。河长按这份数据量出来是 5900 公里，比常见说法的 6400 公里短，因为按格子走出来的河道量不出细小的弯。停靠点的说明（米斯米雪山海拔 5597 米、奥比杜斯河宽约 1.8 公里、两水并排约六公里、入海流量约每秒 20 万立方米、约占全球入海河水的五分之一）用的是通行的说法。城市和支流的坐标是手写的，再用河网数据核对过离最近河段的距离。
