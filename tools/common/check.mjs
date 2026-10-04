// 体检：登记表、各期 README、成片注册、公共资料库的目录，是否和实际文件对得上：npm run check
// 有错误退出码为 1；警告（比如资料库里登记了、本机没有的文件）不算错
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
const exists = (...p) => fs.existsSync(path.join(ROOT, ...p))
const errors = []
const warns = []

// 1. 登记表和 src/videos 下的文件夹
const episodes = JSON.parse(read('src', 'videos', 'episodes.json'))
const dirs = fs.readdirSync(path.join(ROOT, 'src', 'videos'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
const registered = new Set(episodes.map((e) => e.dir))
for (const d of dirs) if (!registered.has(d)) errors.push(`src/videos/${d}/ 没有登记到 episodes.json`)
const ids = new Set()
for (const e of episodes) {
  if (ids.has(e.id)) errors.push(`成片 ID 重复：${e.id}`)
  ids.add(e.id)
  for (const k of ['n', 'id', 'dir', 'title', 'duration', 'summary', 'tags', 'render']) if (e[k] === undefined) errors.push(`${e.id ?? e.dir} 缺字段 ${k}`)
  if (!dirs.includes(e.dir)) errors.push(`${e.id}：src/videos/${e.dir}/ 不存在`)
  else {
    if (!exists('src', 'videos', e.dir, 'README.md')) errors.push(`${e.id}：缺 src/videos/${e.dir}/README.md`)
    // 2. 成片 ID 真的在 Compositions.tsx 里注册了
    const comp = path.join('src', 'videos', e.dir, 'Compositions.tsx')
    if (!exists(comp)) errors.push(`${e.id}：缺 ${comp}`)
    else if (!read(comp).includes(`id="${e.id}"`)) errors.push(`${e.id}：${comp} 里没有 id="${e.id}"`)
  }
}

// 3. 根 README 的视频列表是最新的（改了登记表要 npm run docs）
const readme = read('README.md')
const a = readme.indexOf('<!-- episodes:start -->')
const b = readme.indexOf('<!-- episodes:end -->')
if (a < 0 || b < 0) errors.push('README.md 里找不到 episodes 标记')
else {
  const block = readme.slice(a, b)
  for (const e of episodes) if (!block.includes(`\`${e.id}\``) || !block.includes(e.tags[0])) errors.push(`README.md 的视频列表没跟上 ${e.id}，跑一下 npm run docs`)
}

// 4. 公共资料库：磁盘上的文件都要在 INDEX.md 登记；登记了但本机没有的只提醒
if (exists('library', 'INDEX.md')) {
  const index = read('library', 'INDEX.md')
  for (const kind of ['music', 'images', 'articles']) {
    const dir = path.join(ROOT, 'library', kind)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith('.')) continue
      if (!index.includes(f)) errors.push(`library/${kind}/${f} 没有在 library/INDEX.md 登记`)
    }
  }
  const kinds = ['music', 'images', 'articles']
  const onDisk = kinds.flatMap((k) => (fs.existsSync(path.join(ROOT, 'library', k)) ? fs.readdirSync(path.join(ROOT, 'library', k)) : []))
  const cells = [...index.matchAll(/^\| ([^|]+?) \|/gm)].map((m) => m[1].trim()).filter((x) => /\.[a-z0-9]{2,4}/i.test(x) && x !== '文件')
  for (const cell of cells) {
    // 一个格子可能写一个文件名（里面可能有空格），也可能用空格并排写几个
    const ok = onDisk.includes(cell) || onDisk.some((f) => cell.includes(f)) || cell.split(' ').some((f) => onDisk.includes(f))
    if (!ok) warns.push(`INDEX 里登记了 ${cell}，本机 library/ 里没有（克隆后需要自己补）`)
  }
}

for (const w of warns) console.warn('提醒：', w)
for (const e of errors) console.error('错误：', e)
console.log(`体检完成：${episodes.length} 期，${errors.length} 个错误，${warns.length} 个提醒`)
process.exit(errors.length ? 1 : 0)
