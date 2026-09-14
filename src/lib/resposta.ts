/**
 * Conferência de resposta.
 *
 * O jogador está com pressa, no escuro, digitando com o polegar. Errar por
 * causa de maiúscula, espaço sobrando ou vírgula em vez de ponto não é errar
 * química — e ninguém vai achar justo perder o prêmio por isso.
 *
 * O que a gente perdoa: caixa, espaço, acento, e vírgula ou ponto como
 * separador decimal. O que a gente não perdoa: a resposta errada.
 */

export function normalizarResposta(bruto: string): string {
  let t = bruto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acento
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  // 0,20 e 0.20 são a mesma quantidade de matéria. Só troca a vírgula quando o
  // texto é um número — em "ficou ácido, depois básico" a vírgula é pontuação.
  if (/^-?\d+([.,]\d+)?$/.test(t)) {
    t = t.replace(",", ".");
    // 0.20 e 0.2 também são a mesma coisa.
    if (t.includes(".")) t = t.replace(/0+$/, "").replace(/\.$/, "");
  }

  return t;
}

export function conferirResposta(dada: string, correta: string): boolean {
  return normalizarResposta(dada) === normalizarResposta(correta);
}
