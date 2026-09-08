import EventEmitter from '../Utils/EventEmitter.js'
import { PLAYER } from './config.js'

// Vida do jogador com i-frames (evita dano absurdo por frame) e escudo/invencibilidade.
export default class PlayerHealth extends EventEmitter {
    constructor({ max = PLAYER.maxHp } = {}) {
        super()
        this.max = max
        this.reset(max)
    }

    reset(max) {
        if (max) this.max = max
        this.value = this.max
        this.dead = false
        this.lastHitAt = -99999
        this.shield = false
        this.invincible = false
        this.trigger('change', [this.value, this.max])
    }

    setBuffs({ shield, invincible }) {
        if (shield !== undefined) this.shield = shield
        if (invincible !== undefined) this.invincible = invincible
    }

    get invulnerable() { return this.shield || this.invincible }

    damage(amount, now) {
        if (this.dead || this.invulnerable) return false
        if (now - this.lastHitAt < PLAYER.iFramesMs) return false
        this.lastHitAt = now
        this.value = Math.max(0, this.value - amount)
        this.trigger('hit', [amount])
        this.trigger('change', [this.value, this.max])
        if (this.value <= 0) { this.dead = true; this.trigger('dead') }
        return true
    }

    heal(amount) {
        this.value = Math.min(this.max, this.value + amount)
        this.trigger('change', [this.value, this.max])
    }
}
