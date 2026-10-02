// 标在地图上的地方。down 是「线画到离海多远时它出现」：城市和支流名取所在河段离海的距离，于是线一画到那里名字就出来
export type Place = {
  zh: string;
  en: string;
  lon: number;
  lat: number;
  down: number;
  kind: "city" | "river";
};

export const PLACES: Place[] = [
  { zh: "库斯科", en: "Cusco", lon: -71.97, lat: -13.53, down: 5609, kind: "city" },
  { zh: "马丘比丘", en: "Machu Picchu", lon: -72.545, lat: -13.163, down: 5491, kind: "city" },
  { zh: "拉巴斯", en: "La Paz", lon: -68.15, lat: -16.5, down: 4600, kind: "city" },
  { zh: "普卡尔帕", en: "Pucallpa", lon: -74.55, lat: -8.38, down: 4438, kind: "city" },
  { zh: "里奥布朗库", en: "Rio Branco", lon: -67.81, lat: -9.97, down: 3775, kind: "city" },
  { zh: "伊基托斯", en: "Iquitos", lon: -73.25, lat: -3.75, down: 3382, kind: "city" },
  { zh: "莱蒂西亚", en: "Leticia", lon: -69.94, lat: -4.21, down: 2896, kind: "city" },
  { zh: "波多韦柳", en: "Porto Velho", lon: -63.9, lat: -8.76, down: 2258, kind: "city" },
  { zh: "博阿维斯塔", en: "Boa Vista", lon: -60.67, lat: 2.82, down: 2218, kind: "city" },
  { zh: "特费", en: "Tefé", lon: -64.71, lat: -3.35, down: 1968, kind: "city" },
  { zh: "圣塔伦", en: "Santarém", lon: -54.71, lat: -2.44, down: 540, kind: "city" },
  { zh: "贝伦", en: "Belém", lon: -48.5, lat: -1.45, down: 30, kind: "city" },

  { zh: "乌鲁班巴河", en: "Urubamba", lon: -72.9, lat: -12.0, down: 5222, kind: "river" },
  { zh: "马拉尼翁河", en: "Marañón", lon: -75.43, lat: -4.87, down: 3810, kind: "river" },
  { zh: "纳波河", en: "Napo", lon: -74.25, lat: -2.13, down: 3671, kind: "river" },
  { zh: "普图马约河", en: "Putumayo", lon: -70.42, lat: -2.53, down: 3017, kind: "river" },
  { zh: "茹鲁阿河", en: "Juruá", lon: -67.49, lat: -5.51, down: 2979, kind: "river" },
  { zh: "雅普拉河", en: "Japurá", lon: -66.96, lat: -1.86, down: 2377, kind: "river" },
  { zh: "普鲁斯河", en: "Purus", lon: -63.6, lat: -5.76, down: 2161, kind: "river" },
  { zh: "内格罗河", en: "Negro", lon: -62.48, lat: -1.15, down: 1756, kind: "river" },
  { zh: "马代拉河", en: "Madeira", lon: -61.33, lat: -5.83, down: 1652, kind: "river" },
  { zh: "塔帕若斯河", en: "Tapajós", lon: -56.31, lat: -4.64, down: 923, kind: "river" },
  { zh: "欣古河", en: "Xingu", lon: -52.6, lat: -4.02, down: 692, kind: "river" },
];

// 停下来看的几个地方：arrive 到 leave 之间镜头停住，名字下面多一行说明
export type Station = {
  zh: string;
  en: string;
  note: string;
  lon: number;
  lat: number;
  arrive: number;
  leave: number;
  // 字写在点的左边（右边要让给水系小图时用）
  left?: boolean;
};

export const STATIONS: Station[] = [
  { zh: "米斯米雪山", en: "Nevado Mismi", note: "海拔 5597 米 · 最远的源头", lon: -71.69, lat: -15.52, arrive: 5.2, leave: 6.2 },
  { zh: "阿塔拉亚", en: "Atalaya", note: "坦博河与乌鲁班巴河汇合 · 始称乌卡亚利河", lon: -73.76, lat: -10.73, arrive: 13.5, leave: 16.0 },
  { zh: "瑙塔", en: "Nauta", note: "乌卡亚利河与马拉尼翁河汇合 · 始称亚马逊河", lon: -73.5, lat: -4.45, arrive: 26.0, leave: 30.0 },
  { zh: "马瑙斯", en: "Manaus", note: "内格罗河汇入 · 两水相会", lon: -59.93, lat: -3.1, arrive: 43.5, leave: 48.5 },
  { zh: "奥比杜斯", en: "Óbidos", note: "干流最窄处 · 宽约 1.8 公里", lon: -55.52, lat: -1.92, arrive: 55.5, leave: 59.0 },
  { zh: "入海口", en: "Mouth of the Amazon", note: "马卡帕以东 · 流量约每秒 20 万立方米", lon: -50.6, lat: 0.1, arrive: 66.5, leave: 69.5, left: true },
];
