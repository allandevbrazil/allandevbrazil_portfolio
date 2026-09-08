import { GAME } from './config.js'

// HUD do Modo Zumbi (overlay DOM). Criada sob medida, estilizada synthwave.
export default class Hud {
    constructor() {
        this.el = document.createElement('div')
        this.el.className = 'zombie-hud'
        this.el.innerHTML = `
            <div class="zh-top">
                <div class="zh-level">FASE <b data-level>1</b>/${GAME.totalLevels}</div>
                <div class="zh-timer" data-timer>03:00</div>
                <div class="zh-score">SCORE <b data-score>0</b></div>
            </div>
            <div class="zh-objectives">
                <div class="zh-obj">CRISTAIS <b data-crystals>0/10</b></div>
                <div class="zh-obj zh-emerald" data-emerald>ESMERALDA: NÃO ENCONTRADA</div>
            </div>
            <div class="zh-hp"><span class="zh-hp-label">HP</span><div class="zh-hp-bar"><i data-hpfill></i></div><b data-hpval>100</b></div>
            <div class="zh-effects" data-effects></div>
            <div class="zh-toast" data-toast></div>
            <div class="zh-combo" data-combo></div>
            <div class="zh-audio"><button type="button" data-sfx aria-pressed="true">SOM ON</button><button type="button" data-music aria-pressed="true">MÚSICA ON</button></div>
        `
        document.body.appendChild(this.el)
        this.q = (s) => this.el.querySelector(s)
        this._toastTimer = null
        this._comboTimer = null
    }

    show(v) { this.el.style.display = v ? 'block' : 'none' }

    setLevel(n) { this.q('[data-level]').textContent = n }
    setScore(n) { this.q('[data-score]').textContent = n.toLocaleString('pt-BR') }
    setTimer(str, tension) { const t = this.q('[data-timer]'); t.textContent = str; t.classList.toggle('tension', !!tension) }
    setCrystals(c, req) { this.q('[data-crystals]').textContent = `${c}/${req}` }
    setEmerald(found) { const e = this.q('[data-emerald]'); e.textContent = 'ESMERALDA: ' + (found ? 'ENCONTRADA ✓' : 'NÃO ENCONTRADA'); e.classList.toggle('found', found) }
    setHp(v, max) { this.q('[data-hpfill]').style.width = `${Math.max(0, (v / max) * 100)}%`; this.q('[data-hpval]').textContent = Math.round(v) }

    setEffects(list, now) {
        const box = this.q('[data-effects]')
        box.innerHTML = list.map((e) => {
            const rem = Math.max(0, Math.ceil((e.remaining - now) / 1000))
            return `<span class="zh-eff" style="color:${e.def.hex};border-color:${e.def.hex}">${e.def.name} ${rem}s</span>`
        }).join('')
    }

    toast(text, color) {
        const t = this.q('[data-toast]')
        t.textContent = text; t.style.color = color || '#fff'; t.classList.add('show')
        clearTimeout(this._toastTimer)
        this._toastTimer = setTimeout(() => t.classList.remove('show'), 1400)
    }

    combo(n, points) {
        if (n < 2) return
        const c = this.q('[data-combo]')
        c.textContent = `${n}x COMBO +${points}`
        c.classList.add('show')
        clearTimeout(this._comboTimer)
        this._comboTimer = setTimeout(() => c.classList.remove('show'), 900)
    }

    destroy() { this.el.remove() }
}
