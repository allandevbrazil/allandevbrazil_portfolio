import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1200, height: 800 })
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1000))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 3000))
const probe = await pg.evaluate(() => {
    const THREE = window.application.THREE || null
    const city = window.golZombie.game.city.container
    const out = []
    city.traverse((o) => {
        if (o.isMesh && o.geometry && o.geometry.boundingBox === null) o.geometry.computeBoundingBox()
        if (o.isMesh && o.geometry && o.geometry.boundingBox) {
            const bb = o.geometry.boundingBox
            const sz = new (bb.min.constructor)(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z)
            o.updateWorldMatrix(true, false)
            const wp = new (bb.min.constructor)(); wp.setFromMatrixPosition(o.matrixWorld)
            if (sz.x > 2 && sz.z > 2) out.push({ pos: [wp.x, wp.y, wp.z].map(n => +n.toFixed(1)), size: [sz.x, sz.y, sz.z].map(n => +n.toFixed(1)) })
        }
    })
    return { count: out.length, sample: out.slice(0, 8) }
})
console.log(JSON.stringify(probe, null, 1))
await b.close()
