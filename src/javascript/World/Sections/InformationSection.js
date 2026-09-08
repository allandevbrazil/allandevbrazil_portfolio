import * as THREE from 'three'
import { floorLabel } from '../../portfolio/sceneText.js'
export default class InformationSection {
    constructor(options) {
        Object.assign(this, options)
        this.container = new THREE.Group()
        this.container.add(floorLabel(['SOBRE MIM', '18+ ANOS CONSTRUINDO SOLUÇÕES'],18,5,this.x,this.y+6))
        this.container.add(floorLabel(['ARQUITETURA • WEB • MOBILE • IA', 'SOROCABA, SÃO PAULO, BRASIL'],18,4,this.x,this.y))
        const links = [['GITHUB','https://github.com/allandevbrazil'],['LINKEDIN','https://linkedin.com/in/allan-seleguim'],['E-MAIL','mailto:seleguimstudio@gmail.com']]
        links.forEach(([label,url],i) => {
            const x = this.x - 6 + i*6, y = this.y-6
            this.container.add(floorLabel([label],5,1.5,x,y-2))
            const area = this.areas.add({position:new THREE.Vector2(x,y),halfExtents:new THREE.Vector2(2,1)})
            area.on('interact',() => window.open(url,'_blank','noopener,noreferrer'))
        })
        this.tiles.add({start:new THREE.Vector2(this.x,this.y+13),delta:new THREE.Vector2(0,-8)})
    }
}
