# Tierlist Maker

Este projeto é um Tierlist Maker simples, criado por Allan Seleguim, para permitir que o usuário configure uma tier list, adicione imagens e organize os itens em diferentes níveis de classificação.

## Arquitetura simples do frontend

A aplicação foi construída com uma estrutura direta e organizada para facilitar a compreensão e a evolução do projeto:

- React + TypeScript para a interface e a lógica do frontend.
- Vite como ferramenta de desenvolvimento e build.
- Tailwind CSS para estilização rápida e consistente.
- Zustand para gerenciar o estado global da tier list.
- Componentes separados por responsabilidade, como:
  - SetupForm: tela inicial para definir título, subtítulo e tiers.
  - TierlistBoard: painel principal onde o usuário arrasta e organiza as imagens.
  - ImageBank: área com as imagens ainda não atribuídas.
  - TierRow: cada linha de tier da lista.

Essa arquitetura simples ajuda a manter o código mais legível, com divisão clara entre configuração, interface e estado.

## Como baixar o projeto do Git

1. Abra o terminal.
2. Clone o repositório:

```bash
git clone <url-do-repositorio>
```

3. Entre na pasta do projeto:

```bash
cd tierlist-maker
```

## Como instalar as dependências

No diretório do projeto, execute:

```bash
npm install
```

## Como executar a aplicação

Para rodar o projeto localmente:

```bash
npm run dev
```

Depois, abra o navegador no endereço mostrado no terminal, normalmente:

```text
http://localhost:5173
```

## Como usar a aplicação

1. Na tela inicial, configure o título da tier list e os tiers.
2. Faça upload de imagens para o projeto.
3. Clique em "Gerar Tierlist".
4. No painel principal, arraste as imagens para as categorias desejadas.
5. Se quiser, use os botões:
   - RESET para reorganizar as imagens do início.
   - VOLTAR para retornar à tela de configuração e criar outro tierlist.

## Build para produção

Para gerar a versão pronta para publicação:

```bash
npm run build
```

## Autor

Criado por Allan Seleguim.
