import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1600, height: 900 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
// entra SEM clicar explorar antes
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1200))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 3000))
const info = await pg.evaluate(() => {
    const car = window.application.world.car, cam = window.application.camera
    return {
        carPos: car.chassis.object.position.toArray().map(n => +n.toFixed(1)),
        carVisible: car.chassis.object.visible,
        carChildren: car.chassis.object.children.length,
        camTarget: cam.target.toArray().map(n => +n.toFixed(1)),
        camPos: cam.instance.position.toArray().map(n => +n.toFixed(1)),
        buildings: window.golZombie.game.city._collisions.length,
        cityChildren: window.golZombie.game.city.container.children.length,
        zombies: window.golZombie.game.zombies.active.length,
        portfolioMusicPlaying: !!(window.golZombie.game.audio.music && !window.golZombie.game.audio.music.paused),
    }
})
console.log('INFO', JSON.stringify(info))
await pg.screenshot({ path: 'resources/diag.png' })
console.log('ERROS:', errs.slice(0, 5).join('\n') || '(nenhum)')
await b.close()
