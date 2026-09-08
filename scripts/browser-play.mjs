import puppeteer from 'puppeteer-core'
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const errors = []
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })

const t0 = Date.now()
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
let readyAt = null
for (let i = 0; i < 40; i++) {
    const enabled = await page.evaluate(() => !document.querySelector('#explore').disabled)
    if (enabled) { readyAt = Date.now() - t0; break }
    await new Promise(x => setTimeout(x, 1000))
}
console.log('explore habilitado em', readyAt, 'ms')
await page.screenshot({ path: 'resources/t1-intro.png' })

await page.click('#explore')
await new Promise(x => setTimeout(x, 3000))
await page.screenshot({ path: 'resources/t2-entered.png' })

// dirige por 3s (seta pra frente)
await page.keyboard.down('ArrowUp')
await new Promise(x => setTimeout(x, 3000))
await page.keyboard.up('ArrowUp')
const pos = await page.evaluate(() => window.application.world.car.chassis.object.position.toArray().map(n => +n.toFixed(2)))
console.log('posição do carro após dirigir:', JSON.stringify(pos))
await page.screenshot({ path: 'resources/t3-driven.png' })

console.log('ERROS:', [...new Set(errors)].slice(0, 10).join('\n') || '(nenhum)')
await browser.close()
