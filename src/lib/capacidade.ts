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

/**
 * O parser de horário é um só, compartilhado com o resto do sistema. Ter dois
 * foi exatamente o que gerou o bug: esta função exigia hh:mm, mas coluna time
 * do Postgres volta como hh:mm:ss — e a capacidade do dia dava zero, deixando
 * a fila permanentemente "cheia" no site publicado.
 */
import { minutosDoDia } from "@/lib/tempo";

export type Capacidade = {
  minutosDeFeira: number;
  minutosPorSessao: number;
  sessoes: number;
  jogadores: number;
};

export function calcularCapacidade(entrada: {
  abre_em: string | null;
  fecha_em: string | null;
  duracao_sessao_min: number;
  reset_min: number;
  equipe_max: number;
}): Capacidade {
  const abre = minutosDoDia(entrada.abre_em);
  const fecha = minutosDoDia(entrada.fecha_em);

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

/**
 * A capacidade dividida entre os dois lotes.
 *
 * Os lotes existem por um problema que ia acontecer com certeza: com
 * agendamento só no dia, todo mundo chega perto da abertura e o dia inteiro
 * esgota nos primeiros vinte minutos — quem visita a feira às onze da manhã,
 * inclusive professor e avaliador, não joga.
 *
 * Então o lote da manhã vende as sessões que acontecem antes da tarde abrir, e
 * o da tarde vende o resto.
 */
export function capacidadePorLote(entrada: {
  abre_em: string | null;
  fecha_em: string | null;
  lote_tarde_abre_em: string | null;
  duracao_sessao_min: number;
  reset_min: number;
  equipe_max: number;
}): { manha: number; tarde: number; total: number } {
  const total = calcularCapacidade(entrada).sessoes;

  const daManha = calcularCapacidade({
    ...entrada,
    fecha_em: entrada.lote_tarde_abre_em,
  }).sessoes;

  const manha = Math.min(total, daManha);

  return { manha, tarde: Math.max(0, total - manha), total };
}
