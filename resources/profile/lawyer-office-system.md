# LawFirm ERP MVP

Monorepo do ERP de backoffice para escritorios de advocacia.

## Acessos em producao

- **Frontend:** [lawyer-office-system.vercel.app](https://lawyer-office-system.vercel.app)
- **API Render:** [lawyer-office-system.onrender.com](https://lawyer-office-system.onrender.com)
- **Swagger UI:** [lawyer-office-system.onrender.com/docs](https://lawyer-office-system.onrender.com/docs)
- **ReDoc:** [lawyer-office-system.onrender.com/redoc](https://lawyer-office-system.onrender.com/redoc)
- **OpenAPI JSON:** [lawyer-office-system.onrender.com/openapi.json](https://lawyer-office-system.onrender.com/openapi.json)

O ambiente de producao usa NeonDB e e inicializado com dados demonstrativos idempotentes durante o deploy:
3 processos, 3 clientes, 1 fatura, 2 documentos, eventos e artigos Wiki.

## Estrutura

- `backend/`: API FastAPI, SQLAlchemy async e Alembic.
- `frontend/`: SPA Vue 3, TypeScript e Pinia.
- `tasks/`: especificacao de implementacao e checklist.

## Inicio rapido

1. Copie `.env.example` para `.env` e altere os valores locais.
2. Suba o banco com `docker compose up -d db`.
3. Instale as dependencias do backend com `cd backend && python -m pip install -e ".[dev]"`.
4. Instale as dependencias do frontend com `cd frontend && npm install`.
5. Execute os comandos de cada aplicativo conforme seus READMEs e scripts.

Nunca versione `.env` ou chaves de provedores externos.

## Executando com Docker

### Backend

```bash
# Build da imagem
docker build -t lawfirm-backend ./backend

# Rodar o container (requer banco de dados rodando)
docker run -d --name lawfirm-backend -p 8000:8000 lawfirm-backend

# Ou subir backend + banco juntos
docker compose up -d db
docker run -d --name lawfirm-backend -p 8000:8000 --network lawfirm_default lawfirm-backend
```

### Frontend

```bash
# Build da imagem
docker build -t lawfirm-frontend ./frontend

# Rodar o container
docker run -d --name lawfirm-frontend -p 80:80 lawfirm-frontend
```

## Executando localmente (sem Docker)

### Backend

```bash
cd backend

# Instalar dependencias
python -m pip install -e ".[dev]"

# Configurar variaveis de ambiente (copie .env.example para .env)
cp .env.example .env

# Rodar migracoes
alembic upgrade head

# Iniciar servidor de desenvolvimento
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Acessar API: http://localhost:8000
# Documentacao Swagger: http://localhost:8000/docs
```

Em ambiente local (`APP_ENV=development`), a API carrega automaticamente dados demonstrativos
idempotentes para clientes, processos, documentos, faturas, wiki e atividades. Para carregar
novamente sem reiniciar o servidor, execute `python -m app.cli.seed_demo` dentro de `backend`.

Por padrão, a sessão autenticada dura 3 dias: o access token expira em 4320 minutos e o refresh
token em 3 dias. Esses valores podem ser sobrescritos pelas variáveis
`ACCESS_TOKEN_EXPIRE_MINUTES` e `REFRESH_TOKEN_EXPIRE_DAYS`.

Contas demo locais criadas pelo seed:

- MASTER: `master@example.com` / `DemoMaster@2026!`
- FUNCIONARIO: `ana.silva@example.com` / `DemoStaff@2026!`
- CLIENTE: `mariana.costa@example.com` / `DemoClient@2026!`

O usuário CLIENTE está vinculado à cliente Mariana Costa e consegue visualizar os processos e
faturas associados a ela. Essas credenciais são somente para desenvolvimento/demo.

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar a API; o build falha se esta variável não existir
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev

# Build para producao
npm run build

# Preview do build de producao
npm run preview

# Acessar: http://localhost:5173 (dev) ou http://localhost:4173 (preview)
```

O frontend exige `VITE_LAWFIRM_API_URL` e identifica o bundle por `VITE_APP_ENV`. Em producao,
configure `VITE_APP_ENV=production` e a URL publica do servico Render:
`https://lawyer-office-system.onrender.com/api/v1`. Variaveis `VITE_*` sao publicas no bundle e nao
devem conter segredos.

No backend, `APP_ENV=development` ou `demo` usa `LOCAL_DATABASE_URL`; `APP_ENV=production` usa
`NEON_DATABASE_URL` automaticamente. `DATABASE_URL` permanece como fallback de compatibilidade.
No Render, configure `FRONTEND_BASE_URL` e `CORS_ORIGINS` com a URL do frontend publicado.

## Deploy

- **NeonDB:** configure `NEON_DATABASE_URL` com a string PostgreSQL fornecida pelo Neon e SSL habilitado.
- **Render:** conecte o repositorio, use `render.yaml` e preencha as variaveis marcadas como `sync: false` no painel. O servico executa as migracoes, cria o Master inicial e carrega os dados demo de forma idempotente.
- **Vercel:** importe o repositorio e use `vercel.json`; configure `VITE_LAWFIRM_API_URL` com `https://lawyer-office-system.onrender.com/api/v1`.
- **Swagger:** apos o deploy, a documentacao fica em `/docs`, `/redoc` e `/openapi.json`, com os links publicos listados acima.

Nunca execute `app.cli.reset_demo` em producao. O comando so funciona com `APP_ENV=demo`.

## Fluxo de trabalho

A implementacao segue os gates `/spec`, `/plan`, `/build`, `/test`, `/review` e `/ship` descritos em `SPEC.md` e `tasks/plan.md`.

---

**DESENVOLVIDO POR ALLAN SELEGUIM**
