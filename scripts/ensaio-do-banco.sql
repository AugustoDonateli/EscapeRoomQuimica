-- Ensaio de uma sessão inteira, direto no banco.
--
-- POR QUE ISTO EXISTE: até 16/09/2026 o banco de produção nunca tinha guardado
-- uma sessão. Tudo depois do check-in — cronômetro, estações, respostas,
-- dicas, toques do instrutor, avaliação, placar — só havia rodado contra o
-- dublê local. E o dublê já escondeu um defeito antes: ele sempre mandava
-- horário preenchido, e por isso o abre_em nulo só apareceu na primeira
-- publicação de verdade.
--
-- O que este ensaio cobre: o ESQUEMA. Enums, chaves estrangeiras, a escala das
-- notas e, principalmente, as quatro promessas de idempotência em que o
-- aplicativo se apoia quando a rede da feira cai e o celular reenvia:
--
--   1. ler duas vezes o QR da mesma estação não reabre a estação
--   2. o mesmo toque reenviado não vira dois toques
--   3. salvar a avaliação de novo corrige a nota em vez de duplicar
--   4. recalcular o placar substitui a linha em vez de empilhar
--
-- O que ele NÃO cobre: o código do site. Para isso é preciso abrir o navegador
-- e jogar de verdade.
--
-- COMO RODAR: cole no SQL Editor do Supabase e execute inteiro. Ele escreve com
-- o nome ZZ-ENSAIO, confere, e apaga tudo que criou no fim — o banco volta
-- exatamente como estava. Exige pelo menos duas estações com pergunta ativa.

begin;

create temp table resultado(passo text, esperado text, obtido text, ok boolean) on commit drop;

do $$
declare
  v_team uuid; v_p1 uuid; v_p2 uuid; v_sessao uuid;
  v_e1 uuid; v_e2 uuid; v_q1 uuid; v_q2 uuid;
  v_cliente uuid := gen_random_uuid();
begin
  select id into v_e1 from station where ativa and tem_pergunta order by ordem limit 1;
  select id into v_e2 from station where ativa and tem_pergunta and id <> v_e1 order by ordem limit 1;
  select id into v_q1 from question where station_id = v_e1 and ativa order by ordem limit 1;
  select id into v_q2 from question where station_id = v_e2 and ativa order by ordem limit 1;

  if v_q1 is null or v_q2 is null then
    raise exception 'o ensaio precisa de duas estações ativas com pergunta ativa';
  end if;

  insert into team (nome, codigo_acesso, email_capitao, categoria, media_ano)
  values ('ZZ-ENSAIO', 'ZZZ-ENS', 'ensaio@exemplo.invalid', 'avancado', 3.5)
  returning id into v_team;

  insert into player (team_id, nome, ano_escolar) values (v_team, 'ZZ-Ensaio Um', 3) returning id into v_p1;
  insert into player (team_id, nome, ano_escolar) values (v_team, 'ZZ-Ensaio Dois', 4) returning id into v_p2;

  insert into queue_entry (team_id, lote, posicao, status, chamada_em)
  values (v_team, 'manha', 999, 'em_jogo', now());

  insert into session (team_id, iniciada_em, status)
  values (v_team, now() - interval '18 minutes', 'em_andamento')
  returning id into v_sessao;

  -- 1. A mesma estação lida duas vezes.
  insert into session_station (session_id, station_id, aberta_em)
  values (v_sessao, v_e1, now() - interval '17 minutes')
  on conflict (session_id, station_id) do nothing;
  insert into session_station (session_id, station_id, aberta_em)
  values (v_sessao, v_e1, now())
  on conflict (session_id, station_id) do nothing;

  insert into answer (session_id, question_id, resposta_dada, correta, tentativa_n, ms_gastos)
  values (v_sessao, v_q1, 'errada', false, 1, 21000),
         (v_sessao, v_q1, 'certa',  true,  2, 34000);
  update session_station set concluida_em = now() - interval '12 minutes'
  where session_id = v_sessao and station_id = v_e1;

  insert into hint (session_id, station_id) values (v_sessao, v_e1);

  insert into session_station (session_id, station_id, aberta_em)
  values (v_sessao, v_e2, now() - interval '11 minutes')
  on conflict (session_id, station_id) do nothing;
  insert into answer (session_id, question_id, resposta_dada, correta, tentativa_n, ms_gastos)
  values (v_sessao, v_q2, 'certa de primeira', true, 1, 15000);
  update session_station set concluida_em = now() - interval '6 minutes'
  where session_id = v_sessao and station_id = v_e2;

  -- 2. O mesmo toque reenviado pela rede ruim.
  insert into observation (session_id, player_id, tipo, cliente_id)
  values (v_sessao, v_p1, 'liderou', v_cliente) on conflict (cliente_id) do nothing;
  insert into observation (session_id, player_id, tipo, cliente_id)
  values (v_sessao, v_p1, 'liderou', v_cliente) on conflict (cliente_id) do nothing;
  insert into observation (session_id, player_id, tipo, cliente_id)
  values (v_sessao, v_p2, 'ajudou', gen_random_uuid());
  insert into observation (session_id, player_id, tipo, cliente_id)
  values (v_sessao, v_p2, 'passivo', gen_random_uuid());

  update session set status = 'concluida', encerrada_em = now() - interval '2 minutes'
  where id = v_sessao;

  -- 3. A avaliação salva duas vezes, a segunda corrigindo uma nota.
  insert into rubric_score (session_id, player_id, criterio, nota) values
    (v_sessao, v_p1, 'colaboracao', 5), (v_sessao, v_p1, 'raciocinio', 4),
    (v_sessao, v_p1, 'seguranca', 5),   (v_sessao, v_p1, 'autonomia', 4),
    (v_sessao, v_p2, 'colaboracao', 3), (v_sessao, v_p2, 'raciocinio', 3),
    (v_sessao, v_p2, 'seguranca', 4),   (v_sessao, v_p2, 'autonomia', 3)
  on conflict (session_id, player_id, criterio) do update set nota = excluded.nota;
  insert into rubric_score (session_id, player_id, criterio, nota)
  values (v_sessao, v_p1, 'colaboracao', 2)
  on conflict (session_id, player_id, criterio) do update set nota = excluded.nota;

  -- 4. O placar recalculado.
  insert into score (session_id, progresso, precisao, tempo_relativo, instrutor, total, categoria)
  values (v_sessao, 0.4, 0.75, 0.6, 0.8, 612.5, 'avancado')
  on conflict (session_id) do update set total = excluded.total;
  insert into score (session_id, progresso, precisao, tempo_relativo, instrutor, total, categoria)
  values (v_sessao, 0.4, 0.75, 0.6, 0.8, 640.0, 'avancado')
  on conflict (session_id) do update set total = excluded.total;

  update queue_entry set status = 'concluida' where team_id = v_team;

  insert into resultado
  select 'QR da mesma estação lido duas vezes', '1 abertura', count(*)::text || ' abertura(s)', count(*) = 1
  from session_station where session_id = v_sessao and station_id = v_e1;

  insert into resultado
  select 'toque do instrutor reenviado', '3 toques', count(*)::text || ' toques', count(*) = 3
  from observation where session_id = v_sessao;

  insert into resultado
  select 'avaliação salva duas vezes', '8 notas', count(*)::text || ' notas', count(*) = 8
  from rubric_score where session_id = v_sessao;

  insert into resultado
  select 'nota corrigida na segunda gravação', 'nota 2', 'nota ' || nota::text, nota = 2
  from rubric_score where session_id = v_sessao and player_id = v_p1 and criterio = 'colaboracao';

  insert into resultado
  select 'placar recalculado', '1 linha com 640', count(*)::text || ' linha(s) com ' || max(total)::text,
         count(*) = 1 and max(total) = 640
  from score where session_id = v_sessao;

  -- As travas que protegem contra corrida e contra erro de digitação.
  begin
    insert into queue_entry (team_id, lote, posicao, status) values (v_team, 'manha', 998, 'aguardando');
    insert into queue_entry (team_id, lote, posicao, status) values (v_team, 'manha', 998, 'aguardando');
    insert into resultado values ('duas equipes na mesma posição da fila', 'recusado', 'ACEITOU', false);
  exception when unique_violation then
    insert into resultado values ('duas equipes na mesma posição da fila', 'recusado', 'recusado', true);
  end;

  begin
    insert into team (nome, codigo_acesso, email_capitao) values ('ZZ-ENSAIO-2', 'ZZZ-ENS', 'x@exemplo.invalid');
    insert into resultado values ('código de acesso repetido', 'recusado', 'ACEITOU', false);
  exception when unique_violation then
    insert into resultado values ('código de acesso repetido', 'recusado', 'recusado', true);
  end;

  begin
    insert into rubric_score (session_id, player_id, criterio, nota) values (v_sessao, v_p2, 'raciocinio2', 9);
    insert into resultado values ('nota 9 numa escala de 1 a 5', 'recusado', 'ACEITOU', false);
  exception when check_violation then
    insert into resultado values ('nota 9 numa escala de 1 a 5', 'recusado', 'recusado', true);
  end;

  begin
    insert into answer (session_id, question_id, resposta_dada, correta)
    values (v_sessao, gen_random_uuid(), 'x', true);
    insert into resultado values ('resposta para pergunta inexistente', 'recusado', 'ACEITOU', false);
  exception when foreign_key_violation then
    insert into resultado values ('resposta para pergunta inexistente', 'recusado', 'recusado', true);
  end;
end $$;

select passo, esperado, obtido, case when ok then 'ok' else 'FALHOU' end as veredito from resultado;
select count(*) filter (where not ok) as falhas, count(*) as testes from resultado;

-- O ensaio não deixa rastro: tudo que ele criou desaparece aqui.
rollback;
