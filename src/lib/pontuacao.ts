/**
 * O motor de pontuação.
 *
 * É o código mais consequente do projeto: ele decide quem ganha o prêmio.
 * Então três regras de construção:
 *
 * 1. Módulo puro. Sem banco, sem rede, sem hora do sistema — só a conta.
 * 2. As quatro parcelas ficam separadas e somam o total. Dá para explicar o
 *    resultado componente por componente, em voz alta, para quem perdeu.
 * 3. Nenhuma parcela passa de 100%. Ninguém compensa uma parte ruim sendo
 *    excepcional em outra além do teto — senão o peso publicado seria mentira.
 *
 * A escala é de 0 a 1000 porque número inteiro grande é mais fácil de comparar
 * de longe, na TV, do que casa decimal.
 */

export const ESCALA = 1000;

export type Pesos = {
  progresso: number;
  precisao: number;
  tempo: number;
  instrutor: number;
};

export type EntradaDaConta = {
  /** Soma do peso de dificuldade das estações que a equipe concluiu. */
  pesoConcluido: number;
  /** Soma do peso de todas as estações que valiam nesta feira. */
  pesoTotal: number;
  acertos: number;
  tentativas: number;
  dicas: number;
  /** Desconto por dica, de 0 a 1. Vem da configuração do evento. */
  penalidadeDica: number;
  decorridoS: number;
  alvoS: number;
  /** Notas da rubrica, de 1 a 5. Vazio quando o instrutor ainda não avaliou. */
  notas: number[];
};

export type Parcelas = {
  progresso: number;
  precisao: number;
  tempo: number;
  instrutor: number;
  total: number;
  /** As frações de 0 a 1, antes do peso. Servem para a tela de auditoria. */
  fracoes: { progresso: number; precisao: number; tempo: number; instrutor: number };
};

function entre(valor: number, minimo: number, maximo: number): number {
  if (!Number.isFinite(valor)) return minimo;
  return Math.min(maximo, Math.max(minimo, valor));
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularPontuacao(e: EntradaDaConta, pesos: Pesos): Parcelas {
  // Progresso: quanto da sala a equipe venceu, com estação difícil valendo
  // mais que estação fácil.
  const progresso = e.pesoTotal > 0 ? entre(e.pesoConcluido / e.pesoTotal, 0, 1) : 0;

  // Precisão: acerto por tentativa, com desconto por dica. Sem tentativa
  // nenhuma a precisão é zero — não responder não é o mesmo que acertar.
  const bruta = e.tentativas > 0 ? entre(e.acertos / e.tentativas, 0, 1) : 0;
  const descontoDica = entre(1 - e.penalidadeDica * Math.max(0, e.dicas), 0, 1);
  const precisao = entre(bruta * descontoDica, 0, 1);

  // Tempo: relativo ao tempo-alvo, nunca absoluto. Usar o alvo ou menos vale
  // nota cheia; passar do alvo desconta na proporção.
  //
  // E o tempo só conta na medida do que a equipe fez: sem isto, desistir no
  // segundo minuto daria nota quase cheia em tempo, e sair correndo da sala
  // seria estratégia.
  const ritmo = e.decorridoS > 0 ? entre(e.alvoS / e.decorridoS, 0, 1) : 0;
  const tempo = entre(progresso * ritmo, 0, 1);

  // Instrutor: média das notas da rubrica, de 1 a 5, esticada para 0 a 1.
  // Nota 1 vale zero de propósito: é o piso da escala, não meio ponto grátis.
  const media =
    e.notas.length > 0 ? e.notas.reduce((s, n) => s + entre(n, 1, 5), 0) / e.notas.length : 0;
  const instrutor = e.notas.length > 0 ? entre((media - 1) / 4, 0, 1) : 0;

  const fracoes = { progresso, precisao, tempo, instrutor };

  const parcelas = {
    progresso: arredondar(progresso * pesos.progresso * ESCALA),
    precisao: arredondar(precisao * pesos.precisao * ESCALA),
    tempo: arredondar(tempo * pesos.tempo * ESCALA),
    instrutor: arredondar(instrutor * pesos.instrutor * ESCALA),
  };

  return {
    ...parcelas,
    total: arredondar(
      parcelas.progresso + parcelas.precisao + parcelas.tempo + parcelas.instrutor,
    ),
    fracoes,
  };
}

export type LinhaDoRanking = {
  total: number;
  fracaoPrecisao: number;
  fracaoTempo: number;
  dicas: number;
};

/**
 * O desempate, decidido e escrito antes do jogo — como prometido na ata:
 * total, depois precisão, depois tempo relativo, depois menos dicas.
 *
 * Empate que sobrevive a tudo isso é empate de verdade, e aí a ordem é estável
 * (não muda de lugar a cada vez que a página abre), o que importa: placar que
 * embaralha sozinho na TV parece defeito.
 */
export function compararParaRanking(a: LinhaDoRanking, b: LinhaDoRanking): number {
  if (b.total !== a.total) return b.total - a.total;
  if (b.fracaoPrecisao !== a.fracaoPrecisao) return b.fracaoPrecisao - a.fracaoPrecisao;
  if (b.fracaoTempo !== a.fracaoTempo) return b.fracaoTempo - a.fracaoTempo;
  return a.dicas - b.dicas;
}

/** Explicação do resultado em uma frase, para a tela de auditoria. */
export function explicarTotal(p: Parcelas): string {
  return `progresso ${p.progresso} + precisão ${p.precisao} + tempo ${p.tempo} + instrutor ${p.instrutor} = ${p.total}`;
}
