import * as THREE from 'three'

// Efeitos de partículas leves (pool de sprites) para atropelamento/coleta.
export default class ParticleFx {
    constructor({ scene }) {
        this.scene = scene
        this.pool = []
        this.geo = new THREE.SphereGeometry(0.22, 6, 6)
        this.active = []
    }

    burst(pos, color = 0xff2e88, count = 12, power = 1, direction = null, blood = false) {
        count = Math.min(count, 240 - this.active.length)
        for (let i = 0; i < count; i++) {
            let p = this.pool.pop()
            if (!p) { p = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ transparent: true })); this.scene.add(p) }
            p.visible = true
            p.material.color.set(color)
            p.material.opacity = 1
            p.position.copy(pos)
            p.position.z = Math.max(0.5, p.position.z)
            p.scale.setScalar(0.3 + Math.random() * 0.55)
            const v = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), Math.random() * 0.8).normalize().multiplyScalar((0.002 + Math.random() * 0.006) * power)
            if (direction) v.addScaledVector(direction, 0.004 * power)
            this.active.push({ mesh: p, vel: v, life: 1, blood })
        }
    }

    update(dt) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const a = this.active[i]
            a.vel.z -= 0.000018 * dt
            a.mesh.position.addScaledVector(a.vel, dt)
            if (a.blood && a.mesh.position.z < 0.055) {
                a.mesh.position.z = 0.055; a.vel.set(0, 0, 0); a.mesh.scale.z = 0.05
            }
            a.life -= dt / (a.blood ? 1500 : 700)
            a.mesh.material.opacity = Math.max(0, a.life)
            if (a.life <= 0) { a.mesh.visible = false; this.pool.push(a.mesh); this.active.splice(i, 1) }
        }
    }

    clear() { for (const a of this.active) { a.mesh.visible = false; this.pool.push(a.mesh) } this.active.length = 0 }

    blood(pos, direction, power = 1) { this.burst(pos, 0xc71639, 20, Math.min(2, power), direction, true) }
}
