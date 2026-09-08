import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1200))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 1200))
const proj = await pg.evaluate(() => { const app = window.application, c = app.world.car.chassis.object; const V = c.position.constructor; const v = new V(c.position.x, c.position.y, c.position.z); v.project(app.camera.instance); return { sx: Math.round((v.x * 0.5 + 0.5) * 1280), sy: Math.round((-v.y * 0.5 + 0.5) * 800), camDist: +app.camera.zoom.distance.toFixed(1) } })
console.log('CAR screen', JSON.stringify(proj))
await pg.screenshot({ path: 'resources/carz.png' })
await b.close()
