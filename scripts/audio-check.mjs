import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const pg = await b.newPage(); await pg.setViewport({ width: 800, height: 600 })
const errs = []; pg.on('pageerror', e => errs.push('PE:' + e.message))
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !document.querySelector('#explore').disabled)) break; await new Promise(r => setTimeout(r, 1000)) }
await pg.evaluate(() => window.golZombie.enter()); await new Promise(r => setTimeout(r, 1200))
await pg.evaluate(() => document.querySelector('[data-action="start"]').click()); await new Promise(r => setTimeout(r, 2500))
const audio = await pg.evaluate(() => { const a = window.golZombie.game.audio; return { hasMusic: !!a.music, paused: a.music?.paused, volume: a.music?.volume, musicOn: a.musicOn, src: a.music?.currentSrc?.split('/').pop() } })
console.log('AUDIO', JSON.stringify(audio))
console.log('ERR', errs.slice(0, 4).join('|') || 'none')
await b.close()
