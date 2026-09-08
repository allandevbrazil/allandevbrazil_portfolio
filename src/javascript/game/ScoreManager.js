import EventEmitter from '../Utils/EventEmitter.js'
import { SCORE } from './config.js'

// Pontuação acumulada na campanha + combos de atropelamento.
export default class ScoreManager extends EventEmitter {
    constructor() { super(); this.resetCampaign() }

    resetCampaign() {
        this.total = 0
        this.stats = { zombies: 0, monsters: 0, crystals: 0, emeralds: 0, easterEggs: 0, bestCombo: 0, timeSurvivedMs: 0 }
    }

    add(points, reason) {
        this.total += points
        this.trigger('score', [points, reason, this.total])
    }

    // Combo: hits em sequência dentro da janela.
    registerZombieHit(now) {
        if (now - (this._lastHitAt || 0) < SCORE.comboWindowMs) this._combo = (this._combo || 1) + 1
        else this._combo = 1
        this._lastHitAt = now
        this.stats.zombies++
        this.stats.bestCombo = Math.max(this.stats.bestCombo, this._combo)
        const points = SCORE.zombieHit * this._combo
        this.add(points, { combo: this._combo, type: 'zombie' })
        return { combo: this._combo, points }
    }

    killMonster() { this.stats.monsters++; this.add(SCORE.monsterKill, { type: 'monster' }) }
    collectCrystal() { this.stats.crystals++; this.add(SCORE.crystal, { type: 'crystal' }) }
    findEmerald() { this.stats.emeralds++; this.add(SCORE.emerald, { type: 'emerald' }) }
    foundEasterEgg() { this.stats.easterEggs++; this.add(SCORE.easterEgg, { type: 'egg' }) }

    levelComplete({ secondsLeft, hpLeft }) {
        const bonus = SCORE.levelComplete + Math.round(secondsLeft) * SCORE.fastBonusPerSecondLeft + Math.round(hpLeft) * SCORE.hpBonusPerHp
        this.add(bonus, { type: 'level', bonus })
        return bonus
    }
}
