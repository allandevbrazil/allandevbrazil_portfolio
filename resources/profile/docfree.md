# DocPrático

> 🛠️ Gerenciador de orçamentos e clientes para profissionais autônomos e pequenas empresas (marceneiros, montadores, reformas, etc.)

O **DocPrático** é um sistema completo para criação, envio e acompanhamento de orçamentos. Ele permite cadastrar clientes, montar orçamentos com itens e descontos, acompanhar o status (aprovado, pendente, rejeitado) e visualizar KPIs de desempenho em um dashboard.

O projeto é um **monorepo** composto por:

| Pasta       | Descrição                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `backend/`  | **BFF (Backend For Frontend)** — API REST em Node.js/TypeScript com Express, Prisma e PostgreSQL. Documentação interativa via Swagger. |
| `frontend/` | **Dashboard (SPA)** — React + Vite + TypeScript + Tailwind CSS consumindo o BFF. |

---

## 🏗️ Arquitetura

### Visão Geral

```
┌──────────────────────────┐        ┌──────────────────────────────────────────┐
│       Frontend (SPA)     │  HTTP  │                  Backend (BFF)           │
│  React + Vite + Tailwind │ ─────► │  /api/dashboard   →  DashboardService     │
│  ├─ Dashboard            │        │  /api/clients     →  Client Use Cases     │
│  ├─ Orçamentos           │        │  /api/quotes      →  Quote Use Cases      │
│  └─ Clientes             │        │  /api-docs        →  Swagger UI           │
└──────────────────────────┘        └──────────────┬───────────────────────────┘
                                                   │ Prisma (ORM)
                                                   ▼
                                        ┌──────────────────────┐
                                        │     PostgreSQL       │
                                        │  (clients, quotes,   │
                                        │   quote_items)       │
                                        └──────────────────────┘
```

O backend segue o padrão **BFF (Backend For Frontend)**: os endpoints retornam dados **já formatados** para a interface (valores monetários em `R$`, datas em `DD/MM/YYYY`, mensagens de paginação prontas), eliminando processamento de formatação no cliente e reduzindo o número de requisições.

### Arquitetura Interna do Backend (Clean Architecture)

```
backend/src/
├── domain/              # CAMADA DOMAIN — entidades + contratos (sem deps externas)
│   ├── entities/        #   Client, Quote, QuoteItem
│   └── repositories/    #   Interfaces dos repositórios
├── application/         # CAMADA APPLICATION — casos de uso + DTOs (padrão BFF)
│   ├── dtos/            #   Formato exato que o frontend espera
│   ├── services/        #   DashboardService (consolida use cases)
│   └── use-cases/       #   GetDashboardMetrics, GetRecentQuotes, CRUD Client/Quote
├── infrastructure/      # CAMADA INFRASTRUCTURE — implementações (Prisma)
│   ├── database/        #   Prisma Client singleton
│   └── repositories/    #   Implementações concretas dos repositórios
├── presentation/        # CAMADA PRESENTATION — HTTP
│   ├── controllers/     #   Controllers finos (delegam para use cases)
│   ├── middlewares/     #   Error handler global
│   ├── routes/          #   Rotas + anotações Swagger
│   └── swagger/         #   Configuração do Swagger (OpenAPI 3.0)
├── shared/              # Container de injeção de dependência (composition root)
├── app.ts               # Configuração do Express
└── server.ts            # Bootstrap do servidor
```

**Princípios aplicados:**

- **Clean Architecture** — `domain` não importa infraestrutura; `application` depende apenas de interfaces; `infrastructure` implementa as interfaces; `presentation` injeta os casos de uso.
- **SOLID** — cada classe com responsabilidade única; use cases dependem de abstrações (`QuoteRepository`), não de implementações concretas.
- **Injeção de Dependência** — um container (`shared/container.ts`) conecta todas as camadas no composition root.

### Banco de Dados

| Modelo      | Descrição                                         |
| ----------- | ------------------------------------------------- |
| `Client`    | Cliente (nome, e-mail, telefone, endereço, notas) |
| `Quote`     | Orçamento (projeto, subtotal, desconto, status, itens) |
| `QuoteItem` | Item do orçamento (descrição, quantidade, preços) |

---

## 🛠️ Stack Tecnológico

| Camada        | Tecnologia                              |
| ------------- | --------------------------------------- |
| Runtime       | Node.js 20 + TypeScript                 |
| Framework Web | Express                                |
| Banco de Dados| PostgreSQL 16                           |
| ORM           | Prisma                                  |
| Documentação  | Swagger (OpenAPI 3.0)                  |
| Infraestrutura| Docker + docker-compose                |
| Deploy        | Render (Docker runtime)                |
| Frontend      | React 18 + Vite 5 + TypeScript + Tailwind CSS |

---

## 📥 Como Baixar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) + Docker Compose **ou** PostgreSQL local
- [Git](https://git-scm.com/)

### Clonar o repositório

```bash
git clone https://github.com/allandevbrazil/docfree.git
cd docfree
```

---

## 🚀 Como Instalar

### Opção 1: Docker Compose (recomendado — mais rápido)

```bash
cd backend

# Sobe o PostgreSQL + aplicação (build automático)
docker compose up -d

# A aplicação roda em http://localhost:3333
# O Swagger fica em http://localhost:3333/api-docs
```

> Com o Docker Compose, as migrações e o seed são executados automaticamente na inicialização do container.

### Opção 2: Desenvolvimento local

```bash
cd backend

# 1. Instalar dependências
npm install

# 2. Subir apenas o PostgreSQL (ou usar um PostgreSQL local)
docker compose up -d postgres

# 3. Configurar variáveis de ambiente
cp .env.example .env
```

Edite o `.env` criado com os valores do seu ambiente (veja a seção [Configuração](#-como-configurar)).

```bash
# 4. Gerar o Prisma Client
npm run prisma:generate

# 5. Rodar as migrações do banco
npm run prisma:migrate

# 6. (Opcional) Popular o banco com dados falsos
npm run prisma:seed

# 7. Iniciar o servidor em modo desenvolvimento
npm run dev
```

> ⚠️ O `RUN_SEED=true` deve ser usado **somente** em ambiente local/dev. Em produção, mantenha `RUN_SEED=false` para não sobrescrever dados reais.

### Frontend (Dashboard SPA)

```bash
cd frontend

# 1. Instalar dependências
npm install

# 2. Iniciar o servidor de desenvolvimento (porta 5173)
npm run dev
```

O Vite já possui **proxy configurado**: requisições para `/api`, `/api-docs` e `/health` são encaminhadas para `http://localhost:3333`. Basta o backend estar rodando.

---

## ⚙️ Como Configurar

As variáveis de ambiente são definidas no arquivo `.env` (criado a partir de `.env.example`):

| Variável       | Descrição                                            | Exemplo                                                              |
| -------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`     | Ambiente de execução                                 | `development`                                                        |
| `PORT`         | Porta do servidor HTTP                               | `3333`                                                               |
| `API_PREFIX`   | Prefixo base da API                                  | `/api`                                                               |
| `RUN_SEED`     | Executa o seed de dados falsos (`true`/`false`)      | `false`                                                              |
| `DATABASE_URL` | Connection string do PostgreSQL (usada pelo Prisma)  | `postgresql://docpratico:docpratico@localhost:5432/docpratico?schema=public` |

#### Frontend (`frontend/.env`)

| Variável           | Descrição                                                                 | Exemplo                      |
| ------------------ | ------------------------------------------------------------------------- | ---------------------------- |
| `VITE_API_BASE_URL`| URL da API. Vazio = usa o proxy do Vite (ambiente local). Em produção, aponte para o backend publicado. | `https://docfree-api.onrender.com` |

> 🔒 **Segurança:** Nunca commite o arquivo `.env` nem valores reais de secrets. O `.gitignore` já protege `.env`, `.env.*`, `*.pem` e `*.key`. Para produção (ex.: Render), defina as variáveis no painel do provedor — nunca no código-fonte.

---

## 📖 Como Usar

### Dashboard (Interface Web)

#### Ambiente de produção (demo online)

Para testar a versão publicada, acesse:

```
https://frontend-chi-six-23.vercel.app
```

Com o backend rodando na porta `3333` e o frontend na `5173`, acesse:

```
http://localhost:5173
```

O frontend é uma **SPA (Single Page Application)** com navegação entre as páginas:

| Página       | Descrição                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| **Dashboard**| KPIs (orçamentos aprovados, aguardando resposta e taxa de conversão) + histórico recente de orçamentos, consumidos do endpoint BFF `GET /api/dashboard`. |
| **Orçamentos**| Lista de orçamentos com busca, filtro por status, paginação e editor completo (itens, desconto fixo/percentual, termos, status). |
| **Clientes** | CRUD completo de clientes com busca, paginação, máscaras de telefone/CEP e validação de formulário. |

### Documentação Interativa (Swagger)

Com o servidor rodando, acesse:

```
http://localhost:3333/api-docs
```

A interface **Swagger UI** permite:

- Explorar todos os endpoints da API (Dashboard, Clients, Quotes)
- Visualizar schemas, parâmetros e exemplos de resposta
- **Executar requisições** diretamente pelo navegador (botão **Try it out**)

#### Passo a passo: criar um orçamento pelo Swagger

1. **Abra o Swagger** em `http://localhost:3333/api-docs`
2. **Expanda o grupo `Quotes`** e clique em `POST /api/quotes`
3. Clique no botão **Try it out**
4. No corpo da requisição, preencha com um exemplo:

```json
{
  "clientId": "uuid-do-cliente",
  "projectName": "Armários Cozinha",
  "items": [
    {
      "description": "Armário planejado 2m",
      "quantity": 1,
      "unitPrice": 4500
    },
    {
      "description": "Bancada de granito",
      "quantity": 1,
      "unitPrice": 1200
    }
  ],
  "discount": 0,
  "discountType": "FIXED",
  "termsAndConditions": "Pagamento em até 30 dias",
  "status": "PENDING"
}
```

> 💡 Para obter um `clientId` válido, primeiro execute `GET /api/clients` (ou crie um cliente com `POST /api/clients`) e copie o `id` da resposta.

5. Clique em **Execute** — a resposta `201 Created` retorna o orçamento criado com `id`, `subtotal`, `totalValue` e `items`.

### Endpoints Disponíveis

| Método | Rota                  | Descrição                                              |
| ------ | --------------------- | ------------------------------------------------------ |
| GET    | `/health`             | Health check da aplicação                              |
| GET    | `/api-docs`           | Swagger UI (documentação interativa)                   |
| GET    | `/api/dashboard`      | Dados completos do Dashboard (KPIs + histórico recente) |
| GET    | `/api/clients`        | Lista clientes (paginação + filtros)                   |
| POST   | `/api/clients`        | Cria um novo cliente                                   |
| GET    | `/api/clients/{id}`   | Busca cliente por ID                                   |
| PUT    | `/api/clients/{id}`   | Atualiza cliente                                       |
| DELETE | `/api/clients/{id}`   | Remove cliente                                         |
| GET    | `/api/quotes`         | Lista orçamentos (paginação + filtros)                 |
| POST   | `/api/quotes`         | Cria um novo orçamento (com itens e desconto)          |
| GET    | `/api/quotes/{id}`    | Busca orçamento por ID                                 |
| PUT    | `/api/quotes/{id}`    | Atualiza orçamento                                     |
| DELETE | `/api/quotes/{id}`    | Remove orçamento                                       |

### Exemplos com `curl`

#### Dashboard (KPIs + últimos orçamentos)

```bash
curl "http://localhost:3333/api/dashboard?page=1&pageSize=10&status=APPROVED"
```

Resposta (padrão BFF — dados já formatados):

```json
{
  "overview": {
    "approvedQuotes": {
      "totalValue": 12450,
      "formattedValue": "R$ 12.450,00",
      "percentageChange": 12,
      "isPositiveChange": true
    },
    "awaitingResponse": { "count": 3 },
    "conversionRate": {
      "rate": 68,
      "formattedRate": "68%",
      "variation": 4,
      "isPositiveVariation": true
    }
  },
  "recentQuotes": {
    "data": [
      {
        "id": "uuid",
        "createdAt": "12/10/2023",
        "clientName": "João da Silva",
        "projectName": "Armários Cozinha",
        "totalValue": 4500,
        "formattedValue": "R$ 4.500,00",
        "status": "APPROVED"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 24,
      "totalPages": 3,
      "summary": "Mostrando 4 de 24 registros"
    }
  }
}
```

#### Criar um orçamento

```bash
curl -X POST "http://localhost:3333/api/quotes" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "uuid-do-cliente",
    "projectName": "Armários Cozinha",
    "items": [
      { "description": "Armário planejado 2m", "quantity": 1, "unitPrice": 4500 }
    ],
    "discount": 0,
    "discountType": "FIXED",
    "termsAndConditions": "Pagamento em até 30 dias"
  }'
```

> 📚 A documentação detalhada do backend (modelagem do banco, decisões técnicas, próximos passos) está em [`backend/README.md`](backend/README.md).

---

## 🔄 Scripts Úteis (backend)

| Comando                  | Descrição                                   |
| ------------------------ | ------------------------------------------- |
| `npm run dev`            | Inicia o servidor em modo watch (tsx)       |
| `npm run build`          | Compila o TypeScript para `dist/`           |
| `npm start`              | Executa a build de produção                 |
| `npm run prisma:generate`| Gera o Prisma Client                        |
| `npm run prisma:migrate` | Aplica migrações em dev                     |
| `npm run prisma:deploy`  | Aplica migrações em produção                |
| `npm run prisma:seed`    | Popula o banco com dados falsos             |
| `npm run prisma:studio`  | Abre o Prisma Studio (UI do banco)          |
| `npm run docker:up`      | Sobe PostgreSQL + app via Docker Compose    |
| `npm run docker:down`    | Derruba os containers                       |

---

## 🔐 Segurança

Este projeto segue uma política rigorosa de segurança:

- **Secrets nunca em arquivos versionados** — API keys, tokens e connection strings ficam apenas em variáveis de ambiente ou no painel do provedor.
- **`.gitignore` protege** — `.env`, `.env.*`, `*.pem`, `*.key` e pastas de build (`node_modules`, `dist`) são ignorados.
- **Referencie, não cole** — configurações de CI/CD e deploy usam variáveis (`${VARIAVEL}`), nunca valores literais.

---

## 🧪 Status do Projeto

### Backend (BFF)

- [x] API REST completa (Dashboard, Clientes, Orçamentos)
- [x] Swagger (OpenAPI 3.0) em `/api-docs`
- [x] Docker + docker-compose
- [x] Deploy configurado para Render (Docker runtime)
- [x] Padrão BFF (dados formatados para o frontend)
- [x] Clean Architecture + SOLID + Injeção de Dependência

### Frontend (SPA)

- [x] Dashboard com KPIs e histórico recente
- [x] CRUD de Clientes (busca, paginação, validação)
- [x] Navegação entre páginas (Dashboard, Orçamentos, Clientes)
- [x] Design System com Tailwind CSS (tokens de cor, tipografia, espaçamento)
- [x] Página de Orçamentos (lista, busca, filtro por status, editor completo com itens e desconto)
- [ ] Autenticação (JWT)
- [ ] Testes unitários e de integração
- [ ] CI/CD pipeline

---

## Autor

**ALLAN SELEGUIM** — [GitHub](https://github.com/allandevbrazil) · [LinkedIn](https://linkedin.com/in/allan-seleguim)

---

*Projeto de portfólio — dados fictícios, apenas para fins de demonstração.*