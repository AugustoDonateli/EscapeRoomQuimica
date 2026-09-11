# Escape Químico

Plataforma da sala de fuga de química da feira de ciências. Organiza a fila do dia, conduz
a sessão, serve as perguntas pelos QRs das estações e avalia as equipes em tempo real.

O planejamento inteiro está em [`docs/`](./docs): [decisões](./docs/decisoes.md),
[plano de construção](./docs/plano.md), [telas e modelo de dados](./docs/telas-e-dados.md)
e [o que depende das outras equipes](./docs/dependencias.md).

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com os dados do projeto Supabase
npm run dev                  # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | Confere os tipos sem gerar nada |

## O que já existe

- `/` — página de entrada, com o andamento da construção
- `/estilo` — **catálogo do sistema visual**: as duas paletas, a escala tipográfica, a marca,
  os componentes e o cronômetro em proveta. É onde o visual se discute antes de virar tela.

## Banco de dados

```
supabase/migrations/0001_esquema.sql   as 16 tabelas
supabase/seed.sql                      dados de exemplo para testar sem a sala existir
```

Rode os dois no SQL Editor do projeto Supabase, nessa ordem.

O RLS fica ligado em tudo e só há leitura pública onde a informação é realmente pública
(configuração do evento, estações ativas, placar). **Não existe leitura pública das
perguntas** — se houvesse, alguém acharia as respostas antes da feira. Toda escrita passa
pelo servidor com a chave de serviço.

## Duas paletas, escolhidas pelo lugar

A cor não segue o tema do celular: segue onde a pessoa está.

- **Fora da sala** (totem, cadastro, fila, placar) — fundo claro, porque a feira é de dia.
- **Dentro da sala** (pergunta da estação, painel do instrutor) — grafite, porque a sala é escura.

No código isso é a classe `sala`, que troca as variáveis de cor de tudo que está dentro dela.

## Deploy

Ainda não publicado. Falta criar o projeto na Vercel, ligado a este repositório, com as
variáveis de `.env.example` preenchidas.
