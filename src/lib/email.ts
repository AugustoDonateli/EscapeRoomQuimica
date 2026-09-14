/**
 * E-mail de confirmação, via Resend.
 *
 * O Resend só envia para endereços quaisquer a partir de um domínio verificado
 * por DNS. Enquanto essa decisão não for tomada, esta função não tenta e não
 * finge: ela devolve o motivo, e a tela deixa de prometer um e-mail que não vai
 * chegar. Prometer e não entregar é pior que não prometer.
 *
 * O lembrete que funciona sem nada disso é o convite de calendário — ver
 * src/lib/agenda.ts.
 */

export type ResultadoEnvio =
  | { enviado: true }
  | { enviado: false; motivo: "sem_chave" | "sem_remetente" | "erro"; detalhe?: string };

export function emailConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_REMETENTE);
}

export async function enviarConfirmacao(entrada: {
  para: string;
  equipe: string;
  codigo: string;
  nomeEvento: string;
  enderecoDoSite: string;
}): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE;

  if (!chave) return { enviado: false, motivo: "sem_chave" };
  if (!remetente) return { enviado: false, motivo: "sem_remetente" };

  const linkDaFila = `${entrada.enderecoDoSite.replace(/\/+$/, "")}/fila/${entrada.codigo}`;

  const corpo = [
    `<p>Olá! A equipe <strong>${entrada.equipe}</strong> está na fila do ${entrada.nomeEvento}.</p>`,
    `<p>Código da equipe: <strong style="font-size:18px;letter-spacing:2px">${entrada.codigo}</strong></p>`,
    `<p><a href="${linkDaFila}">Acompanhe a fila aqui</a> — a página se atualiza sozinha e avisa quando a vez chegar.</p>`,
    `<p style="color:#555;font-size:13px">Anote o código num papel: se o celular morrer, é com ele que vocês voltam para essa tela.</p>`,
  ].join("");

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${chave}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: remetente,
        to: [entrada.para],
        subject: `${entrada.equipe} está na fila do ${entrada.nomeEvento}`,
        html: corpo,
      }),
    });

    if (!resposta.ok) {
      return { enviado: false, motivo: "erro", detalhe: `HTTP ${resposta.status}` };
    }

    return { enviado: true };
  } catch (e) {
    return { enviado: false, motivo: "erro", detalhe: e instanceof Error ? e.message : "falhou" };
  }
}
