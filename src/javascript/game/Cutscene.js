import * as THREE from 'three'
import gsap from 'gsap'

// Cutscene final: o carro escapa da cidade. Câmera cinematográfica, ~12-16s, pulável após 3s.
export default class Cutscene {
    constructor({ app, onDone }) {
        this.app = app; this.onDone = onDone
        this.skippable = false
        this.finished = false
    }

    start() {
        const { camera, world } = this.app
        const car = world.car
        const instance = camera.instance

        // Trava controles/input de gameplay
        if (world.controls) world.controls.actions.up = world.controls.actions.down = world.controls.actions.left = world.controls.actions.right = false
        this._savedPan = camera.pan.enabled
        camera.pan.disable && camera.pan.disable()

        // Alvo que segue o carro
        const follow = { x: car.chassis.object.position.x, y: car.chassis.object.position.y, z: car.chassis.object.position.z }
        const camPos = { x: instance.position.x, y: instance.position.y, z: instance.position.z }

        const tl = gsap.timeline({ onComplete: () => this._finish() })

        // Mantém o carro acelerando em linha reta (força simples no chassis)
        this._drive = true
        const body = world.physics.car.chassis.body
        const dir = new THREE.Vector3(Math.cos(car.chassis.object.rotation.z || 0), Math.sin(car.chassis.object.rotation.z || 0), 0)

        // Shot 1: atrás do carro, aproximando
        tl.to(camPos, { x: follow.x - 6, y: follow.y - 3, z: follow.z + 3, duration: 1.2, ease: 'power2.inOut' }, 0)
        // Shot 2: lateral
        .to(camPos, { x: follow.x + 2, y: follow.y - 8, z: follow.z + 2, duration: 2.2, ease: 'power1.inOut' }, 1.4)
        // Shot 3: distante, cidade ficando para trás
        .to(camPos, { x: follow.x - 18, y: follow.y - 14, z: follow.z + 10, duration: 3.2, ease: 'power2.out' }, 3.8)
        // Shot 4: sobe e afasta (horizonte)
        .to(camPos, { x: follow.x - 30, y: follow.y - 20, z: follow.z + 22, duration: 4.0, ease: 'power2.inOut' }, 7.2)

        this._tl = tl
        this._follow = follow
        this._camPos = camPos
        this._body = body
        this._dir = dir
        this._car = car
        this._instance = instance

        // Loop de atualização da cutscene (movimento do carro + câmera)
        this._tick = () => {
            if (!this._drive || this.finished) return
            // empurra o carro para frente continuamente
            body.velocity.x = this._dir.x * 0.6
            body.velocity.y = this._dir.y * 0.6
            body.angularVelocity.set(0, 0, 0)
            follow.x = car.chassis.object.position.x
            follow.y = car.chassis.object.position.y
            follow.z = car.chassis.object.position.z
            instance.position.set(this._camPos.x, this._camPos.y, this._camPos.z)
            instance.lookAt(follow.x, follow.y, follow.z + 1)
        }
        this.app.time.on('tick.zombieCutscene', this._tick)

        setTimeout(() => { this.skippable = true }, 3000)
    }

    skip() { if (this.skippable && !this.finished) { this._tl && this._tl.kill(); this._finish() } }

    _finish() {
        if (this.finished) return
        this.finished = true
        this._drive = false
        this.app.time.off('tick.zombieCutscene')
        if (this._savedPan) this.app.camera.pan.enable()
        this.onDone && this.onDone()
    }
}
