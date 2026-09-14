import Link from "next/link";
import { notFound } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Pilula } from "@/components/ui/Pilula";
import { formatarTempo } from "@/components/ui/Proveta";
import { exigirPapel } from "@/lib/auth";
import { lerConfig } from "@/lib/dados";
import { lerSessao } from "@/lib/instrutor";
import { alternarPausa, darDica, encerrarSessao } from "../../acoes";
import { Cronometro } from "./cronometro";
import { PainelDeToques } from "./toques";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sessão ao vivo · Escape Químico" };

/**
 * A tela crítica.
 *
 * Se algo for quebrar ao vivo na feira, quebra aqui. Então: nada de digitar,
 * botões grandes, o tempo vindo do servidor, os toques sobrevivendo a queda de
 * rede, e as ações perigosas (encerrar, abortar) longe do dedo que está tocando
 * nas observações.
 */
export default async function PaginaSessao({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  await exigirPapel(["admin", "instrutor"]);

  const { id } = await params;
  const { erro } = await searchParams;

  const config = await lerConfig();
  const sessao = await lerSessao(id, config);
  if (!sessao) notFound();

  const encerrada = sessao.status === "concluida" || sessao.status === "abortada";
  const pausada = sessao.status === "pausada";

  return (
    <>
      {erro === "ja-tem-sessao" ? (
        <p className="mb-4 rounded-base bg-alerta-suave px-3 py-2 text-mini text-alerta">
          Já havia uma sessão aberta — esta é ela.
        </p>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-titulo leading-tight font-extrabold tracking-tight">
          {sessao.equipe.nome}
        </h1>
        {pausada ? <Pilula estado="pausada" /> : encerrada ? <Pilula estado="concluida" /> : null}
      </div>
      <p className="font-dados text-micro text-tinta-2">
        {sessao.equipe.codigo} · {sessao.jogadores.length} jogadores
      </p>

      <div className="mt-5">
        <Cronometro
          restanteInicialS={sessao.tempo.restanteS}
          totalS={config.duracao_sessao_min * 60}
          pausado={pausada || encerrada}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-dados text-micro text-tinta-2">
          estação:{" "}
          <strong className="text-tinta">
            {sessao.estacaoAtual ? sessao.estacaoAtual.nome : "nenhuma aberta"}
          </strong>
        </span>
        <span className="font-dados text-micro text-tinta-2">
          acertos: <strong className="text-tinta">{sessao.acertos}</strong> de {sessao.tentativas}
        </span>
        <span className="font-dados text-micro text-tinta-2">
          dicas: <strong className="text-tinta">{sessao.dicas}</strong>
        </span>
        {sessao.saidasDeTela > 0 ? (
          <span className="font-dados text-micro text-alerta">
            saídas de tela: <strong>{sessao.saidasDeTela}</strong>
          </span>
        ) : null}
      </div>

      {!encerrada ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <form action={darDica}>
            <input type="hidden" name="sessaoId" value={sessao.id} />
            <Botao type="submit" variante="alerta" tamanho="grande">
              Dar dica
            </Botao>
          </form>
          <form action={alternarPausa}>
            <input type="hidden" name="sessaoId" value={sessao.id} />
            <Botao type="submit" variante="secundario" tamanho="grande">
              {pausada ? "Retomar" : "Pausar"}
            </Botao>
          </form>
        </div>
      ) : null}

      <div className="mt-7">
        <PainelDeToques
          sessaoId={sessao.id}
          jogadores={sessao.jogadores.map((j) => ({
            id: j.id,
            nome: j.nome,
            contagem: j.contagem,
          }))}
          encerrada={encerrada}
        />
      </div>

      {sessao.estacoes.length > 0 ? (
        <div className="mt-8">
          <Rotulo>Tempo por estação · sai dos QRs, ninguém anota</Rotulo>
          <p className="mt-1 text-mini text-tinta-2">O número do meio é acertos em tentativas.</p>
          <ul className="mt-2 divide-y divide-linha border-y border-linha">
            {sessao.estacoes.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <span className="tabular font-dados text-mini text-tinta-3">
                  {String(e.ordem).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-base">{e.nome}</span>
                <span
                  className="font-dados text-micro text-tinta-2"
                  title="acertos em tentativas"
                >
                  {e.tentativas > 0 ? `${e.acertos}/${e.tentativas}` : "—"}
                </span>
                <span className="tabular font-dados text-mini font-semibold">
                  {e.segundos !== null ? formatarTempo(e.segundos) : "—"}
                </span>
                {!e.concluidaEm ? (
                  <span className="font-dados text-micro text-acento uppercase">aberta</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {encerrada ? (
        <div className="mt-8">
          <Link href={`/i/sessao/${sessao.id}/fechar`}>
            <Botao tamanho="grande" larguraTotal>
              Ir para o fechamento
            </Botao>
          </Link>
        </div>
      ) : (
        <div className="mt-10 border-t border-linha pt-5">
          <Rotulo>Fim da sessão</Rotulo>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={encerrarSessao}>
              <input type="hidden" name="sessaoId" value={sessao.id} />
              <Botao type="submit" tamanho="grande">
                Encerrar e avaliar
              </Botao>
            </form>
            <form action={encerrarSessao}>
              <input type="hidden" name="sessaoId" value={sessao.id} />
              <input type="hidden" name="abortar" value="1" />
              <Botao type="submit" variante="perigo">
                Abortar sem avaliar
              </Botao>
            </form>
          </div>
          <p className="mt-2 text-mini text-tinta-2">
            Abortar é para o caso feio — sala quebrada, equipe que desistiu no meio. A sessão não
            entra no placar.
          </p>
        </div>
      )}
    </>
  );
}
