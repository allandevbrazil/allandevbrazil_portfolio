import * as THREE from 'three'
export function labelTexture(lines) {
    const canvas = document.createElement('canvas')
    canvas.width = 1536; canvas.height = 512
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    lines.forEach((line, i) => {
        ctx.font = `800 ${Math.min(110, 1800 / Math.max(line.length, 1))}px Arial`
        ctx.fillText(line, 768, 256 + (i - (lines.length - 1) / 2) * 135, 1450)
    })
    return new THREE.CanvasTexture(canvas)
}
export function floorLabel(lines, width, height, x, y) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({color: '#e8e6ff', alphaMap: labelTexture(lines), transparent: true, depthWrite: false}))
    mesh.position.set(x, y, 0.03)
    return mesh
}
export function projectImage(project) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0,0,1024,640)
    gradient.addColorStop(0,'#150733'); gradient.addColorStop(1,'#2c0a52')
    ctx.fillStyle = gradient; ctx.fillRect(0,0,1024,640)
    ctx.strokeStyle = '#00f0ff22'; ctx.lineWidth = 1
    for(let i=0;i<1024;i+=64) {ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,640);ctx.stroke()}
    for(let i=0;i<640;i+=64) {ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(1024,i);ctx.stroke()}
    ctx.fillStyle = '#00f0ff'; ctx.font = 'bold 26px Orbitron, Arial'; ctx.fillText('ALLAN SELEGUIM / PROJETOS',60,75)
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 24
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 75px Orbitron, Arial'; ctx.fillText(project.name,60,280,900)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#ff9ad3'; ctx.font = '28px Rajdhani, Arial'; ctx.fillText(project.stack.join(' / '),60,350,900)
    ctx.fillStyle = '#ff2e88'; ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 18; ctx.fillRect(60,460,310,70); ctx.shadowBlur = 0
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px Orbitron, Arial'; ctx.fillText('EXPLORE O CÓDIGO ↗',80,505)
    return canvas.toDataURL('image/png')
}
