import '@fontsource/orbitron/500.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/orbitron/900.css'
import '@fontsource/rajdhani/400.css'
import '@fontsource/rajdhani/500.css'
import '@fontsource/rajdhani/700.css'
import './style/main.css'
import './style/portfolio.css'
import './style/game.css'
import Portfolio from './javascript/portfolio/Portfolio.js'
    const portfolio = new Portfolio()
    window.portfolio = portfolio
try {
    const {default:Application}=await import('./javascript/Application.js')
    window.application=new Application({$canvas:document.querySelector('.js-canvas')})
    portfolio.attach(window.application)

    // Modo Zumbi (expansão do jogo). Criado sob demanda para não pesar no portfólio.
    const {default:GameManager}=await import('./javascript/game/GameManager.js')
    const game=new GameManager(window.application)
    window.application.time.on('tick',()=>game.update(window.application.time.delta,performance.now()))
    window.golZombie={
        game,
        async enter(){
            const w=window.application.world
            if(!w.physics){ w.start() } // garante física/carro
            if(w.reveal && w.reveal.matcapsProgress<1) w.reveal.go()
            await game.enter()
        },
        exit(){ game.exit() },
    }
    document.querySelectorAll('[data-zombie-mode]').forEach((b)=>b.addEventListener('click',()=>window.golZombie.enter()))
} catch(error) {
    console.error('Não foi possível iniciar o mundo 3D.',error)
    portfolio.fail()
}
