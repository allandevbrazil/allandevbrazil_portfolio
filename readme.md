# 🚗💨 ALLAN SELEGUIM — Portfólio Interativo 3D

> **Um currículo que não se lê — se *explora*.** 🕹️ Dirija um VW Gol rosa-neon por um mundo 3D e visite minha trajetória… ou encare o apocalipse zumbi no modo **☣ Gol Zumbi Escape**.

<p align="center">
  <a href="https://allandevbrazil.github.io/allandevbrazil_portfolio/"><img src="https://img.shields.io/badge/Site_ao_vivo-GitHub_Pages-7c3aed?style=for-the-badge&logo=github&logoColor=white" alt="Site ao vivo no GitHub Pages"></a>
  <img src="https://img.shields.io/badge/Three.js-r164-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js r164">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/Node-22.12%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 22.12+">
  <img src="https://img.shields.io/badge/WebGL-GLSL-E34F26?style=for-the-badge" alt="WebGL + GLSL">
  <img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow?style=for-the-badge" alt="Licença MIT">
</p>

👋 **Allan Seleguim** · Engenheiro de Software Sênior e Analista de Sistemas · Sorocaba, SP 🇧🇷 · [GitHub](https://github.com/allandevbrazil) · [LinkedIn](https://linkedin.com/in/allan-seleguim)

---

## 🧭 Sumário

- [🎮 Jogue agora](#jogue-agora)
- [✨ Destaques](#destaques)
- [🎯 Controles](#controles)
- [🧟 Modo Zumbi — Gol Zumbi Escape](#modo-zumbi)
- [🛠️ Stack e bibliotecas](#stack)
- [🏗️ Arquitetura e decisões](#arquitetura)
- [🧊 Modelagem 3D e assets](#modelagem-3d)
- [📂 Estrutura do projeto](#estrutura)
- [🚀 Como rodar](#como-rodar)
- [📦 Publicar no GitHub Pages](#publicar)
- [🔗 Links](#links)
- [📜 Licença e créditos](#licenca)

---

## <a id="jogue-agora"></a>🎮 Jogue agora

🔗 **https://allandevbrazil.github.io/allandevbrazil_portfolio/**

Um portfólio interativo construído 100% em **Three.js + WebGL** (com fallback acessível sem WebGL): cada área do mundo é uma seção do currículo — **Sobre**, **Skills**, **Experiência**, **Educação** e **Projetos** — e ainda existe um **modo zumbi completo** escondido no botão **☣ Modo Zumbi**.

---

## <a id="destaques"></a>✨ Destaques

| | |
|---|---|
| 🌍 **Mundo 3D dirigível** | Dirija um **VW Gol** (pintura rosa-neon) por uma cidade synthwave para visitar as seções do currículo |
| 🧟 **Modo Zumbi completo** | Mini-game *Gol Zumbi Escape*: 5 fases, hordas, power-ups, monstros e cutscene de fuga |
| 📋 **Painel de currículo acessível** | `<dialog>` nativo, navegação por teclado, `aria-live` e **fallback total sem WebGL** |
| 💼 **Projetos reais** | 7 projetos com repositório no GitHub (alguns com demo), filtros por categoria e covers geradas |
| 🎨 **Pós-processamento em GLSL** | Shaders customizados: chão com brilho, matcap neon, blur e glows |
| 🔊 **Imersão sonora** | Trilha ambiente via WebAudio, efeitos de motor, sons das fases CC0 e botão de pausa |
| 📱 **Responsivo** | Controles *touch* no celular, pixel ratio adaptativo e layout para desktop |
| ♿ **Acessibilidade** | `prefers-reduced-motion`, `aria` labels, foco visível e currículo completo sem mouse |
| 🧪 **Testado por automação** | Scripts de regressão com **Puppeteer** validam áudio, fluxo do jogo e telas |

---

## <a id="controles"></a>🎯 Controles

| Ação | Teclado | Touch |
|---|---|---|
| 🏎️ Acelerar / ré | `W` `A` `S` `D` ou `↑ ← ↓ →` | Setas na tela |
| ⚡ Turbo | `Shift` | Botão turbo |
| 🧭 Reposicionar o carro | `R` | Botão 🔄 |

> 💡 Dica: no modo zumbi, **atropelar em velocidade** elimina zumbis; encostar devagar custa vida!

## <a id="modo-zumbi"></a>🧟 Modo Zumbi — Gol Zumbi Escape

Uma expansão *arcade* que **reusa o mesmo motor 3D do portfólio** (carro, física, câmera e materiais) para virar um jogo de sobrevivência:

- 🗓️ **5 fases** com **3 minutos** cada — a dificuldade, o tamanho das hordas e o perigo crescem até o clímax.
- 💎 **Colete 10 cristais** por fase e encontre a **esmeralda escondida** para escapar.
- ✨ **7 cristais com efeitos**: TURBO, ESCUDO, INVENCÍVEL, CURA e IMPACTO… e as armadilhas LENTO e **INVERTIDO** (controles invertidos!).
- 🧟 **Zumbis lentos ("shamblers")**, mas em hordas: atropelar em alta velocidade elimina, encostar devagar custa vida.
- 👾 **Monstros raros** (morcego, aranha gigante e rato — modelos CC0 de Quaternius) valem bônus gordo.
- 🌆 **Cidade procedural** sorteada por *seed* em **8 biomas** (comercial, noturna, contaminada, militar, pós-apocalíptica…), cada um com paleta, névoa, brilho e música próprios.
- 📡 **Radar de objetivo**, HUD com HP/tempo, sistema de **combos**, recorde salvo em `localStorage` e easter eggs.
- 🎬 **Cutscene de fuga** + tela YOU WIN ao completar as 5 fases.

> ⚙️ Toda a calibração do jogo (dano, velocidades, pontuação, curva de dificuldade, biomas) vive em um único arquivo de configuração — **nada de número "mágico" espalhado no código**.

---

## <a id="stack"></a>🛠️ Stack e bibliotecas

| Biblioteca | Papel no projeto |
|---|---|
| [Three.js](https://threejs.org/) `r164` | Renderização WebGL do mundo 3D, câmera, modelos GLB/FBX e pós-processamento |
| [Cannon.js](https://github.com/schteppe/cannon.js) | Física do carro (gravidade, colisões) com **passos fixos** para não atravessar obstáculos |
| **GLSL** + [`vite-plugin-glsl`](https://www.npmjs.com/package/vite-plugin-glsl) | Shaders customizados em `src/shaders/`: chão, sombras, matcap neon, blur e glows |
| [GSAP](https://gsap.com/) | Animações da UI/transições do painel e partículas flutuantes |
| [Howler.js](https://howlerjs.com/) | Efeitos sonoros do mundo e do modo zumbi |
| [WebAudio API](https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Audio_API) | Música ambiente do portfólio e "blips" de alerta gerados proceduralmente |
| [dat.GUI](https://github.com/dataarts/dat.gui) | Painel de debug (habilite com `#debug` na URL) |
| [Vite](https://vite.dev/) 8 | Build e dev server — `base: './'` para funcionar em subpasta do GitHub Pages |
| `@fontsource/orbitron` + `@fontsource/rajdhani` | Tipografia **self-hosted** (sem depender de CDN) |
| Puppeteer-core *(dev)* | Testes automatizados de regressão em `scripts/` |
| **Python** (`pygltflib`, `trimesh`, `PIL`) | Pipelines de modelagem e adaptação de assets 3D (fora do build) |

---

## <a id="arquitetura"></a>🏗️ Arquitetura e decisões

O projeto nasceu como um **portfólio dirigível** e cresceu para incluir um **jogo completo** sem "sujar" a arquitetura. As principais decisões:

### 1) 🧩 Composição orientada a eventos
A classe central **`Application`** orquestra tudo: `Time`, `Sizes`, `Renderer`, `Camera`, `Resources` e o `World`. Os módulos trocam mensagens por um **`EventEmitter`** (`time.on('tick')`, `sizes.on('resize')`): o carro, a física e o HUD reagem ao mesmo "relógio" sem depender uns dos outros.

### 2) 🖥️ Camada 2D (portfólio) separada do mundo 3D
O painel de currículo (`Portfolio.js`) é **independente do WebGL**: se a cena 3D falhar, o currículo continua 100% navegável. O `data.json` centraliza currículo + projetos e alimenta a UI (SPA sem framework — HTML/CSS/JS puros).

### 3) ⏳ Lazy-loading do jogo
O modo zumbi (`GameManager`) entra via `await import()` **sob demanda**: quem só quer ler o currículo não baixa o jogo inteiro no primeiro carregamento.

### 4) ⚙️ Configuração única de gameplay
`src/javascript/game/config.js` concentra **toda** a calibração (HP, dano, velocidades, cristais, temas, pontuação, curva de dificuldade por fase) — o equivalente a um *ScriptableObject*. Ajustar a dificuldade é editar um número, não caçar valor no meio do código.

### 5) 🔄 Reuso inteligente do motor
Em vez de um jogo à parte, o modo zumbi **reaproveita o motor do portfólio** (carro, física Cannon, câmera, materiais matcap) e só adiciona sistemas novos: cidade procedural, zumbis, cristais, HUD, radar. Ao trocar de fase, o `ProceduralCity.dispose()` remove colisores e modelos antigos para **evitar vazamento de memória**.

### 6) 🧮 Física estável em frames longos
A física roda com **sub-passos fixos de 1/120 s**: mesmo quando um frame demora (até 60 ms), o carro rápido não "atravessa" paredes ou barricadas finas.

### 7) ⚡ Performance e mobile de primeira
- Zumbis fora de alcance ficam **dormentes** (*culling* por distância) e há teto de entidades ativas + LOD.
- Pixel ratio é reduzido em telas *touch* para segurar 60 fps no celular.
- Partículas respeitam `prefers-reduced-motion`.

### 8) 📡 Deploy pensado para GitHub Pages
`base: './'` no Vite gera **caminhos relativos**: tudo funciona no subdiretório `allandevbrazil.github.io/allandevbrazil_portfolio/` sem configuração extra. O deploy publica `dist/` na branch `gh-pages` com um **`.nojekyll`** (evita o pipeline Jekyll e deixa o build do Pages rápido).

---

## <a id="modelagem-3d"></a>🧊 Modelagem 3D e assets

Uma das decisões mais legais do projeto: **o carro e os cenários não vieram prontos** — passaram por pipelines próprios de adaptação (Python) para casar com o visual synthwave do motor:

| Asset | Origem | Tratamento |
|---|---|---|
| 🚗 **VW Gol** (chassis) | Hatchback CC0 (Kenney Car Kit) **ou** modelo Sketchfab | Pipeline `scripts/build-gol.py` / `adapt-gol.py`: remapeia eixos (Y-up → Z-up do projeto), escala para **2,4 m**, decima para **≤15 mil faces** e reagrupa peças por cor |
| 🎨 **Pintura rosa-neon** | Material **matcap** próprio (`shadeNeonPink`) | Os scripts classificam os pixels da textura (pintura, vidros, faróis, lanternas) e nomeiam os nós no padrão que o motor espera |
| 🏙️ **Cidade procedural** | Blocos GLB do **City Kit** (Kenney, CC0) | `ProceduralCity` sorteia blocos com **seed determinística** e re-tematiza paleta, névoa e brilho por bioma |
| 🧟 **Zumbis e sobreviventes** | **Animated Characters** (Kenney, CC0) | FBX + texturas, com variação de cor (*tint*) entre os zumbis |
| 👾 **Monstros** (morcego, aranha, rato) | Quaternius (CC0) | Easter eggs raros nas fases avançadas |
| 🔊 **Trilhas** | OpenGameArt (CC0) | *Midnight Drive*, *Battle RPG* e *Victory Loop* escolhidas por momento do jogo |
| 🔤 **Fontes** | Google Fonts (OFL) | Orbitron (títulos) + Rajdhani (texto), self-hosted via Fontsource |

> 📄 **Autores, licenças e URLs de cada asset estão detalhados em [`CREDITS.md`](CREDITS.md).**

---

## <a id="estrutura"></a>📂 Estrutura do projeto

```
.
├─ src/                          # código-fonte (raiz do Vite)
│  ├─ index.html                 # interface, metatags e acessibilidade (pt-BR)
│  ├─ index.js                   # bootstrap: Portfolio + Application + GameManager (lazy)
│  ├─ style/                     # CSS do portfólio e do jogo
│  ├─ shaders/                   # GLSL custom (chão, matcap, blur, glows…)
│  └─ javascript/
│     ├─ Application.js          # orquestrador (renderer, câmera, passes, world)
│     ├─ World/                  # carro, física, zonas/áreas, seções e materiais
│     ├─ game/                   # 🧟 modo zumbi (cidade, zumbis, cristais, HUD…)
│     ├─ portfolio/              # painel 2D, data.json, partículas, textos da cena
│     ├─ Materials/ Geometries/  # materiais matcap e geometrias customizadas
│     ├─ Passes/                 # pós-processamento (blur, glows)
│     └─ Utils/                  # EventEmitter, Time, Sizes, Loader
├─ static/                       # assets públicos (modelos, sons, banners, .htaccess)
├─ scripts/                      # pipelines Python de 3D + testes Puppeteer
├─ scripts/deploy-gh-pages.ps1   # 🚀 publica dist/ na branch gh-pages
├─ CREDITS.md                    # créditos e licenças dos assets
└─ package.json
```

---

## <a id="como-rodar"></a>🚀 Como rodar

Pré-requisito: [Node.js](https://nodejs.org/) **22.12+** e `npm`.

```bash
# 1. Instalar dependências
npm install

# 2. Ambiente de desenvolvimento (http://127.0.0.1:5173)
npm run dev

# 3. Build de produção (gera dist/)
npm run build

# 4. Pré-visualizar o build localmente
npm run preview
```

Extras de desenvolvimento:

```bash
# Painel de debug (dat.GUI) → abra http://127.0.0.1:5173/#debug
# Veículo alternativo p/ comparação → abra http://127.0.0.1:5173/#cybertruck
```

---

## <a id="publicar"></a>📦 Publicar no GitHub Pages

O GitHub Pages já está **configurado no repositório** para servir a branch **`gh-pages`**. Para publicar uma nova versão:

```powershell
# Build + publica dist/ na branch gh-pages
powershell -ExecutionPolicy Bypass -File scripts\deploy-gh-pages.ps1

# Ou, se o dist/ já estiver atualizado, só publica:
powershell -ExecutionPolicy Bypass -File scripts\deploy-gh-pages.ps1 -SkipBuild
```

O script:
1. roda `npm run build`;
2. adiciona o arquivo **`.nojekyll`** (publica os estáticos **sem o Jekyll** do GitHub — essencial para builds rápidos em repositórios grandes como este);
3. faz commit e **force-push** de `dist/` para `gh-pages`.

🌐 O resultado fica em **https://allandevbrazil.github.io/allandevbrazil_portfolio/**

---

## <a id="links"></a>🔗 Links

| O quê | Onde |
|---|---|
| 🌐 **Site ao vivo** | https://allandevbrazil.github.io/allandevbrazil_portfolio/ |
| 📦 Este repositório | https://github.com/allandevbrazil/allandevbrazil_portfolio |
| 👤 GitHub | https://github.com/allandevbrazil |
| 💼 LinkedIn | https://linkedin.com/in/allan-seleguim |
| ✉️ Contato | seleguimstudio@gmail.com |

---

## <a id="licenca"></a>📜 Licença e créditos

- Código sob licença **MIT** — veja [`license.md`](license.md).
- Assets externos (modelos, sons e fontes) possuem licenças próprias — veja [`CREDITS.md`](CREDITS.md).

---

<p align="center">🚗 Feito com ☕, Three.js e um Gol rosa-neon · <b>Allan Seleguim</b> © 2026</p>

