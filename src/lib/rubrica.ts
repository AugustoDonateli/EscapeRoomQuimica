/**
 * A rubrica do instrutor e a tradução dos toques em nota sugerida.
 *
 * A parte subjetiva do placar vale 20% e é a única que depende de opinião. Para
 * ela ser defensável, três coisas: a rubrica é publicada antes do jogo, cada
 * nota tem descritor escrito, e a nota chega pré-sugerida pelos toques que o
 * instrutor deu durante a sessão — com hora registrada.
 *
 * Se uma equipe contestar o prêmio, a resposta não é "o instrutor achou": é
 * uma linha do tempo que dá para mostrar na tela.
 */

export type TipoObservacao =
  | "liderou"
  | "ajudou"
  | "explicou"
  | "seguranca"
  | "passivo"
  | "atropelou";

export const OBSERVACOES: { tipo: TipoObservacao; curto: string; rotulo: string; bom: boolean }[] = [
  { tipo: "liderou", curto: "L", rotulo: "Liderou uma decisão", bom: true },
  { tipo: "ajudou", curto: "A", rotulo: "Ajudou um colega", bom: true },
  { tipo: "explicou", curto: "E", rotulo: "Explicou o raciocínio químico", bom: true },
  { tipo: "seguranca", curto: "S", rotulo: "Manuseou com segurança", bom: true },
  { tipo: "passivo", curto: "P", rotulo: "Ficou de fora", bom: false },
  { tipo: "atropelou", curto: "X", rotulo: "Atropelou a equipe", bom: false },
];

export type Criterio = "colaboracao" | "raciocinio" | "seguranca" | "autonomia";

export const CRITERIOS: {
  criterio: Criterio;
  rotulo: string;
  /** Descritor de cada nota, de 1 a 5. É o que torna a nota discutível. */
  descritores: [string, string, string, string, string];
  somam: TipoObservacao[];
  subtraem: TipoObservacao[];
}[] = [
  {
    criterio: "colaboracao",
    rotulo: "Colaboração",
    descritores: [
      "Trabalhou sozinho, ignorou a equipe",
      "Interagiu pouco, só quando chamado",
      "Participou das conversas da equipe",
      "Ajudou colegas por iniciativa própria",
      "Puxou a equipe junto do começo ao fim",
    ],
    somam: ["ajudou"],
    subtraem: ["passivo", "atropelou"],
  },
  {
    criterio: "raciocinio",
    rotulo: "Raciocínio químico",
    descritores: [
      "Não usou conceito de química",
      "Tentou, mas o raciocínio não fechou",
      "Chegou à resposta com apoio da equipe",
      "Explicou o porquê da resposta",
      "Ensinou o conceito para os colegas",
    ],
    somam: ["explicou"],
    subtraem: ["passivo"],
  },
  {
    criterio: "seguranca",
    rotulo: "Segurança e organização",
    descritores: [
      "Manuseou material de forma imprudente",
      "Precisou ser corrigido mais de uma vez",
      "Seguiu as instruções quando lembrado",
      "Cuidadoso com material e bancada",
      "Zelou pela segurança da equipe toda",
    ],
    somam: ["seguranca"],
    subtraem: ["atropelou"],
  },
  {
    criterio: "autonomia",
    rotulo: "Autonomia",
    descritores: [
      "Esperou que alguém resolvesse",
      "Agiu só com instrução direta",
      "Tomou decisões simples sozinho",
      "Conduziu parte do enigma",
      "Destravou a equipe em momento difícil",
    ],
    somam: ["liderou"],
    subtraem: ["passivo"],
  },
];

/**
 * Toques viram nota sugerida.
 *
 * A regra é deliberadamente simples e escrita: começa em 3, cada toque que
 * conta a favor sobe um, cada toque contra desce um, limitado entre 1 e 5. O
 * instrutor ajusta se discordar — a sugestão existe para ele não ter que
 * lembrar de nada no fim de vinte minutos de sala, não para decidir por ele.
 */
export function sugerirNotas(
  contagem: Partial<Record<TipoObservacao, number>>,
): Record<Criterio, number> {
  const nota = (c: (typeof CRITERIOS)[number]) => {
    const aFavor = c.somam.reduce((s, t) => s + (contagem[t] ?? 0), 0);
    const contra = c.subtraem.reduce((s, t) => s + (contagem[t] ?? 0), 0);
    return Math.min(5, Math.max(1, 3 + aFavor - contra));
  };

  return Object.fromEntries(CRITERIOS.map((c) => [c.criterio, nota(c)])) as Record<
    Criterio,
    number
  >;
}

export function contarObservacoes(
  observacoes: { tipo: TipoObservacao }[],
): Partial<Record<TipoObservacao, number>> {
  const contagem: Partial<Record<TipoObservacao, number>> = {};
  for (const o of observacoes) contagem[o.tipo] = (contagem[o.tipo] ?? 0) + 1;
  return contagem;
}
