"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { esquemaConfig, type ResultadoAcao } from "@/lib/validacao";

function marcado(dados: FormData, campo: string): boolean {
  return dados.get(campo) === "on";
}

function textoOuNulo(dados: FormData, campo: string): string | null {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Grava a configuração do evento. Os valores que dependem de outras equipes da
 * sala vivem todos aqui — nenhum número do projeto fica escrito no código.
 */
export async function salvarConfig(
  _anterior: ResultadoAcao | null,
  dados: FormData,
): Promise<ResultadoAcao> {
  const perfil = await exigirPapel(["admin"]);

  const bruto = {
    nome_evento: String(dados.get("nome_evento") ?? ""),
    data_evento: textoOuNulo(dados, "data_evento"),
    abre_em: String(dados.get("abre_em") ?? ""),
    fecha_em: String(dados.get("fecha_em") ?? ""),
    duracao_sessao_min: dados.get("duracao_sessao_min"),
    reset_min: dados.get("reset_min"),
    lote_manha_abre_em: String(dados.get("lote_manha_abre_em") ?? ""),
    lote_tarde_abre_em: String(dados.get("lote_tarde_abre_em") ?? ""),
    equipe_min: dados.get("equipe_min"),
    equipe_max: dados.get("equipe_max"),
    tempo_limite_pergunta_s: dados.get("tempo_limite_pergunta_s"),
    penalidade_dica: dados.get("penalidade_dica"),
    peso_progresso: dados.get("peso_progresso"),
    peso_precisao: dados.get("peso_precisao"),
    peso_tempo: dados.get("peso_tempo"),
    peso_instrutor: dados.get("peso_instrutor"),
    usar_categorias: marcado(dados, "usar_categorias"),
    corte_categoria: dados.get("corte_categoria"),
    nota_individual_no_premio: marcado(dados, "nota_individual_no_premio"),
    detectar_saida_de_tela: marcado(dados, "detectar_saida_de_tela"),
    ausencia_tolerancia_min: dados.get("ausencia_tolerancia_min"),
    ordem_livre: marcado(dados, "ordem_livre"),
    tentativas_por_pergunta: dados.get("tentativas_por_pergunta"),
  };

  const analisado = esquemaConfig.safeParse(bruto);
  if (!analisado.success) {
    return { ok: false, erro: analisado.error.issues[0]?.message ?? "Confira os campos." };
  }

  const supabase = criarClienteServico();

  const { error } = await supabase
    .from("event_config")
    .update({ ...analisado.data, atualizado_em: new Date().toISOString() })
    .eq("id", true);

  if (error) return { ok: false, erro: `O banco recusou: ${error.message}` };

  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: "configuracao_atualizada",
    alvo: "event_config",
    depois: analisado.data,
  });

  revalidatePath("/admin");
  return { ok: true, mensagem: "Configuração salva." };
}
