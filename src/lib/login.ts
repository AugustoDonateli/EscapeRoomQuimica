/**
 * Mensagem para quem tentou entrar e não conseguiu.
 *
 * Erro de credencial é sempre a mesma frase, sem dizer se foi o e-mail ou a
 * senha: contar qual dos dois errou é contar quais e-mails existem.
 *
 * Erro do próprio serviço de login não entra nessa regra. Na primeira
 * publicação real o GoTrue respondeu 500 (as contas tinham NULL onde ele
 * espera texto vazio) e a tela disse "e-mail ou senha não conferem" — quem
 * estava tentando entrar passou a caçar a senha, que estava certa. Falha de
 * serviço precisa se identificar como falha de serviço.
 */
export function mensagemDeFalhaNoLogin(status?: number | null): string {
  if (status === 429) {
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  }

  if (typeof status !== "number" || status <= 0 || status >= 500) {
    return "O serviço de login falhou — não é a sua senha. Tente de novo em um minuto.";
  }

  return "E-mail ou senha não conferem.";
}
