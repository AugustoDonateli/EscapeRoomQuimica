/**
 * A conta mais importante do projeto: quantas equipes cabem no dia.
 *
 * Fica num arquivo próprio, sem nada do servidor dentro, para o painel poder
 * recalcular na tela enquanto a pessoa ajusta a duração e o reset — é muito
 * melhor descobrir que só cabem catorze equipes agora do que no dia da feira.
 *
 * O tempo de reset entra na conta porque a sala precisa ser rearmada entre uma
 * equipe e a próxima. Ignorar isso faz a fila mentir desde a primeira sessão.
 */

export type Capacidade = {
  minutosDeFeira: number;
  minutosPorSessao: number;
  sessoes: number;
  jogadores: number;
};

function minutosDoHorario(horario: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(horario.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function calcularCapacidade(entrada: {
  abre_em: string;
  fecha_em: string;
  duracao_sessao_min: number;
  reset_min: number;
  equipe_max: number;
}): Capacidade {
  const abre = minutosDoHorario(entrada.abre_em);
  const fecha = minutosDoHorario(entrada.fecha_em);

  const minutosDeFeira = abre === null || fecha === null ? 0 : Math.max(0, fecha - abre);
  const minutosPorSessao = Math.max(0, entrada.duracao_sessao_min) + Math.max(0, entrada.reset_min);

  const sessoes = minutosPorSessao > 0 ? Math.floor(minutosDeFeira / minutosPorSessao) : 0;

  return {
    minutosDeFeira,
    minutosPorSessao,
    sessoes,
    jogadores: sessoes * Math.max(0, entrada.equipe_max),
  };
}
