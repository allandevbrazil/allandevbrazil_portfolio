import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1200))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 3000))

// mede a velocidade real ao dirigir com a tecla (para calibrar)
const speedProbe = await pg.evaluate(async () => {
    const pc = window.application.world.physics.car
    window.application.world.controls.actions.up = true
    await new Promise(r => setTimeout(r, 2000))
    const fs = pc.forwardSpeed; const spd = pc.speed
    window.application.world.controls.actions.up = false
    return { forwardSpeed: +fs.toFixed(4), speed: +spd.toFixed(4) }
})
console.log('SPEED ao dirigir', JSON.stringify(speedProbe))

// RUN-OVER: zumbi na frente do carro (direção -Y), carro em alta velocidade real
const runover = await pg.evaluate(async () => {
    const g = window.golZombie.game, car = window.application.world.car, body = window.application.world.physics.car.chassis.body
    const p = car.chassis.object.position
    g.zombies.spawn(1, g.city, Math.random, { speed: 0 })
    const z = g.zombies.active[g.zombies.active.length - 1]
    z.mesh.position.set(p.x, p.y - 5, 0)
    const before = g.score.stats.zombies
    window.application.world.controls.actions.up = true
    await new Promise(r => setTimeout(r, 1800))
    window.application.world.controls.actions.up = false
    return { before, after: g.score.stats.zombies, combo: g.score.total }
})
console.log('RUNOVER', JSON.stringify(runover))

// CRYSTAL: cristal na frente, dirige e coleta
const crys = await pg.evaluate(async () => {
    const g = window.golZombie.game, car = window.application.world.car
    const it = g.crystals.items.find(i => !i.collected); if (!it) return { skipped: true }
    const p = car.chassis.object.position
    it.mesh.position.set(p.x, p.y - 5, 1.2)
    const before = g.crystals.collectedCount
    window.application.world.controls.actions.up = true
    await new Promise(r => setTimeout(r, 1800))
    window.application.world.controls.actions.up = false
    return { before, after: g.crystals.collectedCount }
})
console.log('CRYSTAL', JSON.stringify(crys))
console.log('ERROS:', [...new Set(errs)].slice(0, 8).join('\n') || '(nenhum)')
await b.close()
