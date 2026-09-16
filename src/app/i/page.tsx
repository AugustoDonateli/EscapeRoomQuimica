import Link from "next/link";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Pilula } from "@/components/ui/Pilula";
import { Proveta } from "@/components/ui/Proveta";
import { lerConfig } from "@/lib/dados";
import { filaDoInstrutor, lerSessao, sessaoAberta } from "@/lib/instrutor";
import { capacidadePorLote } from "@/lib/capacidade";
import { contarNaFila } from "@/lib/fila";
import { chamarProxima, iniciarSessao, marcarAusencia } from "./acoes";

export const dynamic = "force-dynamic";
export const metadata = { title: "A sala agora · Escape Químico" };

/**
 * A sala agora. Uma tela, sem rolagem se possível: o que está rodando, quem é
 * a próxima, e quanto do dia ainda cabe.
 */
export default async function PaginaSala() {
  const config = await lerConfig();
  const aberta = await sessaoAberta();

  const [sessao, fila, naFilaManha, naFilaTarde] = await Promise.all([
    aberta ? lerSessao(aberta, config) : Promise.resolve(null),
    filaDoInstrutor(),
    contarNaFila("manha"),
    contarNaFila("tarde"),
  ]);

  const capacidade = capacidadePorLote(config);
  const restamHoje = Math.max(0, capacidade.total - (naFilaManha + naFilaTarde));
  const chamadas = fila.filter((f) => f.status === "chamada");
  const aguardando = fila.filter((f) => f.status === "aguardando");

  return (
    <>
      <p className="font-dados text-micro tracking-[0.22em] text-tinta-3 uppercase">
        instrutor
      </p>
      <h1 className="titulo-editorial mt-1 text-[clamp(1.75rem,8vw,2.25rem)]">A sala agora</h1>

      {sessao ? (
        <Cartao destaque className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <Rotulo>Em andamento</Rotulo>
            {sessao.status === "pausada" ? <Pilula estado="pausada" /> : null}
          </div>

          <p className="titulo-editorial mt-2 text-[clamp(1.5rem,7vw,2rem)]">
            {sessao.equipe.nome}
          </p>
          <p className="font-dados text-micro text-tinta-2">
            {sessao.estacaoAtual
              ? `${sessao.estacaoAtual.slug} · ${sessao.estacaoAtual.nome}`
              : "nenhuma estação aberta"}
          </p>

          <div className="mt-4">
            <Proveta
              restanteSegundos={sessao.tempo.restanteS}
              totalSegundos={config.duracao_sessao_min * 60}
              tamanho="sessao"
            />
          </div>

          <Link href={`/i/sessao/${sessao.id}`} className="mt-4 block">
            <Botao tamanho="grande" larguraTotal seta>
              Abrir o painel da sessão
            </Botao>
          </Link>
        </Cartao>
      ) : (
        <Cartao className="mt-5">
          <Rotulo>Nenhuma sessão em andamento</Rotulo>
          <p className="mt-2 text-mini text-tinta-2">
            Chame a próxima equipe e faça o check-in para começar.
          </p>
        </Cartao>
      )}

      {chamadas.length > 0 ? (
        <div className="mt-6">
          <Rotulo>Chamada, esperando aparecer</Rotulo>
          <div className="mt-2 flex flex-col gap-2">
            {chamadas.map((c) => (
              <Cartao key={c.entradaId}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-medio font-bold">{c.nome}</span>
                    <span className="block font-dados text-micro text-tinta-2">
                      {c.codigo} · {c.jogadores.length} jogadores · tolerância{" "}
                      {config.ausencia_tolerancia_min} min
                    </span>
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/i/checkin/${c.codigo}`}>
                    <Botao tamanho="grande" disabled={Boolean(sessao)}>
                      Check-in
                    </Botao>
                  </Link>
                  <form action={marcarAusencia}>
                    <input type="hidden" name="entradaId" value={c.entradaId} />
                    <Botao type="submit" variante="perigo" tamanho="grande">
                      Não apareceu
                    </Botao>
                  </form>
                </div>
              </Cartao>
            ))}
          </div>
        </div>
      ) : null}

      {!sessao && chamadas.length === 0 && aguardando.length > 0 ? (
        <form action={chamarProxima} className="mt-6">
          <Botao type="submit" tamanho="grande" larguraTotal seta>
            Chamar a próxima equipe
          </Botao>
        </form>
      ) : null}

      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { r: "Na fila", v: aguardando.length },
          { r: "Chamadas", v: chamadas.length },
          { r: "Vagas hoje", v: restamHoje },
        ].map((i) => (
          <div key={i.r} className="rounded-base border border-linha bg-superficie px-3 py-2.5">
            <Rotulo className="truncate">{i.r}</Rotulo>
            <p className="tabular mt-1 font-display text-grande leading-none font-extrabold">
              {i.v}
            </p>
          </div>
        ))}
      </div>

      <Link href="/i/fila" className="mt-6 inline-block text-mini font-semibold text-acento underline">
        Ver a fila inteira
      </Link>
    </>
  );
}
