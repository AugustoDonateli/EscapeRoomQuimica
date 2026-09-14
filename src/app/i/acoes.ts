"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { sessaoAberta } from "@/lib/instrutor";
import { pausaAberta, type Pausa } from "@/lib/sessao";
import { OBSERVACOES, type TipoObservacao } from "@/lib/rubrica";

/**
 * Ações do instrutor durante a sessão.
 *
 * Todas conferem o papel: ação de servidor é alcançável por POST direto, então
 * a guarda tem que estar aqui dentro e não só no middleware.
 */

function agora() {
  return new Date().toISOString();
}

async function anotar(perfilId: string, acao: string, alvo: string) {
  const supabase = criarClienteServico();
  await supabase.from("audit_log").insert({ profile_id: perfilId, acao, alvo });
}

export async function chamarProxima(): Promise<void> {
  const perfil = await exigirPapel(["admin", "instrutor"]);
  const supabase = criarClienteServico();

  const { data: proxima } = await supabase
    .from("queue_entry")
    .select("id, team(codigo_acesso)")
    .eq("status", "aguardando")
    .order("lote")
    .order("posicao")
    .limit(1)
    .maybeSingle();

  if (!proxima) return;

  await supabase
    .from("queue_entry")
    .update({ status: "chamada", chamada_em: agora() })
    .eq("id", proxima.id);

  await anotar(perfil.id, "equipe_chamada", proxima.id);
  revalidatePath("/i");
  revalidatePath("/i/fila");
}

export async function marcarAusencia(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin", "instrutor"]);
  const id = String(dados.get("entradaId") ?? "");
  if (!id) return;

  const supabase = criarClienteServico();
  await supabase.from("queue_entry").update({ status: "no_show" }).eq("id", id).eq("status", "chamada");

  await anotar(perfil.id, "equipe_ausente", id);
  revalidatePath("/i");
  revalidatePath("/i/fila");
}

export async function devolverParaFila(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin", "instrutor"]);
  const id = String(dados.get("entradaId") ?? "");
  if (!id) return;

  const supabase = criarClienteServico();
  await supabase
    .from("queue_entry")
    .update({ status: "aguardando", chamada_em: null })
    .eq("id", id)
    .eq("status", "chamada");

  await anotar(perfil.id, "equipe_devolvida_para_fila", id);
  revalidatePath("/i");
  revalidatePath("/i/fila");
}

/**
 * Check-in e início da sessão.
 *
 * Uma sala, uma sessão de cada vez: se já existe sessão aberta, esta recusa em
 * vez de deixar duas equipes jogando no mesmo cronômetro.
 */
export async function iniciarSessao(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin", "instrutor"]);

  const entradaId = String(dados.get("entradaId") ?? "");
  const teamId = String(dados.get("teamId") ?? "");
  if (!entradaId || !teamId) return;

  const jaAberta = await sessaoAberta();
  if (jaAberta) redirect(`/i/sessao/${jaAberta}?erro=ja-tem-sessao`);

  const supabase = criarClienteServico();

  const { data: sessao, error } = await supabase
    .from("session")
    .insert({ team_id: teamId, instrutor_id: perfil.id, iniciada_em: agora(), status: "em_andamento" })
    .select("id")
    .single();

  if (error || !sessao) redirect("/i?erro=nao-iniciou");

  await supabase.from("queue_entry").update({ status: "em_jogo" }).eq("id", entradaId);
  await anotar(perfil.id, "sessao_iniciada", sessao.id);

  revalidatePath("/i");
  redirect(`/i/sessao/${sessao.id}`);
}

async function lerPausas(id: string): Promise<Pausa[]> {
  const supabase = criarClienteServico();
  const { data } = await supabase.from("session").select("pausas").eq("id", id).maybeSingle();
  return (data?.pausas ?? []) as Pausa[];
}

export async function alternarPausa(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin", "instrutor"]);
  const id = String(dados.get("sessaoId") ?? "");
  if (!id) return;

  const supabase = criarClienteServico();
  const pausas = await lerPausas(id);

  if (pausaAberta(pausas)) {
    const atualizadas = pausas.map((p) => (p.ate ? p : { ...p, ate: agora() }));
    await supabase
      .from("session")
      .update({ pausas: atualizadas, status: "em_andamento" })
      .eq("id", id);
    await anotar(perfil.id, "sessao_retomada", id);
  } else {
    await supabase
      .from("session")
      .update({ pausas: [...pausas, { de: agora(), ate: null }], status: "pausada" })
      .eq("id", id);
    await anotar(perfil.id, "sessao_pausada", id);
  }

  revalidatePath(`/i/sessao/${id}`);
}

export async function darDica(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin", "instrutor"]);
  const id = String(dados.get("sessaoId") ?? "");
  const stationId = String(dados.get("estacaoId") ?? "") || null;
  if (!id) return;

  const supabase = criarClienteServico();
  await supabase.from("hint").insert({ session_id: id, station_id: stationId, instrutor_id: perfil.id });
  await anotar(perfil.id, "dica_dada", id);

  revalidatePath(`/i/sessao/${id}`);
}

/**
 * Registra os toques de observação em lote.
 *
 * Cada toque carrega um id gerado no celular. Se o Wi-Fi cair, o toque fica
 * guardado lá e sobe quando a rede volta — e o índice único no banco garante
 * que subir de novo não conte em dobro. Nota de equipe não pode crescer por
 * causa de rede ruim.
 */
export async function registrarObservacoes(
  sessaoId: string,
  toques: { clienteId: string; jogadorId: string; tipo: string }[],
): Promise<{ ok: boolean; gravados: number }> {
  await exigirPapel(["admin", "instrutor"]);

  const tiposValidos = new Set(OBSERVACOES.map((o) => o.tipo));
  const limpos = toques
    .filter(
      (t) =>
        typeof t.clienteId === "string" &&
        /^[0-9a-f-]{36}$/i.test(t.clienteId) &&
        typeof t.jogadorId === "string" &&
        tiposValidos.has(t.tipo as TipoObservacao),
    )
    .slice(0, 200);

  if (limpos.length === 0) return { ok: true, gravados: 0 };

  const supabase = criarClienteServico();
  const { error, count } = await supabase.from("observation").upsert(
    limpos.map((t) => ({
      session_id: sessaoId,
      player_id: t.jogadorId,
      tipo: t.tipo,
      cliente_id: t.clienteId,
    })),
    { onConflict: "cliente_id", ignoreDuplicates: true, count: "exact" },
  );

  if (error) return { ok: false, gravados: 0 };

  revalidatePath(`/i/sessao/${sessaoId}`);
  return { ok: true, gravados: count ?? limpos.length };
}

export async function encerrarSessao(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin", "instrutor"]);
  const id = String(dados.get("sessaoId") ?? "");
  const abortar = dados.get("abortar") === "1";
  if (!id) return;

  const supabase = criarClienteServico();
  const pausas = await lerPausas(id);
  const fechadas = pausas.map((p) => (p.ate ? p : { ...p, ate: agora() }));

  await supabase
    .from("session")
    .update({
      encerrada_em: agora(),
      pausas: fechadas,
      status: abortar ? "abortada" : "concluida",
    })
    .eq("id", id);

  // Fecha a estação que ficou aberta, senão o tempo dela cresceria para sempre.
  await supabase
    .from("session_station")
    .update({ concluida_em: agora() })
    .eq("session_id", id)
    .is("concluida_em", null);

  const { data: sessao } = await supabase.from("session").select("team_id").eq("id", id).maybeSingle();
  if (sessao) {
    await supabase
      .from("queue_entry")
      .update({ status: abortar ? "cancelada" : "concluida" })
      .eq("team_id", sessao.team_id);
  }

  await anotar(perfil.id, abortar ? "sessao_abortada" : "sessao_encerrada", id);

  revalidatePath("/i");
  redirect(abortar ? "/i" : `/i/sessao/${id}/fechar`);
}
