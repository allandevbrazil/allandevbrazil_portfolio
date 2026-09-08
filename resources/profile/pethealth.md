<div align="center">

# 🐾 PetHealth

### 🩺 Gestão de Saúde Veterinária para Tutores e Cuidadores

Um pequeno e elegante **frontend** para o cuidado medicamentoso dos seus pets — com agenda de medicamentos, lançamento de administrações, cadastro de pets e relatórios completos. 📋💊

</div>

---

## ✨ Sobre o Projeto

O **PetHealth** nasceu da ideia de simplificar a rotina de quem cuida de animais de estimação: **tutores** e **cuidadores** que precisam acompanhar horários de medicamentos, doses, prazos de tratamento e a evolução do pet — tudo em um só lugar. 🐶🐱🐦

Criado por **ALLAN SELEGUIM** 🧑💻, o projeto é um **frontend autônomo e leve** (React + TypeScript + Vite), com uma experiência visual moderna e focada em usabilidade. Ele permite que o cuidador registre cada pet, cadastre os medicamentos com recorrência e horários, e lance as administrações realizadas com observações e o estado do animal. 👍

> 🎯 **Público-alvo:** tutores de pets, cuidadores profissionais e famílias que precisam organizar a medicação dos seus bichinhos.

---

## 🎨 Ideia do Projeto

O PetHealth resolve um problema real: **ninguém quer depender da memória para lembrar do remédio do pet**. 💊

Com ele você pode:

- 📝 **Cadastrar pets** com espécie, raça, idade, peso, alergias, limitações e fotos;
- 🧾 **Cadastrar medicamentos** ligados ao pet, com dosagem, horários, recorrência e período de tratamento;
- ⏰ **Configurar alertas** de lembrete (pop-up no sistema, e-mail e WhatsApp);
- ✅ **Lançar administrações** de medicamentos, informando horário real, humor do pet e observações;
- 📅 **Acompanhar a agenda** diária e mensal de medicações;
- 📊 **Gerar relatórios** detalhados do histórico de administrações;
- 👥 **Gerenciar usuários e tutores** (Super Admin, Cuidador e Tutor).

---

## 🏗️ Arquitetura e Decisões Internas

### 🧱 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **UI** | ⚛️ React 19 + TypeScript |
| **Build** | ⚡ Vite 6 |
| **Estilo** | 🎨 Tailwind CSS 4 + fontes Plus Jakarta Sans / Inter |
| **Ícones** | 🔤 Material Symbols + Lucide React |
| **Animações** | 🎬 Motion |
| **Servidor local (dev)** | 🚀 Vite (porta 3000) |

### 🗂️ Estrutura de Pastas

```
pethealth/
├── 📄 index.html              # HTML raiz (pt-BR)
├── 📦 package.json            # Scripts e dependências
├── ⚙️ vite.config.ts          # Configuração do Vite (alias @, HMR)
├── 📁 src/
│   ├── 🧠 App.tsx             # Estado global + navegação entre views
│   ├── 🏷️ types.ts           # Tipos/contratos de domínio
│   ├── 📁 components/         # Header, Sidebar, Footer, Modais
│   ├── 📁 views/              # Dashboard, Pets, Medicações, etc.
│   └── 📁 data/               # Dados iniciais de demonstração
```

### 🧠 Decisões Internas

- **🔀 Navegação por abas (SPA):** o app é uma Single Page Application com views trocadas por estado (`currentTab`), sem roteador externo.
- **💾 Estado centralizado:** todos os dados (pets, usuários, tutores, medicamentos e registros) vivem no `App.tsx` usando `useState`, com `handlers` passados às views — permitindo criar, editar, excluir e alternar status.
- **📦 Dados in-memory:** os dados iniciais ficam em `src/data/initialData.ts` e são carregados ao abrir o app. Isso torna o projeto **100% frontend**, sem backend nem banco de dados. *(Perfeito para prototipagem e demonstrações!)*
- **🔤 pt-BR nativo:** toda a interface, tipos (ex.: `PetStatus`, `RecurrenceType`, `AdministrationStatus`) e fluxos estão em português do Brasil.
- **🧩 Contratos de domínio bem definidos:** `Pet`, `Tutor`, `Medication`, `AdministrationRecord` e `ReportFilter` são interfaces TypeScript que garantem consistência entre views.
- **🎛️ Alertas configuráveis:** cada medicação possui configurações individuais de alerta (`systemPopup`, `email`, `whatsapp`).
- **📱 Layout responsivo:** sidebar colapsável e layout adaptativo para mobile e desktop.

---

## 🚀 Como Baixar o Projeto

### 📋 Pré-requisitos

- 🟢 **Node.js** (versão 18 ou superior)
- 📦 **npm** (já incluso no Node.js)

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/allandevbrazil/pethealth.git
cd pethealth
```

> 🌐 **Acesse online pelo GitHub Pages:** [https://allandevbrazil.github.io/pethealth/](https://allandevbrazil.github.io/pethealth/)

### 2️⃣ Instalar as dependências

```bash
npm install
```

### 3️⃣ Configurar

O projeto **não exige variáveis de ambiente** para rodar localmente. 🎉 Se você tiver um arquivo `.env.local` (opcional, para integrações com a API Gemini), basta preencher a chave:

```bash
GEMINI_API_KEY=sua_chave_aqui
```

> 💡 Sem a chave, todas as funcionalidades locais (pets, medicações, registros e relatórios) funcionam normalmente.

---

## ▶️ Como Rodar Localmente

```bash
npm run dev
```

O app sobe em **http://localhost:3000** 🌐 (o servidor de desenvolvimento fica disponível também para acesso pela rede local, via `--host=0.0.0.0`).

### 📜 Outros comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | ▶️ Sobe o servidor de desenvolvimento na porta 3000 |
| `npm run build` | 📦 Gera o build de produção em `dist/` |
| `npm run preview` | 👀 Pré-visualiza o build de produção localmente |
| `npm run lint` | 🔍 Verifica tipos com TypeScript (`tsc --noEmit`) |
| `npm run clean` | 🧹 Remove artefatos de build e o servidor gerado |

---

## ☁️ Como Subir (Deploy)

O PetHealth é um frontend estático ✨ — o que significa que o build final pode ser hospedado em qualquer serviço de hospedagem estática:

### 🧪 1. Gerar o build de produção

```bash
npm run build
```

Isso cria a pasta `dist/` com todos os arquivos otimizados. 📦

### 🌍 2. Opções de hospedagem

- **GitHub Pages:** deploy automático via GitHub Actions (veja abaixo) — o site fica em **[https://allandevbrazil.github.io/pethealth/](https://allandevbrazil.github.io/pethealth/)**. ✅
- **Vercel:** importe o repositório, o framework detectado será **Vite** — build `npm run build`, output `dist`. ✅
- **Netlify:** build `npm run build`, publish directory `dist`. ✅
- **Qualquer servidor Web/Nginx:** basta apontar o document root para a pasta `dist/`. ✅

### 🚀 Deploy automático no GitHub Pages

O repositório já inclui um workflow de GitHub Actions que faz o deploy automático para o GitHub Pages a cada push na branch `main`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Basta ativar o GitHub Pages nas configurações do repositório (**Settings → Pages → Source: GitHub Actions**) e os deploys futuros serão automáticos. 🔄

---

## 🛠️ Como Usar as Principais Funções

### 📊 Dashboard

Ao abrir o app, você vê o **Dashboard** com o resumo do dia: agenda de medicações, próximos horários e atalhos rápidos. O modal de lembrete flutuante permite confirmar uma administração com um clique. ✅

### 🐾 Cadastrar Pets

1. Vá em **Meus Pets** no menu lateral;
2. Clique em **Adicionar Pet** ➕;
3. Preencha nome, espécie (cachorro, gato, pássaro ou outro), raça, idade, peso, status, alergias, limitações e fotos;
4. Salve! 🎉 O pet aparece na lista e pode ser **editado ✏️** ou **excluído 🗑️** a qualquer momento.

> No mesmo menu, a aba **Tutor** permite cadastrar/editar os dados do tutor responsável (nome, e-mail, CPF, telefones e endereço). 📇

### 🧾 Cadastrar Medicamentos

1. Acesse **Medicações**;
2. Selecione o pet no seletor e clique em adicionar;
3. Informe o nome do medicamento, dosagem, horários (ex.: `08:00`), período de tratamento (ex.: `30 dias`) e a **recorrência** (Diário, Semanal, Mensal, A cada 12h, A cada 8h);
4. Configure os **alertas** (pop-up, e-mail e/ou WhatsApp) 💬;
5. Salve para vincular o remédio ao pet. Você também pode **pausar/reativar** cada medicação. ⏸️▶️

### ✅ Lançar Aplicações de Medicamentos

1. Vá em **Registrar Administrações**;
2. Escolha o pet e o medicamento;
3. Informe o horário agendado, o **horário real**, a dosagem e as observações do tutor;
4. Marque o **humor do pet** (Ativo 😄, Calmo 😌, Amuado 😞);
5. O registro entra no histórico com status **Administrado**, podendo também ficar **Pendente** ou **Problema** ⚠️.

### 📅 Agenda de Medicamentos

A **Agenda** exibe o calendário do mês com os eventos de medicação. Clique em qualquer dia para ver os horários e registrar administrações direto pela agenda. 📆

### 👥 Usuários

Em **Usuários**, você gerencia o time de cuidadores/tutores com papéis (**Super Admin**, **Cuidador** ou **Tutor**) e status (**Ativo** ou **Pendente**). 🧑💼

### 📈 Relatórios

Em **Relatórios**, filtre por tutor, pet e período, escolha os campos desejados (data agendada, horário real, medicamento, pet, tutor, estado do pet, observações) e gere o histórico completo de administrações. 📄

---

## 🧪 Rodando o Lint e Testes

```bash
npm run lint
```

Executa a verificação de tipos do TypeScript, garantindo que o código esteja consistente antes de subir. ✅

---

<div align="center">

Feito com 💙 por **ALLAN SELEGUIM** 🐾

**PetHealth** — Cuidar de quem cuida de você. 🐶💊

</div>