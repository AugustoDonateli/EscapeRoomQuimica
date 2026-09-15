import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { chavePublica, urlDoSupabase } from "@/lib/supabase/ambiente";

/**
 * Cliente de servidor amarrado à sessão de quem está navegando. Usa a chave
 * pública, então alcança exatamente o que as políticas do banco permitem para
 * aquela pessoa — é assim que o papel (admin, instrutor, autor) é descoberto
 * sem passar pela chave de serviço, que ignora todas as políticas.
 */
export async function criarClienteSessao() {
  const url = urlDoSupabase();
  const chave = chavePublica();

  if (!url || !chave) {
    throw new Error("Faltam SUPABASE_URL e SUPABASE_ANON_KEY. Abra /diagnostico.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(paraGravar) {
        // Em componente de servidor a gravação de cookie é bloqueada; quem
        // renova a sessão nesse caso é o middleware.
        try {
          for (const { name, value, options } of paraGravar) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* ignorado de propósito */
        }
      },
    },
  });
}
