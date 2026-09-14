import { criarClienteServico } from "@/lib/supabase/server";
import { lerConfig, type Config } from "@/lib/dados";
import { estadoDoTempo, type EstadoDoTempo, type Pausa } from "@/lib/sessao";
import { contarObservacoes, type TipoObservacao } from "@/lib/rubrica";

/**
 * Leituras do painel do instrutor. Tudo passa pela chave de serviço: o
 * instrutor precisa ver o que é invisível para o jogador (as respostas certas,
 * as observações, o tempo real), e a guarda de papel acontece na página antes
 * de qualquer uma destas funções ser chamada.
 */

export type EquipeNaFila = {
  entradaId: string;
  teamId: string;
  nome: string;
  codigo: string;
  lote: "manha" | "tarde";
  posicao: number;
  status: string;
  chamadaEm: string | null;
  jogadores: { id: string; nome: string; ano_escolar: number }[];
};

export type SessaoAoVivo = {
  id: string;
  status: "em_andamento" | "pausada" | "concluida" | "abortada";
  iniciadaEm: string;
  encerradaEm: string | null;
  pausas: Pausa[];
  tempo: EstadoDoTempo;
  equipe: { id: string; nome: string; codigo: string };
  jogadores: {
    id: string;
    nome: string;
    ano_escolar: number;
    contagem: Partial<Record<TipoObservacao, number>>;
  }[];
  estacoes: {
    id: string;
    slug: string;
    nome: string;
    ordem: number;
    abertaEm: string | null;
    concluidaEm: string | null;
    segundos: number | null;
    perguntas: number;
    acertos: number;
    tentativas: number;
  }[];
  estacaoAtual: { slug: string; nome: string; ordem: number } | null;
  dicas: number;
  acertos: number;
  tentativas: number;
};

/**
 * Quanto a equipe passou numa estação. Este número não é digitado por ninguém:
 * ele nasce dos QRs. Abrir a pergunta da estação seguinte fecha a linha da
 * anterior, e a diferença entre os dois instantes é o tempo da estação.
 *
 * Estação ainda aberta conta até agora, para o instrutor ver o tempo correndo.
 */
function duracaoDaEstacao(abertaEm: string | null, concluidaEm: string | null): number | null {
  if (!abertaEm) return null;

  const inicio = Date.parse(abertaEm);
  if (Number.isNaN(inicio)) return null;

  const fim = concluidaEm ? Date.parse(concluidaEm) : Date.now();
  if (Number.isNaN(fim) || fim < inicio) return null;

  return Math.floor((fim - inicio) / 1000);
}

export async function filaDoInstrutor(): Promise<EquipeNaFila[]> {
  const supabase = criarClienteServico();

  const { data, error } = await supabase
    .from("queue_entry")
    .select(
      "id, team_id, lote, posicao, status, chamada_em, team(id, nome, codigo_acesso, player(id, nome, ano_escolar))",
    )
    .in("status", ["aguardando", "chamada"])
    .order("lote")
    .order("posicao");

  if (error) throw new Error(`Não foi possível ler a fila: ${error.message}`);

  type Linha = {
    id: string;
    team_id: string;
    lote: "manha" | "tarde";
    posicao: number;
    status: string;
    chamada_em: string | null;
    team: { id: string; nome: string; codigo_acesso: string; player: EquipeNaFila["jogadores"] } | null;
  };

  return ((data ?? []) as unknown as Linha[])
    .filter((l) => l.team)
    .map((l) => ({
      entradaId: l.id,
      teamId: l.team_id,
      nome: l.team!.nome,
      codigo: l.team!.codigo_acesso,
      lote: l.lote,
      posicao: l.posicao,
      status: l.status,
      chamadaEm: l.chamada_em,
      jogadores: l.team!.player ?? [],
    }));
}

/** A sessão que está rodando agora, se houver. Uma sala, uma sessão de cada vez. */
export async function sessaoAberta(): Promise<string | null> {
  const supabase = criarClienteServico();
  const { data } = await supabase
    .from("session")
    .select("id")
    .in("status", ["em_andamento", "pausada"])
    .order("iniciada_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function lerSessao(id: string, config?: Config): Promise<SessaoAoVivo | null> {
  const supabase = criarClienteServico();
  const c = config ?? (await lerConfig());

  const { data: sessao } = await supabase
    .from("session")
    .select("id, status, iniciada_em, encerrada_em, pausas, team(id, nome, codigo_acesso)")
    .eq("id", id)
    .maybeSingle();

  if (!sessao || !sessao.team) return null;

  const equipe = sessao.team as unknown as { id: string; nome: string; codigo_acesso: string };

  const [{ data: jogadores }, { data: observacoes }, { data: estacoes }, { data: respostas }, { count: dicas }] =
    await Promise.all([
      supabase.from("player").select("id, nome, ano_escolar").eq("team_id", equipe.id).order("nome"),
      supabase.from("observation").select("player_id, tipo").eq("session_id", id),
      supabase
        .from("session_station")
        .select("station_id, aberta_em, concluida_em, station(id, slug, nome, ordem)")
        .eq("session_id", id)
        .order("aberta_em"),
      supabase.from("answer").select("question_id, correta, question(station_id)").eq("session_id", id),
      supabase.from("hint").select("id", { count: "exact", head: true }).eq("session_id", id),
    ]);

  const pausas = (sessao.pausas ?? []) as Pausa[];
  const tempo = estadoDoTempo({
    iniciadaEm: sessao.iniciada_em,
    encerradaEm: sessao.encerrada_em,
    pausas,
    duracaoMin: c.duracao_sessao_min,
  });

  type Resposta = { question_id: string; correta: boolean; question: { station_id: string } | null };
  const listaRespostas = (respostas ?? []) as unknown as Resposta[];

  type LinhaEstacao = {
    station_id: string;
    aberta_em: string | null;
    concluida_em: string | null;
    station: { id: string; slug: string; nome: string; ordem: number } | null;
  };

  const listaEstacoes = ((estacoes ?? []) as unknown as LinhaEstacao[])
    .filter((e) => e.station)
    .map((e) => {
      const daEstacao = listaRespostas.filter((r) => r.question?.station_id === e.station_id);
      const segundos = duracaoDaEstacao(e.aberta_em, e.concluida_em);

      return {
        id: e.station!.id,
        slug: e.station!.slug,
        nome: e.station!.nome,
        ordem: e.station!.ordem,
        abertaEm: e.aberta_em,
        concluidaEm: e.concluida_em,
        segundos,
        perguntas: new Set(daEstacao.map((r) => r.question_id)).size,
        acertos: daEstacao.filter((r) => r.correta).length,
        tentativas: daEstacao.length,
      };
    });

  const aberta = listaEstacoes.find((e) => !e.concluidaEm) ?? null;

  const porJogador = (jogadores ?? []).map((j) => ({
    ...j,
    contagem: contarObservacoes(
      ((observacoes ?? []) as { player_id: string; tipo: TipoObservacao }[])
        .filter((o) => o.player_id === j.id)
        .map((o) => ({ tipo: o.tipo })),
    ),
  }));

  return {
    id: sessao.id,
    status: sessao.status,
    iniciadaEm: sessao.iniciada_em,
    encerradaEm: sessao.encerrada_em,
    pausas,
    tempo,
    equipe: { id: equipe.id, nome: equipe.nome, codigo: equipe.codigo_acesso },
    jogadores: porJogador,
    estacoes: listaEstacoes,
    estacaoAtual: aberta ? { slug: aberta.slug, nome: aberta.nome, ordem: aberta.ordem } : null,
    dicas: dicas ?? 0,
    acertos: listaRespostas.filter((r) => r.correta).length,
    tentativas: listaRespostas.length,
  };
}
