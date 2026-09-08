import profile from './data.json'
import { Howler } from 'howler'
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const external = (url,label) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`
const tags = values => `<div class="tags">${values.map(v=>`<span>${escape(v)}</span>`).join('')}</div>`
export default class Portfolio {
    constructor() {
        this.musicOn = true
        this.zombieAudioSuspended = false
        this.dialog = document.querySelector('dialog')
        this.content = document.querySelector('#panel-content')
        document.querySelector('#year').textContent = new Date().getFullYear()
        const count = document.querySelector('nav button[data-section="projetos"] span')
        if(count) count.textContent = String(profile.allProjects.length).padStart(2, '0')
        document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click',()=>this.open(button.dataset.section)))
        document.querySelector('#close-panel').addEventListener('click',()=>this.dialog.close())
        this.dialog.addEventListener('click',event=>{if(event.target===this.dialog){const r=this.dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)this.dialog.close()}})
        document.querySelector('#home').addEventListener('click',()=>this.home())
        document.querySelector('.brand').addEventListener('click',()=>this.home())
        document.querySelector('#reset').addEventListener('click',()=>this.app?.world.controls.trigger('action',['reset']))
        document.querySelector('#music').addEventListener('click',()=>this.toggleMusic())
        document.querySelector('#effects').addEventListener('click',()=>{
            if(!this.app) return
            this.app.world.sounds.muted = !this.app.world.sounds.muted
            Howler.mute(this.app.world.sounds.muted)
            this.updateEffects()
        })
        window.addEventListener('keydown',()=>queueMicrotask(()=>this.updateEffects()))
        document.addEventListener('visibilitychange',()=>{if(!this.music)return;document.hidden?this.music.pause():this.startAudio()})
        // Retry autoplay on real interaction without overriding manual mute choices.
        document.addEventListener('click',()=>this.startAudio())
        document.addEventListener('keydown',()=>this.startAudio())
        this.dialog.addEventListener('close',()=>this.clearControls())
        window.addEventListener('blur',()=>this.clearControls())
        const panel = new URLSearchParams(location.search).get('panel')
        if(panel && ['sobre','skills','experiencia','educacao','projetos'].includes(panel)) requestAnimationFrame(()=>this.open(panel))
    }
    attach(app) {
        this.app=app
        app.world.sounds.muted=false; Howler.mute(false)
        this.music = new Audio('./sounds/music/midnight-drive.ogg')
        this.music.loop = true
        this.music.volume = 0.45
        this.updateMusic()
        this.startAudio()
        this.updateEffects()
        app.resources.on('progress',p=>{document.querySelector('#progress').textContent=`${Math.round(p*100)}%`})
        app.resources.on('ready',()=>{
            this.ready=true
            const button=document.querySelector('#explore');button.disabled=false;button.innerHTML='Explorar o mundo <span>→</span>'
            // Preview the world behind the introduction.
            app.world.startingScreen.area.trigger('interact')
            app.camera.target.x=0
        })
        app.resources.loader.on('error',()=>this.fail())
        document.querySelector('#explore').addEventListener('click',()=>{
            if(!this.ready)return
            document.body.classList.add('playing')
            document.querySelector('.game-tools').hidden=false
            this.clearControls()
            document.querySelector('.js-canvas').focus()
            app.sizes.trigger('resize')
            if(matchMedia('(pointer:coarse)').matches && !app.world.controls.touch)app.world.controls.setTouch()
            app.world.controls.touch?.reveal()
            this.announce('Mundo pronto. Use as setas ou WASD para dirigir. No celular, use os controles na tela.')
        })
        setTimeout(()=>{if(!this.ready)this.fail()},30000)
    }
    home() {document.body.classList.remove('playing');document.querySelector('.game-tools').hidden=true;this.clearControls();this.app?.world.controls.trigger('action',['reset'])}
    clearControls(){if(this.app)Object.keys(this.app.world.controls.actions).forEach(k=>this.app.world.controls.actions[k]=false)}
    announce(text){document.querySelector('#status').textContent=text}
    fail(){document.querySelector('#explore').textContent='Mundo 3D indisponível';document.querySelector('#explore').disabled=true;document.querySelector('.hint').textContent='Você ainda pode explorar o currículo e os projetos pelo menu.'}
    updateEffects(){const button=document.querySelector('#effects');const on=this.app&&!this.app.world.sounds.muted;button.setAttribute('aria-pressed',String(!!on));button.textContent=on?'Efeitos ligados':'Efeitos desligados'}
    startAudio(){
        if(this.zombieAudioSuspended || document.hidden) return
        if(this.app && !this.app.world.sounds.muted && Howler.ctx?.state === 'suspended') Howler.ctx.resume().catch(()=>{})
        if(this.musicOn && this.music?.paused) this.music.play().catch(()=>{})
    }
    updateMusic(){
        const button = document.querySelector('#music')
        button.setAttribute('aria-pressed', String(this.musicOn))
        button.textContent = this.musicOn ? '♫ Música ligada' : '♫ Música desligada'
    }
    toggleMusic(){
        this.musicOn = !this.musicOn
        this.musicOn ? this.startAudio() : this.music?.pause()
        this.updateMusic()
    }
    suspendAudio(suspended){
        this.zombieAudioSuspended = suspended
        suspended ? this.music?.pause() : this.startAudio()
    }
    open(section) {
        this.clearControls()
        document.querySelectorAll('.panel-nav button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.section===section)))
        let body=''
        if(section==='sobre')body=`<h2 id="panel-title">Tecnologia com propósito.</h2><p><strong>${profile.role}</strong><br>${profile.location}</p>${profile.summary.map(p=>`<p>${escape(p)}</p>`).join('')}${tags(['Arquitetura de software','Web e mobile','Inteligência artificial','Liderança técnica'])}<p>Português nativo · Inglês avançado (B2)</p><p>Além do código: jogos retrô, hardware de performance, animes e séries.</p><p>${external(profile.source,'Currículo completo no GitHub')}</p>`
        if(section==='skills')body=`<h2 id="panel-title">Tecnologias & competências.</h2><p>Da interface à infraestrutura, ferramentas para construir soluções de ponta a ponta.</p>${Object.entries(profile.skills).map(([name,items])=>`<section class="skill-group"><h3>${escape(name.replace('Frontend & Mobile','Interfaces web e mobile').replace('Backend & Cloud','Backend e nuvem').replace('Data & Cache','dados e cache').replace('&','e'))}</h3>${tags(items)}</section>`).join('')}`
        if(section==='experiencia')body=`<h2 id="panel-title">Uma trajetória em construção.</h2><p>Desde 2008, conectando engenharia, pessoas e produtos. Abra cada experiência para conhecer os detalhes do currículo.</p><div class="timeline">${profile.experience.map((e,i)=>`<details ${i===0?'open':''}><summary>${escape(e.title)}</summary><ul>${e.details.map(d=>`<li>${escape(d)}</li>`).join('')}</ul></details>`).join('')}</div>`
        if(section==='educacao')body=`<h2 id="panel-title">Aprender. Construir. Evoluir.</h2><p>Uma base em engenharia, aprofundada em arquitetura de software, docência e inteligência artificial.</p>${profile.education.map(e=>`<article class="education-item">${escape(e)}</article>`).join('')}`
        if(section==='projetos')body=`<h2 id="panel-title">Ideias que viraram código.</h2><p>Todos os meus projetos públicos. Os ambientes de demonstração utilizam dados fictícios.</p><div class="project-filters" aria-label="Filtrar projetos">${['Todos', ...new Set(profile.allProjects.map(p=>p.category))].map((f,i)=>`<button aria-pressed="${i===0}" data-filter="${f}">${f}</button>`).join('')}</div><div class="project-grid"></div>`
        this.content.innerHTML=body
        if(section==='projetos'){
            this.renderProjects('Todos')
            this.content.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{this.content.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));this.renderProjects(b.dataset.filter)}))
        }
        if(!this.dialog.open)this.dialog.showModal()
        this.dialog.scrollTop=0
    }
    renderProjects(filter){this.content.querySelector('.project-grid').innerHTML=profile.allProjects.filter(p=>filter==='Todos'||p.category===filter).map((p,i)=>`<article class="project-card"><div class="project-art${p.cover?' has-cover':''}"${p.cover?` style="background-image:linear-gradient(180deg,#15073300 55%,#150733e6),url('${p.cover}')"`:''} aria-hidden="true">${p.cover?'':`<span>${escape(p.name.slice(0,2))}<i>↗</i></span>`}<b>${String(i+1).padStart(2,'0')}</b></div><div class="project-body"><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p>${tags(p.stack)}<div class="project-links">${external(p.repository,'Código no GitHub')}${p.demo?external(p.demo,'Abrir projeto'):''}</div></div></article>`).join('')}
}
