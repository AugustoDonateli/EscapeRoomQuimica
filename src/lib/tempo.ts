/**
 * O servidor roda em UTC e a feira acontece em Brasília. Toda decisão de "já
 * abriu?" e "é hoje?" tem que usar o fuso do lugar, senão o agendamento abre
 * três horas antes ou depois do combinado.
 */
export const FUSO = "America/Sao_Paulo";

/** Data de hoje no fuso da feira, no formato aaaa-mm-dd. */
export function hojeLocal(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** Hora de agora no fuso da feira, no formato hh:mm. */
export function horaLocal(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(agora);
}

/**
 * Minutos desde a meia-noite, para comparar horários sem virar data.
 *
 * Aceita nulo porque coluna `time` do Postgres é nulável e pode estar vazia —
 * foi assim que a primeira publicação quebrou: `abre_em` e `fecha_em` nunca
 * foram preenchidos, o tipo em TypeScript dizia que eram texto obrigatório, e
 * `.trim()` num nulo derrubou a página inicial. Quem decide o que fazer sem
 * horário é quem chama, não esta função.
 */
export function minutosDoDia(horario: string | null | undefined): number | null {
  if (typeof horario !== "string") return null;

  const m = /^([01]\d|2[0-3]):([0-5]\d)/.exec(horario.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Formata um instante como hh:mm no fuso da feira. */
export function formatarHora(quando: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(quando);
}
