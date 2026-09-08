import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1200))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 2500))

const res = await pg.evaluate(async () => {
    const g = window.golZombie.game, car = window.application.world.car, body = window.application.world.physics.car.chassis.body
    // cristal na frente (-Y) a 6 unidades, carro parado
    const it = g.crystals.items.find(i => !i.collected)
    const p = car.chassis.object.position
    it.mesh.position.set(p.x, p.y - 6, 1.2)
    body.velocity.set(0, 0, 0)
    const before = g.crystals.collectedCount
    window.application.world.controls.actions.up = true
    let moved = 0
    for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 120)); if (it.collected) break }
    window.application.world.controls.actions.up = false
    return { before, after: g.crystals.collectedCount, collected: it.collected, dy: +(car.chassis.object.position.y - p.y).toFixed(1) }
})
console.log('CRYSTAL DRIVE', JSON.stringify(res))
console.log('ERROS:', [...new Set(errs)].slice(0, 6).join('\n') || '(nenhum)')
await b.close()
