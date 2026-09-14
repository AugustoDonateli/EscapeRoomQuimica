# Plano de construção em etapas

Sete etapas. Cada uma termina com **algo que funciona e pode ser demonstrado** — se o tempo
acabar na etapa 5, existe um produto na etapa 5, não um esqueleto de sete etapas pela metade.

O peso está distribuído de propósito: as etapas mecânicas são curtas e diretas, e as três
que decidem a qualidade do projeto — **o sistema visual, o motor da fila e o painel do
instrutor** — são as mais detalhadas, porque é nelas que dá errado quando se tem pressa.

| # | Etapa | Peso |
|---|---|---|
| 1 | Fundação | leve |
| 2 | Sistema visual | **pesado** |
| 3 | Admin e conteúdo | médio |
| 4 | Cadastro e fila | **pesado** |
| 5 | Sessão e painel do instrutor | **o mais pesado** |
| 6 | Pontuação e placar | médio |
| 7 | Fechamento e ensaio geral | leve |

**Situação: as sete etapas estão construídas.** O que falta é humano e não é código:
publicar na Vercel, decidir o domínio de e-mail, e o ensaio com pessoas de fora do projeto.

---

## Etapa 1 — Fundação · leve

Encanamento. Não tem decisão de projeto nenhuma aqui, só montagem.

Next.js + TypeScript, Tailwind, projeto Supabase criado, as 16 tabelas migradas, dados de
exemplo para poder testar sem a sala existir, deploy na Vercel.

**Entrega:** endereço no ar, vazio, com o banco pronto.

---

## Etapa 2 — Sistema visual · pesado

Vem antes de qualquer tela de produto, e essa ordem é de propósito: toda etapa seguinte
constrói telas. Refazer vinte telas depois porque a cor mudou é o desperdício mais comum
de projeto com prazo.

**2.1 — As duas paletas.** Fora da sala, fundo claro frio com os acentos do noturno
escurecidos (verde-ciano `#0E7C6B`, azul `#2B5FCC`). Dentro da sala, grafite de verdade.
Cada cor definida como variável, nenhuma escrita solta no meio do código.

**2.2 — Escala tipográfica.** Bricolage Grotesque para títulos e números grandes, IBM Plex
Sans para texto, IBM Plex Mono para tempo, código de equipe e pontuação. Tamanhos fechados
numa escala e respeitados.

**2.3 — A marca.** Desenhar a casinha de número atômico (símbolo grande, número pequeno no
canto) em três tamanhos que têm exigências diferentes: ícone do navegador, canto da tela,
e cartaz do totem impresso em A3.

**2.4 — Componentes-base.** Botão em três tamanhos, incluindo o de 64 px do instrutor.
Campo de texto, cartão, pílula de status, seletor de ano escolar por botões, aviso de rede
caída. Cada um com estado de foco visível — o dedo erra, o teclado precisa funcionar.

**2.5 — A proveta.** O cronômetro é o objeto mais visto da plataforma e merece ser um
componente próprio, com três estados: normal, últimos cinco minutos, e tempo esgotado.
Precisa ser legível a três metros de distância.

**2.6 — Teste dos extremos.** A mesma tela no sol e no escuro. Contraste conferido de
verdade, não no olhômetro. Alvo de toque medido em celular real, não no navegador do
computador.

**Entrega:** uma página `/estilo` com todos os componentes juntos. É onde a gente discute
e ajusta o visual **antes** de existir tela de produto — muito mais barato de mudar ali.

---

## Etapa 3 — Admin e conteúdo · médio

Vem cedo porque todo o resto lê estes dados.

Configuração do evento (todos os parâmetros da seção 4 da ata), cadastro de estações com
ordem e peso, cadastro de perguntas com pré-visualização de como o jogador vai ver, geração
da folha de QRs para impressão, e o acesso separado do grupo das perguntas — que entra,
cadastra e não alcança mais nada.

**Entrega:** dá para montar uma sala fictícia inteira no painel.

---

## Etapa 4 — Cadastro e fila · pesado

Aqui mora a regra de negócio mais difícil do projeto. Não é tela, é lógica.

**4.1 — Cadastro em três passos.** Equipe → integrantes → confirmação. Menos teclado
possível: ano escolar por botões, um único e-mail obrigatório.

**4.2 — Código da equipe e o roteador.** O celular guarda o código; a raiz `/` decide sozinha
onde a pessoa cai (cadastro, fila, estação, avaliação). O jogador nunca escolhe para onde ir.

**4.3 — Motor da fila.** Posição, lote da manhã e da tarde, capacidade do dia calculada a
partir da duração e do reset, e encerramento automático quando o dia enche.

**4.4 — Estimativa que se corrige.** A previsão da vez usa a duração real observada no dia,
não o número configurado. É isso que impede o efeito cascata quando uma sessão estoura.

**4.5 — Regras de exceção.** Ausência depois da chamada, cancelamento, equipe duplicada,
fila cheia, pessoa que perdeu o código. Cada uma com comportamento decidido **antes**,
não improvisado no dia.

**4.6 — Tempo real.** A página da fila se atualizando sozinha, sem a pessoa recarregar.

**Entrega:** simulação de vinte equipes se agendando, com a fila se comportando direito.

---

## Etapa 5 — Sessão e painel do instrutor · o mais pesado

A etapa mais difícil e a que mais aparece no dia da feira. Se algo vai dar problema ao vivo,
vai ser aqui.

**5.1 — Check-in e início.** Confirmar presença, validar os anos declarados, abrir a sessão.

**5.2 — Cronômetro no servidor.** O tempo **não** pode viver no celular: se o instrutor
recarregar a página, o cronômetro não pode zerar. O servidor guarda o instante de início e
o celular só desenha.

**5.3 — Roteamento do QR.** Estação lida → confere sessão ativa, estação liberada e ordem →
serve a pergunta. Toda a proteção contra abrir pergunta fora de hora está aqui.

**5.4 — A pergunta.** Tempo limite, tentativas, registro de cada resposta com quanto tempo
levou.

**5.5 — Cronometragem automática por estação.** Abrir a estação seguinte fecha a anterior
sozinha. É o que entrega tempo por estação sem ninguém anotar nada.

**5.6 — Observações por toque.** Os botões L/A/E nos jogadores, com fila local: se o Wi-Fi
cair no meio da sessão, o toque não se perde — sobe quando a rede volta.

**5.7 — Dica, pausa, encerramento, aborto.** Inclusive o caso feio: sessão que precisa ser
interrompida no meio.

**5.8 — Fechamento.** Rubrica de 1 a 5 já pré-sugerida pelos toques da sessão; o instrutor
só ajusta e confirma.

**Entrega:** uma sessão completa, jogável de celular, do check-in ao fechamento.

---

## Etapa 6 — Pontuação e placar · médio

Curto em código, delicado em consequência: é o que decide o prêmio.

Motor que calcula as quatro parcelas e guarda cada uma separada. Categorias e regra de
desempate. Placar público para TV — que é o único desenho pensado para ser visto de longe,
e por isso pede mais cuidado visual que o resto. Placar com auditoria, mostrando de onde
veio cada ponto.

**Entrega:** o sistema aponta um vencedor e explica o resultado parcela por parcela.

---

## Etapa 7 — Fechamento e ensaio geral · leve

Avaliação feita pelo jogador (com as perguntas definidas no painel, então não depende de
decisão agora), relatório da sessão, e o e-mail de confirmação com convite de calendário —
este último só se houver domínio (ver bloqueios).

E o ensaio: revisão das permissões no banco, limite de tentativas, comportamento com Wi-Fi
caindo, e **uma rodada com pessoas de verdade que não participaram do projeto.** Essa última
parte não é opcional — é onde aparecem os problemas que a gente não consegue enxergar.

---

## Bloqueios reais para começar

### 1. Autorização
Nada de código de plataforma começa sem o seu "vai".

### 2. Contas de serviço
| Serviço | Para que | Situação |
|---|---|---|
| Supabase | Banco, autenticação, tempo real | Há conexão nesta sessão — dá para criar o projeto |
| Vercel | Hospedagem e HTTPS | Precisa ser criada por você, ligada ao GitHub |
| Resend | E-mail de confirmação e lembrete | Ver o problema abaixo |

### 3. O problema do e-mail
O Resend só envia para **endereços quaisquer** a partir de um **domínio verificado** por DNS.
Sem domínio, o modo de teste envia apenas para o e-mail do dono da conta — o que não serve
para avisar cem visitantes. Três saídas:

1. **Registrar um domínio barato** (algo como `escapequimico.com.br`, na faixa de R$ 40/ano).
   É a saída limpa, e o endereço fica bonito no QR impresso do totem.
2. **Enviar por SMTP do Gmail** com uma conta criada para o projeto. Funciona, é grátis,
   tem limite diário e vai para spam com mais facilidade.
3. **Não enviar e-mail.** A página da fila já se atualiza ao vivo e o instrutor chama em voz
   alta. O e-mail passa a ser só confirmação do cadastro, opcional.

Só a etapa 7 depende disso. As outras seis seguem sem resposta.

### 4. Quem mexe no código
Se mais alguém do grupo vai programar, vale combinar branch por pessoa. Se é só você,
seguimos direto na branch do projeto.
