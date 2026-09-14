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
| `npm test` | Testes da lógica de fila, capacidade, código e fuso |

## O que já existe

**Jogador, sem senha**

- `/` — o totem da entrada. Também é o roteador: se o celular já guarda um código de
  equipe ativo, a pessoa cai direto na própria fila em vez de ver esta tela
- `/cadastro` — cadastro da equipe em três passos, com um único envio no fim
- `/fila/[codigo]` — o cartão da fila, atualizando sozinho
- `/recuperar` — recuperar o código por nome da equipe e e-mail

**Público**

- `/placar` — o placar ao vivo para a TV ou projetor da feira

- `/estilo` — **catálogo do sistema visual**: as duas paletas, a escala tipográfica, a marca,
  os componentes e o cronômetro em proveta. É onde o visual se discute antes de virar tela.

**Fechado, com login** (`/entrar`)

- `/admin` — configuração do evento, com a **capacidade do dia recalculada na tela** enquanto
  se ajusta duração e reset
- `/admin/estacoes` — criar, ordenar, pesar e desativar estações
- `/admin/perguntas` — cadastrar perguntas com **prévia ao vivo da tela do jogador**, usando o
  mesmo componente que a sala vai usar
- `/admin/qrcodes` — folha de cartazes para imprimir, um por estação
- `/admin/placar` — **placar com auditoria**: de onde veio cada ponto de cada equipe

**Instrutor, com login**

- `/i` — a sala agora: sessão em andamento, equipe chamada, vagas do dia
- `/i/fila` — chamar a próxima, marcar ausência, devolver para a fila
- `/i/checkin/[codigo]` — conferir quem veio e validar os anos declarados
- `/i/sessao/[id]` — **a tela crítica**: cronômetro do servidor, toques de observação
  que sobrevivem a queda de rede, dica, pausa, tempo por estação
- `/i/sessao/[id]/fechar` — rubrica pré-sugerida pelos toques

**Jogador, dentro da sala**

- `/e/[slug]` — a pergunta da estação, aberta pelo QR colado na parede

Papéis: `admin` alcança tudo; `autor` alcança **só** as perguntas; `instrutor` conduz as
sessões.
A guarda acontece em duas camadas — no middleware, antes de a página renderizar, e dentro de
cada página e cada ação de servidor.

## Banco de dados

Projeto Supabase: **`escape-quimico`**, referência `jhbbraviyaqnfhzacsqk`, região `sa-east-1`
(São Paulo — a mais perto de quem vai usar). O esquema e os dados de exemplo **já estão
aplicados** lá.

```
supabase/migrations/0001_esquema.sql   as 16 tabelas
supabase/seed.sql                      dados de exemplo para testar sem a sala existir
```

Para recriar em outro projeto, rode os dois no SQL Editor, nessa ordem.

As chaves ficam em `.env.local`, que não vai para o repositório. A URL e a chave pública
estão no painel do Supabase em *Settings → API*; a chave de serviço fica na mesma tela e
**só** pode aparecer no ambiente do servidor.

O RLS fica ligado em tudo e só há leitura pública onde a informação é realmente pública
(configuração do evento, estações ativas, placar). **Não existe leitura pública das
perguntas** — se houvesse, alguém acharia as respostas antes da feira. Toda escrita passa
pelo servidor com a chave de serviço.

Conferido no banco, com a chave pública (papel `anon`): configuração do evento e estações
aparecem; perguntas, equipes e respostas voltam **zero linhas**.

## Duas paletas, escolhidas pelo lugar

A cor não segue o tema do celular: segue onde a pessoa está.

- **Fora da sala** (totem, cadastro, fila, placar) — fundo claro, porque a feira é de dia.
- **Dentro da sala** (pergunta da estação, painel do instrutor) — grafite, porque a sala é escura.

No código isso é a classe `sala`, que troca as variáveis de cor de tudo que está dentro dela.

## Deploy

Ainda não publicado. Falta criar o projeto na Vercel, ligado a este repositório, com as
variáveis de `.env.example` preenchidas.

Depois de publicar, defina também `NEXT_PUBLIC_SITE_URL` com o endereço final — é o que vai
dentro dos QRs impressos. Antes disso, a folha de cartazes avisa que o endereço está faltando
em vez de gerar QR que não abre nada.
