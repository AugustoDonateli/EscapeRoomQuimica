import { criarClienteServico } from "@/lib/supabase/server";
import { lerConfig, type Config } from "@/lib/dados";
import { estadoDoTempo, type Pausa } from "@/lib/sessao";
import type { Parcelas } from "@/lib/pontuacao";
import { lerPlacar } from "@/lib/placar";

/**
 * O relatório que a equipe vê no fim.
 *
 * Mostra o que aconteceu, não só quanto deu: tempo por estação, onde travaram,
 * acertos por tentativa. Um número solitário não ensina nada — e este projeto é
 * de uma feira de ciências.
 */

export type RelatorioDaSessao = {
  equipe: { nome: string; codigo: string };
  sessaoId: string;
  concluida: boolean;
  decorridoS: number;
  alvoS: number;
  estacoes: { nome: string; ordem: number; segundos: number | null; concluida: boolean }[];
  acertos: number;
  tentativas: number;
  dicas: number;
  parcelas: Parcelas | null;
  posicao: number | null;
  categoria: "iniciante" | "avancado" | null;
  totalNaCategoria: number;
  avaliouJaFoi: boolean;
};

export async function lerRelatorio(
  codigo: string,
  config?: Config,
): Promise<RelatorioDaSessao | null> {
  const c = config ?? (await lerConfig());
  const supabase = criarClienteServico();

  const { data: equipe } = await supabase
    .from("team")
    .select("id, nome, codigo_acesso, categoria")
    .eq("codigo_acesso", codigo)
    .maybeSingle();

  if (!equipe) return null;

  const { data: sessao } = await supabase
    .from("session")
    .select("id, status, iniciada_em, encerrada_em, pausas")
    .eq("team_id", equipe.id)
    .order("iniciada_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sessao) return null;

  const [{ data: estacoes }, { data: respostas }, { count: dicas }, { count: avaliacoes }] =
    await Promise.all([
      supabase
        .from("session_station")
        .select("aberta_em, concluida_em, station(nome, ordem)")
        .eq("session_id", sessao.id)
        .order("aberta_em"),
      supabase.from("answer").select("correta").eq("session_id", sessao.id),
      supabase.from("hint").select("id", { count: "exact", head: true }).eq("session_id", sessao.id),
      supabase
        .from("player_feedback")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessao.id),
    ]);

  const tempo = estadoDoTempo({
    iniciadaEm: sessao.iniciada_em,
    encerradaEm: sessao.encerrada_em,
    pausas: (sessao.pausas ?? []) as Pausa[],
    duracaoMin: c.duracao_sessao_min,
  });

  type LinhaEstacao = {
    aberta_em: string | null;
    concluida_em: string | null;
    station: { nome: string; ordem: number } | null;
  };

  const lista = ((estacoes ?? []) as unknown as LinhaEstacao[])
    .filter((e) => e.station)
    .map((e) => {
      const inicio = e.aberta_em ? Date.parse(e.aberta_em) : NaN;
      const fim = e.concluida_em ? Date.parse(e.concluida_em) : NaN;
      return {
        nome: e.station!.nome,
        ordem: e.station!.ordem,
        segundos:
          Number.isNaN(inicio) || Number.isNaN(fim) ? null : Math.floor((fim - inicio) / 1000),
        concluida: Boolean(e.concluida_em),
      };
    });

  const concluida = sessao.status === "concluida";

  // A posição vem do mesmo placar que a TV mostra, para não existir dois
  // rankings dizendo coisas diferentes.
  let posicao: number | null = null;
  let totalNaCategoria = 0;
  let parcelas: Parcelas | null = null;

  if (concluida) {
    const placar = await lerPlacar(c);
    const daCategoria = placar.filter((l) => l.categoria === (c.usar_categorias ? equipe.categoria : null));
    const indice = daCategoria.findIndex((l) => l.sessaoId === sessao.id);

    totalNaCategoria = daCategoria.length;
    if (indice >= 0) {
      posicao = indice + 1;
      parcelas = daCategoria[indice].parcelas;
    }
  }

  return {
    equipe: { nome: equipe.nome, codigo: equipe.codigo_acesso },
    sessaoId: sessao.id,
    concluida,
    decorridoS: tempo.decorridoS,
    alvoS: c.duracao_sessao_min * 60,
    estacoes: lista,
    acertos: (respostas ?? []).filter((r) => r.correta).length,
    tentativas: (respostas ?? []).length,
    dicas: dicas ?? 0,
    parcelas,
    posicao,
    categoria: c.usar_categorias ? equipe.categoria : null,
    totalNaCategoria,
    avaliouJaFoi: (avaliacoes ?? 0) > 0,
  };
}
