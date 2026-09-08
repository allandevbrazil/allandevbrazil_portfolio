import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox'] })
const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 800 })
const errs = []
pg.on('pageerror', e => errs.push('PE:' + e.message))
pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('colormap')) errs.push('CE:' + m.text()) })
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
// explora o mundo (portfólio normal)
await pg.click('#explore'); await new Promise(r => setTimeout(r, 3000))
const drive = await pg.evaluate(async () => { const c = window.application.world.car; const before = c.chassis.object.position.y; window.application.world.controls.actions.up = true; await new Promise(r => setTimeout(r, 1500)); window.application.world.controls.actions.up = false; return { moved: Math.abs(c.chassis.object.position.y - before) > 2 } })
// abre painel de projetos
await pg.evaluate(() => document.querySelector('nav [data-section="projetos"]').click()); await new Promise(r => setTimeout(r, 800))
const panel = await pg.evaluate(() => ({ open: document.querySelector('dialog').open, cards: document.querySelectorAll('.project-card').length, covers: document.querySelectorAll('.project-art.has-cover').length }))
await pg.screenshot({ path: 'resources/regress.png' })
console.log('DRIVE', JSON.stringify(drive), 'PANEL', JSON.stringify(panel))
console.log('ERROS:', [...new Set(errs)].slice(0, 10).join('\n') || '(nenhum)')
await b.close()
