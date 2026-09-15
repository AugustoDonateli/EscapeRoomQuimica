"use server";

import { redirect } from "next/navigation";
import { mensagemDeFalhaNoLogin } from "@/lib/login";
import { criarClienteSessao } from "@/lib/supabase/sessao";

/**
 * Login por e-mail e senha. Instrutor e admin têm conta de verdade; o jogador
 * nunca passa por aqui — a área dele abre com o código da equipe.
 *
 * Credencial errada dá sempre a mesma mensagem, sem dizer se foi o e-mail ou a
 * senha: contar qual dos dois errou é contar quais e-mails existem. Falha do
 * serviço de login é outra coisa e se identifica como tal — ver src/lib/login.ts.
 */
export async function entrar(_estadoAnterior: string | null, dados: FormData): Promise<string> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");
  const de = String(dados.get("de") ?? "");

  if (!email || !senha) return "Preencha o e-mail e a senha.";

  const supabase = await criarClienteSessao();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    // Nos registros do servidor fica o motivo de verdade; na tela, não.
    console.error("falha no login", { status: error.status, code: error.code, mensagem: error.message });
    return mensagemDeFalhaNoLogin(error.status);
  }

  redirect(de && de.startsWith("/") ? de : "/admin");
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteSessao();
  await supabase.auth.signOut();
  redirect("/entrar");
}
