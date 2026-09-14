import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { formatarTempo } from "@/components/ui/Proveta";
import { lerConfig } from "@/lib/dados";
import { normalizarCodigo } from "@/lib/codigo";
import { lerRelatorio } from "@/lib/resultado";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relatório da sessão · Escape Químico" };

/**
 * O relatório da equipe.
 *
 * Mostra o que aconteceu, não só quanto deu — tempo por estação, onde travaram,
 * acertos por tentativa, e de onde veio cada parcela do total. É uma feira de
 * ciências: número solitário não ensina nada, e a equipe que perdeu merece
 * saber exatamente por quê.
 */
export default async function PaginaResultado({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ obrigado?: string }>;
}) {
  const { codigo: bruto } = await params;
  const { obrigado } = await searchParams;

  const codigo = normalizarCodigo(decodeURIComponent(bruto));
  const config = await lerConfig();
  const r = codigo ? await lerRelatorio(codigo, config) : null;

  if (!r) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
        <Link href="/">
          <Marca tamanho="icone" />
        </Link>
        <Cartao className="mt-8">
          <Rotulo>Não achamos essa sessão</Rotulo>
          <p className="mt-2 text-base">
            O relatório aparece depois que a equipe joga. Confira o código do cartão da fila.
          </p>
        </Cartao>
      </main>
    );
  }

  const maisDemorada = r.estacoes.reduce<typeof r.estacoes[number] | null>(
    (pior, e) => (e.segundos !== null && (!pior || (pior.segundos ?? 0) < e.segundos) ? e : pior),
    null,
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/">
        <Marca tamanho="icone" />
      </Link>

      {obrigado ? (
        <p className="mt-5 rounded-base bg-acento-suave px-3 py-2 text-mini text-acento">
          Obrigado pela avaliação. Ela vai direto para quem construiu a sala.
        </p>
      ) : null}

      <p className="mt-6 font-dados text-micro tracking-[0.14em] text-tinta-3 uppercase">
        Relatório da sessão
      </p>
      <h1 className="font-display text-titulo leading-tight font-extrabold tracking-tight">
        {r.equipe.nome}
      </h1>

      {r.posicao ? (
        <div className="mt-5 rounded-base border border-acento bg-acento-suave p-4">
          <Rotulo>
            {r.categoria
              ? `Categoria ${r.categoria === "iniciante" ? "iniciante" : "avançada"}`
              : "Classificação geral"}
          </Rotulo>
          <p className="mt-1 flex items-baseline gap-3">
            <span className="tabular font-display text-enorme leading-none font-extrabold text-acento">
              {r.posicao}º
            </span>
            <span className="text-mini text-tinta-2">
              de {r.totalNaCategoria} equipe{r.totalNaCategoria === 1 ? "" : "s"}
              {r.parcelas ? ` · ${Math.round(r.parcelas.total)} pontos` : ""}
            </span>
          </p>
        </div>
      ) : (
        <Cartao className="mt-5">
          <Rotulo>Pontuação</Rotulo>
          <p className="mt-1 text-base text-tinta-2">
            {r.concluida
              ? "O instrutor ainda não gravou a avaliação da sessão. A pontuação aparece aqui quando ele gravar."
              : "Esta sessão não foi concluída, então não entra no placar."}
          </p>
        </Cartao>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { r: "Tempo", v: formatarTempo(r.decorridoS) },
          { r: "Acertos", v: `${r.acertos}/${r.tentativas}` },
          { r: "Dicas", v: String(r.dicas) },
        ].map((i) => (
          <div key={i.r} className="rounded-base border border-linha bg-superficie px-3 py-2.5">
            <Rotulo>{i.r}</Rotulo>
            <p className="tabular mt-1 font-dados text-medio font-semibold">{i.v}</p>
          </div>
        ))}
      </div>

      {r.estacoes.length > 0 ? (
        <div className="mt-6">
          <Rotulo>Tempo por estação</Rotulo>
          <ul className="mt-2 divide-y divide-linha border-y border-linha">
            {r.estacoes.map((e) => (
              <li key={e.ordem} className="flex items-center gap-3 py-2.5">
                <span className="tabular font-dados text-mini text-tinta-3">
                  {String(e.ordem).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-base">{e.nome}</span>
                {!e.concluida ? (
                  <span className="font-dados text-micro text-alerta uppercase">não terminou</span>
                ) : null}
                <span className="tabular font-dados text-mini font-semibold">
                  {e.segundos !== null ? formatarTempo(e.segundos) : "—"}
                </span>
              </li>
            ))}
          </ul>

          {maisDemorada ? (
            <p className="mt-2 text-mini text-tinta-2">
              Onde vocês travaram mais: <strong className="text-tinta">{maisDemorada.nome}</strong>.
            </p>
          ) : null}
        </div>
      ) : null}

      {r.parcelas ? (
        <div className="mt-6">
          <Rotulo>De onde veio a pontuação</Rotulo>
          <ul className="mt-2 flex flex-col gap-1.5">
            {[
              { r: "Progresso", v: r.parcelas.progresso, p: config.peso_progresso },
              { r: "Precisão", v: r.parcelas.precisao, p: config.peso_precisao },
              { r: "Tempo", v: r.parcelas.tempo, p: config.peso_tempo },
              { r: "Avaliação do instrutor", v: r.parcelas.instrutor, p: config.peso_instrutor },
            ].map((i) => (
              <li key={i.r} className="flex items-baseline gap-3">
                <span className="min-w-0 flex-1 truncate text-mini">
                  {i.r}{" "}
                  <span className="font-dados text-micro text-tinta-3">
                    · vale até {Math.round(i.p * 1000)}
                  </span>
                </span>
                <span className="tabular font-dados text-mini font-semibold">{i.v}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!r.avaliouJaFoi ? (
        <div className="mt-8">
          <Link href={`/avaliar/${r.equipe.codigo}`}>
            <Botao tamanho="grande" larguraTotal>
              Avaliar a sala
            </Botao>
          </Link>
          <p className="mt-2 text-center text-mini text-tinta-2">
            Leva menos de um minuto e é o que a gente usa para melhorar.
          </p>
        </div>
      ) : null}

      <footer className="mt-auto pt-10">
        <Link href="/placar" className="text-mini font-semibold text-acento underline">
          Ver o placar da feira
        </Link>
      </footer>
    </main>
  );
}
