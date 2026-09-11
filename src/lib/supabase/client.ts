import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente do navegador. Usa a chave pública (anon), então só alcança o que as
 * políticas de acesso do banco permitem: configuração do evento, estações
 * ativas e placar. Tudo o que é do instrutor ou do admin passa pelo servidor.
 */
export function criarClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. Copie .env.example para .env.local.",
    );
  }

  return createBrowserClient(url, chave);
}
