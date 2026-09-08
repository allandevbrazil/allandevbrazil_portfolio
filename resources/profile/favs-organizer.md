# Favs Organizer

Aplicativo desktop em Electron para organizar favoritos de navegadores Chromium (Chrome, Edge e Brave) de forma local, sem dependência de LLM.

## O que ele faz

1. Detecta navegadores instalados no Windows (perfil `Default`).
2. Lê o arquivo local `Bookmarks` do navegador selecionado.
3. Extrai URLs e busca metadados de cada página com:
   - `axios` para requisições HTTP
   - `cheerio` para parsing do HTML (`<title>`, `meta description`, `og:description`, `og:type`)
4. Classifica os links em pastas com regras heurísticas determinísticas.
5. Cria backup automático do arquivo `Bookmarks`.
6. Sobrescreve a barra de favoritos com a nova organização.

## Arquitetura

### Camadas principais

- `src/main/main.js`
  - Inicialização do Electron
  - Janela principal sem barra de menu

- `src/main/preload.js`
  - Ponte segura IPC (`contextIsolation` habilitado)

- `src/main/ipc.js`
  - Casos de uso expostos para UI:
    - detectar navegadores
    - organizar favoritos

- `src/main/browserProfiles.js`
  - Descoberta dos caminhos dos perfis Chromium no Windows

- `src/main/bookmarks.js`
  - Leitura do JSON de favoritos
  - Extração de links
  - Reescrita da barra de favoritos
  - Backup automático

- `src/main/metadataExtractor.js`
  - Busca metadados das URLs com timeout e fallback

- `src/main/heuristics.js`
  - Regras de pontuação/categorização por palavras-chave, domínio e Open Graph

- `src/main/organizer.js`
  - Orquestração: metadados -> classificação -> estrutura de pastas

- `src/renderer/*`
  - Interface em PT-BR
  - Modal de resultado/erro
  - Fluxo único de operação

## Fluxo de uso

1. Abrir o app.
2. Clicar em **Detectar Navegadores**.
3. Escolher o navegador alvo.
4. Clicar em **Extrair Metadados e Organizar**.
5. Confirmar o resultado no modal:
   - quantas URLs foram organizadas
   - em quantas pastas
   - quantos fallbacks ocorreram

## Requisitos

- Windows
- Node.js 18+
- Navegador Chromium com perfil `Default`

## Como rodar localmente

```bash
npm install
npm run dev
```

## Testes

```bash
npm run test
```

## Empacotar instalador (Windows)

```bash
npm run package
```

Saída esperada em `dist/`.

## Segurança e confiabilidade

- Não usa chave de API.
- Não envia favoritos para serviços externos de IA.
- Cria backup antes de qualquer modificação em `Bookmarks`.
- Em caso de falha de scraping, usa fallback por domínio/título.

## Limitações atuais

- Suporte inicial ao perfil `Default` dos navegadores Chromium.
- Alguns sites podem bloquear scraping direto ou retornar pouco metadado.
- Sem preview visual das pastas antes da escrita (pode ser adicionado depois).

## Próximas melhorias sugeridas

- Seletor de perfil do navegador (`Default`, `Profile 1`, etc.).
- Cache local de metadados para execuções mais rápidas.
- Modo de pré-visualização (dry-run) antes de sobrescrever.
