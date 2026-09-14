# Revisão de segurança e endurecimento

Parte da etapa 7 do [plano](./plano.md). Registra o que foi conferido, o que foi
corrigido e — mais importante — **as decisões que parecem problema e não são**, para
ninguém "consertar" depois e abrir um buraco.

Última revisão: 14/09/2026, com o analisador do Supabase (`get_advisors`).

---

## O desenho de acesso

**Nega tudo por padrão.** RLS ligado em todas as 16 tabelas. Só existem três políticas de
leitura pública, e só onde a informação é pública de verdade:

| Tabela | Política | Por quê |
|---|---|---|
| `event_config` | leitura pública | Duração da sessão e horários aparecem no totem |
| `station` | leitura das ativas | O jogador precisa saber onde está |
| `score` | leitura pública | É o placar |
| `profile` | cada um lê o próprio | Descobrir o papel sem usar a chave de serviço |

Todo o resto — perguntas, equipes, respostas, sessões, observações, rubrica, auditoria — é
**inalcançável pela chave que roda no navegador**. Quem lê e escreve isso é o servidor, com
a chave de serviço, depois de conferir papel e dono.

**Não existe leitura pública de `question`, de propósito.** Se houvesse, qualquer pessoa
acharia as respostas antes da feira com uma requisição.

### O que o analisador aponta e nós mantemos

O analisador lista **12 tabelas com "RLS ligado e nenhuma política"** em nível INFO. Isso é
exatamente o desenho: RLS ligado sem política significa *negar tudo* para a chave pública.
Adicionar política nessas tabelas para "resolver o aviso" seria abrir acesso que hoje não
existe. **Não mexa nisso sem pensar duas vezes.**

Também lista **8 chaves estrangeiras sem índice** e **16 índices nunca usados**, os dois em
INFO. Os índices de chave estrangeira só pesam ao apagar linha do pai, o que não acontece
durante a feira; e os "nunca usados" estão assim porque o banco ainda não recebeu tráfego
real — vão ser usados no dia. Nenhum dos dois foi mexido.

## Corrigido nesta revisão

- **Política do perfil reavaliada linha por linha.** `auth.uid()` solto virou
  `(select auth.uid())`. Migração `0007`.

## Pendente, e só você pode fazer

- **Proteção contra senha vazada está desligada** (aviso WARN). O Supabase compara a senha
  com a base do HaveIBeenPwned. Liga-se no painel, em *Authentication → Providers → Email*.
  Vale ligar antes de trocar as senhas provisórias das contas da equipe.
- **Trocar as senhas provisórias** das três contas criadas no desenvolvimento.

## Defesas no código, e o que cada uma impede

| Onde | Defesa | O que impede |
|---|---|---|
| Toda ação de servidor | `exigirPapel` dentro da função, não só no middleware | Ação é alcançável por POST direto, sem passar pela tela |
| `/e/[slug]` | Ordem das estações conferida a cada leitura | Ler o QR da última estação e pular o jogo |
| `/e/[slug]` | Tentativas por pergunta, com índice único por tentativa | Força bruta na resposta |
| Cancelar vaga | Código tem que ser o guardado neste celular | Derrubar a equipe da frente mandando o código dela |
| Cadastro | Um e-mail, uma equipe na fila | Cadastrar três equipes para pegar posição melhor |
| Recuperar código | Exige nome **e** e-mail | Descobrir quais e-mails estão cadastrados |
| Avaliação | Respostas validadas contra as perguntas configuradas | Campo inventado entrando no banco |
| Rubrica | Só aceita jogador que pertence àquela sessão | Gravar nota em jogador de outra equipe |
| Observações | Id gerado no celular, com índice único | Reenvio depois de queda de rede contar em dobro |
| Chave de serviço | Só em `src/lib/supabase/server.ts`, nunca importada no cliente | A chave vazar no pacote de JavaScript |

## O que **não** está implementado, e é honesto dizer

- **Limite por endereço de rede (IP).** Não existe. As defesas são por e-mail, por equipe e
  por sessão. Para uma feira escolar, com instrutor olhando, é proporcional.
- **Impedir pesquisa na internet.** É impossível em celular pessoal, como está registrado na
  ata desde o começo. O que existe é o desenho das perguntas (o dado está na sala) e, se a
  organização ligar, o registro de saída de tela — que **avisa o jogador** que está sendo
  registrado, porque vigiar sem contar não dissuade e não seria honesto.
- **O código da equipe é o segredo** do convite de calendário e do relatório. São seis
  caracteres num alfabeto de 32, o que dá cerca de um bilhão de combinações; e o que está
  atrás é o nome da equipe e o horário estimado. Proporcional ao risco.
- **LGPD:** existe em `/admin/dados`. Anonimiza em vez de apagar — nome e e-mail saem,
  estatística fica — porque apagar a equipe levaria a sessão e a pontuação em cascata e o
  placar da feira desapareceria. Exige digitar uma frase de confirmação.
