/**
 * O tempo da sessão.
 *
 * A regra mais importante desta etapa: o cronômetro NÃO vive no celular. O
 * servidor guarda o instante de início e a lista de pausas; o celular só
 * desenha. Se o instrutor recarregar a página, trocar de aparelho ou ficar sem
 * bateria, o tempo da equipe continua exatamente onde estava.
 *
 * Módulo puro de propósito: é a conta que decide se a equipe ainda tem tempo,
 * e conta assim precisa de teste.
 */

export type Pausa = { de: string; ate?: string | null };

export type EstadoDoTempo = {
  decorridoS: number;
  restanteS: number;
  pausadoAgora: boolean;
  esgotado: boolean;
};

/** Soma dos intervalos de pausa até agora. Pausa aberta conta até este instante. */
export function somarPausas(pausas: Pausa[], agora: Date): number {
  let total = 0;

  for (const p of pausas) {
    const de = Date.parse(p.de);
    if (Number.isNaN(de)) continue;

    const ate = p.ate ? Date.parse(p.ate) : agora.getTime();
    if (Number.isNaN(ate) || ate <= de) continue;

    total += ate - de;
  }

  return Math.floor(total / 1000);
}

export function pausaAberta(pausas: Pausa[]): boolean {
  return pausas.some((p) => !p.ate);
}

/**
 * Quanto a equipe já jogou e quanto ainda tem.
 *
 * O tempo pausado não conta: imprevisto, banheiro ou problema técnico não
 * podem custar a sessão de ninguém — é isso que torna o placar defensável.
 */
export function estadoDoTempo(entrada: {
  iniciadaEm: string;
  encerradaEm?: string | null;
  pausas: Pausa[];
  duracaoMin: number;
  agora?: Date;
}): EstadoDoTempo {
  const agora = entrada.agora ?? new Date();
  const inicio = Date.parse(entrada.iniciadaEm);

  if (Number.isNaN(inicio)) {
    return { decorridoS: 0, restanteS: entrada.duracaoMin * 60, pausadoAgora: false, esgotado: false };
  }

  const fim = entrada.encerradaEm ? Date.parse(entrada.encerradaEm) : agora.getTime();
  const brutoS = Math.max(0, Math.floor((fim - inicio) / 1000));

  const pausadoS = somarPausas(entrada.pausas, entrada.encerradaEm ? new Date(fim) : agora);
  const decorridoS = Math.max(0, brutoS - pausadoS);
  const totalS = Math.max(0, entrada.duracaoMin * 60);

  return {
    decorridoS,
    restanteS: Math.max(0, totalS - decorridoS),
    pausadoAgora: !entrada.encerradaEm && pausaAberta(entrada.pausas),
    esgotado: decorridoS >= totalS,
  };
}
