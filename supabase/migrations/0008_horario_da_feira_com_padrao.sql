-- As colunas de horário eram nuláveis e sem valor padrão, e a linha de
-- configuração nasceu com as duas vazias. O código tratava horário como texto
-- obrigatório e derrubou a página inicial na primeira publicação real.
--
-- O conserto tem dois lados: o código passou a aceitar horário ausente (e a
-- dizer que falta configurar, em vez de dizer que a fila encheu), e o banco
-- passa a nascer com uma janela plausível em vez de vazia. Continua sendo só
-- um padrão: a organização da feira troca no painel quando decidir.
alter table event_config
  alter column abre_em set default '08:00',
  alter column fecha_em set default '14:00';

update event_config
set abre_em = coalesce(abre_em, '08:00'),
    fecha_em = coalesce(fecha_em, '14:00'),
    atualizado_em = now()
where id;
