/**
 * A sigla de duas letras de uma estação, no formato de símbolo de elemento:
 * maiúscula e minúscula, sem acento — "Titulação" vira "Ti", "Bancada das
 * Ligações" vira "Bl".
 *
 * Serve para desenhar a sala como uma fileira de células de tabela periódica.
 * É derivada do nome que a organização escreveu, então nenhuma equipe precisa
 * inventar código nenhum: escreveu o nome, ganhou o símbolo.
 */

/** Palavras que não contam para a sigla: ligação não é elemento. */
const LIGACOES = new Set(["de", "da", "do", "das", "dos", "e", "em", "no", "na", "a", "o", "as", "os", "com"]);

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function siglaDaEstacao(nome: string): string {
  const palavras = semAcento(nome)
    .split(/[\s-]+/)
    .map((p) => p.replace(/[^A-Za-zÀ-ÿ0-9]/g, ""))
    // Só palavra com letra conta: nome tipo "EST-01 Cofre" daria "E0" se o
    // número entrasse, e "E0" não se lê como símbolo de elemento.
    .filter((p) => /[A-Za-zÀ-ÿ]/.test(p) && !LIGACOES.has(p.toLowerCase()));

  if (palavras.length === 0) return "Eq";

  if (palavras.length >= 2) {
    return palavras[0][0].toUpperCase() + palavras[1][0].toLowerCase();
  }

  const unica = palavras[0];
  return unica.length >= 2
    ? unica[0].toUpperCase() + unica[1].toLowerCase()
    : unica[0].toUpperCase();
}
