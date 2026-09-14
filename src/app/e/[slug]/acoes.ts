"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServico } from "@/lib/supabase/server";
import { lerConfig } from "@/lib/dados";
import { conferirResposta } from "@/lib/resposta";
import { contextoDaEstacao } from "@/lib/estacao";

/**
 * O que o jogador pode fazer numa estação.
 *
 * Estas ações são públicas — o jogador não tem login, e ação de servidor é
 * alcançável por POST direto. Então tudo é reconferido aqui: a sessão está
 * aberta, o tempo não acabou, a estação está liberada para esta equipe, a
 * pergunta é daquela estação e ainda há tentativa. O QR na parede não protege
 * nada; quem protege é este arquivo.
 */

/**
 * Abre a estação. É este toque que liga o cronômetro dela — e não o simples
 * carregar da página, para que um QR lido por engano não comece a contar tempo
 * contra a equipe.
 *
 * Abrir uma estação fecha qualquer outra que tenha ficado aberta: é daqui que
 * sai o tempo por estação, sem ninguém anotar nada.
 */
export async function abrirEstacao(dados: FormData): Promise<{ erro: string } | null> {
  const slug = String(dados.get("slug") ?? "");
  const r = await contextoDaEstacao(slug);
  if (!r.ok) return { erro: r.erro };

  const supabase = criarClienteServico();
  const agora = new Date().toISOString();

  await supabase
    .from("session_station")
    .update({ concluida_em: agora })
    .eq("session_id", r.ctx.sessaoId)
    .is("concluida_em", null)
    .neq("station_id", r.ctx.estacao.id);

  await supabase
    .from("session_station")
    .upsert(
      { session_id: r.ctx.sessaoId, station_id: r.ctx.estacao.id, aberta_em: agora },
      { onConflict: "session_id,station_id", ignoreDuplicates: true },
    );

  revalidatePath(`/e/${slug}`);
  return null;
}

export async function responder(
  _anterior: { erro?: string; acertou?: boolean } | null,
  dados: FormData,
): Promise<{ erro?: string; acertou?: boolean }> {
  const slug = String(dados.get("slug") ?? "");
  const perguntaId = String(dados.get("perguntaId") ?? "");
  const dada = String(dados.get("resposta") ?? "");
  const msGastos = Number(dados.get("msGastos") ?? 0);

  const r = await contextoDaEstacao(slug);
  if (!r.ok) return { erro: r.erro };

  const supabase = criarClienteServico();
  const config = await lerConfig();

  const { data: pergunta } = await supabase
    .from("question")
    .select("id, station_id, resposta, ativa")
    .eq("id", perguntaId)
    .maybeSingle();

  if (!pergunta || !pergunta.ativa || pergunta.station_id !== r.ctx.estacao.id) {
    return { erro: "Esta pergunta não é desta estação." };
  }

  const { data: anteriores } = await supabase
    .from("answer")
    .select("tentativa_n, correta")
    .eq("session_id", r.ctx.sessaoId)
    .eq("question_id", perguntaId);

  const tentativas = anteriores ?? [];
  if (tentativas.some((t) => t.correta)) return { erro: "Vocês já acertaram esta pergunta." };
  if (tentativas.length >= config.tentativas_por_pergunta) {
    return { erro: "As tentativas desta pergunta acabaram." };
  }

  const acertou = conferirResposta(dada, pergunta.resposta);

  const { error } = await supabase.from("answer").insert({
    session_id: r.ctx.sessaoId,
    question_id: perguntaId,
    resposta_dada: dada.slice(0, 200),
    correta: acertou,
    tentativa_n: tentativas.length + 1,
    ms_gastos: Number.isFinite(msGastos) ? Math.max(0, Math.min(3_600_000, msGastos)) : null,
  });

  if (error) return { erro: "Não conseguimos registrar a resposta. Tente de novo." };

  await talvezFecharEstacao(r.ctx.sessaoId, r.ctx.estacao.id, config.tentativas_por_pergunta);

  revalidatePath(`/e/${slug}`);
  return { acertou };
}

/**
 * Fecha a estação quando não há mais nada a fazer nela: todas as perguntas
 * acertadas ou com as tentativas esgotadas. É o outro lado da cronometragem
 * automática — a equipe não precisa avisar que terminou.
 */
async function talvezFecharEstacao(
  sessaoId: string,
  estacaoId: string,
  tentativasPorPergunta: number,
): Promise<void> {
  const supabase = criarClienteServico();

  const [{ data: perguntas }, { data: respostas }] = await Promise.all([
    supabase.from("question").select("id").eq("station_id", estacaoId).eq("ativa", true),
    supabase.from("answer").select("question_id, correta").eq("session_id", sessaoId),
  ]);

  const daEstacao = new Set((perguntas ?? []).map((p) => p.id));
  if (daEstacao.size === 0) return;

  const resolvidas = new Set<string>();
  for (const id of daEstacao) {
    const minhas = (respostas ?? []).filter((r) => r.question_id === id);
    const acertou = minhas.some((r) => r.correta);
    if (acertou || minhas.length >= tentativasPorPergunta) resolvidas.add(id);
  }

  if (resolvidas.size < daEstacao.size) return;

  await supabase
    .from("session_station")
    .update({ concluida_em: new Date().toISOString() })
    .eq("session_id", sessaoId)
    .eq("station_id", estacaoId)
    .is("concluida_em", null);
}
