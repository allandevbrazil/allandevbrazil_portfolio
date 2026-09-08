import * as THREE from 'three'
import { GAME } from './config.js'

export function nearestObjective(items, player) {
    let nearest = null, distance = Infinity
    for (const item of items) {
        if (!item || item.collected) continue
        const p = item.mesh.position
        const d = Math.hypot(p.x - player.x, p.y - player.y)
        if (d < distance) { distance = d; nearest = item }
    }
    return nearest ? { position: nearest.mesh.position, distance } : null
}

export default class ObjectiveRadar {
    constructor(hud, audio) {
        this.audio = audio
        this.el = document.createElement('aside')
        this.el.className = 'zh-radar'
        this.el.setAttribute('aria-label', 'Radar dos objetivos')
        this.el.innerHTML = `<div class="zh-radar-heading">RADAR <span data-threats></span></div>
            <div class="zh-radar-dial"><i class="zh-radar-sweep"></i><i class="zh-radar-player"></i>
                <div class="zh-bearing crystal" data-bearing="crystal"><span>▲</span></div>
                <div class="zh-bearing emerald" data-bearing="emerald"><span>▲</span></div>
            </div>
            <div class="zh-radar-reading crystal" data-reading="crystal"><span>◆ CRISTAL</span><b></b><small></small></div>
            <div class="zh-radar-reading emerald" data-reading="emerald"><span>◆ ESMERALDA</span><b></b><small></small></div>`
        hud.el.append(this.el)
        this.rows = Object.fromEntries(['crystal', 'emerald'].map(key => [key, {
            arrow: this.el.querySelector(`[data-bearing="${key}"]`),
            row: this.el.querySelector(`[data-reading="${key}"]`),
            distance: this.el.querySelector(`[data-reading="${key}"] b`),
            signal: this.el.querySelector(`[data-reading="${key}"] small`),
        }]))
        this.threats = this.el.querySelector('[data-threats]')
        this.direction = new THREE.Vector3()
        this.nextPing = 0
    }

    update(player, camera, crystals, now, enemies) {
        const signals = {
            crystal: crystals.collectedCount < GAME.requiredCrystals ? nearestObjective(crystals.items, player) : null,
            emerald: nearestObjective([crystals.emerald], player),
        }
        this.threats.textContent = `${enemies} HOSTIS`
        let closest = Infinity
        for (const [key, signal] of Object.entries(signals)) {
            const ui = this.rows[key]
            ui.arrow.hidden = !signal
            ui.row.classList.toggle('complete', !signal)
            if (!signal) { ui.distance.textContent = '✓'; ui.signal.textContent = 'OBJETIVO COMPLETO'; continue }
            this.direction.subVectors(signal.position, player).setZ(0).transformDirection(camera.matrixWorldInverse)
            const angle = Math.atan2(this.direction.x, this.direction.y)
            ui.arrow.style.transform = `rotate(${angle}rad)`
            ui.distance.textContent = `${Math.ceil(signal.distance)} m`
            const near = signal.distance < 22
            ui.row.classList.toggle('near', near)
            ui.arrow.classList.toggle('near', near)
            ui.arrow.style.setProperty('--ping-speed', `${0.3 + Math.min(1.5, signal.distance / 30)}s`)
            ui.signal.textContent = signal.distance < 7 ? 'SINAL MÁXIMO' : near ? 'SINAL PRÓXIMO' : 'RASTREANDO'
            closest = Math.min(closest, signal.distance)
        }
        if (closest < 22 && now >= this.nextPing) {
            this.audio.radar(closest)
            this.nextPing = now + 300 + closest * 40
        }
    }
}
