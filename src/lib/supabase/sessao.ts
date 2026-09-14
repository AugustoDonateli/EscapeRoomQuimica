import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de servidor amarrado à sessão de quem está navegando. Usa a chave
 * pública, então alcança exatamente o que as políticas do banco permitem para
 * aquela pessoa — é assim que o papel (admin, instrutor, autor) é descoberto
 * sem passar pela chave de serviço, que ignora todas as políticas.
 */
export async function criarClienteSessao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. Copie .env.example para .env.local.",
    );
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
