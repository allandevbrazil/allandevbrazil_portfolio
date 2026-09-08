// Gerador procedural de cidade (Kenney City Kit) para o Modo Zumbi.
// Converte os modelos Y-up da Kenney para o frame Z-up do template, escala ao tamanho
// de cidade, aterra na base, monta quarteirões com RUAS visíveis e uma grade de
// navegação para spawn SEGURO de zumbis/cristais/esmeralda/carro.
import * as THREE from 'three'
import CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export function makeRng(seed) {
    let a = seed >>> 0
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const CITY_BASE = './game/city/'
const BUILDINGS = [
    'building-a', 'building-b', 'building-c', 'building-d', 'building-e', 'building-f', 'building-g', 'building-h',
    'building-i', 'building-j', 'building-k', 'building-l', 'building-m', 'building-n',
    'low-detail-building-a', 'low-detail-building-b', 'low-detail-building-c', 'low-detail-building-d',
    'low-detail-building-e', 'low-detail-building-f', 'low-detail-building-g', 'low-detail-building-h',
    'building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c', 'building-skyscraper-d', 'building-skyscraper-e',
]
const SKYSCRAPERS = ['building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c', 'building-skyscraper-d', 'building-skyscraper-e']

export default class ProceduralCity {
    constructor(_options) {
        this.world = _options.world
        this.debug = _options.debug
        this.container = new THREE.Object3D(); this.container.name = 'proceduralCity'
        this.baked = {} // name -> { geo, footprint }
        this.loader = new GLTFLoader()
        this._collisions = []
        this.occluders = []
        this.props = []
        this.ownedGeometries = new Set()
        this.ownedMaterials = new Set()

        this.blocks = 5 // quarteirões por lado
        this.blockSize = 16 // lado do quarteirão (prédios)
        this.roadWidth = 8 // largura da rua
        this.pitch = this.blockSize + this.roadWidth
        this.half = (this.blocks * this.pitch) / 2
        this.walkableLines = [] // {axis:'x'|'y', at} centro de cada rua
    }

    get extent() { return this.half * 2 }

    loadModel(name) {
        const url = CITY_BASE + name + '.glb'
        if (!this.baked[name]) {
            this.baked[name] = this.loader.loadAsync(url).then((gltf) => this._bake(gltf.scene)).catch(() => null)
        }
        return this.baked[name]
    }

    _bake(scene) {
        scene.updateMatrixWorld(true)
        const geos = []
        scene.traverse((o) => {
            if (o.isMesh && o.geometry) {
                const g = o.geometry.clone()
                g.applyMatrix4(o.matrixWorld)
                if (g.index) { /* keep */ } else { g.setIndex(null) }
                // remove atributos extras para merge simples (posição + normal)
                for (const k of ['uv', 'uv1', 'color']) if (g.attributes[k]) g.deleteAttribute(k)
                geos.push(g)
            }
        })
        if (!geos.length) return null
        let geo
        try { geo = mergeGeometries(geos, false) } catch (e) { geo = geos[0] }
        // Y-up -> Z-up: (x,y,z) -> (x, -z, y)
        const pos = geo.attributes.position.array
        const nor = geo.attributes.normal ? geo.attributes.normal.array : null
        for (let i = 0; i < pos.length; i += 3) {
            const x = pos[i], y = pos[i + 1], z = pos[i + 2]
            pos[i] = x; pos[i + 1] = -z; pos[i + 2] = y
            if (nor) { const nx = nor[i], ny = nor[i + 1], nz = nor[i + 2]; nor[i] = nx; nor[i + 1] = -nz; nor[i + 2] = ny }
        }
        geo.computeBoundingBox()
        const bb = geo.boundingBox
        const size = new THREE.Vector3(); bb.getSize(size)
        const center = new THREE.Vector3(); bb.getCenter(center)
        // recentra XY, base em z=0
        geo.translate(-center.x, -center.y, -bb.min.z)
        geo.computeBoundingBox()
        return { geo, w: size.x, d: size.y, h: size.z }
    }

    async preload() { await Promise.all(BUILDINGS.map((b) => this.loadModel(b))) }

    _roadCenters() {
        const lines = []
        this.roadCoords = []
        for (let i = 0; i <= this.blocks; i++) {
            const at = -this.half + i * this.pitch
            this.roadCoords.push(at)
            lines.push({ axis: 'x', at }) // rua vertical em x=at
            lines.push({ axis: 'y', at }) // rua horizontal em y=at
        }
        return lines
    }

    async generate({ seed }) {
        const rng = makeRng(seed)
        this._collisions.length = 0
        for (const c of [...this.container.children]) this.container.remove(c)
        this.walkableLines = this._roadCenters()

        // Ruas: faixas escuras no chão (visuais) + meio-fio
        const roadMat = new THREE.MeshBasicMaterial({ color: 0x1a1030 })
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd400 })
        this.ownedMaterials.add(roadMat); this.ownedMaterials.add(lineMat)
        const roadLen = this.half * 2
        for (const l of this.walkableLines) {
            const strip = new THREE.Mesh(new THREE.PlaneGeometry(roadLen, this.roadWidth), roadMat)
            this.ownedGeometries.add(strip.geometry)
            if (l.axis === 'x') { strip.position.set(l.at, 0, 0.02); strip.rotation.z = Math.PI / 2 }
            else strip.position.set(0, l.at, 0.02)
            this.container.add(strip)
            // faixa central tracejada
            for (let s = -this.half + 3; s < this.half - 2; s += 6) {
                const dash = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.4), lineMat)
                this.ownedGeometries.add(dash.geometry)
                if (l.axis === 'x') { dash.position.set(l.at, s, 0.03); dash.rotation.z = Math.PI / 2 }
                else dash.position.set(s, l.at, 0.03)
                this.container.add(dash)
            }
        }

        // Prédios nos blocos (entre ruas) — cores neon brilhantes p/ contraste no chão escuro
        const matcaps = ['white', 'orange', 'red', 'green', 'blue', 'yellow', 'emeraldGreen', 'purple', 'metal', 'beige']
        const jobs = []
        for (let bi = 0; bi < this.blocks; bi++) {
            for (let bj = 0; bj < this.blocks; bj++) {
                const bcx = -this.half + this.roadWidth / 2 + bi * this.pitch + this.blockSize / 2
                const bcy = -this.half + this.roadWidth / 2 + bj * this.pitch + this.blockSize / 2
                const tall = rng() < 0.3
                const name = tall ? SKYSCRAPERS[Math.floor(rng() * SKYSCRAPERS.length)] : BUILDINGS[Math.floor(rng() * 22)]
                jobs.push(this._placeBuilding(name, bcx, bcy, rng, matcaps, tall))
            }
        }
        await Promise.all(jobs)
        await this._placeProps(rng)
        this._addBoundary()
        if (this.debug) console.log('Cidade:', this._collisions.length, 'prédios')
    }

    // Muros visíveis + colisão delimitando a arena (a fase não é infinita)
    _addBoundary() {
        const wallMat = this.world.materials.shades.items.red || this.world.materials.shades.items.white
        const e = this.half - 1
        const seg = 8, h = 6, th = 2
        const edges = [
            { x: 0, y: -e, dx: 1, dy: 0 }, { x: 0, y: e, dx: 1, dy: 0 },
            { x: -e, y: 0, dx: 0, dy: 1 }, { x: e, y: 0, dx: 0, dy: 1 },
        ]
        for (const ed of edges) {
            const length = this.half * 2
            const n = Math.ceil(length / seg)
            for (let i = 0; i < n; i++) {
                const along = -this.half + i * seg + seg / 2
                const x = ed.dx ? along : ed.x
                const y = ed.dy ? along : ed.y
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(ed.dx ? seg : th, ed.dy ? seg : th, h), wallMat)
                this.ownedGeometries.add(mesh.geometry)
                mesh.position.set(x, y, h / 2)
                this.container.add(mesh)
                this.occluders.push(mesh)
                const collMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
                collMesh.name = 'cube_1'
                collMesh.scale.set(ed.dx ? seg : th, ed.dy ? seg : th, h)
                collMesh.position.set(0, 0, h / 2)
                const col = this.world.physics.addObjectFromThree({ meshes: [collMesh], offset: { x, y, z: 0 }, mass: 0, sleep: true })
                this._collisions.push(col)
            }
        }
    }

    async _placeBuilding(name, x, y, rng, matcaps, tall) {
        const baked = await this.loadModel(name)
        if (!baked) return
        // 1 prédio sólido preenchendo o quarteirão; escala independente (footprint x altura)
        const targetW = this.blockSize * (0.86 + rng() * 0.1) // preenche quase todo o quarteirão (denso)
        const targetH = tall ? 8 + rng() * 8 : 3 + rng() * 4
        const sx = targetW / Math.max(0.5, baked.w)
        const sy = targetW / Math.max(0.5, baked.d)
        const sz = targetH / Math.max(0.5, baked.h)
        const height = targetH
        const matName = matcaps[Math.floor(rng() * matcaps.length)]
        const mat = this.world.materials.shades.items[matName] || this.world.materials.shades.items.white
        const mesh = new THREE.Mesh(baked.geo, mat)
        mesh.scale.set(sx, sy, sz)
        mesh.position.set(x, y, 0)
        mesh.rotation.z = Math.floor(rng() * 4) * Math.PI / 2
        this.container.add(mesh)
        this.occluders.push(mesh)

        // colisor (caixa estática)
        const collMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
        collMesh.name = 'cube_1'
        const fw = baked.w * sx, fd = baked.d * sy
        collMesh.scale.set(fw, fd, height)
        collMesh.position.set(0, 0, height / 2)
        const col = this.world.physics.addObjectFromThree({
            meshes: [collMesh], offset: { x, y, z: 0 }, rotation: new THREE.Euler(0, 0, mesh.rotation.z), mass: 0, sleep: true,
        })
        this._collisions.push(col)
        this._aabb = this._aabb || []
        this._aabb.push({ x, y, hw: fw / 2 + 1, hd: fd / 2 + 1 })
    }

    async _placeProps(rng) {
        const brick = this.world?.resources?.items?.brickBase?.scene
        const cone = this.world?.resources?.items?.coneBase?.scene
        const mat = this.world.materials.shades.items.orange
        const spots = []
        for (const l of this.walkableLines) for (let s = -this.half + 4; s < this.half - 3; s += 8) spots.push(l.axis === 'x' ? { x: l.at, y: s } : { x: s, y: l.at })
        for (let i = 0; i < spots.length; i++) {
            if (rng() > 0.28) continue
            const src = (rng() < 0.5 && brick) ? brick : (cone || brick); if (!src) continue
            const clone = src.clone()
            clone.traverse((o) => { if (o.isMesh) { o.material = mat; o.matrixAutoUpdate = true } })
            const p = spots[i]
            clone.position.set(0, 0, 0)
            clone.rotation.set(0, 0, 0)
            clone.scale.setScalar(0.7 + rng() * 0.5)
            clone.updateMatrixWorld(true)
            const bounds = new THREE.Box3().setFromObject(clone)
            clone.position.set(p.x + (rng() - 0.5) * 3, p.y + (rng() - 0.5) * 3, 0)
            clone.rotation.set(0, 0, rng() * Math.PI)
            // Keep the spawn intersection clear now that street props are solid.
            const road = this.roadCoords[Math.floor(this.roadCoords.length / 2)]
            if (Math.hypot(clone.position.x - road, clone.position.y - road) < 4) continue
            this.container.add(clone)
            this._addPropCollider(clone, bounds)
        }
    }

    _addPropCollider(mesh, localBounds) {
        if (localBounds.isEmpty()) return
        const size = localBounds.getSize(new THREE.Vector3())
        const center = localBounds.getCenter(new THREE.Vector3())
        const body = new CANNON.Body({ mass: 0, material: this.world.physics.materials.items.dummy })
        body.position.copy(mesh.position)
        body.quaternion.copy(mesh.quaternion)
        body.addShape(new CANNON.Box(new CANNON.Vec3(
            Math.max(size.x / 2, 0.02), Math.max(size.y / 2, 0.02), Math.max(size.z / 2, 0.02),
        )), new CANNON.Vec3(center.x, center.y, center.z))
        this.world.physics.world.addBody(body)
        this._collisions.push({ body })
        mesh.updateMatrixWorld(true)
        const bounds = new THREE.Box3().setFromObject(mesh)
        this.props.push({ mesh, body, bounds })
    }

    dispose() {
        const physics = this.world.physics
        for (const c of this._collisions) {
            if (c.body) physics.world.removeBody(c.body)
            if (c.model && c.model.container && c.model.container.parent) c.model.container.parent.remove(c.model.container)
        }
        this._collisions.length = 0
        this._aabb = []
        this.occluders.length = 0
        this.props.length = 0
        for (const geometry of this.ownedGeometries) geometry.dispose()
        for (const material of this.ownedMaterials) material.dispose()
        this.ownedGeometries.clear(); this.ownedMaterials.clear()
        for (const c of [...this.container.children]) this.container.remove(c)
    }

    // ponto sobre uma rua (linha de rolamento), fora dos prédios
    randomSpawnPoint(rng, { minDistFrom = null, minDist = 0, maxDist = Infinity } = {}) {
        const lines = this.walkableLines.filter(l => Math.abs(l.at) < this.half - 3)
        let fallback = null
        for (let tries = 0; tries < 240; tries++) {
            const l = lines[Math.floor(rng() * lines.length)]
            const along = -this.half + rng() * this.half * 2
            const off = (rng() - 0.5) * (this.roadWidth * 0.5)
            const x = l.axis === 'x' ? l.at + off : along
            const y = l.axis === 'x' ? along : l.at + off
            if (!this.isWalkable(x, y)) continue
            const distance = minDistFrom ? Math.hypot(x - minDistFrom.x, y - minDistFrom.y) : 0
            if (minDistFrom && distance < minDist) continue
            fallback = { x, y }
            if (distance > maxDist) continue
            return { x, y }
        }
        return fallback || { x: lines[0].at, y: lines[0].at }
    }

    isWalkable(x, y, radius = 0.5) {
        if (Math.abs(x) > this.half - 3 - radius || Math.abs(y) > this.half - 3 - radius) return false
        if (this.props.some(({ bounds }) => x > bounds.min.x - radius && x < bounds.max.x + radius && y > bounds.min.y - radius && y < bounds.max.y + radius)) return false
        return !(this._aabb || []).some(b => Math.abs(x - b.x) < b.hw + radius && Math.abs(y - b.y) < b.hd + radius)
    }

    moveActor(position, direction, distance) {
        const x = position.x + direction.x * distance, y = position.y + direction.y * distance
        if (this.isWalkable(x, y)) { position.x = x; position.y = y }
        else if (this.isWalkable(x, position.y)) position.x = x
        else if (this.isWalkable(position.x, y)) position.y = y
    }

    clearPath(from, to) {
        const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y))
        for (let i = 1; i <= steps; i++) {
            const t = i / steps
            if (!this.isWalkable(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)) return false
        }
        return true
    }

    // Tiny road graph: route around blocks instead of accumulating inside walls.
    findPath(from, to) {
        if (this.clearPath(from, to)) return [{ x: to.x, y: to.y }]
        const coords = this.roadCoords.filter(c => Math.abs(c) < this.half - 3)
        const nodes = [{ x: from.x, y: from.y }, { x: to.x, y: to.y }]
        for (const x of coords) for (const y of coords) nodes.push({ x, y })
        const distances = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set()
        distances[0] = 0
        for (let step = 0; step < nodes.length; step++) {
            let current = -1
            for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || distances[i] < distances[current])) current = i
            if (current < 0 || !Number.isFinite(distances[current])) break
            if (current === 1) {
                const path = []
                for (let n = 1; n !== 0; n = previous[n]) path.unshift(nodes[n])
                return path
            }
            visited.add(current)
            for (let next = 0; next < nodes.length; next++) {
                if (visited.has(next)) continue
                const a = nodes[current], b = nodes[next]
                if (current > 1 && next > 1 && a.x !== b.x && a.y !== b.y) continue
                const distance = distances[current] + Math.hypot(a.x - b.x, a.y - b.y)
                if (distance >= distances[next] || !this.clearPath(a, b)) continue
                distances[next] = distance; previous[next] = current
            }
        }
        return []
    }

    chaseDirection(actor, position, target, now, direction) {
        if (!actor.path || now > actor.nextPath) {
            actor.path = this.findPath(position, target)
            actor.nextPath = now + 1100 + Math.random() * 600
        }
        if (actor.path.length && Math.hypot(position.x - actor.path[0].x, position.y - actor.path[0].y) < 0.8) actor.path.shift()
        const waypoint = actor.path[0] || position
        direction.set(waypoint.x - position.x, waypoint.y - position.y, 0).normalize()
        return direction
    }

    pickHiddenSpot(rng, fromPoint, hideDepth) {
        let best = null, bestScore = -1
        for (let i = 0; i < 40; i++) {
            const p = this.randomSpawnPoint(rng, { minDistFrom: fromPoint, minDist: 20 + hideDepth * 10 })
            const d = Math.hypot(p.x - fromPoint.x, p.y - fromPoint.y)
            if (d > bestScore) { bestScore = d; best = p }
        }
        return best || { x: 0, y: 0 }
    }
}
