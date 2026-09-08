import * as THREE from 'three'

// Fade only scenery between the camera and a padded volume around the player.
export default class OcclusionController {
    constructor() {
        this.items = []
        this.ray = new THREE.Ray()
        this.hit = new THREE.Vector3()
        this.target = new THREE.Vector3()
    }

    setMeshes(meshes) {
        this.clear()
        for (const mesh of meshes) {
            const original = mesh.material
            const material = original.clone()
            // Preserve live theme/reveal uniforms, but give each wall its own alpha.
            if (material.uniforms) material.uniforms = { ...original.uniforms, opacity: { value: 1 } }
            mesh.material = material
            mesh.updateWorldMatrix(true, false)
            this.items.push({ mesh, original, material, box: new THREE.Box3().setFromObject(mesh).expandByScalar(1.4), alpha: 1 })
        }
    }

    update(dt, camera, player) {
        this.target.copy(player).add(new THREE.Vector3(0, 0, 0.8))
        this.ray.origin.copy(camera.position)
        this.ray.direction.subVectors(this.target, camera.position).normalize()
        const distance = camera.position.distanceTo(this.target)
        const ease = 1 - Math.exp(-Math.min(dt, 100) / 70)
        for (const item of this.items) {
            const intersection = this.ray.intersectBox(item.box, this.hit)
            const blocked = item.box.containsPoint(camera.position) || (intersection && camera.position.distanceTo(this.hit) < distance)
            const target = blocked ? 0.12 : 1
            item.alpha += (target - item.alpha) * ease
            if (Math.abs(item.alpha - target) < 0.005) item.alpha = target
            const transparent = item.alpha < 1
            if (item.material.transparent !== transparent) {
                item.material.transparent = transparent
                item.material.depthWrite = !transparent
                item.material.needsUpdate = true
            }
            item.material.opacity = item.alpha
            if (item.material.uniforms?.opacity) item.material.uniforms.opacity.value = item.alpha
        }
    }

    clear() {
        for (const item of this.items) { item.mesh.material = item.original; item.material.dispose() }
        this.items.length = 0
    }
}
