import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { exigirPapel } from "@/lib/auth";
import { lerConfig } from "@/lib/dados";
import { lerPerguntas } from "@/lib/avaliacao";
import { criarClienteServico } from "@/lib/supabase/server";
import { EditorPerguntasAvaliacao } from "./formulario";

export const metadata = { title: "Avaliação dos jogadores · Escape Químico" };

/**
 * As perguntas que os jogadores respondem, e o que eles responderam.
 *
 * As duas coisas na mesma tela de propósito: quem escreve a pergunta precisa
 * ver a resposta que ela gerou. Pergunta que ninguém responde, ou que todo
 * mundo responde igual, é pergunta para trocar.
 */
export default async function PaginaAvaliacaoAdmin() {
  await exigirPapel(["admin"]);

  const config = await lerConfig();
  const perguntas = lerPerguntas(config.perguntas_avaliacao);

  const supabase = criarClienteServico();
  const { data: recebidas } = await supabase
    .from("player_feedback")
    .select("id, respostas, criada_em, session(team(nome))")
    .order("criada_em", { ascending: false })
    .limit(50);

  type Recebida = {
    id: string;
    respostas: Record<string, number | string>;
    criada_em: string;
    session: { team: { nome: string } | null } | null;
  };

  const lista = (recebidas ?? []) as unknown as Recebida[];

  const medias = perguntas
    .filter((p) => p.tipo === "estrelas")
    .map((p) => {
      const notas = lista
        .map((r) => r.respostas?.[p.id])
        .filter((v): v is number => typeof v === "number");
      return {
        pergunta: p.texto,
        media: notas.length > 0 ? notas.reduce((s, n) => s + n, 0) / notas.length : null,
        quantas: notas.length,
      };
    });

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Avaliação dos jogadores</h1>
      <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
        O que exatamente os jogadores avaliam ficou em aberto desde a primeira conversa do
        projeto. Em vez de esperar, as perguntas viraram conteúdo editável aqui — a decisão pode
        ser tomada na semana da feira, sem mexer em código.
      </p>

      {lista.length > 0 ? (
        <Cartao className="mt-6">
          <Rotulo>Médias, de {lista.length} avaliações</Rotulo>
          <ul className="mt-2 flex flex-col gap-2">
            {medias.map((m) => (
              <li key={m.pergunta} className="flex items-baseline gap-3">
                <span className="min-w-0 flex-1 text-mini">{m.pergunta}</span>
                <span className="tabular font-dados text-medio font-semibold">
                  {m.media !== null ? m.media.toFixed(1) : "—"}
                </span>
                <span className="font-dados text-micro text-tinta-3">
                  {m.quantas} resposta{m.quantas === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </Cartao>
      ) : null}

      <div className="mt-8">
        <Rotulo className="mb-3">As perguntas</Rotulo>
        <EditorPerguntasAvaliacao iniciais={perguntas} />
      </div>

      <div className="mt-10">
        <Rotulo>O que as equipes escreveram</Rotulo>

        {lista.length === 0 ? (
          <p className="mt-3 rounded-base border border-linha bg-superficie px-4 py-6 text-center text-mini text-tinta-2">
            Nenhuma avaliação recebida ainda.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {lista.map((r) => (
              <li key={r.id}>
                <Cartao>
                  <Rotulo>{r.session?.team?.nome ?? "equipe"}</Rotulo>
                  <dl className="mt-2 flex flex-col gap-1.5">
                    {perguntas.map((p) => {
                      const v = r.respostas?.[p.id];
                      if (v === undefined || v === "") return null;

                      return (
                        <div key={p.id} className="flex gap-3">
                          <dt className="min-w-0 flex-1 text-mini text-tinta-2">{p.texto}</dt>
                          <dd className="max-w-[60%] text-right text-mini">
                            {typeof v === "number" ? (
                              <span className="tabular font-dados font-semibold">{v} / 5</span>
                            ) : (
                              <span>{v}</span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </Cartao>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
