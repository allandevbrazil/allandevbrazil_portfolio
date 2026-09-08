import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1200, height: 800 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
// antes de entrar: estado do carro no portfólio
await pg.click('#explore'); await new Promise(r => setTimeout(r, 3000))
const before = await pg.evaluate(() => { const c = window.application.world.car; c.chassis.object.updateWorldMatrix(true, false); return { pos: c.chassis.object.position.toArray().map(n => +n.toFixed(1)), visible: c.chassis.object.visible, inScene: !!c.chassis.object.parent, matcapReveal: window.application.world.reveal?.matcapsProgress } })
console.log('PORTFOLIO car', JSON.stringify(before))
// entra no modo zumbi + start
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1500))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 3500))
const after = await pg.evaluate(() => {
    const app = window.application, c = app.world.car, g = window.golZombie.game
    c.chassis.object.updateWorldMatrix(true, false)
    const box = new (c.chassis.object.geometry ? Object : Object)
    let bb = null
    try { const THREE = window.THREE; } catch(e){}
    // bounds via traverse
    let minz=999,maxz=-999
    c.chassis.object.traverse(o=>{ if(o.isMesh && o.geometry){ o.geometry.computeBoundingBox(); const bnd=o.geometry.boundingBox; }})
    return {
        pos: c.chassis.object.position.toArray().map(n => +n.toFixed(1)),
        visible: c.chassis.object.visible,
        parentVisible: c.chassis.object.parent?.visible,
        containerVisible: app.world.car.container.visible,
        matcapReveal: app.world.reveal?.matcapsProgress,
        carScale: c.chassis.object.scale.toArray().map(n=>+n.toFixed(2)),
        camTarget: app.camera.target.toArray().map(n => +n.toFixed(1)),
        bodyPos: app.world.physics.car.chassis.body.position.toArray().map(n=>+n.toFixed(1)),
    }
})
console.log('ZOMBIE car', JSON.stringify(after))
console.log('ERROS', errs.slice(0,5).join('|')||'none')
await b.close()
