import puppeteer from 'puppeteer-core'

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const url = 'http://127.0.0.1:5173/'

const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--no-sandbox']
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

const errors = []
const failed = []
page.on('console', m => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type().toUpperCase() + ': ' + t) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))
page.on('requestfailed', r => failed.push('REQFAIL: ' + r.url() + ' :: ' + (r.failure()?.errorText)))
page.on('response', r => { if (r.status() >= 400) failed.push('HTTP ' + r.status() + ': ' + r.url()) })

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

let loader = null
for (let i = 0; i < 30; i++) {
    loader = await page.evaluate(() => {
        const L = window.application?.resources?.loader
        if (!L) return null
        return { loaded: L.loaded, toLoad: L.toLoad, ready: window.application.resources.items && !!window.application.world }
    })
    if (loader && loader.loaded === loader.toLoad) break
    await new Promise(r => setTimeout(r, 1000))
}
console.log('LOADER', JSON.stringify(loader))

// quais itens NÃO carregaram: compara lista esperada vs items
const missing = await page.evaluate(() => {
    const L = window.application?.resources?.loader
    if (!L) return ['<sem loader>']
    // reconstrói lista de nomes esperados é difícil; retorna nomes carregados
    return Object.keys(L.items)
})
console.log('LOADED_COUNT', missing.length)

// tenta descobrir resource que falhou: escuta eventos futuros
const stuck = await page.evaluate(() => {
    const L = window.application?.resources?.loader
    return { loaded: L.loaded, toLoad: L.toLoad }
})
console.log('STUCK', JSON.stringify(stuck))

await page.screenshot({ path: 'resources/test-1-intro.png' })
console.log('--- ERROS/WARN ---')
console.log([...new Set(errors)].slice(0, 40).join('\n') || '(nenhum)')
console.log('--- REQS FALHAS ---')
console.log([...new Set(failed)].slice(0, 40).join('\n') || '(nenhuma)')

await browser.close()
