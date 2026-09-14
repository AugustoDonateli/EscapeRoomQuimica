"use server";

import { redirect } from "next/navigation";
import { criarClienteServico } from "@/lib/supabase/server";
import { guardarCodigo } from "@/lib/sessao-jogador";

/**
 * "Perdi o código."
 *
 * Exige o nome da equipe E o e-mail do capitão, os dois. Com só o e-mail isto
 * viraria um jeito de descobrir quais e-mails estão cadastrados; com os dois,
 * quem recupera é quem sabe o que a própria equipe escreveu.
 *
 * A resposta é a mesma quando não encontra e quando os dados não combinam —
 * de novo, para não contar o que existe no banco.
 */
export async function recuperar(
  _anterior: string | null,
  dados: FormData,
): Promise<string> {
  const nome = String(dados.get("nome") ?? "").trim();
  const email = String(dados.get("email") ?? "").trim();

  if (nome.length < 2 || !email.includes("@")) {
    return "Preencha o nome da equipe e o e-mail usados no cadastro.";
  }

  const supabase = criarClienteServico();
  const { data } = await supabase
    .from("team")
    .select("codigo_acesso, nome")
    .ilike("email_capitao", email)
    .limit(10);

  const alvo = (data ?? []).find(
    (e) => e.nome.trim().toLowerCase() === nome.toLowerCase(),
  );

  if (!alvo) return "Não encontramos equipe com esse nome e esse e-mail.";

  await guardarCodigo(alvo.codigo_acesso);
  redirect(`/fila/${alvo.codigo_acesso}`);
}
