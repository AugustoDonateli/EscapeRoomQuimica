"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { esquemaEstacao, type ResultadoAcao } from "@/lib/validacao";

/**
 * Estação não se apaga, se desativa.
 *
 * Apagar levaria as perguntas junto (a chave estrangeira é em cascata) e o
 * cartaz com o QR já estaria impresso e colado na parede. Desativar tira a
 * estação do jogo sem destruir o que outra equipe escreveu.
 */

export async function salvarEstacao(
  _anterior: ResultadoAcao | null,
  dados: FormData,
): Promise<ResultadoAcao> {
  const perfil = await exigirPapel(["admin"]);

  const id = String(dados.get("id") ?? "").trim() || undefined;

  const analisado = esquemaEstacao.safeParse({
    id,
    slug: String(dados.get("slug") ?? "").toUpperCase(),
    nome: String(dados.get("nome") ?? ""),
    ordem: dados.get("ordem"),
    peso_dificuldade: dados.get("peso_dificuldade"),
    tem_pergunta: dados.get("tem_pergunta") === "on",
  });

  if (!analisado.success) {
    return { ok: false, erro: analisado.error.issues[0]?.message ?? "Confira os campos." };
  }

  const { id: idAnalisado, ...campos } = analisado.data;
  const supabase = criarClienteServico();

  const { error } = idAnalisado
    ? await supabase.from("station").update(campos).eq("id", idAnalisado)
    : await supabase.from("station").insert(campos);

  if (error) {
    // O banco tem índice único na ordem entre as ativas e no slug: em vez de
    // mostrar o erro cru do Postgres, diz o que a pessoa precisa mudar.
    if (error.code === "23505" || error.message.includes("duplicate")) {
      return {
        ok: false,
        erro: "Já existe estação ativa com esse código ou nessa ordem. Troque um dos dois.",
      };
    }
    return { ok: false, erro: `O banco recusou: ${error.message}` };
  }

  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: idAnalisado ? "estacao_editada" : "estacao_criada",
    alvo: campos.slug,
    depois: campos,
  });

  revalidatePath("/admin/estacoes");
  revalidatePath("/admin/qrcodes");
  return { ok: true, mensagem: idAnalisado ? "Estação atualizada." : "Estação criada." };
}

export async function alternarEstacao(dados: FormData): Promise<void> {
  const perfil = await exigirPapel(["admin"]);

  const id = String(dados.get("id") ?? "");
  const ativar = dados.get("ativar") === "1";
  if (!id) return;

  const supabase = criarClienteServico();
  await supabase.from("station").update({ ativa: ativar }).eq("id", id);
  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: ativar ? "estacao_reativada" : "estacao_desativada",
    alvo: id,
  });

  revalidatePath("/admin/estacoes");
  revalidatePath("/admin/qrcodes");
}
