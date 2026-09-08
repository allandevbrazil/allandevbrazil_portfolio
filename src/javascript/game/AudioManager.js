// Áudio do Modo Zumbi: música de fundo (por fase/tema) + efeitos sintetizados via WebAudio.
// Música é <audio> nativo independente do Howler.mute dos efeitos do template.
export default class AudioManager {
    constructor() {
        this.music = null
        this.musicOn = true
        this.ctx = null
        this.effectsOn = true
        this.lastImpact = -Infinity
    }

    _ensureCtx() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)() } catch (e) {} } return this.ctx }

    unlock() {
        const ctx = this._ensureCtx()
        if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
    }

    playMusic(file, rate = 1) {
        const src = './sounds/music/' + file
        if (!this.music) { this.music = new Audio(); this.music.loop = true; this.music.volume = 0.4 }
        if (this.music.dataset.src !== src) { this.music.src = src; this.music.dataset.src = src }
        this.music.playbackRate = rate
        if (this.musicOn) this.music.play().catch(() => {})
    }

    stopMusic() { if (this.music) this.music.pause() }
    setMusicOn(v) { this.musicOn = v; if (this.music) v ? this.music.play().catch(() => {}) : this.music.pause() }

    // SFX sintetizados (sem depender de arquivos): hit, coletar, dano, powerup, gameover, win.
    blip(freq = 440, dur = 0.12, type = 'square', vol = 0.15) {
        if (!this.effectsOn) return
        const ctx = this._ensureCtx(); if (!ctx) return
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.type = type; o.frequency.value = freq
        g.gain.value = vol; o.connect(g); g.connect(ctx.destination)
        o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
        o.stop(ctx.currentTime + dur)
        o.onended = () => { o.disconnect(); g.disconnect() }
    }

    hit(strength = 1) {
        const ctx = this._ensureCtx()
        if (!ctx || !this.effectsOn || ctx.currentTime - this.lastImpact < 0.06) return
        this.lastImpact = ctx.currentTime
        // Filtered noise supplies the crunch; a falling bass note supplies weight.
        const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.22), ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
        const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain()
        source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 1300
        gain.gain.setValueAtTime(Math.min(0.38, 0.2 * strength), ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
        source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start()
        source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
        this.blip(65, 0.18, 'triangle', 0.26)
    }
    radar(distance) { this.blip(800 + (22 - distance) * 25, 0.045, 'sine', 0.035) }
    collect() { this.blip(660, 0.1, 'triangle', 0.16); setTimeout(() => this.blip(990, 0.12, 'triangle', 0.14), 60) }
    damage() { this.hit(0.8); this.blip(90, 0.25, 'sawtooth', 0.16) }
    powerup() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.1, 'triangle', 0.14), i * 70)) }
    gameOver() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.blip(f, 0.3, 'sawtooth', 0.18), i * 180)) }
    win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'triangle', 0.16), i * 130)) }
}
