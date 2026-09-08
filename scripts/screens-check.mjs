import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1500))
await pg.screenshot({ path: 'resources/s-menu.png' })

// game over
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 2500))
await pg.evaluate(() => { const g = window.golZombie.game; g.score.registerZombieHit(performance.now()); g.score.collectCrystal(); g.health.lastHitAt = -99999; g.health.value = 0; g.health.trigger('dead') })
await new Promise(r => setTimeout(r, 700))
await pg.screenshot({ path: 'resources/s-gameover.png' })

// win
await pg.evaluate(() => document.querySelector('[data-action="restart"]').click()); await new Promise(r => setTimeout(r, 2500))
await pg.evaluate(async () => { const g = window.golZombie.game; await g.loadLevel(5); g.state='playing'; const body=window.application.world.physics.car.chassis.body; for(const it of g.crystals.items){ body.position.set(it.mesh.position.x, it.mesh.position.y, 2); body.velocity.set(0,0,0); await new Promise(r=>setTimeout(r,60)) } const e=g.crystals.emerald.mesh; body.position.set(e.position.x,e.position.y,2); await new Promise(r=>setTimeout(r,150)) })
await new Promise(r => setTimeout(r, 20000)) // cutscene + win
await pg.screenshot({ path: 'resources/s-win.png' })
console.log('ERROS:', [...new Set(errs)].slice(0, 6).join('\n') || '(nenhum)')
await b.close()
