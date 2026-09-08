import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1500))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 3500))
await pg.evaluate(() => {
    const g = window.golZombie.game; const car = window.application.world.car.chassis.object.position
    g.monsters.spawn(g._rng, g.city, { fromPoint: { x: car.x, y: car.y }, hideDepth: 1, count: 1 })
    g.zombies.spawnHorde(6, g.city, g._rng, { x: car.x, y: car.y }, g._diff.zombieSpeed)
})
await new Promise(r => setTimeout(r, 1500))
console.log('STATE', JSON.stringify(await pg.evaluate(() => ({ monsters: window.golZombie.game.monsters.count, zombies: window.golZombie.game.zombies.count }))))
await pg.screenshot({ path: 'resources/gfx.png' })
console.log('ERR', errs.slice(0, 5).join('|') || 'none')
await b.close()
