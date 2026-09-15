# Contas da equipe organizadora

Não existe tela de cadastro. As contas são criadas por quem administra o
projeto, uma por papel, e a tela `/entrar` só faz login.

| E-mail | Papel | O que abre |
| --- | --- | --- |
| `admin@escapequimico.exemplo` | `admin` | `/admin` e tudo dentro dele |
| `instrutor@escapequimico.exemplo` | `instrutor` | `/i` (fila, check-in, sessão) |
| `autor@escapequimico.exemplo` | `autor` | `/admin/perguntas` |

As senhas iniciais foram combinadas fora do repositório e **precisam ser
trocadas antes da feira**. Senha nenhuma entra aqui nem em commit.

## Criando ou recriando uma conta

Criar usuário por `insert` direto em `auth.users` funciona em silêncio e
quebra o login depois: o GoTrue, serviço de autenticação do Supabase, lê
`confirmation_token`, `recovery_token`, `email_change_token_new`,
`email_change_token_current`, `email_change`, `phone_change`,
`phone_change_token` e `reauthentication_token` como texto, e `NULL` nessas
colunas vira **HTTP 500 com `converting NULL to string is unsupported`** — não
"senha errada", embora seja fácil confundir. Foi o que aconteceu na primeira
publicação real.

O caminho seguro é o painel do Supabase (**Authentication → Users → Add user**,
com *Auto Confirm User* ligado) ou a Admin API, que preenchem essas colunas
sozinhos. Só depois:

```sql
insert into public.profile (id, nome, papel, ativo)
select id, 'Nome de quem usa', 'instrutor', true
from auth.users where email = 'instrutor@escapequimico.exemplo';
```

Se em algum momento a conta precisar ser criada por SQL, as oito colunas vão
explícitas como `''`, nunca omitidas. E depois de criar qualquer conta, esta
consulta precisa voltar vazia:

```sql
select email from auth.users
where confirmation_token is null or recovery_token is null
   or email_change_token_new is null or email_change_token_current is null
   or email_change is null or phone_change is null
   or phone_change_token is null or reauthentication_token is null;
```

## Quando o login falhar

`/entrar` separa os casos: "e-mail ou senha não conferem" é credencial (e é
proposital não dizer qual dos dois errou — dizer conta quais e-mails existem);
"o serviço de login falhou" é 500 ou rede. O motivo de verdade fica nos
registros do servidor e em **Logs → Auth** no Supabase.
