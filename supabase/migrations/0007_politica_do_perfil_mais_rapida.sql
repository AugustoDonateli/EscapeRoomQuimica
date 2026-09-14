-- O analisador do Supabase apontou: auth.uid() escrito solto numa política é
-- reavaliado linha por linha. Envolvido em (select ...), o Postgres avalia uma
-- vez e reaproveita. Na nossa escala não muda nada hoje, mas é o tipo de coisa
-- que não se conserta depois — e o aviso some da lista, o que importa para a
-- próxima pessoa saber que a lista está limpa de propósito.
drop policy if exists "cada um le o proprio perfil" on profile;

create policy "cada um le o proprio perfil"
  on profile for select
  using (id = (select auth.uid()));
