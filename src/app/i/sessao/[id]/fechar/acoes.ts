"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { CRITERIOS } from "@/lib/rubrica";

/**
 * Grava a rubrica do instrutor.
 *
 * A nota chega pré-sugerida pelos toques, mas é esta gravação que vale — o
 * instrutor pode discordar da sugestão, e deve poder. Os toques continuam
 * guardados com hora: se a equipe contestar, dá para mostrar o que gerou a
 * sugestão e o que o instrutor ajustou.
 */
export async function salvarRubrica(
  _anterior: { erro?: string } | null,
  dados: FormData,
): Promise<{ erro?: string }> {
  const perfil = await exigirPapel(["admin", "instrutor"]);

  const sessaoId = String(dados.get("sessaoId") ?? "");
  if (!sessaoId) return { erro: "Sessão não informada." };

  const supabase = criarClienteServico();

  // Só aceita nota de jogador que pertence a esta sessão. Sem isto, um POST
  // direto poderia gravar nota em jogador de outra equipe.
  const { data: sessao } = await supabase
    .from("session")
    .select("team_id")
    .eq("id", sessaoId)
    .maybeSingle();

  if (!sessao) return { erro: "Sessão não encontrada." };

  const { data: jogadores } = await supabase
    .from("player")
    .select("id")
    .eq("team_id", sessao.team_id);

  const idsValidos = new Set((jogadores ?? []).map((j) => j.id));

  const linhas: { session_id: string; player_id: string; criterio: string; nota: number }[] = [];

  for (const [campo, valor] of dados.entries()) {
    const m = /^nota:([0-9a-f-]{36}):([a-z]+)$/.exec(campo);
    if (!m) continue;

    const [, jogadorId, criterio] = m;
    if (!idsValidos.has(jogadorId)) continue;
    if (!CRITERIOS.some((c) => c.criterio === criterio)) continue;

    const nota = Number(valor);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) continue;

    linhas.push({ session_id: sessaoId, player_id: jogadorId, criterio, nota });
  }

  if (linhas.length === 0) return { erro: "Nenhuma nota válida para gravar." };

  const { error } = await supabase
    .from("rubric_score")
    .upsert(linhas, { onConflict: "session_id,player_id,criterio" });

  if (error) return { erro: `O banco recusou: ${error.message}` };

  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: "rubrica_gravada",
    alvo: sessaoId,
    depois: { notas: linhas.length },
  });

  revalidatePath(`/i/sessao/${sessaoId}/fechar`);
  redirect("/i?avaliada=1");
}
