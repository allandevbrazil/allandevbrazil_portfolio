import { GAME } from './config.js'

// Telas de fluxo do jogo: Menu, Game Over, You Win, Créditos. Overlay DOM único.
export default class Screens {
    constructor() {
        this.el = document.createElement('div')
        this.el.className = 'zombie-screens'
        document.body.appendChild(this.el)
        this.current = null
    }

    _btn(label, action, cls = '') { return `<button class="zs-btn ${cls}" data-action="${action}">${label}</button>` }

    hide() { this.el.classList.remove('show'); this.current = null }

    menu({ onStart, onCredits }) {
        this.current = 'menu'
        this.el.classList.add('show')
        this.el.innerHTML = `
            <div class="zs-card zs-menu">
                <div class="zs-logo">ALLAN<span>SELEGUIM</span></div>
                <h1 class="zs-title">GOL <em>ZUMBI</em> ESCAPE</h1>
                <p class="zs-sub">Atropelle zumbis, colete cristais, encontre a esmeralda e fuja da cidade. ${GAME.totalLevels} fases.</p>
                <div class="zs-actions">${this._btn('▶ JOGAR', 'start', 'primary')}${this._btn('CRÉDITOS', 'credits')}</div>
                <p class="zs-hint">↑↓←→ / WASD dirigir · Shift turbo · R reposicionar</p>
            </div>`
        this._wire({ start: onStart, credits: onCredits })
    }

    gameOver({ stats, onRetryLevel, onRestartGame, onMenu }) {
        this.current = 'gameover'
        this.el.classList.add('show')
        this.el.innerHTML = `
            <div class="zs-card zs-over">
                <h1 class="zs-big zs-red">GAME OVER</h1>
                <div class="zs-stats">${this._stat('Fase alcançada', stats.level)}${this._stat('Pontuação', stats.score)}${this._stat('Zumbis atropelados', stats.zombies)}${this._stat('Cristais', stats.crystals)}${this._stat('Esmeraldas', stats.emeralds)}${this._stat('Maior combo', stats.bestCombo + 'x')}${this._stat('Recorde', stats.highScore)}</div>
                <div class="zs-actions">${this._btn('↻ REINICIAR FASE', 'retry', 'primary')}${this._btn('REINICIAR JOGO', 'restart')}${this._btn('MENU', 'menu')}</div>
            </div>`
        this._wire({ retry: onRetryLevel, restart: onRestartGame, menu: onMenu })
    }

    win({ stats, onPlayAgain, onMenu, onCredits }) {
        this.current = 'win'
        this.el.classList.add('show')
        const hs = stats.isHighScore ? '<div class="zs-hs">★ NEW HIGH SCORE! ★</div>' : ''
        this.el.innerHTML = `
            <div class="zs-card zs-win">
                <h1 class="zs-big zs-green">YOU WIN</h1>
                <p class="zs-youwin">VOCÊ VENCEU O GAME!</p>
                ${hs}
                <div class="zs-stats">${this._stat('Pontuação final', stats.score)}${this._stat('Fases completadas', stats.levelsCompleted + '/' + GAME.totalLevels)}${this._stat('Zumbis atropelados', stats.zombies)}${this._stat('Monstros', stats.monsters)}${this._stat('Cristais', stats.crystals)}${this._stat('Esmeraldas', stats.emeralds)}${this._stat('Easter eggs', stats.easterEggs)}${this._stat('Maior combo', stats.bestCombo + 'x')}${this._stat('Tempo total', stats.time)}</div>
                <div class="zs-actions">${this._btn('▶ JOGAR NOVAMENTE', 'again', 'primary')}${this._btn('CRÉDITOS', 'credits')}${this._btn('MENU', 'menu')}</div>
            </div>`
        this._wire({ again: onPlayAgain, credits: onCredits, menu: onMenu })
    }

    credits({ onBack }) {
        this.current = 'credits'
        this.el.classList.add('show')
        this.el.innerHTML = `
            <div class="zs-card zs-credits">
                <h1 class="zs-big">CRÉDITOS</h1>
                <div class="zs-credit-list">
                    <p>Kenney — City Kit Commercial (CC0)</p>
                    <p>Kenney — Animated Characters: Survivors (CC0)</p>
                    <p>Quaternius — Animated Monster Pack / Easy Animated Enemy Pack (CC0): morcegos, aranhas e ratos</p>
                    <p>Música: "Midnight Drive" — OpenGameArt (CC0)</p>
                    <p>Música: "Battle RPG Theme" (CleytonRX) — OpenGameArt (CC0)</p>
                    <p>Música: "Dreaming of Victory" — OpenGameArt (CC0)</p>
                    <p>Música: "8-bit Victory Loop" — OpenGameArt (CC0)</p>
                    <p>Adaptado e expandido por Allan Seleguim</p>
                </div>
                <div class="zs-actions">${this._btn('← VOLTAR', 'back', 'primary')}</div>
            </div>`
        this._wire({ back: onBack })
    }

    _stat(k, v) { return `<div class="zs-stat"><span>${k}</span><b>${v}</b></div>` }

    _wire(map) {
        this.el.querySelectorAll('.zs-btn').forEach((b) => b.addEventListener('click', () => { const f = map[b.dataset.action]; if (f) f() }))
    }
}
