import * as THREE from 'three'
import { PLAYER, PERF, ZOMBIE_TINTS } from './config.js'

// Gerenciador de zumbis com object pooling + culling por distância.
// Zumbis são cinemáticos (sem corpo CANNON) por performance; colisão é por distância.
export default class ZombieManager {
    constructor({ world, scene, time }) {
        this.world = world; this.scene = scene; this.time = time
        this.container = new THREE.Object3D(); this.container.name = 'zombies'
        scene.add(this.container)
        this.pool = []
        this.active = []
        this.template = null
        this.skins = []
        this.loaded = false
    }

    async load() {
        if (this.loaded) return
        // Humanoide low-poly limpo (não depende do FBX mesclado que virava blob)
        this.template = this._buildHumanoid()
        this.loaded = true
    }

    _buildHumanoid() {
        const g = new THREE.Group()
        const skin = new THREE.MeshBasicMaterial({ color: 0x6a8f3c })
        const cloth = new THREE.MeshBasicMaterial({ color: 0x3a3550 })
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.7), cloth); torso.position.set(0, 0, 1.05); g.add(torso)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skin); head.position.set(0, 0, 1.6); g.add(head)
        for (const [side, dx] of [['left', -0.36], ['right', 0.36]]) {
            const shoulder = new THREE.Group(); shoulder.name = `arm-${side}`; shoulder.position.set(dx, 0, 1.35)
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.16), skin); arm.position.y = 0.32
            shoulder.add(arm); g.add(shoulder)
        }
        for (const [side, dx] of [['left', -0.14], ['right', 0.14]]) {
            const hip = new THREE.Group(); hip.name = `leg-${side}`; hip.position.set(dx, 0, 0.7)
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.7), cloth); leg.position.z = -0.35
            hip.add(leg); g.add(hip)
        }
        // olhos
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2e4d })
        for (const dx of [-0.09, 0.09]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), eyeMat); e.position.set(dx, 0.19, 1.65); g.add(e) }
        return g
    }

    _makeMesh(tint) {
        const clone = this.template.clone(true)
        clone.traverse((o) => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() !== 0xff2e4d) { const m = o.material.clone(); m.color.offsetHSL(((tint >> 16 & 255) / 255 - 0.42) * 0.3, 0, 0); o.material = m } })
        return clone
    }

    _acquire() {
        let z = this.pool.pop()
        if (!z) {
            z = { mesh: null, vel: new THREE.Vector3(), dead: false, deadAt: 0, fling: new THREE.Vector3(), phase: Math.random() * 6 }
            const tint = ZOMBIE_TINTS[Math.floor(Math.random() * ZOMBIE_TINTS.length)]
            z.mesh = this._makeMesh(tint)
            z.limbs = ['arm-left', 'arm-right', 'leg-left', 'leg-right'].map(name => z.mesh.getObjectByName(name))
            this.container.add(z.mesh)
        }
            z.dead = false; z.vel.set(0, 0, 0); z.fling.set(0, 0, 0)
            z.mesh.rotation.set(0, 0, 0); z.mesh.scale.setScalar(0.95)
            z.nextAttack = 0; z.attackUntil = 0; z.damage = this.damage ?? PLAYER.zombieContactDamage
            z.path = null
            const a = Math.random() * Math.PI * 2
            z.offset = { x: Math.cos(a) * 1.1, y: Math.sin(a) * 1.1 } // cerca o carro dentro do alcance de mordida
            z.mesh.visible = true
        return z
    }

    spawn(count, city, rng, { speed, fromPoint = { x: 0, y: 0 } } = {}) {
        this.city = city
        const available = Math.max(0, PERF.maxActiveZombies - this.active.length)
        for (let i = 0; i < Math.min(count, available); i++) {
            const z = this._acquire()
            const p = city.randomSpawnPoint(rng, { minDistFrom: fromPoint, minDist: 12, maxDist: 42 })
            z.mesh.position.set(p.x, p.y, 0)
            z.speed = speed ?? 0.02
            this.active.push(z)
        }
    }

    // Horda: grupo que surge perto de um ponto (o jogador), em células navegáveis.
    spawnHorde(size, city, rng, nearPos, speed) {
        this.spawn(size, city, rng, { speed: (speed ?? 0.002) * 1.15, fromPoint: nearPos })
    }

    clear() {
        for (const z of this.active) { z.mesh.visible = false; this.pool.push(z) }
        this.active.length = 0
    }

    // Retorna eventos: { runOvers:[{pos,speed}], damages:[{amount,pos}] }
    update(dt, car, powerups, now, carSpeed) {
        dt = Math.min(dt, 50)
        const events = { runOvers: [], damages: [] }
        const carPos = new THREE.Vector3().copy(car.chassis.object.position)
        const speed = Math.abs(carSpeed || 0) // velocidade real (physics.car.forwardSpeed) vinda do GameManager
        const speedMult = powerups.speedMultiplier
        const runOverThreshold = PLAYER.runOverMinSpeed

        for (let i = this.active.length - 1; i >= 0; i--) {
            const z = this.active[i]
            const pos = z.mesh.position

            if (z.dead) {
                // fling: arremesso com gravidade + fade
                z.fling.z -= 0.000018 * dt
                pos.addScaledVector(z.fling, dt)
                if (pos.z < 0.15) { pos.z = 0.15; z.fling.z = Math.abs(z.fling.z) * 0.25; z.fling.x *= 0.8; z.fling.y *= 0.8 }
                z.mesh.rotation.x += dt * 0.006
                const life = (now - z.deadAt) / 1300
                z.mesh.scale.setScalar(0.95 * Math.max(0.01, 1 - Math.max(0, life - 0.6) / 0.4))
                if (life >= 1) { z.mesh.visible = false; z.mesh.scale.setScalar(1); z.mesh.rotation.set(0, 0, 0); this.pool.push(z); this.active.splice(i, 1) }
                continue
            }

            const dist = pos.distanceTo(carPos)

            // Culling: longe demais -> dorme (não persegue) mas ainda pode ser atropelado perto.
            if (dist > PERF.despawnDistance) {
                const point = this.city.randomSpawnPoint(Math.random, { minDistFrom: carPos, minDist: 22, maxDist: 42 })
                pos.set(point.x, point.y, 0)
                z.path = null
                continue
            }
            if (dist > PERF.cullDistance) continue

            // Perseguição (cada zumbi mira um ponto deslocado ao redor do carro -> cerca, não empilha)
            const target = new THREE.Vector3(carPos.x + (z.offset?.x || 0), carPos.y + (z.offset?.y || 0), carPos.z)
            const dir = new THREE.Vector3().subVectors(target, pos); dir.z = 0
            if (dist > 3) this.city.chaseDirection(z, pos, target, now, dir)
            if (dir.lengthSq() > 0.001) {
                dir.normalize()
                const chase = z.speed * dt * (dist < 30 ? 1.4 : 1)
                this.city.moveActor(pos, dir, chase)
                z.mesh.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2
                // bob de cambaleio
                z.phase += dt * 0.006
                const stride = Math.sin(z.phase), attacking = now < z.attackUntil
                pos.z = Math.abs(stride) * 0.05
                z.mesh.rotation.x = 0.08 + Math.sin(z.phase * 0.5) * 0.05
                z.mesh.rotation.y = stride * 0.07
                z.limbs[0].rotation.x = (attacking ? -0.5 : -0.12) + stride * 0.1
                z.limbs[1].rotation.x = (attacking ? -0.5 : -0.2) - stride * 0.08
                z.limbs[2].rotation.x = stride * 0.42
                z.limbs[3].rotation.x = -stride * 0.32
            }

            // Contato
            if (dist < PLAYER.contactRange) {
                if (speed > runOverThreshold) {
                    // ATROPELAMENTO
                    z.dead = true; z.deadAt = now
                    const knock = Math.min(0.018, 0.005 + speed * 0.05) * powerups.impactMultiplier
                    z.fling.copy(dir).multiplyScalar(-knock); z.fling.z = 0.006 + knock * 0.3
                    events.runOvers.push({ pos: pos.clone(), speed, direction: z.fling.clone().setZ(0).normalize() })
                } else if (now >= z.nextAttack && !powerups.shield && !powerups.invincible) {
                    z.nextAttack = now + 1200; z.attackUntil = now + 350
                    // MORDIDA (cooldown por i-frames no Health)
                    events.damages.push({ amount: z.damage ?? PLAYER.zombieContactDamage, pos: pos.clone() })
                }
            }
        }
        return events
    }

    setDamage(d) { this.damage = d; for (const z of this.active) z.damage = d }

    get count() { return this.active.filter((z) => !z.dead).length }
}
