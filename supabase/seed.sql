-- ============================================================================
-- Dados de exemplo — para dar para testar a plataforma antes da sala existir.
--
-- As estações e as perguntas aqui são INVENTADAS: quantas estações existem e
-- o que cada uma faz é decisão da equipe das estações, e o texto das perguntas
-- é da equipe das perguntas. Isto aqui é só andaime.
--
-- Repare no formato das perguntas: toda uma delas tem um dado que só existe
-- DENTRO da sala (uma massa na balança, uma cor observada, um volume medido).
-- É isso que impede o jogador de pesquisar a resposta no celular — e é o
-- padrão que a equipe das perguntas precisa seguir.
-- ============================================================================

-- O horário entra explícito: a primeira versão deste seed omitia abre_em e
-- fecha_em, as duas colunas nasciam nulas, e a página inicial estourava por
-- causa disso na primeira publicação real.
insert into event_config (id, nome_evento, duracao_sessao_min, reset_min, abre_em, fecha_em)
values (true, 'Escape Químico', 20, 5, '08:00', '14:00')
on conflict (id) do nothing;

-- Estações -------------------------------------------------------------------
insert into station (id, slug, nome, ordem, peso_dificuldade, tem_pergunta) values
  ('11111111-1111-4111-8111-000000000001', 'EST-01', 'Cofre da Tabela',       1, 1.00, true),
  ('11111111-1111-4111-8111-000000000002', 'EST-02', 'Bancada das Ligações',  2, 1.25, true),
  ('11111111-1111-4111-8111-000000000003', 'EST-03', 'Titulação',            3, 1.50, true),
  ('11111111-1111-4111-8111-000000000004', 'EST-04', 'Balança e Mol',        4, 1.75, true),
  ('11111111-1111-4111-8111-000000000005', 'EST-05', 'Fechadura Final',      5, 2.00, false)
on conflict (slug) do nothing;

-- Perguntas ------------------------------------------------------------------
insert into question (station_id, enunciado, tipo, alternativas, resposta, ordem) values
  ('11111111-1111-4111-8111-000000000001',
   'O cadeado tem três dígitos. Some os números atômicos dos três elementos marcados com fita vermelha na tabela da parede.',
   'texto', null, '31', 1),

  ('11111111-1111-4111-8111-000000000001',
   'O frasco na prateleira de cima traz apenas o símbolo. Qual é o nome do elemento?',
   'texto', null, 'enxofre', 2),

  ('11111111-1111-4111-8111-000000000002',
   'Os dois modelos moleculares na bancada estão montados com palitos. O da esquerda representa qual tipo de ligação?',
   'multipla', array['Iônica', 'Covalente', 'Metálica'], 'Covalente', 1),

  ('11111111-1111-4111-8111-000000000002',
   'Um dos três sólidos do suporte conduziu corrente no teste. Pela condução, qual deles é iônico dissolvido em água?',
   'multipla', array['Frasco A', 'Frasco B', 'Frasco C'], 'Frasco B', 2),

  ('11111111-1111-4111-8111-000000000003',
   'A solução virou rosa depois da terceira gota do indicador. O que isso diz sobre o pH do meio neste ponto?',
   'multipla', array['Ficou ácido', 'Ficou básico', 'Continua neutro'], 'Ficou básico', 1),

  ('11111111-1111-4111-8111-000000000003',
   'Leia na bureta o volume gasto até a viragem, em mililitros. Digite só o número.',
   'texto', null, '12,5', 2),

  ('11111111-1111-4111-8111-000000000004',
   'A balança mostra 11,7 g deste sal de cozinha. Quantos mols vocês têm nas mãos? Use duas casas decimais.',
   'texto', null, '0,20', 1),

  ('11111111-1111-4111-8111-000000000004',
   'Dobrando a massa que está na balança, o número de mols também dobra?',
   'multipla', array['Sim', 'Não', 'Depende da temperatura'], 'Sim', 2)
on conflict do nothing;

-- Equipes de exemplo ---------------------------------------------------------
insert into team (id, nome, codigo_acesso, email_capitao, media_ano, categoria) values
  ('22222222-2222-4222-8222-000000000001', 'Ácido Cítrico', 'ACID-2026', 'capitao1@exemplo.com', 2.5, 'iniciante'),
  ('22222222-2222-4222-8222-000000000002', 'Mol Mol Mol',   'MOLS-2026', 'capitao2@exemplo.com', 3.4, 'avancado'),
  ('22222222-2222-4222-8222-000000000003', 'Gás Nobre',     'GASN-2026', 'capitao3@exemplo.com', 1.6, 'iniciante')
on conflict (codigo_acesso) do nothing;

insert into player (team_id, nome, ano_escolar) values
  ('22222222-2222-4222-8222-000000000001', 'Augusto', 4),
  ('22222222-2222-4222-8222-000000000001', 'Helena',  2),
  ('22222222-2222-4222-8222-000000000001', 'Rafael',  1),
  ('22222222-2222-4222-8222-000000000001', 'Bianca',  3),
  ('22222222-2222-4222-8222-000000000002', 'Diego',   4),
  ('22222222-2222-4222-8222-000000000002', 'Sofia',   3),
  ('22222222-2222-4222-8222-000000000002', 'Iris',    3),
  ('22222222-2222-4222-8222-000000000003', 'Caio',    1),
  ('22222222-2222-4222-8222-000000000003', 'Lia',     2),
  ('22222222-2222-4222-8222-000000000003', 'Tomás',   2)
on conflict do nothing;

-- Fila de exemplo ------------------------------------------------------------
insert into queue_entry (team_id, lote, posicao, status) values
  ('22222222-2222-4222-8222-000000000001', 'manha', 5, 'aguardando'),
  ('22222222-2222-4222-8222-000000000002', 'manha', 6, 'aguardando'),
  ('22222222-2222-4222-8222-000000000003', 'manha', 4, 'chamada')
on conflict (team_id) do nothing;
