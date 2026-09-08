# ⚔️ Freesworder — Portal Admin para Freelancers

[![Ver online](https://img.shields.io/badge/Ver-online-2ea44f?style=for-the-badge&logo=github)](https://allandevbrazil.github.io/freesworder/)

> **Portal Admin** exclusivo para profissionais freelancers gerenciarem seus negócios: clientes, projetos, faturas, produtos/serviços e tarefas — em um só painel.

## Sobre

O **Freesworder** é um painel administrativo completo para freelancers que precisam organizar a operação do próprio negócio. Construído como SPA em **React + TypeScript + Vite + Tailwind CSS**, com recursos de IA (Gemini) para auxiliar no dia a dia do gestor.

### Funcionalidades

- 🔐 **Autenticação** — login, cadastro e recuperação de senha
- 📊 **Dashboard** — cards de projetos ativos, faturas a receber/pagas, meta mensal; top 5 projetos e clientes; gráficos e widgets de gestão
- 👥 **Clientes** — CRUD completo com busca, paginação, importação CSV e botão de envio de mensagem via WhatsApp direto na listagem; perfil com foto/avatar, e-mail, telefone e endereço
- 📁 **Projetos** — CRUD com data prevista de término, imagem de capa e anexos; módulo de tarefas estilo **SCRUM/Kanban** (Backlog → Refinamento → Desenvolvimento → Desenvolvido → Homologação → Produção)
- 🧾 **Faturas** — geração de fatura em **PDF com QR Code PIX**, atrelada a projetos, por **horas** ou **total**; juros de atraso e descontos personalizáveis; status pago/não pago; compartilhamento de link e envio via WhatsApp
- 🛍️ **Produtos & Serviços** — cadastro com valores padrão para reutilização em projetos e faturas
- ⚙️ **Configurações** — personalização da marca (logo, dados do negócio, site, redes sociais, endereço, e-mail, telefone/WhatsApp)

## Stack

- **React 19 + TypeScript + Vite + Tailwind CSS 4**
- **IA:** Google Gemini (`@google/genai`) com API server-side (Express) — a chave fica no servidor, nunca no bundle
- **Deploy:** GitHub Pages (`gh-pages`)

## Como rodar localmente

**Pré-requisitos:** Node.js 18+

```bash
npm install
cp .env.example .env.local    # preencha GEMINI_API_KEY
npm run dev                   # → http://localhost:3000
```

Outros comandos:

```bash
npm run build        # build de produção
npm run build:pages  # build com base para GitHub Pages
npm run deploy       # build + publica na branch gh-pages
npm run lint         # checagem de tipos (tsc --noEmit)
```

## Publicação

O app está publicado em GitHub Pages:

🔗 **https://allandevbrazil.github.io/freesworder/**

Para republicar: `npm run deploy` (publica `dist/` na branch `gh-pages`).

## Estrutura

```
freesworder-admin/
├─ src/                  # componentes, páginas, hooks e tipagens
├─ index.html            # entrada do Vite
├─ vite.config.ts        # config do Vite
├─ metadata.json         # metadados do app (AI Studio)
└─ package.json
```

## Autor

**ALLAN SELEGUIM** — [GitHub](https://github.com/allandevbrazil) · [LinkedIn](https://linkedin.com/in/allan-seleguim)

---

*Projeto de portfólio — dados e marcas fictícios, apenas para fins de demonstração.*
