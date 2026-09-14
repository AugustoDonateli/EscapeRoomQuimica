"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { recalcularTudo } from "@/lib/placar";

/**
 * Recalcula o placar inteiro. Serve para depois de mexer num peso: o resultado
 * de todas as sessões passa a refletir a regra nova, de uma vez, em vez de
 * metade das equipes ficar com a conta antiga.
 */
export async function recalcular(): Promise<void> {
  const perfil = await exigirPapel(["admin"]);
  const quantas = await recalcularTudo();

  const supabase = criarClienteServico();
  await supabase.from("audit_log").insert({
    profile_id: perfil.id,
    acao: "placar_recalculado",
    alvo: "score",
    depois: { sessoes: quantas },
  });

  revalidatePath("/admin/placar");
  revalidatePath("/placar");
}
