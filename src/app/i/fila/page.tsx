import Link from "next/link";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Pilula, type EstadoPilula } from "@/components/ui/Pilula";
import { filaDoInstrutor, sessaoAberta } from "@/lib/instrutor";
import { chamarProxima, devolverParaFila, marcarAusencia } from "../acoes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fila · Escape Químico" };

export default async function PaginaFilaInstrutor() {
  const [fila, aberta] = await Promise.all([filaDoInstrutor(), sessaoAberta()]);

  const porLote = {
    manha: fila.filter((f) => f.lote === "manha"),
    tarde: fila.filter((f) => f.lote === "tarde"),
  };

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Fila</h1>
      <p className="mt-2 text-mini text-tinta-2">
        A ordem é a da posição, dentro de cada lote. Chamar segue essa ordem.
      </p>

      {fila.some((f) => f.status === "aguardando") ? (
        <form action={chamarProxima} className="mt-5">
          <Botao type="submit" tamanho="grande" larguraTotal>
            Chamar a próxima da fila
          </Botao>
        </form>
      ) : null}

      {(["manha", "tarde"] as const).map((lote) =>
        porLote[lote].length > 0 ? (
          <section key={lote} className="mt-8">
            <Rotulo>Lote da {lote === "manha" ? "manhã" : "tarde"}</Rotulo>

            <ul className="mt-2 flex flex-col gap-2">
              {porLote[lote].map((f) => (
                <li key={f.entradaId}>
                  <Cartao destaque={f.status === "chamada"}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="tabular font-dados text-grande leading-none font-semibold text-tinta-3">
                        {String(f.posicao).padStart(2, "0")}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-medio font-bold">{f.nome}</span>
                        <span className="block font-dados text-micro text-tinta-2">
                          {f.codigo} · {f.jogadores.length} jogadores
                        </span>
                      </span>

                      <Pilula estado={f.status as EstadoPilula} />
                    </div>

                    {f.status === "chamada" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/i/checkin/${f.codigo}`}>
                          <Botao disabled={Boolean(aberta)}>Check-in</Botao>
                        </Link>
                        <form action={marcarAusencia}>
                          <input type="hidden" name="entradaId" value={f.entradaId} />
                          <Botao type="submit" variante="perigo">
                            Não apareceu
                          </Botao>
                        </form>
                        <form action={devolverParaFila}>
                          <input type="hidden" name="entradaId" value={f.entradaId} />
                          <Botao type="submit" variante="fantasma">
                            Voltar para a fila
                          </Botao>
                        </form>
                      </div>
                    ) : null}
                  </Cartao>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      {fila.length === 0 ? (
        <p className="mt-6 rounded-base border border-linha bg-superficie px-4 py-6 text-center text-mini text-tinta-2">
          Ninguém na fila agora.
        </p>
      ) : null}
    </>
  );
}
