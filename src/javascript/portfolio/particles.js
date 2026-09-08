import * as THREE from 'three'
export default function addParticles(app) {
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const count=matchMedia('(pointer:coarse)').matches?35:80
    const positions=new Float32Array(count*3)
    for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*55;positions[i*3+1]=(Math.random()-.5)*55;positions[i*3+2]=1+Math.random()*7}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3))
    const material=new THREE.PointsMaterial({color:'#ffe8bb',size:.055,transparent:true,opacity:.5,depthWrite:false})
    const particles=new THREE.Points(geometry,material);app.scene.add(particles)
    app.time.on('tick',()=>{if(document.hidden)return;particles.position.x=app.camera.target.x;particles.position.y=app.camera.target.y;particles.rotation.z=Math.sin(app.time.elapsed*.00003)*.15})
}
