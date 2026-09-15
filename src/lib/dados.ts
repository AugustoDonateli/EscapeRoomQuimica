import { criarClienteServico } from "@/lib/supabase/server";

/**
 * Leituras do painel. Passam pela chave de serviço porque o admin precisa ver
 * o que é invisível para o público — as perguntas, principalmente. A guarda de
 * papel acontece na página, antes de qualquer uma destas funções ser chamada.
 */

export type Config = {
  nome_evento: string;
  data_evento: string | null;
  // Nuláveis no banco e sem valor padrão: ficam vazias até a organização da
  // feira definir o horário. O tipo diz a verdade sobre isso de propósito —
  // quando dizia que eram obrigatórias, o compilador não pôde avisar que a
  // página inicial ia estourar com o banco recém-criado.
  abre_em: string | null;
  fecha_em: string | null;
  duracao_sessao_min: number;
  reset_min: number;
  lote_manha_abre_em: string;
  lote_tarde_abre_em: string;
  equipe_min: number;
  equipe_max: number;
  anos_participantes: number[];
  tempo_limite_pergunta_s: number;
  penalidade_dica: number;
  peso_progresso: number;
  peso_precisao: number;
  peso_tempo: number;
  peso_instrutor: number;
  usar_categorias: boolean;
  corte_categoria: number;
  nota_individual_no_premio: boolean;
  detectar_saida_de_tela: boolean;
  ausencia_tolerancia_min: number;
  ordem_livre: boolean;
  tentativas_por_pergunta: number;
  perguntas_avaliacao: unknown;
};

export type Estacao = {
  id: string;
  slug: string;
  nome: string;
  ordem: number;
  peso_dificuldade: number;
  tem_pergunta: boolean;
  ativa: boolean;
};

export type Pergunta = {
  id: string;
  station_id: string;
  enunciado: string;
  tipo: "texto" | "multipla";
  alternativas: string[] | null;
  resposta: string;
  tempo_limite_s: number | null;
  ordem: number;
  ativa: boolean;
};

export async function lerConfig(): Promise<Config> {
  const supabase = criarClienteServico();
  const { data, error } = await supabase.from("event_config").select("*").eq("id", true).single();

  if (error) throw new Error(`Não foi possível ler a configuração do evento: ${error.message}`);
  return data as Config;
}

export async function listarEstacoes(): Promise<Estacao[]> {
  const supabase = criarClienteServico();
  const { data, error } = await supabase
    .from("station")
    .select("id, slug, nome, ordem, peso_dificuldade, tem_pergunta, ativa")
    .order("ordem", { ascending: true });

  if (error) throw new Error(`Não foi possível listar as estações: ${error.message}`);
  return (data ?? []) as Estacao[];
}

export async function listarPerguntas(): Promise<Pergunta[]> {
  const supabase = criarClienteServico();
  const { data, error } = await supabase
    .from("question")
    .select("id, station_id, enunciado, tipo, alternativas, resposta, tempo_limite_s, ordem, ativa")
    .order("ordem", { ascending: true });

  if (error) throw new Error(`Não foi possível listar as perguntas: ${error.message}`);
  return (data ?? []) as Pergunta[];
}
