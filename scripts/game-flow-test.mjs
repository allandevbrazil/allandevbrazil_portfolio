import puppeteer from 'puppeteer-core'
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []
pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))
pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('colormap')) errs.push('CONSOLE: ' + m.text()) })

const sleep = ms => new Promise(r => setTimeout(r, ms))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await sleep(1000) }
await pg.evaluate(() => window.golZombie.enter()); await sleep(1500)
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await sleep(4000)

// helper: coleta todos os cristais + esmeralda teleportando o carro
async function completeLevel() {
    return await pg.evaluate(async () => {
        const g = window.golZombie.game, body = window.application.world.physics.car.chassis.body
        const sleep = ms => new Promise(r => setTimeout(r, ms))
        for (const it of g.crystals.items) { if (it.collected) continue; body.position.set(it.mesh.position.x, it.mesh.position.y, 2); body.velocity.set(0,0,0); await sleep(120) }
        if (g.crystals.emerald && !g.crystals.emerald.collected) { const e = g.crystals.emerald.mesh; body.position.set(e.position.x, e.position.y, 2); body.velocity.set(0,0,0); await sleep(150) }
        await sleep(200)
        return { crystals: g.crystals.collectedCount, emerald: g.crystals.emeraldFound }
    })
}

// --- TESTE 1: passar da fase 1 -> fase 2 ---
const c1 = await completeLevel()
await sleep(2500)
const s1 = await pg.evaluate(() => { const g = window.golZombie.game; return { state: g.state, level: g.level, timer: Math.round(g.timer.remaining), buildings: g.city.buildingAABBs.length, score: g.score.total } })
console.log('T1 coletados', JSON.stringify(c1), '->', JSON.stringify(s1))

// --- TESTE 2: game over por HP ---
await pg.evaluate(() => { const g = window.golZombie.game; g.health.lastHitAt = -99999; g.health.value = 1; g.health.damage(50, performance.now()) })
await sleep(600)
const s2 = await pg.evaluate(() => ({ state: window.golZombie.game.state, screen: document.querySelector('.zombie-screens')?.classList.contains('show'), title: document.querySelector('.zs-big')?.textContent }))
console.log('T2 gameover HP', JSON.stringify(s2))

// --- TESTE 3: reiniciar fase a partir do game over ---
await pg.evaluate(() => document.querySelector('[data-action="retry"]').click())
await sleep(3000)
const s3 = await pg.evaluate(() => ({ state: window.golZombie.game.state, level: window.golZombie.game.level, hp: window.golZombie.game.health.value, timer: Math.round(window.golZombie.game.timer.remaining) }))
console.log('T3 retry', JSON.stringify(s3))

// --- TESTE 4: game over por TEMPO ---
await pg.evaluate(() => { const g = window.golZombie.game; g.timer.remaining = 0.05 })
await sleep(800)
const s4 = await pg.evaluate(() => ({ state: window.golZombie.game.state, title: document.querySelector('.zs-big')?.textContent }))
console.log('T4 timeout', JSON.stringify(s4))

// --- TESTE 5: última fase -> cutscene -> win ---
await pg.evaluate(async () => { const g = window.golZombie.game; g.score.resetCampaign(); await g.loadLevel(5); g.state = 'playing' })
await sleep(3000)
await completeLevel()
await sleep(2500)
const s5a = await pg.evaluate(() => ({ state: window.golZombie.game.state }))
console.log('T5 apos ult fase state', JSON.stringify(s5a))
await sleep(16000) // cutscene
const s5b = await pg.evaluate(() => ({ state: window.golZombie.game.state, title: document.querySelector('.zs-big')?.textContent, screen: document.querySelector('.zombie-screens')?.classList.contains('show') }))
console.log('T5 win', JSON.stringify(s5b))

console.log('ERROS:', [...new Set(errs)].slice(0, 15).join('\n') || '(nenhum)')
await b.close()
