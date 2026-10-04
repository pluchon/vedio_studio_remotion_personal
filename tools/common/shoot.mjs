// 批量截图：node tools/common/shoot.mjs <site.json> <shots.json> <输出目录> [只拍的名字...]
// site.json 描述站点：各端地址、登录 Cookie 名、令牌文件（相对 site.json）、视口；shots.json 描述要拍的页面与操作步骤
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const [sitePath, shotsPath, outDir, ...only] = process.argv.slice(2)
if (!sitePath || !shotsPath || !outDir) {
  console.error('用法：node tools/common/shoot.mjs <site.json> <shots.json> <输出目录> [只拍的名字...]')
  process.exit(1)
}
const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'))
const { shots } = JSON.parse(fs.readFileSync(shotsPath, 'utf8'))
const tokensFile = site.tokens ? path.resolve(path.dirname(sitePath), site.tokens) : null
const tokens = tokensFile && fs.existsSync(tokensFile) ? JSON.parse(fs.readFileSync(tokensFile, 'utf8')) : {}
fs.mkdirSync(outDir, { recursive: true })

const CHROME = site.chrome ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--font-render-hinting=none']
})

try {
  for (const shot of shots) {
    if (only.length && !only.includes(shot.name)) continue
    const page = await browser.newPage()
    const vp = site.viewport
    await page.setViewport({ width: shot.width ?? vp.width, height: shot.height ?? vp.height, deviceScaleFactor: vp.scale })
    if (shot.login !== false && site.cookies?.[shot.end]) {
      if (!tokens[shot.end]) throw new Error(`${shot.name}: 令牌文件里没有「${shot.end}」端的令牌`)
      const host = new URL(site.origins[shot.end]).hostname
      await page.setCookie({ name: site.cookies[shot.end], value: tokens[shot.end], domain: host, path: '/' })
    }
    await page.goto(site.origins[shot.end] + shot.url, { waitUntil: 'networkidle0', timeout: 60000 })
    await sleep(shot.wait ?? 1500)
    for (const step of shot.steps ?? []) {
      if (step.click) {
        await page.waitForSelector(step.click, { timeout: 30000 })
        await page.$eval(step.click, (el) => el.click())
      }
      if (step.clickText) {
        // 按可见文字点击（取最后一个匹配，通常是最内层元素）
        const ok = await page.evaluate(({ sel, text }) => {
          const list = [...document.querySelectorAll(sel)].filter((el) => el.textContent.trim().includes(text) && el.offsetParent !== null)
          if (!list.length) return false
          list[list.length - 1].click()
          return true
        }, { sel: step.selector ?? '*', text: step.clickText })
        if (!ok) throw new Error(`${shot.name}: 找不到文字「${step.clickText}」`)
      }
      if (step.eval) await page.evaluate(step.eval)
      if (step.waitFor) await page.waitForSelector(step.waitFor, { timeout: step.timeout ?? 30000 })
      if (step.waitGone) await page.waitForFunction((s) => !document.querySelector(s), { timeout: step.timeout ?? 180000 }, step.waitGone)
      await sleep(step.wait ?? 800)
      if (step.shot) {
        await page.screenshot({ path: path.join(outDir, `${step.shot}.png`) })
        console.log('已截图', step.shot)
      }
      if (step.rect) {
        // 记录元素在视口中的位置（按视口宽高归一化），供视频里叠加动效
        const vpNow = page.viewport()
        const r = await page.$eval(step.rect.selector, (el) => {
          const b = el.getBoundingClientRect()
          return { x: b.x, y: b.y, w: b.width, h: b.height }
        })
        const file = path.join(outDir, 'rects.json')
        const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
        all[step.rect.name] = { x: r.x / vpNow.width, y: r.y / vpNow.height, w: r.w / vpNow.width, h: r.h / vpNow.height }
        fs.writeFileSync(file, JSON.stringify(all, null, 2))
        console.log('已记录位置', step.rect.name)
      }
    }
    const file = path.join(outDir, `${shot.name}.png`)
    await page.screenshot({ path: file, fullPage: !!shot.fullPage })
    console.log('已截图', shot.name)
    await page.close()
  }
} finally {
  await browser.close()
}
