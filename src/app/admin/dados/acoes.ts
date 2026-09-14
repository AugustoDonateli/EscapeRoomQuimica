"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import type { ResultadoAcao } from "@/lib/validacao";

const FRASE = "APAGAR DADOS PESSOAIS";

/**
 * Cumpre a promessa feita ao jogador na tela de consentimento: "apagamos tudo
 * depois do evento".
 *
 * Anonimiza em vez de apagar. Apagar a equipe levaria em cascata a sessão, as
 * respostas e a pontuação — o placar da feira desapareceria junto, e com ele o
 * registro do que foi construído. Trocar nome e e-mail por identificador
 * genérico cumpre a promessa (nenhum dado pessoal fica) e preserva a
 * estatística, que era exatamente o combinado na ata.
 *
 * Ação destrutiva e sem volta: exige digitar a frase de confirmação.
 */
export async function anonimizar(
  _anterior: ResultadoAcao | null,
  dados: FormData,
): Promise<ResultadoAcao> {
  const perfil = await exigirPapel(["admin"]);

  if (String(dados.get("confirmacao") ?? "").trim().toUpperCase() !== FRASE) {
    return { ok: false, erro: `Digite exatamente "${FRASE}" para confirmar.` };
  }

  const supabase = criarClienteServico();

  const { data: equipes, error: erroLeitura } = await supabase
    .from("team")
    .select("id, criada_em")
    .order("criada_em");

  if (erroLeitura) return { ok: false, erro: `Não conseguimos ler as equipes: ${erroLeitura.message}` };
  if (!equipes || equipes.length === 0) return { ok: false, erro: "Nenhuma equipe cadastrada." };

  let equipesTrocadas = 0;
  let jogadoresTrocados = 0;

  for (const [i, equipe] of equipes.entries()) {
    const { error: erroEquipe } = await supabase
      .from("team")
      .update({
        nome: `Equipe ${i + 1}`,
        email_capitao: `equipe${i + 1}@apagado.invalido`,
      })
      .eq("id", equipe.id);

    if (erroEquipe) continue;
    equipesTrocadas++;

    const { data: jogadores } = await supabase
      .from("player")
      .select("id")
      .eq("team_id", equipe.id)
      .order("criado_em");

    for (const [j, jogador] of (jogadores ?? []).entries()) {
      // O ano escolar fica: ele não identifica ninguém e é o que sustenta a
      // categoria no placar.
      const { error } = await supabase
        .from("player")
        .update({ nome: `Jogador ${j + 1}` })
        .eq("id", jogador.id);

      if (!error) jogadoresTrocados++;
    }
  }

  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: "dados_pessoais_anonimizados",
    alvo: "team,player",
    depois: { equipes: equipesTrocadas, jogadores: jogadoresTrocados },
  });

  revalidatePath("/admin/dados");
  revalidatePath("/admin/placar");
  revalidatePath("/placar");

  return {
    ok: true,
    mensagem: `Pronto: ${equipesTrocadas} equipes e ${jogadoresTrocados} jogadores sem nome nem e-mail. O placar continua de pé.`,
  };
}
