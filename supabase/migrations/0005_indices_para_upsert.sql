-- O Postgres só aceita ON CONFLICT quando consegue casar as colunas com um
-- índice único simples. Índice de expressão (com coalesce) e índice parcial
-- (com where) não servem de árbitro de forma confiável — e o erro só apareceria
-- na hora de gravar, no dia da feira.

-- Rubrica: a avaliação é por jogador. Linha de equipe inteira (player_id nulo)
-- não é usada pelo fechamento, então o índice simples basta e deixa o upsert
-- funcionar.
drop index if exists rubric_score_unica;
create unique index rubric_score_unica on rubric_score (session_id, player_id, criterio);

-- Observação: índice simples em cliente_id. Nulo não conflita com nulo no
-- Postgres, então as observações antigas sem id de cliente continuam válidas e
-- a idempotência do reenvio continua garantida para as novas.
drop index if exists observation_cliente_unico;
create unique index observation_cliente_unico on observation (cliente_id);
