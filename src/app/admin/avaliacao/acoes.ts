"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { esquemaPerguntasAvaliacao } from "@/lib/avaliacao";
import type { ResultadoAcao } from "@/lib/validacao";

export async function salvarPerguntasAvaliacao(
  _anterior: ResultadoAcao | null,
  dados: FormData,
): Promise<ResultadoAcao> {
  const perfil = await exigirPapel(["admin"]);

  let bruto: unknown;
  try {
    bruto = JSON.parse(String(dados.get("perguntas") ?? "[]"));
  } catch {
    return { ok: false, erro: "Não conseguimos ler as perguntas." };
  }

  const analisado = esquemaPerguntasAvaliacao.safeParse(bruto);
  if (!analisado.success) {
    return { ok: false, erro: analisado.error.issues[0]?.message ?? "Confira as perguntas." };
  }

  const supabase = criarClienteServico();
  const { error } = await supabase
    .from("event_config")
    .update({ perguntas_avaliacao: analisado.data, atualizado_em: new Date().toISOString() })
    .eq("id", true);

  if (error) return { ok: false, erro: `O banco recusou: ${error.message}` };

  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: "perguntas_avaliacao_atualizadas",
    alvo: "event_config",
    depois: { quantas: analisado.data.length },
  });

  revalidatePath("/admin/avaliacao");
  return { ok: true, mensagem: "Perguntas salvas." };
}
