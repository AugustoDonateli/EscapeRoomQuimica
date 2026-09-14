"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServico } from "@/lib/supabase/server";
import { lerConfig } from "@/lib/dados";
import { lerPerguntas, validarRespostas } from "@/lib/avaliacao";
import { normalizarCodigo } from "@/lib/codigo";
import { lerCodigoGuardado } from "@/lib/sessao-jogador";

/**
 * Grava a avaliação da equipe.
 *
 * Pública e sem login, então: as respostas são validadas contra as perguntas
 * que estão configuradas (nada de campo inventado entrando no banco), e o
 * código tem que ser o guardado neste celular — senão qualquer pessoa poderia
 * avaliar no lugar de outra equipe.
 *
 * Uma avaliação por sessão, garantido por índice único: reenviar por engano não
 * cria duas linhas.
 */
export async function enviarAvaliacao(
  _anterior: { erro: string } | null,
  dados: FormData,
): Promise<{ erro: string } | null> {
  const codigo = normalizarCodigo(String(dados.get("codigo") ?? ""));
  const guardado = await lerCodigoGuardado();

  if (!codigo) return { erro: "Código inválido." };
  if (guardado !== codigo) {
    return { erro: "Só dá para avaliar no celular que fez o cadastro." };
  }

  const config = await lerConfig();
  const perguntas = lerPerguntas(config.perguntas_avaliacao);
  if (perguntas.length === 0) return { erro: "Nenhuma pergunta de avaliação configurada." };

  const bruto: Record<string, string> = {};
  for (const p of perguntas) bruto[p.id] = String(dados.get(`r:${p.id}`) ?? "");

  const validado = validarRespostas(perguntas, bruto);
  if (!validado.ok) return { erro: validado.erro };

  const supabase = criarClienteServico();

  const { data: equipe } = await supabase
    .from("team")
    .select("id")
    .eq("codigo_acesso", codigo)
    .maybeSingle();
  if (!equipe) return { erro: "Equipe não encontrada." };

  const { data: sessao } = await supabase
    .from("session")
    .select("id")
    .eq("team_id", equipe.id)
    .order("iniciada_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sessao) return { erro: "Não achamos a sessão de vocês." };

  const { error } = await supabase.from("player_feedback").upsert(
    { session_id: sessao.id, respostas: validado.respostas, anonimo: true },
    { onConflict: "session_id" },
  );

  if (error) return { erro: "Não conseguimos gravar. Tente de novo." };

  revalidatePath(`/resultado/${codigo}`);
  redirect(`/resultado/${codigo}?obrigado=1`);
}
