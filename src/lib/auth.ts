import { redirect } from "next/navigation";
import { criarClienteSessao } from "@/lib/supabase/sessao";

export type Papel = "admin" | "instrutor" | "autor";

export type Perfil = {
  id: string;
  nome: string;
  papel: Papel;
  ativo: boolean;
};

/** Quem está logado, ou null. Não redireciona — use em tela pública. */
export async function perfilAtual(): Promise<Perfil | null> {
  const supabase = await criarClienteSessao();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profile")
    .select("id, nome, papel, ativo")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !data.ativo) return null;
  return data as Perfil;
}

/**
 * Guarda de página. O middleware já barra quem não tem sessão, mas cada página
 * confere de novo: se um dia o middleware mudar de caminho, a página não fica
 * aberta por acidente.
 */
export async function exigirPapel(papeis: Papel[]): Promise<Perfil> {
  const perfil = await perfilAtual();

  if (!perfil) redirect("/entrar");
  if (!papeis.includes(perfil.papel)) redirect("/entrar?erro=sem-permissao");

  return perfil;
}
