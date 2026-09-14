import { z } from "zod";

/**
 * Nada entra no banco sem passar por aqui. O banco também tem as suas
 * restrições — as duas camadas dizem a mesma coisa de propósito: uma protege
 * contra formulário errado, a outra contra código errado.
 */

const horario = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato 00:00");

export const esquemaConfig = z
  .object({
    nome_evento: z.string().trim().min(2).max(60),
    data_evento: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").nullable(),
    abre_em: horario,
    fecha_em: horario,
    duracao_sessao_min: z.coerce.number().int().min(5).max(180),
    reset_min: z.coerce.number().int().min(0).max(60),
    lote_manha_abre_em: horario,
    lote_tarde_abre_em: horario,
    equipe_min: z.coerce.number().int().min(1).max(20),
    equipe_max: z.coerce.number().int().min(1).max(20),
    tempo_limite_pergunta_s: z.coerce.number().int().min(15).max(600),
    penalidade_dica: z.coerce.number().min(0).max(0.5),
    peso_progresso: z.coerce.number().min(0).max(1),
    peso_precisao: z.coerce.number().min(0).max(1),
    peso_tempo: z.coerce.number().min(0).max(1),
    peso_instrutor: z.coerce.number().min(0).max(1),
    usar_categorias: z.boolean(),
    corte_categoria: z.coerce.number().min(1).max(12),
    nota_individual_no_premio: z.boolean(),
    detectar_saida_de_tela: z.boolean(),
    ausencia_tolerancia_min: z.coerce.number().int().min(1).max(30),
    ordem_livre: z.boolean(),
    tentativas_por_pergunta: z.coerce.number().int().min(1).max(10),
  })
  .refine((c) => c.equipe_max >= c.equipe_min, {
    message: "O tamanho máximo da equipe não pode ser menor que o mínimo.",
    path: ["equipe_max"],
  })
  .refine((c) => c.fecha_em > c.abre_em, {
    message: "A feira não pode fechar antes de abrir.",
    path: ["fecha_em"],
  })
  .refine(
    (c) =>
      Math.abs(c.peso_progresso + c.peso_precisao + c.peso_tempo + c.peso_instrutor - 1) < 0.0005,
    {
      message: "Os quatro pesos do placar precisam somar exatamente 1.",
      path: ["peso_progresso"],
    },
  );

export const esquemaEstacao = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{2,32}$/, "Só letras, números e hífen — é o que vai impresso no QR."),
  nome: z.string().trim().min(2).max(60),
  ordem: z.coerce.number().int().min(1).max(99),
  peso_dificuldade: z.coerce.number().min(0.25).max(10),
  tem_pergunta: z.boolean(),
});

export const esquemaPergunta = z
  .object({
    id: z.string().uuid().optional(),
    station_id: z.string().uuid("Escolha a estação."),
    enunciado: z.string().trim().min(10).max(600),
    tipo: z.enum(["texto", "multipla"]),
    alternativas: z.string().nullable(),
    resposta: z.string().trim().min(1).max(200),
    tempo_limite_s: z.number().int().min(15).max(600).nullable(),
    ordem: z.coerce.number().int().min(1).max(99),
  })
  .superRefine((p, ctx) => {
    if (p.tipo !== "multipla") return;

    const alternativas = listarAlternativas(p.alternativas);

    if (alternativas.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Múltipla escolha precisa de pelo menos duas alternativas, uma por linha.",
        path: ["alternativas"],
      });
      return;
    }

    // A resposta correta tem que ser uma das alternativas, senão a pergunta
    // fica impossível de acertar e ninguém descobre isso até o dia da feira.
    if (!alternativas.includes(p.resposta.trim())) {
      ctx.addIssue({
        code: "custom",
        message: "A resposta correta precisa ser igual a uma das alternativas.",
        path: ["resposta"],
      });
    }
  });

/** Alternativas são digitadas uma por linha — é o formato mais rápido de escrever. */
export function listarAlternativas(texto?: string | null): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export type ResultadoAcao = { ok: true; mensagem: string } | { ok: false; erro: string };
