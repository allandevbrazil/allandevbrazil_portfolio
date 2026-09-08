import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1000, height: 700 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1200))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 2500))
const snap = () => pg.evaluate(() => { const a = window.application; let meshes = 0; a.scene.traverse(o => { if (o.isMesh) meshes++ }); const g = window.golZombie.game; return { meshes, bodies: a.world.physics.world.bodies.length, zombiesActive: g.zombies.active.length, pool: g.zombies.pool.length, level: g.level } })
console.log('L1', JSON.stringify(await snap()))
for (let n = 0; n < 3; n++) {
    await pg.evaluate(async () => { const g = window.golZombie.game, body = window.application.world.physics.car.chassis.body; for (const it of g.crystals.items) { body.position.set(it.mesh.position.x, it.mesh.position.y, 2); body.velocity.set(0, 0, 0); await new Promise(r => setTimeout(r, 40)) } const e = g.crystals.emerald.mesh; body.position.set(e.position.x, e.position.y, 2); await new Promise(r => setTimeout(r, 120)) })
    await new Promise(r => setTimeout(r, 2500))
    console.log('L' + (n + 2), JSON.stringify(await snap()))
}
console.log('ERROS', [...new Set(errs)].slice(0, 5).join('|') || 'none')
await b.close()
