# Escape Room de Química — Documento de Decisões

> **Ata viva do projeto.** Registro das decisões tomadas, das que ainda estão abertas e das
> restrições técnicas descobertas. Ainda **não existe código de plataforma** — nada será
> implementado antes de autorização explícita.
>
> Última atualização: 2026-09-11

---

## 1. Contexto

Feira de ciências da escola. A sala toda está construindo um **escape room de química**:
vários grupos, cada um responsável por uma parte (estações, enigmas, perguntas, cenografia).
Tudo é baseado em conhecimento de química, não apenas em demonstração.

**Nosso grupo é responsável pela plataforma web** que sustenta a operação da sala.

### O problema real que a plataforma resolve

A demanda de equipes é muito maior que a capacidade da sala. Sem sistema, a feira vira
uma fila física congestionada e desorganizada. A plataforma existe para:

1. **Organizar a fila/agendamento** no dia da feira
2. **Avaliar as equipes em tempo real** pelos instrutores, de forma justa (há prêmio)
3. **Servir as perguntas de química** nas estações, via QR
4. **Coletar a avaliação dos jogadores** sobre a experiência
5. **Avisar a equipe** quando a vez dela está chegando

---

## 2. Papéis

| Papel | Quem | Acesso |
|---|---|---|
| **Admin** | Nosso grupo | Tudo: estações, perguntas, configuração, placar |
| **Autor de conteúdo** | Grupo das perguntas | Cadastrar e editar perguntas de química |
| **Instrutor** | Monitores da sala | Conduzir sessão, cronometrar, avaliar equipe e jogadores |
| **Jogador** | Visitantes da feira | Agendar, acompanhar fila, responder perguntas, avaliar |
| **Público** | Feira | Placar ao vivo (TV/projetor) |

---

## 3. Decisões fechadas

### 3.1 Nível de dificuldade
- **Nível único** para todas as perguntas. Não haverá adaptação por ano escolar.
  *Motivo: sistema de níveis geraria confusão operacional.*
- **Consequência aceita:** a justiça entre anos escolares deixa de vir do banco de perguntas
  e passa a vir (a) do desenho das perguntas e (b) da categorização do ranking.

### 3.2 Agendamento
- **Só no dia da feira.** Não há agendamento antecipado.
- O visitante chega, acessa a plataforma (QR/NFC em um totem na entrada) e cadastra a equipe.
- Dados do cadastro: **nome da equipe**, **integrantes**, **e-mail**, **ano escolar de cada integrante**.

### 3.3 Notificações
- **E-mail via Resend** + convite de calendário (`.ics`).
- **WhatsApp:** sem API oficial (exige conta Meta Business verificada e é paga).
  Se necessário, apenas link `wa.me` pré-preenchido, disparado manualmente pelo organizador.

### 3.4 Prêmio
- **Por equipe.**

### 3.5 Perguntas
- Abertas por **QR code** nas estações.
- **Não é permitido pesquisar na internet** durante a sessão.
- O grupo das perguntas **terá acesso ao painel** para cadastrar o conteúdo.

### 3.6 Avaliação
- O **instrutor avalia em tempo real**, durante a sessão.
- Avalia tanto a equipe quanto **o desempenho de cada jogador dentro da equipe**.
- Os **jogadores também avaliam** (o que exatamente, ainda em definição).

### 3.7 Infraestrutura
- Há **Wi-Fi** na sala.
- **Cada jogador tem celular.**
- A plataforma precisa ser **segura** (requisito explícito).

---

## 4. Parâmetros de configuração (não são decisões do nosso grupo)

Vários números deste projeto dependem de equipes que ainda não terminaram a parte delas
(estações, enigmas, perguntas, cronograma da feira). **Nenhum deles será escrito no código.**
Todos ficam numa tela de *Configuração do evento*, com um valor padrão provisório, e quem
souber a informação preenche depois — em segundos, sem mexer em código.

| Parâmetro | Padrão provisório | Quem decide |
|---|---|---|
| Data do evento | vazio | Organização da feira |
| Horário de funcionamento | 08:00–14:00 | Organização da feira |
| Duração-alvo da sessão | 20 min | Equipe das estações |
| Tempo de reset entre sessões | 5 min | Equipe das estações |
| Liberação da fila em lotes | manhã 08:00 / tarde 11:00 | Nosso grupo |
| Tamanho da equipe | 2 a 6 jogadores | Organização |
| Número de estações | criadas no painel, sem limite fixo | Equipe das estações |
| Ordem das estações | livre ou fixa, configurável | Equipe das estações |
| Quais estações têm pergunta | definido no painel | Equipe das perguntas |
| Perguntas por estação | definido no painel | Equipe das perguntas |
| Tempo limite por pergunta | 90 s | Equipe das perguntas |
| Penalidade por dica | −5% no componente de precisão | Nosso grupo |
| Pesos do placar | 40 / 25 / 15 / 20 | Nosso grupo |
| Categorias de ranking | 2 categorias, corte na média de ano 2,5 (desligável) | Organização |
| Detectar saída de tela | desligado | Nosso grupo |
| Anos escolares participantes | 4 níveis, nomes editáveis | Escola |

**Regra de ouro do projeto: se um número pode mudar, ele é configuração — nunca código.**

Isso significa que a plataforma pode ser construída **inteira** antes de qualquer outra
equipe terminar a parte dela. No dia em que as informações chegarem, é digitação.

## 5. Restrições técnicas conhecidas

- **NFC:** tag com URL funciona por aproximação em iPhone e Android, mas a API Web NFC
  (ler/escrever pelo navegador) só existe no Chrome Android. **QR precisa existir sempre
  como alternativa.**
- **Impedir pesquisa na internet é tecnicamente impossível** em celular pessoal via site.
  Estratégia adotada: perguntas cuja resposta depende de dados físicos da sala
  (Google não ajuda) + cronômetro curto por pergunta.
- **QR não precisa de leitor dentro do site.** O QR da estação é uma URL impressa; a câmera
  nativa do celular já abre. Elimina permissão de câmera no navegador e bugs de iOS.
- **HTTPS é obrigatório** para o fluxo de QR funcionar bem.
- **Banco de perguntas não pode ser acessível antes do evento** — pergunta só é servida
  com sessão ativa e estação liberada.
- **LGPD:** dados de menores. Coletar o mínimo, informar a finalidade, apagar após o evento.

---

## 6. Stack proposta

Critério: moderna, mas **cada peça precisa justificar sua existência**. Projeto escolar
com data indefinida não sobrevive a excesso de dependências.

| Camada | Escolha | Justificativa |
|---|---|---|
| Framework | Next.js 15 + TypeScript | Server Components, deploy trivial |
| Banco / tempo real / auth | Supabase (Postgres, Realtime, RLS) | Tempo real quase de graça; segurança no banco |
| UI | Tailwind + shadcn/ui | Tela de instrutor precisa de botão grande e rápido |
| Validação | Zod | Nada entra no banco sem passar por regra |
| E-mail | Resend + `.ics` | Decidido |
| Hospedagem | Vercel | Grátis, HTTPS automático |
| PWA | manifest + service worker | Instalável, resistente a oscilação de Wi-Fi |

**Autenticação:** jogador sem senha (link mágico / código de equipe).
Instrutor e admin com login real. Políticas de acesso no próprio Postgres (RLS).

---

## 7. Placar — proposta em debate

Pesos iniciais, **não finais**:

| Componente | Peso | Observação |
|---|---|---|
| Progresso | 40% | Enigmas resolvidos, ponderados por dificuldade |
| Precisão | 25% | Acertos ÷ tentativas, com desconto fixo por dica |
| Tempo | 15% | Relativo ao tempo-alvo, não absoluto |
| Avaliação do instrutor | 20% | Rubrica 1–5 com descritor escrito por nota |

**Regras de justiça (essas são o coração do sistema):**

1. A parte subjetiva é limitada a 20% e a **rubrica é publicada antes** do jogo.
2. **Critério de desempate definido por escrito antes:** precisão → tempo relativo → menos dicas.
3. **Nenhum ajuste matemático invisível.** Se o placar não é explicável em uma frase para
   quem perdeu, ele está errado.
4. Toda nota do instrutor é rastreável até registros com hora — se houver contestação,
   mostramos a linha do tempo.

---

## 8. Fila e capacidade

O gargalo não é o agendamento, é a **capacidade da sala**.

```
sessões possíveis no dia = (horas de feira × 60) ÷ (duração da sessão + tempo de reset)
```

Consequências de projeto:

- A plataforma deve **calcular a capacidade restante** e **encerrar os agendamentos**
  (ou abrir lista de espera) quando o dia estiver cheio. Não prometer o que não cabe.
- **Tempo de reset entre sessões é obrigatório** no cálculo — a sala precisa ser
  rearmada entre equipes.
- **No-show** é o maior risco operacional: regra de ausência definida antes
  (chamada → X minutos → passa a vez).
- **Check-in pelo instrutor** no momento da vez, confirmando quem veio e os anos escolares
  declarados. Isso valida o dado autodeclarado e elimina equipe fantasma.

---

## 9. Funções para o instrutor (menu em aberto)

Levantamento para escolher o que entra:

- Cronômetro automático da sessão
- Cronometragem por estação, **derivada dos QRs** (sem o instrutor fazer nada)
- Botão de pausa (imprevisto) que não conta no tempo
- Contador de dicas com penalidade automática
- Alerta de tempo ("faltam 5 minutos")
- Painel do estado da sala: em que estação a equipe está
- Chamar automaticamente a próxima equipe da fila
- Checklist de reset entre sessões
- Registro de ocorrência (quebra de regra)
- Relatório da sessão gerado ao final
- Placar ao vivo para TV/projetor

---

## 10. Privacidade

- Coletar o mínimo: nome, ano escolar, e **um** e-mail de contato por equipe (proposta).
- Informar na tela para que servem os dados.
- Apagar os dados pessoais após a feira, mantendo apenas estatísticas anônimas.

---

## 11. Escopo do nosso grupo

Nosso grupo é responsável **pela plataforma web, e só por ela.** Outras cinco ou seis equipes
cuidam das estações, dos enigmas, das perguntas de química e da cenografia. O que depende
delas está na seção 4 como parâmetro configurável, e em [`dependencias.md`](./dependencias.md)
como pedido formal.

### Dentro do nosso controle — construível sem esperar ninguém

- Modelo de dados e banco
- Cadastro de equipe e agendamento no dia da feira
- Fila virtual: posição, estimativa ao vivo, chamada da próxima equipe, no-show
- Check-in pelo instrutor
- Painel do instrutor: cronômetro automático, dicas, pausa, avaliação ao vivo
- Motor de pontuação com pesos configuráveis
- Painel de administração: estações, perguntas, configuração do evento
- Roteamento dos QRs das estações
- E-mail de confirmação (Resend) + `.ics`
- Placar ao vivo
- Avaliação feita pelos jogadores
- Autenticação, permissões, segurança e LGPD

### Fora do nosso controle

- Quantas estações existem e o que cada uma faz
- O texto das perguntas de química
- Data, horário e cronograma da feira
- Regras físicas da sala e do prêmio

---

## 12. Identidade visual escolhida

Decidido no quiz visual de 11/09/2026:

| Decisão | Escolha |
|---|---|
| Nome do produto | **Escape Químico** |
| Tema | Claro |
| Paleta | Laboratório noturno (grafite esverdeado, ciano frio, azul) |
| Tipografia | Bricolage Grotesque (display) + IBM Plex Sans (texto) + IBM Plex Mono (dados) |
| Cantos | Levemente arredondado — 4 px |
| Fundo | ~~Liso, sem textura~~ → **papel quadriculado com grão** (revisto em 16/09, ver abaixo) |
| Voz do texto | Direto e humano — *"Sua vez está chegando — fica por aqui!"* |
| Marca | Número atômico (casinha da tabela periódica) |
| Cronômetro | Proveta esvaziando (barra de líquido que baixa) |
| Movimento | Mínimo |

### Conflito a resolver

**Tema claro + paleta Laboratório noturno** não fecham como escolhidos: aquela paleta nasce de
um fundo grafite, e os acentos (ciano `#3FD9C4`, azul `#8FB8FF`) não têm contraste suficiente
sobre fundo claro. Proposta de resolução:

- **Interface clara** (totem, cadastro, fila, placar) com fundo neutro de viés frio e os acentos
  do noturno escurecidos para contraste real: verde-ciano `#0E7C6B` e azul `#2B5FCC`.
- **Telas de dentro da sala** (pergunta da estação, painel do instrutor em sessão) no noturno
  de verdade, fundo grafite — que é onde aquela paleta foi feita para viver.

Ou seja: o híbrido por contexto, chegando pelo caminho da paleta em vez do caminho do tema.

### Revisão de 16/09/2026: o fundo deixou de ser liso

A aposta do "fundo liso" era que quatro detalhes — marca de número atômico, proveta,
acento frio e Bricolage Grotesque — segurariam a identidade sozinhos. Não seguraram, por
dois motivos:

1. **Um dos quatro não existia.** A Bricolage nunca chegou à tela: as variáveis de fonte
   estavam declaradas no `<body>` e `globals.css` monta as famílias em `:root`, então
   `font-family` caía para a fonte do navegador. Sete etapas de site renderizadas em Arial,
   sem nenhum erro em lugar nenhum.
2. **Três detalhes num fundo liso é pouco.** Sem textura e sem hierarquia de profundidade, o
   resultado é a média: cartão com borda de 1px, tudo com o mesmo peso, coluna centrada.
   Foi exatamente essa a crítica recebida — *"parece completamente feito de inteligência
   artificial"*.

O fundo agora é papel quadriculado de 24 px com grão, os dois atrás do conteúdo. A direção
inteira, com a lista fechada de recursos permitidos, está em **`docs/visual.md`**.

**Esta decisão contraria uma escolha feita no quiz.** Tirar a textura é um bloco de CSS em
`globals.css` (`body::before`, `body::after` e a grade do `.sala`): se a escolha original
valer mais que o efeito, ela sai em uma edição.
