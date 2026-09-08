import * as THREE from 'three'
import CANNON from 'cannon'
import Screens from './Screens.js'
import Hud from './Hud.js'
import AudioManager from './AudioManager.js'
import ParticleFx from './ParticleFx.js'
import ProceduralCity, { makeRng } from './ProceduralCity.js'
import ZombieManager from './ZombieManager.js'
import MonsterManager from './MonsterManager.js'
import CrystalManager from './CrystalManager.js'
import PlayerHealth from './PlayerHealth.js'
import ScoreManager from './ScoreManager.js'
import PowerUpSystem from './PowerUpSystem.js'
import TimerManager from './TimerManager.js'
import Cutscene from './Cutscene.js'
import OcclusionController from './OcclusionController.js'
import ObjectiveRadar from './ObjectiveRadar.js'
import { GAME, PLAYER, THEMES, difficultyForLevel } from './config.js'

// Orquestrador do Modo Zumbi. Reusa o motor existente (carro/física/câmera/materiais/tempo).
export default class GameManager {
    constructor(app) {
        this.app = app
        this.state = 'off' // off | menu | playing | cutscene | gameover | win
        this.level = 1
        // Materials.floorShadow.updateMaterials precisa de objects (referência latente no template)
        if (app.world?.materials) app.world.materials.objects = app.world.objects
        this.screens = new Screens()
        this.hud = new Hud()
        this.audio = new AudioManager()
        this.radar = new ObjectiveRadar(this.hud, this.audio)
        this.occlusion = new OcclusionController()
        this.fx = new ParticleFx({ scene: app.scene })
        this.city = new ProceduralCity({ world: app.world, objects: app.world.objects, physics: app.world.physics, materials: app.world.materials })
        this.zombies = new ZombieManager({ world: app.world, scene: app.scene, time: app.time })
        this.monsters = new MonsterManager({ scene: app.scene, world: app.world })
        this.crystals = new CrystalManager({ scene: app.scene, time: app.time })
        this.health = new PlayerHealth()
        this.score = new ScoreManager()
        this.powerups = new PowerUpSystem()
        this.timer = new TimerManager()
        this.highScore = parseInt(localStorage.getItem('golzombie_highscore') || '0', 10)
        this._started = false
        this._hookEvents()
        for (const [selector, property, label] of [['[data-sfx]', 'effectsOn', 'SOM'], ['[data-music]', 'musicOn', 'MÚSICA']]) {
            const button = this.hud.q(selector)
            button.addEventListener('click', () => {
                this.audio.unlock()
                this.audio[property] = !this.audio[property]
                if (property === 'musicOn') this.audio.setMusicOn(this.audio.musicOn)
                button.setAttribute('aria-pressed', String(this.audio[property]))
                button.textContent = `${label} ${this.audio[property] ? 'ON' : 'OFF'}`
                this.app.$canvas.focus()
            })
        }
    }

    _hookEvents() {
        this.health.on('change', (v, max) => this.hud.setHp(v, max))
        this.health.on('dead', () => this.gameOver('HP'))
        this.timer.on('change', (rem) => { this.hud.setTimer(this.timer.formatted, rem <= GAME.tensionSeconds) })
        this.timer.on('timeout', () => this._checkTimeout())
        this.timer.on('tension', () => { this.audio.blip(200, 0.3, 'square', 0.15); document.body.classList.add('zh-tension') })
        this.score.on('score', (pts, reason, total) => { this.hud.setScore(total); if (reason?.combo) this.hud.combo(reason.combo, pts) })
        this.powerups.on('change', (list) => this.hud.setEffects(list || [], performance.now()))
        this.powerups.on('heal', amount => this.health.heal(amount))
    }

    // ---- Entrada/saída do modo ----
    async enter() {
        window.portfolio?.suspendAudio(true)
        if (!this._started) {
            this.hud.show(false)
            await this.city.preload()
            await this.zombies.load()
            await this.monsters.load()
            this._started = true
        }
        // evita música duplicada: pausa a trilha do portfólio enquanto no modo zumbi
        document.body.classList.add('zombie-mode')
        this._configureCamera()
        // garante que objetos matcap (o carro) fiquem visíveis (reveal do portfólio pode estar em 0)
        if (this.app.world.reveal) { this.app.world.reveal.matcapsProgress = 1; this.app.world.reveal.floorShadowsProgress = 1 }
        this._setPortfolioCollision(false) // remove paredes invisíveis do portfólio
        this._hidePortfolio()
        this.state = 'menu'
        this.screens.menu({ onStart: () => this.startGame(), onCredits: () => this.showCredits() })
    }

    exit() {
        this.state = 'off'
        this.screens.hide()
        this.hud.show(false)
        this.audio.stopMusic()
        document.body.classList.remove('zombie-mode', 'zh-tension')
        this._setPortfolioCollision(true) // restaura colisões do portfólio
        this._teardownLevel()
        this._showPortfolio()
        window.portfolio?.suspendAudio(false)
    }

    _configureCamera() {
        const cam = this.app.camera
        if (!this._portfolioCamera) this._portfolioCamera = { angle: cam.angle.items.default.clone(), pan: cam.pan.enabled, zoom: cam.zoom.targetValue }
        cam.pan.disable()
        cam.pan.reset()
        // ângulo mais top-down p/ sobrevoar prédios e enxergar a cidade
        cam.angle.items.default = new THREE.Vector3(0.7, -1.0, 1.7)
        cam.angle.set('default')
        cam.zoom.value = 0.18
        cam.zoom.targetValue = 0.18
    }

    // Liga/desliga TODAS as colisões dos objetos do portfólio (paredes invisíveis no modo zumbi)
    _setPortfolioCollision(enabled) {
        const items = this.app.world.objects?.items || []
        for (const it of items) {
            const body = it.collision && it.collision.body
            if (!body) continue
            if (enabled) { if (!this.app.world.physics.world.bodies.includes(body)) this.app.world.physics.world.addBody(body) }
            else this.app.world.physics.world.removeBody(body)
        }
    }

    _hidePortfolio() {
        const w = this.app.world
        w.zones.enabled = false
        for (const k in w.sections) { if (w.sections[k].container) w.sections[k].container.visible = false }
        if (w.objects) w.objects.container.visible = false // prédios/props/placas do portfólio vivem aqui
        if (w.boundary) w.boundary.set(false) // muralha do portfólio não deve valer no modo zumbi
        if (w.startingScreen?.loadingLabel?.mesh) w.startingScreen.loadingLabel.mesh.visible = false
        if (w.startingScreen?.startLabel?.mesh) w.startingScreen.startLabel.mesh.visible = false
    }
    _showPortfolio() {
        const w = this.app.world
        w.zones.enabled = true
        if (this._portfolioCamera) {
            const cam = this.app.camera, saved = this._portfolioCamera
            cam.angle.items.default.copy(saved.angle); cam.angle.set('default'); cam.zoom.targetValue = saved.zoom
            if (saved.pan) cam.pan.enable()
            this._portfolioCamera = null
        }
        for (const k in w.sections) { if (w.sections[k].container) w.sections[k].container.visible = true }
        if (w.objects) w.objects.container.visible = true
        if (w.boundary) w.boundary.set(true)
    }

    showCredits() { const prev = this.state; this.screens.credits({ onBack: () => { if (prev === 'menu') this.enter() } }) }

    // ---- Fluxo de fases ----
    async startGame() {
        this.audio.unlock()
        this.screens.hide()
        this._campaignStart = performance.now()
        this.score.resetCampaign()
        this.level = 1
        await this.loadLevel(this.level)
        this.state = 'playing'
        this.hud.show(true)
        if (window.matchMedia('(pointer: coarse)').matches && !this.app.world.controls.touch) this.app.world.controls.setTouch()
        this.app.world.controls.touch?.reveal()
        this.app.$canvas.focus()
    }

    async loadLevel(n) {
        this.level = n
        const rng = makeRng(1000 + n * 7919)
        const theme = THEMES[(n - 1) % THEMES.length]
        const diff = difficultyForLevel(n, GAME.totalLevels)
        this._theme = theme; this._diff = diff; this._rng = rng

        this._teardownLevel()
        this._applyTheme(theme)

        // Cidade
        await this.city.generate({ seed: 1000 + n * 7919, theme })
        this.app.scene.add(this.city.container)
        this.occlusion.setMeshes(this.city.occluders)

        // Carro num cruzamento de rua central (não dentro de prédio)
        const car = this.app.world.car
        const rc = this.city.roadCoords || [0]
        const road = rc[Math.floor(rc.length / 2)]
        const spawn = { x: road, y: road }
        const body = this.app.world.physics.car.chassis.body
        body.wakeUp()
        body.position.set(spawn.x, spawn.y, 2)
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)
        body.force.set(0, 0, 0)
        body.torque.set(0, 0, 0)
        body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5)
        this.app.world.physics.car.oldPosition.copy(body.position)
        car.chassis.object.position.copy(body.position).add(car.chassis.offset)
        this.app.camera.target.set(spawn.x, spawn.y, 0)
        this.app.camera.targetEased.copy(this.app.camera.target)

        // Zumbis
        this.zombies.spawn(diff.zombieCount, this.city, rng, { speed: diff.zombieSpeed, fromPoint: spawn })
        this.zombies.setDamage(diff.zombieDamage)

        // Cristais + esmeralda escondida
        this.crystals.spawn(diff.crystalCount, this.city, rng, GAME.requiredCrystals)
        const hidden = this.city.pickHiddenSpot(rng, spawn, diff.emeraldHideDepth)
        this.crystals.spawnEmerald(hidden, rng)

        // Monstros raros (easter egg / mini-boss)
        this.monsters.clear()
        this.monsters.spawn(rng, this.city, { fromPoint: spawn, count: diff.monsterCount })

        // Hordas periódicas
        this._nextHordeAt = performance.now() + diff.hordeInterval

        // HP / timer / powerups
        this.powerups.clear()
        this._applyPowerupsToCar()
        this.health.reset(diff.maxHp)
        document.body.classList.remove('zh-tension')
        this.timer.start(GAME.levelDuration)
        this.hud.setLevel(n)
        this.hud.setScore(this.score.total)
        this.hud.setCrystals(0, GAME.requiredCrystals)
        this.hud.setEmerald(false)
        this._startMs = performance.now()
        this.audio.playMusic(n === GAME.totalLevels ? 'battle-rpg.mp3' : theme.music, 1 + (n - 1) * 0.03)
        this.hud.toast(`FASE ${n}: ${theme.name}`, theme.glow)
    }

    _teardownLevel() {
        this.occlusion.clear()
        this.zombies.clear()
        this.monsters.clear()
        this.crystals.clear()
        this.fx.clear()
        this.city.dispose() // remove prédios (visual+colisores) e props sem vazar
        if (this.city.container.parent) this.app.scene.remove(this.city.container)
    }

    _applyTheme(theme) {
        const w = this.app.world
        if (w.materials) w.materials.objects = w.objects // garante referência para floorShadow.updateMaterials
        Object.assign(w.floor.colors, { topLeft: theme.floor[0], topRight: theme.floor[1], bottomRight: theme.floor[2], bottomLeft: theme.floor[3] })
        w.floor.updateMaterial()
        w.materials.shades.uniforms.uRevealProgress = w.reveal.matcapsProgress
        w.materials.shades.indirectColor = theme.indirect; w.materials.shades.updateMaterials()
        w.materials.items.floorShadow.shadowColor = theme.shadow; w.materials.items.floorShadow.updateMaterials()
        w.shadows.color = theme.shadow
        this.app.passes.glowsPass.color = theme.glow; this.app.passes.glowsPass.material.uniforms.uColor.value.set(theme.glow)
        document.documentElement.style.setProperty('--zombie-bg', theme.sky)
    }

    // ---- Loop ----
    update(dt, now) {
        if (this.state !== 'playing') return
        const car = this.app.world.car
        const carPos = car.chassis.object.position
        const carSpeed = Math.abs(this.app.world.physics.car.forwardSpeed || 0)

        this.timer.update(dt)
        if (this.state !== 'playing') return
        this.powerups.update(now)
        this._applyPowerupsToCar()
        this.occlusion.update(dt, this.app.camera.instance, carPos)
        this.hud.setEffects(this.powerups.list(), now)

        const events = this.zombies.update(dt, car, this.powerups, now, carSpeed)
        for (const ro of events.runOvers) {
            this.fx.blood(ro.pos, ro.direction, 1 + ro.speed * 4)
            this.audio.hit(1 + ro.speed * 3)
            this._impactCar(ro.pos, false)
            this._shake(Math.min(10, 3 + ro.speed * 40))
            const r = this.score.registerZombieHit(now)
            if (r.combo >= 2) this.hud.toast(`${r.combo}x COMBO!`, '#ffe600')
        }
        for (const dm of events.damages) {
            this._enemyAttack(dm, now)
        }
        if (this.state !== 'playing') return

        this.crystals.update(dt, now, carPos, (def) => this._onCrystal(def), () => this._onEmerald())
        this.fx.update(dt)

        // Monstros: atropelar em velocidade => bônus + easter egg
        this.monsters.update(dt, now, carPos, carSpeed, (m) => {
            this.score.killMonster()
            this.audio.hit(); this._shake(14)
            this.fx.blood(m.group.position, m.fling, 1.4)
            this._impactCar(m.group.position, false)
            this.hud.toast('MONSTRO ELIMINADO! +1000', '#b14bff')
        }, dm => this._enemyAttack(dm, now), this.powerups)
        if (this.state !== 'playing') return
        this.radar.update(carPos, this.app.camera.instance, this.crystals, now, this.zombies.count + this.monsters.count)

        // Hordas periódicas
        if (now > this._nextHordeAt) {
            this._nextHordeAt = now + this._diff.hordeInterval
            const size = Math.max(this._diff.hordeSize, this._diff.zombieCount - this.zombies.count)
            if (this.zombies.count < 115) {
                this.zombies.spawnHorde(size, this.city, this._rng, carPos, this._diff.zombieSpeed)
                this.hud.toast('HORDA DE ZUMBIS!', '#ff2e4d')
                this.audio.blip(80, 0.4, 'sawtooth', 0.2)
            }
            this.monsters.spawn(this._rng, this.city, { fromPoint: carPos, count: Math.max(0, this._diff.monsterCount - this.monsters.count) })
        }

        this._checkWin()
    }

    _applyPowerupsToCar() {
        const opts = this.app.world.physics.car.options
        const base = this._baseOpts || (this._baseOpts = { accel: opts.controlsAcceleratingSpeed, accelBoost: opts.controlsAcceleratingSpeedBoost, max: opts.controlsAcceleratinMaxSpeed, maxBoost: opts.controlsAcceleratinMaxSpeedBoost })
        const m = this.powerups.speedMultiplier
        opts.controlsAcceleratingSpeed = base.accel * m
        opts.controlsAcceleratingSpeedBoost = base.accelBoost * m
        opts.controlsAcceleratinMaxSpeed = base.max * m
        opts.controlsAcceleratinMaxSpeedBoost = base.maxBoost * m
        this.app.world.physics.car.steerSign = this.powerups.invertControls ? -1 : 1
        this.health.setBuffs({ shield: this.powerups.shield, invincible: this.powerups.invincible })
    }

    _onCrystal(def) {
        this.score.collectCrystal()
        this.powerups.apply(def.id, performance.now())
        this.hud.setCrystals(this.crystals.collectedCount, GAME.requiredCrystals)
        this.audio.powerup()
        this.hud.toast(`${def.name} — ${def.desc}`, def.hex)
        this.fx.burst(this.app.world.car.chassis.object.position, def.color, 10, 0.8)
    }

    _onEmerald() {
        this.score.findEmerald()
        this.hud.setEmerald(true)
        this.audio.win()
        this.fx.burst(this.app.world.car.position, 0x1affa0, 28, 1.4)
        this._shake(3)
        this.hud.toast('ESMERALDA ENCONTRADA!', '#1affa0')
    }

    _checkWin() {
        if (this.crystals.collectedCount >= GAME.requiredCrystals && this.crystals.emeraldFound) this.completeLevel()
    }

    _checkTimeout() {
        if (this.state !== 'playing') return
        if (this.crystals.collectedCount >= GAME.requiredCrystals && this.crystals.emeraldFound) return
        this.gameOver('TEMPO')
    }

    completeLevel() {
        const secondsLeft = this.timer.remaining
        this.timer.stop()
        this.score.levelComplete({ secondsLeft, hpLeft: this.health.value })
        this.hud.toast('OBJETIVO COMPLETO!', '#1affa0')
        if (this.level >= GAME.totalLevels) { this._finalObjective() }
        else { this.state = 'transition'; setTimeout(() => this.loadLevel(this.level + 1).then(() => { this.state = 'playing' }), 1600) }
    }

    _finalObjective() {
        this.state = 'cutscene'
        this.hud.toast('FINAL OBJECTIVE COMPLETE! — FUJA!', '#ffe600')
        this.hud.show(false)
        this.audio.playMusic('victory8.ogg', 1)
        this._cutscene = new Cutscene({ app: this.app, onDone: () => this.win() })
        this._cutscene.start()
        this._skipHandler = () => this._cutscene.skip()
        setTimeout(() => document.addEventListener('keydown', this._skipHandler), 3000)
    }

    gameOver(reason) {
        if (this.state !== 'playing') return
        this.state = 'gameover'
        this.timer.stop()
        this.audio.gameOver()
        this._persistHighScore()
        this.screens.gameOver({
            stats: this._stats(reason),
            onRetryLevel: () => { this.audio.unlock(); return this.loadLevel(this.level).then(() => { this.state = 'playing'; this.screens.hide(); this.hud.show(true); this.app.$canvas.focus() }) },
            onRestartGame: () => this.startGame(),
            onMenu: () => this.enter(),
        })
    }

    win() {
        document.removeEventListener('keydown', this._skipHandler)
        this.state = 'win'
        this._persistHighScore()
        this.audio.playMusic('victory.mp3', 1)
        this.audio.win()
        const s = this._stats('win')
        this.screens.win({
            stats: s,
            onPlayAgain: () => this.startGame(),
            onMenu: () => this.enter(),
            onCredits: () => this.showCredits(),
        })
    }

    _persistHighScore() {
        if (this.score.total > this.highScore) { this.highScore = this.score.total; localStorage.setItem('golzombie_highscore', String(this.highScore)) }
    }

    _stats(reason) {
        const st = this.score.stats
        return {
            level: this.level, score: this.score.total.toLocaleString('pt-BR'), zombies: st.zombies, monsters: st.monsters,
            crystals: st.crystals, emeralds: st.emeralds, easterEggs: st.easterEggs, bestCombo: st.bestCombo,
            highScore: this.highScore.toLocaleString('pt-BR'), isHighScore: this.score.total >= this.highScore && this.score.total > 0,
            levelsCompleted: this.state === 'win' ? GAME.totalLevels : Math.max(0, this.level - 1), time: this._formatTotalTime(),
        }
    }

    _formatTotalTime() {
        const s = Math.floor((performance.now() - (this._campaignStart || performance.now())) / 1000)
        return `${Math.floor(s / 60)}m ${s % 60}s`
    }

    _shake(px) {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
        this.app.camera.impactShake = Math.min(0.35, Math.max(this.app.camera.impactShake || 0, px * 0.022))
    }

    _impactCar(position, attack) {
        const body = this.app.world.physics.car.chassis.body
        const away = new CANNON.Vec3(body.position.x - position.x, body.position.y - position.y, 0)
        if (away.length() < 0.001) away.set(1, 0, 0)
        away.normalize()
        const strength = body.mass * (attack ? 0.65 : 0.16)
        body.wakeUp()
        body.applyImpulse(away.scale(strength), new CANNON.Vec3(position.x, position.y, body.position.z))
    }

    _enemyAttack(damage, now) {
        if (!this.health.damage(damage.amount, now)) return
        this._impactCar(damage.pos, true)
        this.audio.damage(); this._shake(9)
        this.fx.blood(damage.pos, null, 0.65)
    }
}
