/**
 * Código de acesso da equipe. É a senha do jogador — só que ele não digita
 * senha nenhuma: o celular guarda o código num cookie e a raiz do site leva a
 * pessoa de volta ao lugar certo.
 *
 * O alfabeto não tem I, O, 0 nem 1. Alguém vai ler esse código em voz alta no
 * meio do barulho da feira, ou copiar de um papel: confundir zero com letra O
 * é o tipo de erro que a gente pode simplesmente não ter.
 */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarCodigo(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);

  const letras = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]);
  return `${letras.slice(0, 3).join("")}-${letras.slice(3).join("")}`;
}

export function normalizarCodigo(bruto: string): string {
  const limpo = bruto.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (limpo.length !== 6) return "";
  return `${limpo.slice(0, 3)}-${limpo.slice(3)}`;
}
