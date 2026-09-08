import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { PLAYER } from './config.js'

const SPECIES = [
    { name: 'Bat', label: 'MORCEGO', size: 2.8, speed: 0.0034, altitude: 0.9, damage: 7, color: 0xb14bff, movement: /Flying/ },
    { name: 'Spider', label: 'ARANHA GIGANTE', size: 3.4, speed: 0.0018, altitude: 0, damage: 14, color: 0xff8c42, movement: /Walk/ },
    { name: 'Rat', label: 'RATO', size: 2.1, speed: 0.003, altitude: 0, damage: 6, color: 0xaa91bd, movement: /Run/ },
]

export default class MonsterManager {
    constructor({ scene, world }) {
        this.world = world
        this.container = new THREE.Group(); this.container.name = 'monsters'; scene.add(this.container)
        this.items = []
        this.templates = new Map()
        this.serial = 0
        this.direction = new THREE.Vector3()
    }

    async load() {
        if (this.templates.size) return
        const loader = new FBXLoader()
        await Promise.all(SPECIES.map(async species => {
            const model = await loader.loadAsync('./game/creatures/' + species.name + '.fbx')
            const palettes = {
                Bat: { Main: 0xffedc2, Black: 0xa9dfe8, Belly: 0xffd477, Nose: 0xff9aab, Eyes: 0xff315c },
                Rat: { Grey: 0xe4edf2, Pink: 0xffb6bf },
                Spider: { Material: 0xc2f590, 'Material.001': 0xff634a },
            }
            model.traverse(mesh => {
                if (!mesh.isMesh) return
                const convert = mat => new THREE.MeshMatcapMaterial({
                    color: palettes[species.name][mat.name] ?? species.color,
                    matcap: this.world.materials.shades.items.white.uniforms.matcap.value,
                    side: THREE.DoubleSide,
                    // Keep pale enemy colors legible through the neon postprocess.
                    toneMapped: false,
                })
                mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material)
                mesh.frustumCulled = false
            })
            // FBX bind poses differ greatly from the running/flying pose. Normalize
            // the animated extent so a bat never becomes larger than the car.
            const probe = new THREE.AnimationMixer(model)
            const movement = model.animations.find(clip => species.movement.test(clip.name))
            probe.clipAction(movement).play()
            const box = new THREE.Box3()
            for (const fraction of [0, 0.25, 0.5, 0.75]) {
                probe.setTime(movement.duration * fraction); model.updateMatrixWorld(true)
                box.union(new THREE.Box3().setFromObject(model, true))
            }
            probe.stopAllAction(); probe.uncacheRoot(model)
            const size = box.getSize(new THREE.Vector3())
            this.templates.set(species.name, { model, scale: species.size / Math.max(size.x, size.y, size.z), minY: box.min.y })
        }))
    }

    spawn(rng, city, { fromPoint, count = 3 }) {
        this.city = city
        const available = Math.min(count, 18 - this.items.length)
        for (let i = 0; i < available; i++) {
            const species = SPECIES[this.serial++ % SPECIES.length]
            const template = this.templates.get(species.name)
            if (!template) continue
            const model = cloneSkeleton(template.model)
            const group = new THREE.Group(), frame = new THREE.Group()
            frame.rotation.x = Math.PI / 2 // FBX Y-up to world Z-up.
            frame.scale.setScalar(template.scale)
            model.position.y -= template.minY
            frame.add(model); group.add(frame)
            const spot = city.randomSpawnPoint(rng, { minDistFrom: fromPoint, minDist: 16, maxDist: 40 })
            group.position.set(spot.x, spot.y, species.altitude)
            const mixer = new THREE.AnimationMixer(model)
            const actions = Object.fromEntries(template.model.animations.map(clip => [clip.name, mixer.clipAction(clip)]))
            const walk = Object.entries(actions).find(([name]) => species.movement.test(name))?.[1]
            const attack = Object.entries(actions).find(([name]) => /Attack/.test(name))?.[1]
            const death = Object.entries(actions).find(([name]) => /Death/.test(name))?.[1]
            walk?.play(); mixer.update(rng())
            this.container.add(group)
            this.items.push({ group, model, mixer, walk, attack, death, species, color: species.color, dead: false, phase: rng() * 6, nextAttack: 0, attackUntil: 0, fling: new THREE.Vector3() })
        }
    }

    _release(item) {
        item.mixer.stopAllAction(); item.mixer.uncacheRoot(item.model)
        this.container.remove(item.group)
        // Clones own skeleton textures, but share cached geometry/materials.
        item.model.traverse(mesh => { if (mesh.isSkinnedMesh) mesh.skeleton.dispose() })
    }

    clear() { for (const item of this.items) this._release(item); this.items.length = 0 }

    update(dt, now, carPos, carSpeed, onKill, onAttack, powerups) {
        dt = Math.min(dt, 50)
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i], pos = item.group.position, species = item.species
            item.mixer.update(dt / 1000)
            if (item.dead) {
                item.fling.z -= 0.000018 * dt
                pos.addScaledVector(item.fling, dt)
                if (pos.z < 0.08) { pos.z = 0.08; item.fling.set(0, 0, 0) }
                if (now - item.deadAt > 1300) { this._release(item); this.items.splice(i, 1) }
                continue
            }
            const distance = Math.hypot(pos.x - carPos.x, pos.y - carPos.y)
            if (distance > 85) {
                const p = this.city.randomSpawnPoint(Math.random, { minDistFrom: carPos, minDist: 22, maxDist: 40 })
                pos.set(p.x, p.y, species.altitude)
                item.path = null
                continue
            }
            this.direction.subVectors(carPos, pos).setZ(0).normalize()
            if (distance > 3) this.city.chaseDirection(item, pos, carPos, now, this.direction)
            this.city.moveActor(pos, this.direction, species.speed * dt)
            item.group.rotation.z = Math.atan2(this.direction.y, this.direction.x) + Math.PI / 2
            pos.z = species.altitude + (species.name === 'Bat' ? Math.sin(now * 0.006 + item.phase) * 0.25 : 0)
            if (item.attackUntil && now > item.attackUntil) { item.attack?.fadeOut(0.15); item.walk?.reset().fadeIn(0.15).play(); item.attackUntil = 0 }
            if (distance > (species.name === 'Spider' ? 2.1 : 1.6)) continue
            if (carSpeed > PLAYER.runOverMinSpeed) {
                item.dead = true; item.deadAt = now
                item.mixer.stopAllAction()
                if (item.death) { item.death.setLoop(THREE.LoopOnce, 1); item.death.clampWhenFinished = true; item.death.reset().play() }
                item.fling.copy(this.direction).multiplyScalar(-0.007 * (powerups?.impactMultiplier || 1)); item.fling.z = 0.006
                onKill(item)
            } else if (now >= item.nextAttack && !powerups?.shield && !powerups?.invincible) {
                item.nextAttack = now + 1400; item.attackUntil = now + 600
                item.walk?.fadeOut(0.1)
                item.attack?.reset().fadeIn(0.1).play()
                onAttack({ pos: pos.clone(), amount: species.damage })
            }
        }
    }

    get count() { return this.items.filter(item => !item.dead).length }
}
