-- Duas equipes cadastrando no mesmo instante poderiam receber a mesma posição:
-- as duas leem "maior posição = 7" antes de qualquer uma gravar a 8. O índice
-- único faz o banco recusar a segunda, e o código tenta de novo com a posição
-- seguinte. Sem isto, o empate só apareceria no dia da feira, na hora de
-- decidir quem entra primeiro.
create unique index queue_entry_posicao_unica on queue_entry (lote, posicao);

-- Usado para recuperar o código de acesso e para barrar a mesma equipe
-- entrando duas vezes na fila.
create index team_por_email on team (lower(email_capitao));
