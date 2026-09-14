import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { formatarTempo } from "@/components/ui/Proveta";
import { exigirPapel } from "@/lib/auth";
import { lerConfig } from "@/lib/dados";
import { lerPlacar } from "@/lib/placar";
import { explicarTotal } from "@/lib/pontuacao";
import { recalcular } from "./acoes";

export const metadata = { title: "Placar com auditoria · Escape Químico" };

/**
 * O placar com auditoria — a tela que defende o prêmio.
 *
 * Se uma equipe contestar o resultado, a resposta não pode ser "o sistema
 * calculou". Aqui cada ponto aparece com a conta que o gerou e com os números
 * que entraram nela: quantas estações, quantos acertos em quantas tentativas,
 * quantas dicas, quanto tempo, quantas notas do instrutor.
 */
export default async function PaginaPlacarAdmin() {
  await exigirPapel(["admin"]);

  const config = await lerConfig();
  const linhas = await lerPlacar(config);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-titulo font-bold tracking-tight">
            Placar com auditoria
          </h1>
          <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
            Cada linha mostra de onde veio cada ponto. É o que transforma o resultado em algo
            discutível em vez de opinião — e o que você abre se alguém contestar o prêmio.
          </p>
        </div>

        <form action={recalcular}>
          <Botao type="submit" variante="secundario">
            Recalcular tudo
          </Botao>
        </form>
      </div>

      <Cartao className="mt-6">
        <Rotulo>A regra, como está configurada agora</Rotulo>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {[
            { r: "Progresso", v: `${Math.round(config.peso_progresso * 100)}%` },
            { r: "Precisão", v: `${Math.round(config.peso_precisao * 100)}%` },
            { r: "Tempo", v: `${Math.round(config.peso_tempo * 100)}%` },
            { r: "Instrutor", v: `${Math.round(config.peso_instrutor * 100)}%` },
          ].map((i) => (
            <div key={i.r}>
              <Rotulo>{i.r}</Rotulo>
              <p className="tabular mt-0.5 font-dados text-medio font-semibold">{i.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-mini text-tinta-2">
          Desempate: precisão, depois tempo relativo, depois menos dicas. Dica desconta{" "}
          {Math.round(config.penalidade_dica * 100)}% da precisão cada.
          {config.usar_categorias
            ? ` Categorias ligadas, com corte na média de ano ${config.corte_categoria}.`
            : " Categorias desligadas: ranking único."}
        </p>
      </Cartao>

      {linhas.length === 0 ? (
        <p className="mt-6 rounded-base border border-linha bg-superficie px-4 py-8 text-center text-mini text-tinta-2">
          Nenhuma sessão concluída e avaliada ainda. O total aparece quando o instrutor grava a
          rubrica no fechamento.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {linhas.map((l) => (
            <li key={l.sessaoId}>
              <Cartao destaque={l.posicao === 1}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tabular font-display text-grande leading-none font-extrabold text-tinta-3">
                    {l.posicao}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-medio font-bold">{l.equipe}</span>
                    <span className="block font-dados text-micro text-tinta-2">
                      {l.codigo}
                      {l.categoria ? ` · ${l.categoria}` : ""}
                    </span>
                  </span>
                  <span className="tabular font-display text-grande leading-none font-extrabold text-acento">
                    {Math.round(l.parcelas.total)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                  {[
                    {
                      r: "Progresso",
                      v: l.parcelas.progresso,
                      d: `${l.entrada.estacoesConcluidas} de ${l.entrada.estacoesTotais} estações`,
                    },
                    {
                      r: "Precisão",
                      v: l.parcelas.precisao,
                      d: `${l.entrada.acertos} de ${l.entrada.tentativas} · ${l.entrada.dicas} dica${l.entrada.dicas === 1 ? "" : "s"}`,
                    },
                    {
                      r: "Tempo",
                      v: l.parcelas.tempo,
                      d: `${formatarTempo(l.entrada.decorridoS)} de ${formatarTempo(l.entrada.alvoS)}`,
                    },
                    {
                      r: "Instrutor",
                      v: l.parcelas.instrutor,
                      d:
                        l.entrada.notas.length > 0
                          ? `média ${(l.entrada.notas.reduce((s, n) => s + n, 0) / l.entrada.notas.length).toFixed(1)} em ${l.entrada.notas.length} notas`
                          : "sem rubrica gravada",
                    },
                  ].map((i) => (
                    <div key={i.r} className="border-t border-linha pt-2">
                      <Rotulo>{i.r}</Rotulo>
                      <p className="tabular mt-0.5 font-dados text-medio font-semibold">{i.v}</p>
                      <p className="text-mini text-tinta-2">{i.d}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 rounded-base bg-superficie-2 px-3 py-2 font-dados text-micro text-tinta-2">
                  {explicarTotal(l.parcelas)}
                </p>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
