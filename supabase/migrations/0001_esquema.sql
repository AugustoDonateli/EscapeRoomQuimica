-- ============================================================================
-- Escape Químico — esquema inicial (etapa 1)
--
-- Dezesseis tabelas, agrupadas por função. A ordem de criação segue as
-- dependências: configuração, pessoas, fila, jogo, avaliação, resultado.
--
-- Segurança: RLS fica LIGADO em tudo e só existe política de leitura pública
-- onde a informação é realmente pública (configuração do evento, estações
-- ativas, placar). Todo o resto é negado por padrão e só o servidor alcança,
-- com a chave de serviço. O endurecimento fino é a etapa 7 do plano.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type papel_perfil as enum ('admin', 'instrutor', 'autor');
create type status_fila as enum ('aguardando', 'chamada', 'em_jogo', 'concluida', 'no_show', 'cancelada');
create type status_sessao as enum ('em_andamento', 'pausada', 'concluida', 'abortada');
create type tipo_pergunta as enum ('texto', 'multipla');
create type tipo_observacao as enum ('liderou', 'ajudou', 'explicou', 'seguranca', 'passivo', 'atropelou');
create type categoria_equipe as enum ('iniciante', 'avancado');
create type turno_lote as enum ('manha', 'tarde');

-- ---------------------------------------------------------------------------
-- 1. Configuração
-- ---------------------------------------------------------------------------

-- Linha única. Tudo que depende de outra equipe da sala mora aqui, para que
-- nenhum número precise ser escrito no código. A trava do id garante que
-- existe no máximo uma configuração.
create table event_config (
  id                    boolean primary key default true,
  nome_evento           text        not null default 'Escape Químico',
  data_evento           date,
  abre_em               time,
  fecha_em              time,
  duracao_sessao_min    integer     not null default 20,
  reset_min             integer     not null default 5,
  lote_manha_abre_em    time        not null default '08:00',
  lote_tarde_abre_em    time        not null default '11:00',
  equipe_min            integer     not null default 2,
  equipe_max            integer     not null default 6,
  anos_participantes    integer[]   not null default '{1,2,3,4}',
  rotulos_anos          jsonb       not null default '{"1":"1º","2":"2º","3":"3º","4":"4º"}',
  tempo_limite_pergunta_s integer   not null default 90,
  penalidade_dica       numeric(4,3) not null default 0.05,
  peso_progresso        numeric(4,3) not null default 0.40,
  peso_precisao         numeric(4,3) not null default 0.25,
  peso_tempo            numeric(4,3) not null default 0.15,
  peso_instrutor        numeric(4,3) not null default 0.20,
  usar_categorias       boolean     not null default true,
  corte_categoria       numeric(3,1) not null default 2.5,
  nota_individual_no_premio boolean not null default false,
  detectar_saida_de_tela boolean    not null default false,
  ausencia_tolerancia_min integer   not null default 3,
  atualizado_em         timestamptz not null default now(),
  constraint event_config_linha_unica check (id),
  constraint event_config_pesos_somam_um
    check (peso_progresso + peso_precisao + peso_tempo + peso_instrutor = 1)
);

-- O slug é o que vai impresso no QR da estação: /e/<slug>. Estático, porque
-- cartaz impresso não se atualiza.
create table station (
  id               uuid primary key default gen_random_uuid(),
  slug             text        not null unique,
  nome             text        not null,
  ordem            integer     not null,
  peso_dificuldade numeric(4,2) not null default 1.00,
  tem_pergunta     boolean     not null default true,
  ativa            boolean     not null default true,
  criada_em        timestamptz not null default now(),
  constraint station_slug_formato check (slug ~ '^[A-Za-z0-9-]{2,32}$'),
  constraint station_ordem_positiva check (ordem > 0)
);
create unique index station_ordem_unica on station (ordem) where ativa;

create table question (
  id              uuid primary key default gen_random_uuid(),
  station_id      uuid        not null references station (id) on delete cascade,
  enunciado       text        not null,
  tipo            tipo_pergunta not null default 'texto',
  alternativas    text[],
  resposta        text        not null,
  tempo_limite_s  integer,
  ordem           integer     not null default 1,
  ativa           boolean     not null default true,
  criada_em       timestamptz not null default now(),
  -- Pergunta de múltipla escolha sem alternativas não tem como ser respondida.
  constraint question_multipla_tem_alternativas
    check (tipo <> 'multipla' or (alternativas is not null and array_length(alternativas, 1) >= 2))
);
create index question_por_estacao on question (station_id, ordem);

-- ---------------------------------------------------------------------------
-- 2. Pessoas e fila
-- ---------------------------------------------------------------------------

-- Instrutor, admin e autor de conteúdo. O id espelha auth.users do Supabase.
create table profile (
  id        uuid primary key,
  nome      text        not null,
  papel     papel_perfil not null default 'instrutor',
  ativo     boolean     not null default true,
  criado_em timestamptz not null default now()
);

-- O jogador não tem senha: o celular guarda o codigo_acesso da equipe.
create table team (
  id            uuid primary key default gen_random_uuid(),
  nome          text        not null,
  codigo_acesso text        not null unique,
  email_capitao text        not null,
  categoria     categoria_equipe,
  media_ano     numeric(3,1),
  criada_em     timestamptz not null default now(),
  constraint team_nome_nao_vazio check (length(btrim(nome)) between 2 and 60),
  constraint team_email_formato check (email_capitao ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')
);

create table player (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid        not null references team (id) on delete cascade,
  nome        text        not null,
  ano_escolar integer     not null,
  criado_em   timestamptz not null default now(),
  constraint player_ano_plausivel check (ano_escolar between 1 and 12)
);
create index player_por_equipe on player (team_id);

-- Uma entrada por equipe. A estimativa é recalculada com a duração real
-- observada no dia, e não com o número configurado — é isso que evita o
-- efeito cascata quando uma sessão estoura.
create table queue_entry (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid        not null unique references team (id) on delete cascade,
  lote           turno_lote  not null,
  posicao        integer     not null,
  status         status_fila not null default 'aguardando',
  estimativa_de  timestamptz,
  estimativa_ate timestamptz,
  chamada_em     timestamptz,
  criada_em      timestamptz not null default now(),
  constraint queue_entry_posicao_positiva check (posicao > 0)
);
create index queue_entry_ordem on queue_entry (lote, posicao);
create index queue_entry_por_status on queue_entry (status);

-- ---------------------------------------------------------------------------
-- 3. Jogo
-- ---------------------------------------------------------------------------

-- iniciada_em é a fonte da verdade do cronômetro: o tempo é calculado no
-- servidor a partir dela, nunca guardado no celular do instrutor.
-- pausas guarda os intervalos que não contam: [{"de":"...","ate":"..."}]
create table session (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid        not null references team (id) on delete cascade,
  instrutor_id  uuid        references profile (id) on delete set null,
  iniciada_em   timestamptz not null default now(),
  encerrada_em  timestamptz,
  pausas        jsonb       not null default '[]',
  status        status_sessao not null default 'em_andamento',
  constraint session_fim_depois_do_inicio
    check (encerrada_em is null or encerrada_em >= iniciada_em)
);
create index session_por_equipe on session (team_id);
create index session_abertas on session (status) where status in ('em_andamento', 'pausada');

-- O cronômetro automático: abrir o QR da estação seguinte fecha a linha da
-- anterior. Tempo por estação sai daqui, sem ninguém anotar nada.
create table session_station (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid        not null references session (id) on delete cascade,
  station_id    uuid        not null references station (id) on delete cascade,
  aberta_em     timestamptz not null default now(),
  concluida_em  timestamptz,
  unique (session_id, station_id),
  constraint session_station_fim_depois_do_inicio
    check (concluida_em is null or concluida_em >= aberta_em)
);
create index session_station_por_sessao on session_station (session_id, aberta_em);

create table answer (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid        not null references session (id) on delete cascade,
  question_id   uuid        not null references question (id) on delete cascade,
  player_id     uuid        references player (id) on delete set null,
  resposta_dada text        not null,
  correta       boolean     not null,
  tentativa_n   integer     not null default 1,
  ms_gastos     integer,
  respondida_em timestamptz not null default now(),
  constraint answer_tentativa_positiva check (tentativa_n > 0)
);
create index answer_por_sessao on answer (session_id, respondida_em);
create unique index answer_tentativa_unica on answer (session_id, question_id, tentativa_n);

create table hint (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid        not null references session (id) on delete cascade,
  station_id  uuid        references station (id) on delete set null,
  instrutor_id uuid       references profile (id) on delete set null,
  dada_em     timestamptz not null default now()
);
create index hint_por_sessao on hint (session_id);

-- ---------------------------------------------------------------------------
-- 4. Avaliação
-- ---------------------------------------------------------------------------

-- Cada toque do instrutor, com hora. É a memória da justiça: se a equipe
-- contestar o prêmio, a nota deixa de ser opinião e passa a ser linha do tempo.
create table observation (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid        not null references session (id) on delete cascade,
  player_id     uuid        not null references player (id) on delete cascade,
  tipo          tipo_observacao not null,
  registrada_em timestamptz not null default now()
);
create index observation_por_sessao on observation (session_id, registrada_em);
create index observation_por_jogador on observation (player_id);

-- player_id nulo significa nota da equipe inteira, não de um jogador.
create table rubric_score (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid        not null references session (id) on delete cascade,
  player_id  uuid        references player (id) on delete cascade,
  criterio   text        not null,
  nota       smallint    not null,
  criada_em  timestamptz not null default now(),
  constraint rubric_score_nota_de_um_a_cinco check (nota between 1 and 5)
);
create unique index rubric_score_unica on rubric_score (session_id, coalesce(player_id, '00000000-0000-0000-0000-000000000000'::uuid), criterio);

-- As perguntas do formulário são definidas no painel, então isto guarda as
-- respostas em jsonb em vez de uma coluna por pergunta.
create table player_feedback (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid        not null references session (id) on delete cascade,
  respostas  jsonb       not null,
  anonimo    boolean     not null default true,
  criada_em  timestamptz not null default now()
);
create index player_feedback_por_sessao on player_feedback (session_id);

-- ---------------------------------------------------------------------------
-- 5. Resultado
-- ---------------------------------------------------------------------------

-- As quatro parcelas ficam guardadas separadas: dá para explicar o resultado
-- componente por componente e mudar um peso sem refazer conta à mão.
create table score (
  session_id       uuid primary key references session (id) on delete cascade,
  progresso        numeric(6,2) not null default 0,
  precisao         numeric(6,2) not null default 0,
  tempo_relativo   numeric(6,2) not null default 0,
  instrutor        numeric(6,2) not null default 0,
  total            numeric(7,2) not null default 0,
  categoria        categoria_equipe,
  calculado_em     timestamptz not null default now()
);
create index score_ranking on score (categoria, total desc);

create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid        references profile (id) on delete set null,
  acao       text        not null,
  alvo       text,
  antes      jsonb,
  depois     jsonb,
  em         timestamptz not null default now()
);
create index audit_log_recente on audit_log (em desc);

-- ---------------------------------------------------------------------------
-- Políticas de acesso
--
-- Nega tudo por padrão; libera leitura apenas do que é público de verdade.
-- Toda escrita passa pelo servidor com a chave de serviço, que ignora RLS —
-- assim a validação acontece no servidor e não no celular de quem joga.
-- ---------------------------------------------------------------------------
alter table event_config     enable row level security;
alter table station          enable row level security;
alter table question         enable row level security;
alter table profile          enable row level security;
alter table team             enable row level security;
alter table player           enable row level security;
alter table queue_entry      enable row level security;
alter table session          enable row level security;
alter table session_station  enable row level security;
alter table answer           enable row level security;
alter table hint             enable row level security;
alter table observation      enable row level security;
alter table rubric_score     enable row level security;
alter table player_feedback  enable row level security;
alter table score            enable row level security;
alter table audit_log        enable row level security;

create policy "configuracao do evento e publica"
  on event_config for select using (true);

create policy "estacoes ativas sao publicas"
  on station for select using (ativa);

create policy "placar e publico"
  on score for select using (true);

-- Não existe política de leitura para question: se o banco de perguntas fosse
-- legível pela chave pública, alguém acharia as respostas antes da feira.
