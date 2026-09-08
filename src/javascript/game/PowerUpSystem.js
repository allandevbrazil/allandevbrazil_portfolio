import EventEmitter from '../Utils/EventEmitter.js'
import { CRYSTALS, POWERUP } from './config.js'

// Sistema de efeitos temporários dos cristais. Cada efeito tem duração e expira sozinho.
export default class PowerUpSystem extends EventEmitter {
    constructor() {
        super()
        this.active = {} // effectId -> { def, until }
    }

    clear() { this.active = {}; this.trigger('change', [this.list()]) }

    apply(crystalId, now) {
        const def = CRYSTALS.find((c) => c.id === crystalId)
        if (!def) return null
        if (def.effect === 'heal') { this.trigger('heal', [POWERUP.healAmount]); return def }
        this.active[def.effect] = { def, until: now + def.duration }
        this.trigger('change', [this.list()])
        this.trigger('applied', [def])
        return def
    }

    update(now) {
        let expired = false
        for (const key in this.active) {
            if (now >= this.active[key].until) { delete this.active[key]; expired = true }
        }
        if (expired) this.trigger('change', [this.list()])
    }

    list() {
        return Object.values(this.active).map((a) => ({ def: a.def, remaining: a.until }))
    }

    has(effect) { return !!this.active[effect] }

    get speedMultiplier() {
        let m = 1
        if (this.has('speed')) m *= POWERUP.speedMultiplier
        if (this.has('slow')) m *= POWERUP.slowMultiplier
        return m
    }

    get impactMultiplier() { return this.has('impact') ? POWERUP.impactKnockback : 1 }
    get shield() { return this.has('shield') }
    get invincible() { return this.has('invincible') }
    get invertControls() { return this.has('invert') }
}
