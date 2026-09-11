# Plano de construção em etapas

Cada etapa termina com **algo que funciona e pode ser demonstrado**. Se o tempo acabar na
etapa 3, existe um produto na etapa 3 — não um esqueleto de sete etapas pela metade.

## Etapa 0 — Base e identidade
Projeto Next.js + TypeScript, banco Supabase criado, deploy na Vercel com URL viva, tokens de
design da seção 12 aplicados (cores, tipografia, cantos, marca).
**Entrega:** endereço no ar, com a cara do Escape Químico e nada dentro.

## Etapa 1 — Admin e conteúdo
Configuração do evento, cadastro de estações, cadastro de perguntas, geração da folha de QRs
para impressão. Acesso separado para o grupo das perguntas.
**Entrega:** dá para montar uma sala fictícia inteira no painel.
*Vem primeiro porque todo o resto lê estes dados.*

## Etapa 2 — Cadastro e fila
Totem de entrada por QR/NFC, cadastro de equipe (nome, integrantes com ano, e-mail do capitão,
consentimento), fila virtual com posição e estimativa ao vivo, capacidade do dia e liberação
em lotes.
**Entrega:** dá para simular vinte equipes se agendando e ver a fila se comportar.

## Etapa 3 — Sessão e painel do instrutor
Check-in, cronômetro automático, QR das estações servindo as perguntas, contador de dicas,
pausa, registro de observações por toque.
**Entrega:** uma sessão completa, jogável de celular, do início ao encerramento.

## Etapa 4 — Pontuação e placar
Motor de pontuação com pesos configuráveis, tela de fechamento com rubrica pré-sugerida,
placar público para TV e placar com auditoria.
**Entrega:** o sistema aponta um vencedor e explica de onde veio cada ponto.

## Etapa 5 — Avaliação e e-mail
Avaliação feita pelos jogadores (formulário definido no painel), relatório da sessão,
e-mail de confirmação com convite de calendário.
*Depende da questão de domínio de e-mail — ver bloqueios.*

## Etapa 6 — Endurecimento
Revisão de permissões e RLS, limite de tentativas, PWA e resistência a queda de Wi-Fi no
painel do instrutor, ensaio geral com pessoas de verdade.
**Entrega:** plataforma pronta para um dia de feira com gente nervosa usando.

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

A etapa 5 é a única que depende disso. Todas as outras seguem sem resposta.

### 4. Quem mexe no código
Se mais alguém do grupo vai programar, vale combinar branch por pessoa. Se é só você,
seguimos direto na branch do projeto.
