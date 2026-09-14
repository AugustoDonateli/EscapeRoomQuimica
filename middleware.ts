import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão a cada navegação e barra as áreas fechadas antes de a página
 * chegar a renderizar.
 *
 * O jogador nunca passa por aqui: a área dele não tem senha, é código de equipe.
 */
export async function middleware(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return resposta;

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(paraGravar) {
        for (const { name, value } of paraGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of paraGravar) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const areaFechada = caminho.startsWith("/admin") || caminho.startsWith("/i");

  if (areaFechada && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.searchParams.set("de", caminho);
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/admin/:path*", "/i/:path*", "/entrar"],
};
