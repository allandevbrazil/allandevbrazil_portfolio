import EventEmitter from '../Utils/EventEmitter.js'
import { GAME } from './config.js'

// Cronômetro da fase (3:00). Emite 'tick' a cada segundo e 'tension' nos últimos N segundos.
export default class TimerManager extends EventEmitter {
    constructor() { super() }

    start(duration = GAME.levelDuration) {
        this.duration = duration
        this.remaining = duration
        this.running = true
        this._enteredTension = false
        this.trigger('change', [this.remaining])
    }

    stop() { this.running = false }

    update(deltaMs) {
        if (!this.running) return
        this.remaining -= deltaMs / 1000
        if (this.remaining <= 0) { this.remaining = 0; this.running = false; this.trigger('timeout'); return }
        if (!this._enteredTension && this.remaining <= GAME.tensionSeconds) { this._enteredTension = true; this.trigger('tension') }
        this.trigger('change', [this.remaining])
    }

    get formatted() {
        const m = Math.floor(this.remaining / 60)
        const s = Math.floor(this.remaining % 60)
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
}
