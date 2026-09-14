import { criarClienteServico } from "@/lib/supabase/server";
import { lerConfig, type Config } from "@/lib/dados";
import { estadoDoTempo, type Pausa } from "@/lib/sessao";
import {
  calcularPontuacao,
  compararParaRanking,
  type EntradaDaConta,
  type Parcelas,
} from "@/lib/pontuacao";

/**
 * Junta os números da sessão, chama a conta e grava.
 *
 * Só sessão concluída entra no placar: abortada é o caso feio (sala quebrada,
 * equipe que desistiu no meio) e não seria justo comparar com quem jogou.
 */

export type EntradaAuditada = EntradaDaConta & {
  estacoesConcluidas: number;
  estacoesTotais: number;
};

export type LinhaDoPlacar = {
  sessaoId: string;
  equipe: string;
  codigo: string;
  categoria: "iniciante" | "avancado" | null;
  parcelas: Parcelas;
  entrada: EntradaAuditada;
  posicao: number;
};

async function montarEntrada(
  sessaoId: string,
  config: Config,
): Promise<{ entrada: EntradaAuditada; teamId: string } | null> {
  const supabase = criarClienteServico();

  const { data: sessao } = await supabase
    .from("session")
    .select("id, team_id, status, iniciada_em, encerrada_em, pausas")
    .eq("id", sessaoId)
    .maybeSingle();

  if (!sessao || sessao.status !== "concluida") return null;

  const [{ data: concluidas }, { data: todasEstacoes }, { data: respostas }, { count: dicas }, { data: notas }] =
    await Promise.all([
      supabase
        .from("session_station")
        .select("station(peso_dificuldade)")
        .eq("session_id", sessaoId)
        .not("concluida_em", "is", null),
      supabase
        .from("station")
        .select("peso_dificuldade")
        .eq("ativa", true)
        .eq("tem_pergunta", true),
      supabase.from("answer").select("correta").eq("session_id", sessaoId),
      supabase.from("hint").select("id", { count: "exact", head: true }).eq("session_id", sessaoId),
      supabase.from("rubric_score").select("nota").eq("session_id", sessaoId),
    ]);

  const pesoConcluido = ((concluidas ?? []) as unknown as { station: { peso_dificuldade: number } | null }[])
    .reduce((s, c) => s + Number(c.station?.peso_dificuldade ?? 0), 0);

  const pesoTotal = (todasEstacoes ?? []).reduce(
    (s, e) => s + Number(e.peso_dificuldade ?? 0),
    0,
  );

  const tempo = estadoDoTempo({
    iniciadaEm: sessao.iniciada_em,
    encerradaEm: sessao.encerrada_em,
    pausas: (sessao.pausas ?? []) as Pausa[],
    duracaoMin: config.duracao_sessao_min,
  });

  return {
    teamId: sessao.team_id,
    entrada: {
      pesoConcluido,
      pesoTotal,
      acertos: (respostas ?? []).filter((r) => r.correta).length,
      tentativas: (respostas ?? []).length,
      dicas: dicas ?? 0,
      penalidadeDica: Number(config.penalidade_dica),
      decorridoS: tempo.decorridoS,
      alvoS: config.duracao_sessao_min * 60,
      notas: (notas ?? []).map((n) => Number(n.nota)),
      estacoesConcluidas: (concluidas ?? []).length,
      estacoesTotais: (todasEstacoes ?? []).length,
    },
  };
}

function pesosDe(config: Config) {
  return {
    progresso: Number(config.peso_progresso),
    precisao: Number(config.peso_precisao),
    tempo: Number(config.peso_tempo),
    instrutor: Number(config.peso_instrutor),
  };
}

export async function calcularEGravar(
  sessaoId: string,
  config?: Config,
): Promise<Parcelas | null> {
  const c = config ?? (await lerConfig());
  const montado = await montarEntrada(sessaoId, c);
  if (!montado) return null;

  const parcelas = calcularPontuacao(montado.entrada, pesosDe(c));
  const supabase = criarClienteServico();

  const { data: equipe } = await supabase
    .from("team")
    .select("categoria")
    .eq("id", montado.teamId)
    .maybeSingle();

  await supabase.from("score").upsert(
    {
      session_id: sessaoId,
      progresso: parcelas.progresso,
      precisao: parcelas.precisao,
      tempo_relativo: parcelas.tempo,
      instrutor: parcelas.instrutor,
      total: parcelas.total,
      categoria: c.usar_categorias ? (equipe?.categoria ?? null) : null,
      calculado_em: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );

  return parcelas;
}

/** Recalcula todas as sessões concluídas. Usado quando um peso muda. */
export async function recalcularTudo(): Promise<number> {
  const config = await lerConfig();
  const supabase = criarClienteServico();

  const { data: sessoes } = await supabase
    .from("session")
    .select("id")
    .eq("status", "concluida");

  let quantas = 0;
  for (const s of sessoes ?? []) {
    const r = await calcularEGravar(s.id, config);
    if (r) quantas++;
  }

  return quantas;
}

/**
 * O placar ordenado.
 *
 * A conta é feita de novo na leitura, a partir dos números guardados, em vez de
 * confiar só no total gravado: assim a tela de auditoria mostra as frações que
 * geraram cada parcela, e um peso alterado na configuração aparece na hora sem
 * precisar recalcular tudo antes de olhar.
 */
export async function lerPlacar(config?: Config): Promise<LinhaDoPlacar[]> {
  const c = config ?? (await lerConfig());
  const supabase = criarClienteServico();

  const { data: sessoes } = await supabase
    .from("session")
    .select("id, team(nome, codigo_acesso, categoria)")
    .eq("status", "concluida");

  type Linha = {
    id: string;
    team: { nome: string; codigo_acesso: string; categoria: "iniciante" | "avancado" | null } | null;
  };

  const linhas: Omit<LinhaDoPlacar, "posicao">[] = [];

  for (const s of ((sessoes ?? []) as unknown as Linha[]).filter((s) => s.team)) {
    const montado = await montarEntrada(s.id, c);
    if (!montado) continue;

    linhas.push({
      sessaoId: s.id,
      equipe: s.team!.nome,
      codigo: s.team!.codigo_acesso,
      categoria: c.usar_categorias ? s.team!.categoria : null,
      parcelas: calcularPontuacao(montado.entrada, pesosDe(c)),
      entrada: montado.entrada,
    });
  }

  return linhas
    .sort((a, b) =>
      compararParaRanking(
        {
          total: a.parcelas.total,
          fracaoPrecisao: a.parcelas.fracoes.precisao,
          fracaoTempo: a.parcelas.fracoes.tempo,
          dicas: a.entrada.dicas,
        },
        {
          total: b.parcelas.total,
          fracaoPrecisao: b.parcelas.fracoes.precisao,
          fracaoTempo: b.parcelas.fracoes.tempo,
          dicas: b.entrada.dicas,
        },
      ),
    )
    .map((l, i) => ({ ...l, posicao: i + 1 }));
}

/** Agrupa por categoria, mantendo a ordem do ranking dentro de cada uma. */
export function porCategoria(
  linhas: LinhaDoPlacar[],
): { categoria: "iniciante" | "avancado" | null; rotulo: string; linhas: LinhaDoPlacar[] }[] {
  const rotulos = {
    iniciante: "Categoria iniciante",
    avancado: "Categoria avançada",
    geral: "Classificação geral",
  };

  const categorias = [...new Set(linhas.map((l) => l.categoria))];

  return categorias.map((categoria) => {
    const doGrupo = linhas.filter((l) => l.categoria === categoria);
    return {
      categoria,
      rotulo: categoria ? rotulos[categoria] : rotulos.geral,
      linhas: doGrupo.map((l, i) => ({ ...l, posicao: i + 1 })),
    };
  });
}
