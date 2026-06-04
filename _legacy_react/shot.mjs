import puppeteer from 'puppeteer-core'

const URL = process.argv[2] || 'http://localhost:4173/'
const OUT = process.argv[3] || '/tmp/forest_shot.png'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
    '--window-size=1280,800',
  ],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })

const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 })
await new Promise((r) => setTimeout(r, 2500)) // 숲 생성 + 몇 프레임 대기
await page.screenshot({ path: OUT })

console.log('errors:', errors.length ? '\n' + errors.join('\n') : 'none')
await browser.close()
