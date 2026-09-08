import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1200))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click())
await new Promise(r => setTimeout(r, 6000))
const st = await pg.evaluate(() => { const g = window.golZombie.game, c = window.application.world.car; return { carVisible: c.chassis.object.visible, carPos: c.chassis.object.position.toArray().map(n => +n.toFixed(1)), zombies: g.zombies.count, hp: g.health.value, zSpeed: g._diff.zombieSpeed } })
console.log('ZOMBIE', JSON.stringify(st))
await pg.screenshot({ path: 'resources/zfinal.png' })
console.log('ERR', errs.slice(0, 4).join('|') || 'none')
await b.close()
