// 宇宙学的几个数：按普朗克 2018 的参数自己积分出来，片子里的距离、回溯时间和三条界线都从这里取
import { LIGHT_YEAR } from "./units";

const H0 = 67.4;
const OMEGA_M = 0.315;
const OMEGA_R = 9.2e-5;
const OMEGA_L = 1 - OMEGA_M - OMEGA_R;

// 哈勃距离 c / H₀（光年）与哈勃时间 1 / H₀（年），数值上相等
const HUBBLE_YEARS = 977.8e9 / H0;
const expansion = (a: number) => Math.sqrt(OMEGA_R / a ** 4 + OMEGA_M / a ** 3 + OMEGA_L);

// 按 ln a 从今天（a = 1）往回积分：到尺度因子 a 那一刻为止的共动距离（光年）和回溯时间（年）
const STEPS = 6000;
const LN_MIN = Math.log(1e-9);
const DISTANCE: number[] = [0];
const LOOKBACK: number[] = [0];
(() => {
  const h = -LN_MIN / STEPS;
  for (let i = 0; i < STEPS; i++) {
    const a = Math.exp(-(i + 0.5) * h);
    DISTANCE.push(DISTANCE[i] + (HUBBLE_YEARS / (a * expansion(a))) * h);
    LOOKBACK.push(LOOKBACK[i] + (HUBBLE_YEARS / expansion(a)) * h);
  }
})();

// 往后（a → ∞）积分：此刻发出的光最远能到的共动距离
const FUTURE = (() => {
  const top = Math.log(1e6);
  const n = 4000;
  const h = top / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.exp((i + 0.5) * h);
    sum += (HUBBLE_YEARS / (a * expansion(a))) * h;
  }
  return sum;
})();

// 米
export const HUBBLE_RADIUS = HUBBLE_YEARS * LIGHT_YEAR;
export const EVENT_HORIZON = FUTURE * LIGHT_YEAR;
export const PARTICLE_HORIZON = DISTANCE[STEPS] * LIGHT_YEAR;
// 年
export const AGE = LOOKBACK[STEPS];
// 很久以后膨胀只剩暗能量在推，每过这么多年宇宙大 e 倍
export const E_FOLD_YEARS = HUBBLE_YEARS / Math.sqrt(OMEGA_L);

// 一样东西如今离我们 meters 远（共动距离），我们看到的是它多少年前的样子
export const lookbackYears = (meters: number) => {
  const ly = Math.min(meters, PARTICLE_HORIZON) / LIGHT_YEAR;
  let lo = 0;
  let hi = STEPS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (DISTANCE[mid] < ly) lo = mid;
    else hi = mid;
  }
  const k = (ly - DISTANCE[lo]) / (DISTANCE[hi] - DISTANCE[lo]);
  return LOOKBACK[lo] + (LOOKBACK[hi] - LOOKBACK[lo]) * Math.min(Math.max(k, 0), 1);
};
