/**
 * Convite de calendário (.ics).
 *
 * É o lembrete que funciona sem depender de nada: sem domínio, sem conta de
 * e-mail, sem API paga. O jogador toca no link, o celular dele guarda o evento
 * e o próprio aparelho avisa quando estiver chegando a hora.
 *
 * Enquanto a decisão sobre domínio de e-mail não for tomada, este é o lembrete
 * de verdade do projeto — e mesmo depois continua sendo o mais confiável.
 */

function escapar(texto: string): string {
  return texto.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

function paraIcs(data: Date): string {
  return data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Quebra a linha a cada 75 OCTETOS, como o formato exige — e não a cada 75
 * caracteres, que é o erro fácil: em UTF-8 cada acento ocupa dois octetos, e
 * "Ciências" numa linha de 75 caracteres já passa do limite. A conta por
 * caractere gerava arquivo fora da especificação, que alguns aplicativos de
 * calendário recusam.
 *
 * A quebra nunca cai no meio de um caractere: o acumulador é por ponto de
 * código, não por byte.
 */
function dobrar(linha: string): string {
  const octetos = (t: string) => new TextEncoder().encode(t).length;
  if (octetos(linha) <= 75) return linha;

  const partes: string[] = [];
  let atual = "";
  let limite = 75;

  for (const caractere of linha) {
    if (octetos(atual + caractere) > limite) {
      partes.push(atual);
      atual = caractere;
      // A continuação começa com um espaço, que também conta no limite.
      limite = 74;
    } else {
      atual += caractere;
    }
  }
  if (atual) partes.push(atual);

  return partes.map((p, i) => (i === 0 ? p : ` ${p}`)).join("\r\n");
}

export function montarIcs(entrada: {
  nomeEvento: string;
  equipe: string;
  codigo: string;
  inicio: Date;
  duracaoMin: number;
  local?: string;
  minutosDeAviso?: number;
}): string {
  const fim = new Date(entrada.inicio.getTime() + entrada.duracaoMin * 60_000);
  const aviso = entrada.minutosDeAviso ?? 10;

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Escape Quimico//Feira de Ciencias//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${entrada.codigo}@escape-quimico`,
    `DTSTAMP:${paraIcs(new Date())}`,
    `DTSTART:${paraIcs(entrada.inicio)}`,
    `DTEND:${paraIcs(fim)}`,
    dobrar(`SUMMARY:${escapar(`${entrada.nomeEvento} — ${entrada.equipe}`)}`),
    dobrar(
      `DESCRIPTION:${escapar(
        `Sessão da equipe ${entrada.equipe}. Código: ${entrada.codigo}. O horário é estimado: acompanhe a fila no site, que se atualiza sozinha.`,
      )}`,
    ),
    entrada.local ? dobrar(`LOCATION:${escapar(entrada.local)}`) : null,
    "BEGIN:VALARM",
    `TRIGGER:-PT${aviso}M`,
    "ACTION:DISPLAY",
    dobrar(`DESCRIPTION:${escapar(`Sua vez no ${entrada.nomeEvento} está chegando`)}`),
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);

  // O formato exige terminador CRLF, inclusive no fim do arquivo.
  return `${linhas.join("\r\n")}\r\n`;
}
