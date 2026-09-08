import * as THREE from 'three'
import { CRYSTALS } from './config.js'

// Cristais menores (uma cor por efeito) + esmeralda principal escondida.
// Coleta por proximidade; emite callback onCollect(crystalDef) / onEmerald().
export default class CrystalManager {
    constructor({ scene, time }) {
        this.scene = scene; this.time = time
        this.container = new THREE.Object3D(); this.container.name = 'crystals'
        scene.add(this.container)
        this.items = [] // { mesh, def, collected, spin }
        this.emerald = null
        this.geo = new THREE.OctahedronGeometry(0.9, 0)
        this.emeraldGeo = new THREE.IcosahedronGeometry(1.6, 0)
    }

    clear() {
        const disposeMaterials = mesh => mesh.traverse(o => { if (o.material) o.material.dispose() })
        for (const it of this.items) { this.container.remove(it.mesh); disposeMaterials(it.mesh) }
        this.items.length = 0
        if (this.emerald) { this.container.remove(this.emerald.mesh); disposeMaterials(this.emerald.mesh); this.emerald = null }
    }

    _gem(color, size = 1) {
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
        const mesh = new THREE.Mesh(this.geo, mat)
        mesh.scale.setScalar(size)
        const glow = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 }))
        glow.scale.setScalar(size * 1.6)
        mesh.add(glow)
        return mesh
    }

    // Distribui cristais: garante pelo menos `required` de cores variadas + extras (risco/efeitos).
    spawn(crystalCount, city, rng, required) {
        const pool = [...CRYSTALS]
        for (let i = 0; i < crystalCount; i++) {
            const def = pool[i % pool.length]
            const p = city.randomSpawnPoint(rng, { minDistFrom: { x: 0, y: 0 }, minDist: 12 })
            const mesh = this._gem(def.color)
            mesh.position.set(p.x, p.y, 1.2)
            this.container.add(mesh)
            this.items.push({ mesh, def, collected: false, phase: rng() * 6 })
        }
    }

    spawnEmerald(spot, rng) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x1affa0, transparent: true, opacity: 0.98 })
        const mesh = new THREE.Mesh(this.emeraldGeo, mat)
        mesh.position.set(spot.x, spot.y, 1.4)
        const halo = new THREE.Mesh(this.emeraldGeo, new THREE.MeshBasicMaterial({ color: 0x1affa0, transparent: true, opacity: 0.2 }))
        halo.scale.setScalar(1.7); mesh.add(halo)
        this.container.add(mesh)
        this.emerald = { mesh, collected: false, phase: 0 }
    }

    update(dt, now, carPos, onCollect, onEmerald) {
        for (const it of this.items) {
            if (it.collected) continue
            const m = it.mesh
            m.rotation.z += dt * 0.002
            m.position.z = 1.2 + Math.sin((now / 500) + it.phase) * 0.25
            if (m.position.distanceTo(carPos) < 2.2) {
                it.collected = true; m.visible = false
                onCollect(it.def)
            }
        }
        if (this.emerald && !this.emerald.collected) {
            const m = this.emerald.mesh
            m.rotation.z += dt * 0.0015; m.rotation.y += dt * 0.001
            m.position.z = 1.4 + Math.sin((now / 400)) * 0.3
            if (m.position.distanceTo(carPos) < 2.6) { this.emerald.collected = true; m.visible = false; onEmerald() }
        }
    }

    get collectedCount() { return this.items.filter((i) => i.collected).length }
    get totalCount() { return this.items.length }
    get emeraldFound() { return !!this.emerald && this.emerald.collected }
}
