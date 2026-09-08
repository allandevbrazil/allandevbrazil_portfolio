import puppeteer from 'puppeteer-core'
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []
pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '')))
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()) })
pg.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()) })

await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
// espera recursos do mundo
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
console.log('mundo pronto')

// entra no modo zumbi
await pg.evaluate(() => window.golZombie.enter())
await new Promise(r => setTimeout(r, 2000))
await pg.screenshot({ path: 'resources/g-menu.png' })

// inicia o jogo
await pg.evaluate(() => document.querySelector('[data-action="start"]')?.click())
await new Promise(r => setTimeout(r, 6000))
const state = await pg.evaluate(() => {
    const g = window.golZombie.game
    return { state: g.state, level: g.level, zombies: g.zombies.count, crystals: g.crystals.totalCount, emerald: !!g.crystals.emerald, buildings: g.city.buildingAABBs.length, hp: g.health.value, timer: g.timer.remaining }
})
console.log('STATE', JSON.stringify(state))
await pg.screenshot({ path: 'resources/g-play.png' })

// dirige um pouco
await pg.keyboard.down('ArrowUp'); await new Promise(r => setTimeout(r, 2500)); await pg.keyboard.up('ArrowUp')
const car = await pg.evaluate(() => window.application.world.car.chassis.object.position.toArray().map(n => +n.toFixed(1)))
console.log('CAR', JSON.stringify(car))
await pg.screenshot({ path: 'resources/g-drive.png' })

console.log('ERROS:', [...new Set(errs)].slice(0, 15).join('\n') || '(nenhum)')
await b.close()