# 亚马逊河这一期的数据

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
