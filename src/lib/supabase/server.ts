import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de servidor com a chave de serviço. Ignora as políticas do banco, e
 * por isso NUNCA pode ser importado por componente que roda no navegador — a
 * chave vazaria junto com o pacote de JavaScript.
 *
 * Regra da casa: toda escrita de sessão, fila e pontuação passa por aqui, para
 * que a validação aconteça no servidor e não no celular de quem está jogando.
 */
export function criarClienteServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.",
    );
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
