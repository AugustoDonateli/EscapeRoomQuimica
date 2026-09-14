-- Cada pessoa da equipe lê o próprio perfil. Sem isto, descobrir o papel de
-- quem acabou de entrar exigiria a chave de serviço em toda navegação — e a
-- chave de serviço ignora todas as outras políticas, então quanto menos
-- caminho passar por ela, melhor.
create policy "cada um le o proprio perfil"
  on profile for select
  using (id = auth.uid());
