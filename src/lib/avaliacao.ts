import { z } from "zod";

/**
 * As perguntas da avaliação que o jogador responde no fim.
 *
 * Vivem na configuração do evento, não no código: o que exatamente os
 * jogadores vão avaliar é decisão da organização, e ficou em aberto desde a
 * primeira conversa. Editável no painel significa que a decisão pode ser
 * tomada na semana da feira sem mexer em nada.
 */

export const esquemaPerguntaAvaliacao = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]{2,32}$/, "Use letras minúsculas, números, hífen ou sublinhado."),
  texto: z.string().trim().min(5).max(200),
  tipo: z.enum(["estrelas", "texto"]),
});

export const esquemaPerguntasAvaliacao = z
  .array(esquemaPerguntaAvaliacao)
  .min(1, "Deixe pelo menos uma pergunta.")
  .max(12, "Mais de doze perguntas e ninguém responde até o fim.")
  .refine((lista) => new Set(lista.map((p) => p.id)).size === lista.length, {
    message: "Duas perguntas com o mesmo identificador.",
  });

export type PerguntaAvaliacao = z.infer<typeof esquemaPerguntaAvaliacao>;

/** Lê o jsonb do banco sem confiar nele: conteúdo malformado não derruba a tela. */
export function lerPerguntas(bruto: unknown): PerguntaAvaliacao[] {
  const r = esquemaPerguntasAvaliacao.safeParse(bruto);
  return r.success ? r.data : [];
}

/**
 * Valida as respostas contra as perguntas configuradas. Esta é a única defesa:
 * a avaliação é pública, sem login, e a ação é alcançável por POST direto.
 */
export function validarRespostas(
  perguntas: PerguntaAvaliacao[],
  bruto: Record<string, string>,
): { ok: true; respostas: Record<string, number | string> } | { ok: false; erro: string } {
  const respostas: Record<string, number | string> = {};

  for (const p of perguntas) {
    const valor = (bruto[p.id] ?? "").trim();
    if (valor === "") continue;

    if (p.tipo === "estrelas") {
      const n = Number(valor);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return { ok: false, erro: `Nota inválida em "${p.texto}".` };
      }
      respostas[p.id] = n;
    } else {
      respostas[p.id] = valor.slice(0, 600);
    }
  }

  if (Object.keys(respostas).length === 0) {
    return { ok: false, erro: "Responda pelo menos uma pergunta." };
  }

  return { ok: true, respostas };
}
