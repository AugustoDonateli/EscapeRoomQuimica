/**
 * De onde vêm as credenciais do Supabase.
 *
 * Todo acesso ao banco neste projeto acontece no servidor — componentes de
 * servidor, ações de servidor e middleware. Nada no navegador fala com o
 * Supabase (o cliente de navegador existia e nunca foi importado; foi
 * removido).
 *
 * Por isso os nomes preferidos não têm o prefixo `NEXT_PUBLIC_`. O prefixo, no
 * Next, significa "este valor pode ir para o pacote do navegador" — e usá-lo
 * numa credencial que só o servidor lê é mentir sobre onde ela vive, além de
 * convidar a próxima pessoa a usá-la no cliente, onde ela não deveria estar.
 *
 * Os nomes com prefixo continuam aceitos, para não quebrar quem já configurou
 * assim: nesta versão do Next a leitura acontece em execução, então funcionam
 * igual. A preferência é de clareza, não de funcionamento.
 */

function preferindoSemPrefixo(semPrefixo?: string, comPrefixo?: string): string | undefined {
  const escolhido = semPrefixo?.trim() || comPrefixo?.trim();
  return escolhido || undefined;
}

export function urlDoSupabase(): string | undefined {
  return preferindoSemPrefixo(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function chavePublica(): string | undefined {
  return preferindoSemPrefixo(
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function chaveDeServico(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

export function enderecoDoSite(): string | undefined {
  return preferindoSemPrefixo(process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL);
}
