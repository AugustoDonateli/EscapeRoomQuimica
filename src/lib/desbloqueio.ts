/**
 * Que estações a equipe pode abrir agora.
 *
 * O QR colado na parede é estático e público: qualquer pessoa pode ler o QR da
 * última estação e abrir o endereço. Quem impede é esta regra, conferida no
 * servidor a cada leitura — e não o QR, que não tem como se atualizar depois de
 * impresso.
 *
 * Se a ordem é livre ou fixa é decisão da equipe das estações, então vem da
 * configuração do evento em vez de estar escrito aqui.
 */

export type MotivoBloqueio = "fora_de_ordem" | "sem_pergunta" | "inativa" | "ja_concluida";

export function estacaoLiberada(entrada: {
  ordem: number;
  ativa: boolean;
  temPergunta: boolean;
  ordensConcluidas: number[];
  ordemLivre: boolean;
}): { liberada: true } | { liberada: false; motivo: MotivoBloqueio } {
  if (!entrada.ativa) return { liberada: false, motivo: "inativa" };
  if (!entrada.temPergunta) return { liberada: false, motivo: "sem_pergunta" };
  if (entrada.ordensConcluidas.includes(entrada.ordem)) {
    return { liberada: false, motivo: "ja_concluida" };
  }
  if (entrada.ordemLivre) return { liberada: true };

  // Em ordem fixa, a equipe só abre a estação seguinte à última concluída.
  const maiorConcluida = entrada.ordensConcluidas.length
    ? Math.max(...entrada.ordensConcluidas)
    : 0;

  return entrada.ordem <= maiorConcluida + 1
    ? { liberada: true }
    : { liberada: false, motivo: "fora_de_ordem" };
}
