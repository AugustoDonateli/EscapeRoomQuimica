import { criarClienteServico } from "@/lib/supabase/server";
import { capacidadePorLote } from "@/lib/capacidade";
import { gerarCodigo } from "@/lib/codigo";
import { hojeLocal, horaLocal, minutosDoDia } from "@/lib/tempo";
import { lerConfig, type Config } from "@/lib/dados";

export type Lote = "manha" | "tarde";

export type StatusFila =
  | "aguardando"
  | "chamada"
  | "em_jogo"
  | "concluida"
  | "no_show"
  | "cancelada";

/** Status em que a equipe ainda ocupa lugar na fila. */
const NA_FILA: StatusFila[] = ["aguardando", "chamada", "em_jogo"];

export type EstadoAgendamento =
  | { aberto: true; lote: Lote; vagas: number; capacidade: number }
  | {
      aberto: false;
      motivo: "sem_horario" | "antes_do_dia" | "fora_do_horario" | "lote_cheio" | "dia_cheio";
      detalhe: string;
    };

/**
 * O agendamento acontece só no dia da feira, na hora. Esta função é o portão:
 * decide se dá para entrar na fila agora e, se não der, por quê — porque
 * "indisponível" sem motivo faz a pessoa ficar tentando de novo.
 */
export async function estadoDoAgendamento(config?: Config): Promise<EstadoAgendamento> {
  const c = config ?? (await lerConfig());
  const agora = new Date();

  // Sem horário de funcionamento não existe capacidade, e sem capacidade a fila
  // não pode abrir. Isto tem estado próprio porque o motivo é outro: não é que
  // encheu, é que ninguém preencheu ainda — e dizer "encheu" mandaria a pessoa
  // esperar por uma vaga que não vai aparecer sozinha.
  if (!c.abre_em || !c.fecha_em) {
    return {
      aberto: false,
      motivo: "sem_horario",
      detalhe: "O horário de funcionamento da feira ainda não foi definido no painel.",
    };
  }

  // Sem data definida a plataforma segue aberta de propósito: é o que permite
  // testar tudo antes de a feira ter data marcada.
  if (c.data_evento && c.data_evento !== hojeLocal(agora)) {
    return {
      aberto: false,
      motivo: "antes_do_dia",
      detalhe: "O agendamento abre no próprio dia da feira, aqui no totem da entrada.",
    };
  }

  const hora = minutosDoDia(horaLocal(agora)) ?? 0;
  const abreManha = minutosDoDia(c.lote_manha_abre_em) ?? 0;
  const abreTarde = minutosDoDia(c.lote_tarde_abre_em) ?? 0;
  const fecha = minutosDoDia(c.fecha_em) ?? 24 * 60;

  if (hora < abreManha) {
    return {
      aberto: false,
      motivo: "fora_do_horario",
      detalhe: `O primeiro lote abre às ${c.lote_manha_abre_em.slice(0, 5)}.`,
    };
  }

  if (hora >= fecha) {
    return {
      aberto: false,
      motivo: "fora_do_horario",
      detalhe: "A sala fechou por hoje.",
    };
  }

  const lote: Lote = hora >= abreTarde ? "tarde" : "manha";
  const capacidade = capacidadePorLote(c);
  const limite = lote === "manha" ? capacidade.manha : capacidade.tarde;
  const ocupadas = await contarNaFila(lote);

  if (ocupadas >= limite) {
    // Dizer não às nove da manhã é melhor que dizer não às treze, depois de
    // três horas de espera.
    const outroAindaAbre = lote === "manha" && capacidade.tarde > 0;
    return {
      aberto: false,
      motivo: lote === "manha" ? "lote_cheio" : "dia_cheio",
      detalhe: outroAindaAbre
        ? `O lote da manhã encheu. O da tarde abre às ${c.lote_tarde_abre_em.slice(0, 5)}.`
        : "Todas as sessões de hoje já foram preenchidas.",
    };
  }

  return { aberto: true, lote, vagas: limite - ocupadas, capacidade: limite };
}

export async function contarNaFila(lote: Lote): Promise<number> {
  const supabase = criarClienteServico();
  const { count, error } = await supabase
    .from("queue_entry")
    .select("id", { count: "exact", head: true })
    .eq("lote", lote)
    .in("status", NA_FILA);

  if (error) throw new Error(`Não foi possível contar a fila: ${error.message}`);
  return count ?? 0;
}

export type CartaoDaFila = {
  equipe: { id: string; nome: string; codigo_acesso: string; email_capitao: string };
  jogadores: { nome: string; ano_escolar: number }[];
  entrada: { id: string; lote: Lote; posicao: number; status: StatusFila; chamada_em: string | null };
  quantasNaFrente: number;
  estimativaDe: string | null;
  estimativaAte: string | null;
};

/**
 * O cartão da fila. A estimativa é calculada na hora da leitura, a partir de
 * quantas equipes ainda estão na frente — e não de um horário fixo gravado no
 * cadastro. É isso que evita o efeito cascata: quando uma sessão estoura, a
 * previsão das seguintes se corrige sozinha na próxima vez que a página abre.
 */
export async function lerCartao(codigo: string): Promise<CartaoDaFila | null> {
  const supabase = criarClienteServico();

  const { data: equipe } = await supabase
    .from("team")
    .select("id, nome, codigo_acesso, email_capitao")
    .eq("codigo_acesso", codigo)
    .maybeSingle();

  if (!equipe) return null;

  const [{ data: jogadores }, { data: entrada }, config] = await Promise.all([
    supabase.from("player").select("nome, ano_escolar").eq("team_id", equipe.id).order("nome"),
    supabase
      .from("queue_entry")
      .select("id, lote, posicao, status, chamada_em")
      .eq("team_id", equipe.id)
      .maybeSingle(),
    lerConfig(),
  ]);

  if (!entrada) return null;

  let quantasNaFrente = 0;
  if (entrada.status === "aguardando") {
    const { count } = await supabase
      .from("queue_entry")
      .select("id", { count: "exact", head: true })
      .eq("lote", entrada.lote)
      .in("status", NA_FILA)
      .lt("posicao", entrada.posicao);
    quantasNaFrente = count ?? 0;
  }

  const porSessao = config.duracao_sessao_min + config.reset_min;
  const agora = Date.now();
  const inicio =
    entrada.status === "aguardando" ? agora + quantasNaFrente * porSessao * 60_000 : agora;

  return {
    equipe,
    jogadores: jogadores ?? [],
    entrada: entrada as CartaoDaFila["entrada"],
    quantasNaFrente,
    estimativaDe: entrada.status === "aguardando" ? new Date(inicio).toISOString() : null,
    estimativaAte:
      entrada.status === "aguardando"
        ? new Date(inicio + config.duracao_sessao_min * 60_000).toISOString()
        : null,
  };
}

export type Integrante = { nome: string; ano_escolar: number };

/**
 * Cria a equipe, os integrantes e a entrada na fila.
 *
 * A posição é alocada com tentativa e repetição: o banco tem índice único em
 * (lote, posição), então duas equipes cadastrando no mesmo instante não podem
 * receber o mesmo número — a segunda leva erro e tenta a posição seguinte.
 */
export async function cadastrarEquipe(entrada: {
  nome: string;
  email_capitao: string;
  integrantes: Integrante[];
  lote: Lote;
}): Promise<{ ok: true; codigo: string } | { ok: false; erro: string }> {
  const supabase = criarClienteServico();

  const media =
    entrada.integrantes.reduce((s, i) => s + i.ano_escolar, 0) / entrada.integrantes.length;
  const config = await lerConfig();
  const categoria = config.usar_categorias
    ? media < config.corte_categoria
      ? "iniciante"
      : "avancado"
    : null;

  const codigo = gerarCodigo();

  const { data: equipe, error: erroEquipe } = await supabase
    .from("team")
    .insert({
      nome: entrada.nome,
      codigo_acesso: codigo,
      email_capitao: entrada.email_capitao,
      media_ano: Number(media.toFixed(1)),
      categoria,
    })
    .select("id")
    .single();

  if (erroEquipe || !equipe) {
    return { ok: false, erro: `Não foi possível criar a equipe: ${erroEquipe?.message}` };
  }

  const { error: erroJogadores } = await supabase.from("player").insert(
    entrada.integrantes.map((i) => ({
      team_id: equipe.id,
      nome: i.nome,
      ano_escolar: i.ano_escolar,
    })),
  );

  if (erroJogadores) {
    await supabase.from("team").delete().eq("id", equipe.id);
    return { ok: false, erro: `Não foi possível salvar os integrantes: ${erroJogadores.message}` };
  }

  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const { data: ultima } = await supabase
      .from("queue_entry")
      .select("posicao")
      .eq("lote", entrada.lote)
      .order("posicao", { ascending: false })
      .limit(1)
      .maybeSingle();

    const posicao = (ultima?.posicao ?? 0) + 1 + tentativa;

    const { error } = await supabase.from("queue_entry").insert({
      team_id: equipe.id,
      lote: entrada.lote,
      posicao,
      status: "aguardando",
    });

    if (!error) return { ok: true, codigo };

    const colisaoDePosicao = error.code === "23505" || error.message.includes("duplicate");
    if (!colisaoDePosicao) {
      await supabase.from("team").delete().eq("id", equipe.id);
      return { ok: false, erro: `Não foi possível entrar na fila: ${error.message}` };
    }
  }

  await supabase.from("team").delete().eq("id", equipe.id);
  return {
    ok: false,
    erro: "A fila está recebendo muitos cadastros ao mesmo tempo. Tente de novo em alguns segundos.",
  };
}

/** Já existe equipe na fila com este e-mail de capitão? */
export async function jaEstaNaFila(email: string): Promise<string | null> {
  const supabase = criarClienteServico();

  const { data } = await supabase
    .from("team")
    .select("codigo_acesso, queue_entry(status)")
    .ilike("email_capitao", email)
    .limit(5);

  for (const equipe of data ?? []) {
    const entradas = (equipe.queue_entry ?? []) as { status: StatusFila }[];
    if (entradas.some((e) => NA_FILA.includes(e.status))) return equipe.codigo_acesso;
  }

  return null;
}
