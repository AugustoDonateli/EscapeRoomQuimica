# Telas e modelo de dados

Versão visual (com as telas desenhadas): **https://claude.ai/code/artifact/1fd4f6b4-43cf-42b8-9dde-333b970b18f8**

## Rotas

### Jogador — sem senha, entra pelo código da equipe
| Rota | Tela |
|---|---|
| `/` | Entrada pelo QR/NFC do totem |
| `/cadastro` | Cadastro da equipe (nome, integrantes + ano, e-mail do capitão, consentimento) |
| `/fila/:codigo` | Cartão da fila em tempo real: posição, janela estimada, status |
| `/e/:estacao` | Pergunta da estação (só com sessão ativa e estação liberada) |
| `/avaliar/:codigo` | Avaliação feita pelo jogador |
| `/resultado/:codigo` | Relatório da sessão + posição no placar |

### Instrutor — login real
| Rota | Tela |
|---|---|
| `/i` | A sala agora: sessão atual, próxima equipe, capacidade restante |
| `/i/checkin/:codigo` | Check-in: confirma presença e valida os anos declarados |
| `/i/sessao/:id` | **Sessão ao vivo** — tela crítica: cronômetro, estação, observações, dica, pausa |
| `/i/sessao/:id/fechar` | Rubrica 1–5 pré-sugerida pelos toques |
| `/i/fila` | Chamar próxima, marcar ausência, reordenar |

### Admin
| Rota | Tela |
|---|---|
| `/admin` | Configuração do evento (todos os parâmetros da seção 4 da ata) |
| `/admin/estacoes` | Estações + geração da folha de QRs para impressão |
| `/admin/perguntas` | Perguntas (acesso do grupo das perguntas) |
| `/admin/placar` | Placar com auditoria de cada ponto |
| `/placar` | Placar público para TV/projetor |

## Tabelas

**Configuração** — `event_config` (linha única), `station`, `question`
**Pessoas e fila** — `team`, `player`, `queue_entry`, `profile`
**Jogo** — `session`, `session_station`, `answer`, `hint`
**Avaliação** — `observation`, `rubric_score`, `player_feedback`
**Resultado** — `score`, `audit_log`

Três tabelas merecem explicação:

- **`session_station`** é o cronômetro automático. Abrir o QR da estação 3 fecha a linha da
  estação 2. Tempo por estação, tempo total e ponto onde a equipe travou saem daí, sem
  ninguém anotar nada.
- **`observation`** é a memória da justiça. Cada toque do instrutor fica gravado com hora.
  Se uma equipe contestar o prêmio, a nota deixa de ser opinião e passa a ser linha do tempo.
- **`score`** guarda as quatro parcelas separadas (progresso, precisão, tempo relativo,
  instrutor). Dá para explicar o resultado componente por componente e mudar um peso sem
  refazer conta à mão.

## Direção de design

Mobile-first orientado por **contexto físico**, não por tamanho de tela:

| Usuário | Onde está | Consequência no desenho |
|---|---|---|
| Jogador na fila | Em pé na feira, uma mão livre | Tela-cartão, número gigante, sem scroll, atualiza sozinha |
| Jogador na estação | Dentro da sala, com pressa, luz baixa | Tema escuro; pergunta, resposta, cronômetro. Sem navegação |
| Instrutor | Andando, olhando os jogadores | Botões de 64 px, zero digitação, uma tela só |
| Público | TV a 5 metros | A única tela que não é mobile |

Regras: toque de 48 px (64 px no instrutor); uma ação principal por tela; contraste alto
para sol e para sala escura; ano escolar por botões em vez de lista; estado da conexão
sempre visível pro instrutor; cronômetro e placar em fonte monoespaçada.
