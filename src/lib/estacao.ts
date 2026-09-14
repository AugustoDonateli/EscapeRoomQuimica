import { criarClienteServico } from "@/lib/supabase/server";
import { lerCodigoGuardado } from "@/lib/sessao-jogador";
import { lerConfig } from "@/lib/dados";
import { estacaoLiberada } from "@/lib/desbloqueio";
import { estadoDoTempo, type Pausa } from "@/lib/sessao";

/**
 * O contexto de uma estação para a equipe que está jogando: a sessão está
 * aberta? o tempo ainda corre? esta estação está liberada?
 *
 * Fica num módulo próprio porque a página e as ações precisam exatamente da
 * mesma resposta. Duas cópias desta regra seria duas chances de a tela dizer
 * uma coisa e o servidor decidir outra.
 */
export type Contexto = {
  sessaoId: string;
  equipeId: string;
  estacao: { id: string; ordem: number; slug: string; nome: string };
  ordensConcluidas: number[];
  restanteSessaoS: number;
};

export async function contextoDaEstacao(slug: string): Promise<{ ok: true; ctx: Contexto } | { ok: false; erro: string }> {
  const codigo = await lerCodigoGuardado();
  if (!codigo) return { ok: false, erro: "Abra pelo cartão da fila, no celular que fez o cadastro." };

  const supabase = criarClienteServico();
  const config = await lerConfig();

  const { data: equipe } = await supabase
    .from("team")
    .select("id")
    .eq("codigo_acesso", codigo)
    .maybeSingle();
  if (!equipe) return { ok: false, erro: "Equipe não encontrada." };

  const { data: sessao } = await supabase
    .from("session")
    .select("id, status, iniciada_em, encerrada_em, pausas")
    .eq("team_id", equipe.id)
    .in("status", ["em_andamento", "pausada"])
    .order("iniciada_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sessao) return { ok: false, erro: "A sessão de vocês não está em andamento." };
  if (sessao.status === "pausada") return { ok: false, erro: "A sessão está pausada. Chame o instrutor." };

  const tempo = estadoDoTempo({
    iniciadaEm: sessao.iniciada_em,
    encerradaEm: sessao.encerrada_em,
    pausas: (sessao.pausas ?? []) as Pausa[],
    duracaoMin: config.duracao_sessao_min,
  });
  if (tempo.esgotado) return { ok: false, erro: "O tempo da sessão acabou." };

  const { data: estacao } = await supabase
    .from("station")
    .select("id, slug, nome, ordem, ativa, tem_pergunta")
    .eq("slug", slug)
    .maybeSingle();
  if (!estacao) return { ok: false, erro: "Estação não encontrada." };

  const { data: concluidas } = await supabase
    .from("session_station")
    .select("station(ordem)")
    .eq("session_id", sessao.id)
    .not("concluida_em", "is", null);

  const ordensConcluidas = ((concluidas ?? []) as unknown as { station: { ordem: number } | null }[])
    .map((c) => c.station?.ordem)
    .filter((o): o is number => typeof o === "number");

  const liberacao = estacaoLiberada({
    ordem: estacao.ordem,
    ativa: estacao.ativa,
    temPergunta: estacao.tem_pergunta,
    ordensConcluidas,
    ordemLivre: config.ordem_livre,
  });

  if (!liberacao.liberada) {
    const mensagens = {
      fora_de_ordem: "Esta estação ainda não abriu para vocês. Terminem a anterior primeiro.",
      ja_concluida: "Vocês já terminaram esta estação.",
      inativa: "Esta estação não está no jogo de hoje.",
      sem_pergunta: "Esta estação não tem pergunta — é só enigma.",
    } as const;
    return { ok: false, erro: mensagens[liberacao.motivo] };
  }

  return {
    ok: true,
    ctx: {
      sessaoId: sessao.id,
      equipeId: equipe.id,
      estacao: { id: estacao.id, ordem: estacao.ordem, slug: estacao.slug, nome: estacao.nome },
      ordensConcluidas,
      restanteSessaoS: tempo.restanteS,
    },
  };
}


export type Pergunta = {
  id: string;
  enunciado: string;
  tipo: "texto" | "multipla";
  alternativas: string[] | null;
  tempoLimiteS: number;
  tentativasRestantes: number;
};

export type EstadoParaJogador =
  | { tipo: "erro"; mensagem: string }
  | { tipo: "fechada"; estacao: { slug: string; nome: string; ordem: number }; perguntas: number; restanteSessaoS: number }
  | { tipo: "pergunta"; estacao: { slug: string; nome: string; ordem: number }; pergunta: Pergunta; restanteSessaoS: number; feitas: number; total: number }
  | { tipo: "concluida"; estacao: { slug: string; nome: string; ordem: number }; acertos: number; total: number; restanteSessaoS: number };

/**
 * O que a tela do jogador deve mostrar nesta estação, agora.
 *
 * A pergunta escolhida é a primeira, na ordem, que a equipe ainda não acertou e
 * ainda tem tentativa. Uma por vez: o jogador está no escuro e com pressa, e
 * lista de perguntas é uma decisão a mais para ele tomar.
 */
export async function estadoParaJogador(slug: string): Promise<EstadoParaJogador> {
  const r = await contextoDaEstacao(slug);
  if (!r.ok) return { tipo: "erro", mensagem: r.erro };

  const { ctx } = r;
  const supabase = criarClienteServico();
  const config = await lerConfig();
  const vitrine = { slug: ctx.estacao.slug, nome: ctx.estacao.nome, ordem: ctx.estacao.ordem };

  const [{ data: perguntas }, { data: respostas }, { data: linha }] = await Promise.all([
    supabase
      .from("question")
      .select("id, enunciado, tipo, alternativas, tempo_limite_s, ordem")
      .eq("station_id", ctx.estacao.id)
      .eq("ativa", true)
      .order("ordem"),
    supabase.from("answer").select("question_id, correta").eq("session_id", ctx.sessaoId),
    supabase
      .from("session_station")
      .select("aberta_em, concluida_em")
      .eq("session_id", ctx.sessaoId)
      .eq("station_id", ctx.estacao.id)
      .maybeSingle(),
  ]);

  const lista = perguntas ?? [];
  const todas = respostas ?? [];

  if (!linha || !linha.aberta_em) {
    return { tipo: "fechada", estacao: vitrine, perguntas: lista.length, restanteSessaoS: ctx.restanteSessaoS };
  }

  const acertos = lista.filter((p) => todas.some((r) => r.question_id === p.id && r.correta)).length;

  const proxima = lista.find((p) => {
    const minhas = todas.filter((r) => r.question_id === p.id);
    return !minhas.some((r) => r.correta) && minhas.length < config.tentativas_por_pergunta;
  });

  if (!proxima) {
    return { tipo: "concluida", estacao: vitrine, acertos, total: lista.length, restanteSessaoS: ctx.restanteSessaoS };
  }

  const usadas = todas.filter((r) => r.question_id === proxima.id).length;
  const feitas = lista.filter((p) => {
    const minhas = todas.filter((r) => r.question_id === p.id);
    return minhas.some((r) => r.correta) || minhas.length >= config.tentativas_por_pergunta;
  }).length;

  return {
    tipo: "pergunta",
    estacao: vitrine,
    restanteSessaoS: ctx.restanteSessaoS,
    feitas,
    total: lista.length,
    pergunta: {
      id: proxima.id,
      enunciado: proxima.enunciado,
      tipo: proxima.tipo,
      alternativas: proxima.alternativas,
      tempoLimiteS: proxima.tempo_limite_s ?? config.tempo_limite_pergunta_s,
      tentativasRestantes: config.tentativas_por_pergunta - usadas,
    },
  };
}
