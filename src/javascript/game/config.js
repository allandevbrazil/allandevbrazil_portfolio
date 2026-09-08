// Fonte única de configuração do Modo Zumbi (equivalente a ScriptableObjects).
// Nenhum valor de gameplay deve ser "mágico" espalhado: tudo aqui.

export const GAME = {
    totalLevels: 5, // última fase é o clímax; após completá-la -> cutscene + YOU WIN
    levelDuration: 180, // 3 minutos por fase (segundos)
    tensionSeconds: 30, // últimos N segundos -> alerta visual/sonoro
    requiredCrystals: 10,
    emeraldsPerLevel: 1,
}

export const PLAYER = {
    maxHp: 100,
    iFramesMs: 800, // invulnerabilidade após levar hit (evita dano absurdo por frame)
    zombieContactDamage: 12, // dano por mordida quando o carro está lento/parado
    contactRange: 1.6, // distância (mundo) para "tocar" um zumbi
    runOverMinSpeed: 0.012, // acima disso => atropelamento (elimina) em vez de dano
    respawnHpPerLevel: true,
}

// Cristais: cada cor => efeito obrigatório. Todos contam para o objetivo de 10.
export const CRYSTALS = [
    { id: 'verde', color: 0x39ff14, hex: '#39ff14', name: 'TURBO', kind: 'buff', effect: 'speed', duration: 6000, desc: 'Velocidade +50%' },
    { id: 'azul', color: 0x2e9bff, hex: '#2e9bff', name: 'ESCUDO', kind: 'buff', effect: 'shield', duration: 8000, desc: 'Imune a mordidas' },
    { id: 'amarelo', color: 0xffe600, hex: '#ffe600', name: 'INVENCÍVEL', kind: 'buff', effect: 'invincible', duration: 5000, desc: 'Invencibilidade' },
    { id: 'vermelho', color: 0xff2e4d, hex: '#ff2e4d', name: 'LENTO', kind: 'debuff', effect: 'slow', duration: 5000, desc: 'Velocidade -40%' },
    { id: 'roxo', color: 0xb14bff, hex: '#b14bff', name: 'INVERTIDO', kind: 'debuff', effect: 'invert', duration: 6000, desc: 'Controles invertidos' },
    { id: 'ciano', color: 0x00f0ff, hex: '#00f0ff', name: 'CURA', kind: 'buff', effect: 'heal', duration: 0, desc: '+30 de HP' },
    { id: 'laranja', color: 0xff8c1a, hex: '#ff8c1a', name: 'IMPACTO', kind: 'buff', effect: 'impact', duration: 7000, desc: 'Atropelamento mais forte' },
]

export const POWERUP = {
    speedMultiplier: 1.5,
    slowMultiplier: 0.6,
    healAmount: 30,
    impactKnockback: 2.2, // multiplicador de arremesso ao atropelar com buff laranja
}

// Pontuação centralizada (nunca hardcoded no código de gameplay).
export const SCORE = {
    zombieHit: 100,
    monsterKill: 1000,
    crystal: 250,
    emerald: 2500,
    levelComplete: 5000,
    fastBonusPerSecondLeft: 20, // bônus por segundo restante ao completar
    hpBonusPerHp: 15, // bônus por HP restante ao completar
    easterEgg: 500,
    comboWindowMs: 1500, // janela para encadear combos de atropelamento
}

// Curva de dificuldade por fase (1-based). Tudo cresce até o clímax.
export function difficultyForLevel(level, total) {
    const t = total <= 1 ? 1 : (level - 1) / (total - 1) // 0..1
    return {
        t,
        zombieCount: Math.round(48 + t * 48), // população reposta durante a fase
        hordeInterval: 7000 - t * 2000,
        hordeSize: Math.round(10 + t * 8),
        monsterCount: Math.round(6 + t * 6),
        zombieSpeed: 0.0016 + t * 0.0014, // lerdo (shambler): ~1.5..3 unidades/s (carro ~9/s)
        zombieDamage: 8 + t * 8,
        crystalCount: GAME.requiredCrystals + Math.round(6 + t * 8), // spawns a mais (escolha/risco)
        monsterChance: 0.25 + t * 0.5, // chance de aparecer monstro raro nesta fase
        maxHp: Math.max(60, 100 - Math.round(t * 30)), // menos HP disponível nas fases finais
        emeraldHideDepth: 1 + Math.round(t * 3), // quão "escondida" (anéis de busca)
    }
}

// Temas/biomas: cada fase sorteia um visual+áudio diferente (paleta, céu, névoa, música).
export const THEMES = [
    { id: 'cidade-comercial', name: 'Cidade Comercial Abandonada', floor: ['#2c0a52', '#47106b', '#12042e', '#1f0745'], indirect: '#12b6d8', shadow: '#ff2e88', glow: '#ff6ec7', fog: '#1a0533', sky: '#0d0221', music: 'midnight-drive.ogg' },
    { id: 'cidade-noturna', name: 'Cidade Noturna', floor: ['#05010f', '#0a0420', '#02000a', '#070214'], indirect: '#3b6cff', shadow: '#7b2ff7', glow: '#8a5cff', fog: '#05010f', sky: '#02000a', music: 'midnight-drive.ogg' },
    { id: 'contaminada', name: 'Zona Contaminada', floor: ['#0a2a12', '#144d1f', '#051a0a', '#0d3315'], indirect: '#7cff3b', shadow: '#39ff14', glow: '#a6ff4d', fog: '#0a2a12', sky: '#04140a', music: 'midnight-drive.ogg' },
    { id: 'industrial', name: 'Zona Industrial', floor: ['#241a12', '#3d2a17', '#120a06', '#2a1c10'], indirect: '#ff9d3b', shadow: '#ff6a00', glow: '#ffb066', fog: '#1a120a', sky: '#0d0805', music: 'midnight-drive.ogg' },
    { id: 'neblina', name: 'Cidade com Neblina', floor: ['#1b1b2a', '#2a2a44', '#101018', '#161624'], indirect: '#cfd6ff', shadow: '#8892c9', glow: '#c9d2ff', fog: '#20203a', sky: '#101018', music: 'midnight-drive.ogg' },
    { id: 'militar', name: 'Área Militar', floor: ['#1a1f12', '#2f3a1f', '#0d1008', '#222a16'], indirect: '#b6ff5a', shadow: '#ff2e88', glow: '#d0ff6a', fog: '#12160c', sky: '#0a0d06', music: 'midnight-drive.ogg' },
    { id: 'monstruosa', name: 'Ambiente Monstruoso', floor: ['#2a0524', '#4a0a3f', '#160213', '#33062c'], indirect: '#ff2ea6', shadow: '#b14bff', glow: '#ff6ec7', fog: '#2a0524', sky: '#160213', music: 'midnight-drive.ogg' },
    { id: 'pos-apocaliptica', name: 'Cidade Pós-Apocalíptica', floor: ['#241028', '#3a1a40', '#120616', '#2a1230'], indirect: '#ff8c42', shadow: '#ff2e88', glow: '#ff9d5c', fog: '#1a0c1e', sky: '#0d0512', music: 'midnight-drive.ogg' },
]

// Paleta de zumbis (variação de cor por fase/tipo).
export const ZOMBIE_TINTS = [0x6a8f3c, 0x4f7a5a, 0x7a6a4f, 0x556b7a, 0x8f5a6a, 0x6a5a8f]

// Limites de performance.
export const PERF = {
    maxActiveZombies: 120,
    cullDistance: 70, // zumbis além disso ficam dormentes (não atualizam AI)
    despawnDistance: 95,
    respawnDistance: 80, // re-spawn de zumbis distantes perto do jogador
    lodDistance: 45,
}
