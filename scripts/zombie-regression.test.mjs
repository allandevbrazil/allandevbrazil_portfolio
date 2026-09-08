import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

// Load shader text for logic tests; GPU rendering is checked in the browser.
registerHooks({ load(url, context, next) {
    if (url.endsWith('.glsl')) return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(readFileSync(new URL(url), 'utf8'))}` }
    return next(url, context)
} })
const { default: Materials } = await import('../src/javascript/World/Materials.js')
const { default: GameManager } = await import('../src/javascript/game/GameManager.js')
const { default: PlayerHealth } = await import('../src/javascript/game/PlayerHealth.js')
const { default: Cutscene } = await import('../src/javascript/game/Cutscene.js')
const { default: EventEmitter } = await import('../src/javascript/Utils/EventEmitter.js')
const { THEMES } = await import('../src/javascript/game/config.js')
const THREE = await import('three')
const { default: OcclusionController } = await import('../src/javascript/game/OcclusionController.js')
const { default: ZombieManager } = await import('../src/javascript/game/ZombieManager.js')
const { default: ProceduralCity, makeRng } = await import('../src/javascript/game/ProceduralCity.js')
const { nearestObjective } = await import('../src/javascript/game/ObjectiveRadar.js')
const { default: ParticleFx } = await import('../src/javascript/game/ParticleFx.js')
const { PERF } = await import('../src/javascript/game/config.js')

test('resuming the clock never feeds a zero delta into physics or audio', async () => {
    const { default: Time } = await import('../src/javascript/Utils/Time.js')
    const originalNow = Date.now
    globalThis.window = { requestAnimationFrame() { return 1 } }
    Date.now = () => 1234
    try {
        const clock = Object.create(Time.prototype)
        clock.current = 1234; clock.start = 1200; clock.trigger = () => {}
        clock.tick()
        assert.equal(clock.delta, 1)
    } finally { Date.now = originalNow; delete globalThis.window }
})

test('every level theme keeps all car materials revealed', () => {
    const materials = new Materials({ resources: { items: {} } })
    const world = { materials, objects: { items: [] }, reveal: { matcapsProgress: 1 }, floor: { colors: {}, updateMaterial() {} }, shadows: {} }
    const game = Object.create(GameManager.prototype)
    game.app = { world, passes: { glowsPass: { material: { uniforms: { uColor: { value: { set() {} } } } } } } }
    globalThis.document = { documentElement: { style: { setProperty() {} } } }
    try {
        for (const theme of THEMES) {
            game._applyTheme(theme)
            for (const material of Object.values(materials.shades.items)) assert.equal(material.uniforms.uRevealProgress.value, 1)
        }
    } finally { delete globalThis.document }
})

test('retry restores damage and death events', () => {
    const health = new PlayerHealth()
    let deaths = 0
    health.on('dead', () => deaths++)
    health.damage(health.max, 10000)
    assert.equal(deaths, 1)
    health.reset()
    assert.equal(health.dead, false)
    assert.equal(health.damage(health.max, 20000), true)
    assert.equal(deaths, 2)
})

test('finishing cutscene preserves physics and render tick listeners', () => {
    const time = new EventEmitter()
    let frames = 0, finished = 0
    time.on('tick', () => frames++)
    time.on('tick.zombieCutscene', () => assert.fail('cutscene listener leaked'))
    const cutscene = new Cutscene({ app: { time }, onDone: () => finished++ })
    cutscene._finish()
    time.trigger('tick')
    cutscene._finish()
    assert.equal(frames, 1)
    assert.equal(finished, 1)
})

test('timeout stops gameplay processing in the same frame', () => {
    const game = Object.create(GameManager.prototype)
    game.state = 'playing'
    game.app = { world: { car: { chassis: { object: { position: {} } } }, physics: { car: {} } } }
    game.timer = { update() { game.state = 'gameover' } }
    game.powerups = { update() { assert.fail('gameplay continued after timeout') } }
    game.update(16, 1000)
    assert.equal(game.state, 'gameover')
})

test('occluding wall fades independently and returns to opaque when camera moves', () => {
    const material = new THREE.MeshBasicMaterial()
    const wall = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), material)
    wall.position.set(0, -5, 2.5)
    const other = new THREE.Mesh(wall.geometry, material); other.position.set(20, -5, 2.5)
    const controller = new OcclusionController(); controller.setMeshes([wall, other])
    const camera = new THREE.PerspectiveCamera(); camera.position.set(0, -10, 4)
    const player = new THREE.Vector3()
    for (let i = 0; i < 30; i++) controller.update(16, camera, player)
    assert.equal(wall.material.opacity, 0.12)
    assert.equal(wall.material.depthWrite, false)
    assert.equal(other.material.opacity, 1)
    assert.equal(material.opacity, 1)
    camera.position.set(0, 10, 4)
    for (let i = 0; i < 30; i++) controller.update(16, camera, player)
    assert.equal(wall.material.opacity, 1)
    assert.equal(wall.material.depthWrite, true)
    controller.clear(); assert.equal(wall.material, material)
})

test('radar selects nearest uncollected objective using ground distance', () => {
    const gem = (x, y, collected = false) => ({ mesh: { position: new THREE.Vector3(x, y, 20) }, collected })
    const near = gem(3, 4), far = gem(30, 40), used = gem(0, 0, true)
    assert.equal(nearestObjective([far, used, near], new THREE.Vector3()).position, near.mesh.position)
    assert.equal(nearestObjective([near], new THREE.Vector3()).distance, 5)
    assert.equal(nearestObjective([null, used], new THREE.Vector3()), null)
})

test('spawn points stay inside walls and road paths go around buildings', () => {
    const city = new ProceduralCity({ world: {} })
    city.walkableLines = city._roadCenters()
    city._aabb = [{ x: 0, y: 0, hw: 9, hd: 9 }]
    const rng = makeRng(99)
    for (let i = 0; i < 200; i++) {
        const p = city.randomSpawnPoint(rng, { minDistFrom: { x: 12, y: 12 }, minDist: 12, maxDist: 42 })
        assert.ok(city.isWalkable(p.x, p.y))
        assert.ok(Math.hypot(p.x - 12, p.y - 12) >= 12)
    }
    const start = { x: -12, y: 0 }, end = { x: 12, y: 0 }
    assert.equal(city.clearPath(start, end), false)
    const path = city.findPath(start, end)
    assert.ok(path.length >= 3)
    let previous = start
    for (const point of path) { assert.ok(city.clearPath(previous, point)); previous = point }
    assert.deepEqual(path.at(-1), end)
})

test('zombies animate limbs, fling above ground and reset correctly when pooled', async () => {
    const city = new ProceduralCity({ world: {} }); city.walkableLines = city._roadCenters()
    const zombies = new ZombieManager({ scene: new THREE.Scene() }); await zombies.load()
    zombies.setDamage(17)
    zombies.spawn(1, city, makeRng(12), { speed: 0.002 })
    const zombie = zombies.active[0], car = { chassis: { object: { position: new THREE.Vector3() } } }
    const powerups = { speedMultiplier: 1, impactMultiplier: 1 }
    zombie.mesh.position.set(0, 5, 0)
    zombies.update(16, car, powerups, 16, 0)
    const leg = zombie.limbs[2].rotation.x
    zombies.update(50, car, powerups, 66, 0)
    assert.notEqual(zombie.limbs[2].rotation.x, leg)
    assert.ok(zombie.limbs[0].children[0].position.y > 0)
    zombie.mesh.position.set(0, 1, 0)
    assert.equal(zombies.update(16, car, powerups, 100, 0.08).runOvers.length, 1)
    zombies.update(50, car, powerups, 150, 0)
    assert.ok(zombie.mesh.position.z > 0)
    zombies.update(50, car, powerups, 1500, 0)
    assert.equal(zombies.active.length, 0)
    zombies.spawn(1, city, makeRng(13), { speed: 0.002 })
    assert.equal(zombies.active[0], zombie)
    assert.equal(zombie.dead, false)
    assert.equal(zombie.damage, 17)
    assert.equal(zombie.mesh.rotation.x, 0)
    zombies.spawnHorde(1000, city, makeRng(14), { x: 12, y: 12 }, 0.002)
    assert.equal(zombies.active.length, PERF.maxActiveZombies)
    zombies.spawnHorde(20, city, makeRng(15), { x: 12, y: 12 }, 0.002)
    assert.equal(zombies.active.length, PERF.maxActiveZombies)
})

test('blood lands on the road, fades and respects the particle budget', () => {
    const fx = new ParticleFx({ scene: new THREE.Scene() })
    for (let i = 0; i < 30; i++) fx.blood(new THREE.Vector3(0, 0, 0.5), new THREE.Vector3(1, 0, 0))
    assert.equal(fx.active.length, 240)
    for (let i = 0; i < 20; i++) fx.update(50)
    assert.ok(fx.active.every(p => p.mesh.position.z >= 0.055))
    for (let i = 0; i < 20; i++) fx.update(50)
    assert.equal(fx.active.length, 0)
})

test('rotated street props stop a fast chassis and remove their collision on teardown', async () => {
    const { default: CANNON } = await import('cannon')
    for (const speed of [9, 24]) {
        const physics = { world: new CANNON.World(), materials: { items: { dummy: new CANNON.Material() } } }
        const city = new ProceduralCity({ world: { physics } })
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 1), new THREE.MeshBasicMaterial())
        mesh.geometry.translate(0.3, 0, 0.5)
        mesh.scale.setScalar(1.2); mesh.updateMatrixWorld(true)
        const localBounds = new THREE.Box3().setFromObject(mesh)
        mesh.position.set(12, 12, 0); mesh.rotation.z = 0.4; city.container.add(mesh)
        city._addPropCollider(mesh, localBounds)
        const prop = city.props[0]
        assert.deepEqual([prop.body.quaternion.x, prop.body.quaternion.y, prop.body.quaternion.z, prop.body.quaternion.w], mesh.quaternion.toArray())
        assert.equal(city.isWalkable(12, 12), false)
        const car = new CANNON.Body({ mass: 40, shape: new CANNON.Box(new CANNON.Vec3(1.2, 0.5, 0.3)) })
        car.position.set(6, 12, 0.5); car.velocity.set(speed, 0, 0)
        car.fixedRotation = true; car.updateMassProperties()
        physics.world.addBody(car)
        let contacts = 0
        car.addEventListener('collide', e => { if (e.body === prop.body) contacts++ })
        for (let i = 0; i < 30; i++) physics.world.step(1 / 120, 0.06, 8)
        assert.ok(contacts > 0, `no contact at ${speed} m/s`)
        assert.ok(car.position.x < 12, `passed through prop at ${speed} m/s`)
        city.dispose()
        assert.equal(physics.world.bodies.includes(prop.body), false)
        assert.equal(city.props.length, 0)
    }
})

test('downloaded bat, spider and rat contain working skeletal movement/attack/death animations', async () => {
    const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js')
    const { clone } = await import('three/addons/utils/SkeletonUtils.js')
    for (const name of ['Bat', 'Spider', 'Rat']) {
        const bytes = readFileSync(new URL('../static/game/creatures/' + name + '.fbx', import.meta.url))
        const model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
        const movement = model.animations.find(clip => /Flying|Walk|Run/.test(clip.name))
        assert.ok(movement)
        assert.ok(model.animations.some(clip => /Attack/.test(clip.name)))
        assert.ok(model.animations.some(clip => /Death/.test(clip.name)))
        const actor = clone(model), mixer = new THREE.AnimationMixer(actor)
        mixer.clipAction(movement).play()
        const bones = []; actor.traverse(o => { if (o.isBone) bones.push(o) })
        const before = bones.map(b => b.quaternion.toArray().join(',')).join('|')
        mixer.update(0.3)
        assert.notEqual(bones.map(b => b.quaternion.toArray().join(',')).join('|'), before)
    }
})
