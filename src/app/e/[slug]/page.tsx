import Link from "next/link";
import { estadoParaJogador } from "@/lib/estacao";
import { formatarTempo } from "@/components/ui/Proveta";
import { BotaoAbrir } from "./abrir";
import { FormularioResposta } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estação · Escape Químico" };

/**
 * A tela que abre quando o jogador lê o QR colado na estação.
 *
 * Fica no contexto `sala`: a pessoa está no escuro, com pressa, e a tela não
 * pode cegar ninguém. Sem navegação, sem menu, sem link para lugar nenhum —
 * enunciado, resposta e tempo.
 */
export default async function PaginaEstacao({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const estado = await estadoParaJogador(slug.toUpperCase());

  return (
    <div className="sala min-h-dvh bg-fundo text-tinta">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
        {estado.tipo === "erro" ? (
          <>
            <p className="font-dados text-micro tracking-[0.14em] text-tinta-3 uppercase">
              Escape Químico
            </p>
            <div className="mt-6 rounded-base border border-alerta bg-alerta-suave p-4">
              <p className="text-medio text-alerta">{estado.mensagem}</p>
            </div>
            <Link
              href="/"
              className="mt-5 min-h-[48px] text-mini text-tinta-2 underline"
            >
              Voltar ao início
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
                {estado.estacao.slug} · {estado.estacao.nome}
              </p>
              <p className="tabular shrink-0 font-dados text-micro text-tinta-3">
                sessão {formatarTempo(estado.restanteSessaoS)}
              </p>
            </div>

            {estado.tipo === "fechada" ? (
              <div className="mt-8">
                <p className="font-display text-titulo leading-tight font-extrabold tracking-tight">
                  {estado.estacao.nome}
                </p>
                <p className="mt-2 text-base text-tinta-2">
                  {estado.perguntas === 1
                    ? "Uma pergunta de química nesta estação."
                    : `${estado.perguntas} perguntas de química nesta estação.`}{" "}
                  O tempo da estação começa a contar quando vocês toquem em começar.
                </p>
                <div className="mt-6">
                  <BotaoAbrir slug={estado.estacao.slug} />
                </div>
              </div>
            ) : estado.tipo === "concluida" ? (
              <div className="mt-8">
                <p className="font-display text-titulo leading-tight font-extrabold tracking-tight">
                  Estação concluída
                </p>
                <p className="mt-2 text-base text-tinta-2">
                  {estado.acertos} de {estado.total} certas aqui. Sigam para a próxima estação e
                  leiam o QR de lá.
                </p>
              </div>
            ) : (
              <div className="mt-7">
                <FormularioResposta
                  slug={estado.estacao.slug}
                  pergunta={estado.pergunta}
                  feitas={estado.feitas}
                  total={estado.total}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
