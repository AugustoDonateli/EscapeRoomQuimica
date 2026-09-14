-- O que os jogadores vão avaliar ficou em aberto na ata desde a primeira
-- conversa. Em vez de esperar a decisão, as perguntas viram conteúdo editável
-- no painel — assim a decisão pode ser tomada na semana da feira, por quem
-- quiser, sem mexer em código.
--
-- Formato de cada pergunta: {"id":"...","texto":"...","tipo":"estrelas"|"texto"}
alter table event_config
  add column perguntas_avaliacao jsonb not null default '[
    {"id": "sala",      "texto": "O que vocês acharam da sala de fuga?",            "tipo": "estrelas"},
    {"id": "perguntas", "texto": "As perguntas de química estavam justas?",          "tipo": "estrelas"},
    {"id": "instrutor", "texto": "O instrutor explicou bem as regras?",              "tipo": "estrelas"},
    {"id": "favorita",  "texto": "Qual estação foi a mais divertida? Por quê?",      "tipo": "texto"},
    {"id": "melhorar",  "texto": "O que a gente deveria melhorar para a próxima?",   "tipo": "texto"}
  ]'::jsonb;

-- Uma avaliação por sessão. A equipe responde junto, no celular de quem estiver
-- com ele na mão — e reenviar por engano não pode criar duas linhas.
create unique index player_feedback_uma_por_sessao on player_feedback (session_id);
