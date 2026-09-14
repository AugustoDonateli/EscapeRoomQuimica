"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServico } from "@/lib/supabase/server";
import { esquecerCodigo, lerCodigoGuardado } from "@/lib/sessao-jogador";

/**
 * Cancelar a própria vaga.
 *
 * A checagem de dono é obrigatória: esta ação é pública e alcançável por POST
 * direto, então sem ela qualquer pessoa poderia derrubar a equipe da frente
 * mandando o código dela. O único jeito de cancelar é ter o código guardado no
 * próprio celular.
 */
export async function cancelarVaga(dados: FormData): Promise<void> {
  const codigo = String(dados.get("codigo") ?? "");
  const guardado = await lerCodigoGuardado();

  if (!codigo || guardado !== codigo) {
    redirect(`/fila/${codigo}?erro=nao-e-sua`);
  }

  const supabase = criarClienteServico();

  const { data: equipe } = await supabase
    .from("team")
    .select("id")
    .eq("codigo_acesso", codigo)
    .maybeSingle();

  if (equipe) {
    await supabase
      .from("queue_entry")
      .update({ status: "cancelada" })
      .eq("team_id", equipe.id)
      .in("status", ["aguardando", "chamada"]);
  }

  await esquecerCodigo();
  revalidatePath(`/fila/${codigo}`);
  redirect("/?cancelada=1");
}
