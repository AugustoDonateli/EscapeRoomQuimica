"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { esquemaPergunta, listarAlternativas, type ResultadoAcao } from "@/lib/validacao";

export async function salvarPergunta(
  _anterior: ResultadoAcao | null,
  dados: FormData,
): Promise<ResultadoAcao> {
  // O grupo das perguntas alcança esta ação e mais nenhuma.
  const perfil = await exigirPapel(["admin", "autor"]);

  const id = String(dados.get("id") ?? "").trim() || undefined;
  const tempoBruto = String(dados.get("tempo_limite_s") ?? "").trim();

  const analisado = esquemaPergunta.safeParse({
    id,
    station_id: String(dados.get("station_id") ?? ""),
    enunciado: String(dados.get("enunciado") ?? ""),
    tipo: String(dados.get("tipo") ?? "texto"),
    alternativas: String(dados.get("alternativas") ?? "") || null,
    resposta: String(dados.get("resposta") ?? ""),
    tempo_limite_s: tempoBruto === "" ? null : Number(tempoBruto),
    ordem: dados.get("ordem"),
  });

  if (!analisado.success) {
    return { ok: false, erro: analisado.error.issues[0]?.message ?? "Confira os campos." };
  }

  const d = analisado.data;
  const campos = {
    station_id: d.station_id,
    enunciado: d.enunciado,
    tipo: d.tipo,
    alternativas: d.tipo === "multipla" ? listarAlternativas(d.alternativas) : null,
    resposta: d.resposta,
    tempo_limite_s: d.tempo_limite_s,
    ordem: d.ordem,
  };

  const supabase = criarClienteServico();
  const { error } = d.id
    ? await supabase.from("question").update(campos).eq("id", d.id)
    : await supabase.from("question").insert(campos);

  if (error) return { ok: false, erro: `O banco recusou: ${error.message}` };

  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: d.id ? "pergunta_editada" : "pergunta_criada",
    alvo: d.station_id,
    depois: campos,
  });

  revalidatePath("/admin/perguntas");
  revalidatePath("/admin/estacoes");
  return { ok: true, mensagem: d.id ? "Pergunta atualizada." : "Pergunta criada." };
}

export async function alternarPergunta(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin", "autor"]);

  const id = String(dados.get("id") ?? "");
  const ativar = dados.get("ativar") === "1";
  if (!id) return;

  const supabase = criarClienteServico();
  await supabase.from("question").update({ ativa: ativar }).eq("id", id);
  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: ativar ? "pergunta_reativada" : "pergunta_desativada",
    alvo: id,
  });

  revalidatePath("/admin/perguntas");
  revalidatePath("/admin/estacoes");
}
