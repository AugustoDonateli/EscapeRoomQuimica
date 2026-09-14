-- Se a ordem das estações é livre ou fixa é decisão da equipe das estações, e
-- quantas tentativas cada pergunta aceita é decisão da equipe das perguntas.
-- Nenhuma das duas pode estar escrita no código.
alter table event_config
  add column ordem_livre boolean not null default false,
  add column tentativas_por_pergunta smallint not null default 3
    check (tentativas_por_pergunta between 1 and 10);

-- O instrutor toca em observações durante a sessão inteira, e o Wi-Fi da sala
-- pode cair no meio. O toque fica guardado no celular e sobe quando a rede
-- volta — mas subir de novo não pode virar toque em dobro, senão a nota da
-- equipe cresce por causa de rede ruim. O id vem do celular e o banco recusa
-- repetido.
alter table observation
  add column cliente_id uuid;

create unique index observation_cliente_unico
  on observation (cliente_id)
  where cliente_id is not null;

-- A tela do instrutor lê, a cada poucos segundos, quais estações a equipe já
-- concluiu. Este índice é o caminho dessa leitura.
create index session_station_concluidas
  on session_station (session_id, concluida_em);
