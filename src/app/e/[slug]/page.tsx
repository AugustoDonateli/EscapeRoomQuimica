import Link from "next/link";
import { estadoParaJogador } from "@/lib/estacao";
import { Proveta } from "@/components/ui/Proveta";
import { Celula } from "@/components/marca/Celula";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { siglaDaEstacao } from "@/lib/sigla";
import { lerConfig } from "@/lib/dados";
import { BotaoAbrir } from "./abrir";
import { FormularioResposta } from "./formulario";
import { Vigilante } from "./vigilante";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estação · Escape Químico" };

/**
 * A tela que abre quando o jogador lê o QR colado na estação.
 *
 * Contexto `sala`: escuro, com pressa, seis pessoas lendo o mesmo celular. Tudo
 * aqui é decidido por isso — o enunciado é o maior texto da plataforma inteira,
 * o tempo da sessão fica preso no alto porque é a pressão que move o jogo, e
 * não existe navegação nenhuma para alguém se perder no meio.
 */
export default async function PaginaEstacao({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [estado, config] = await Promise.all([
    estadoParaJogador(slug.toUpperCase()),
    lerConfig(),
  ]);

  if (estado.tipo === "erro") {
    return (
      <div className="sala min-h-dvh bg-fundo text-tinta">
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-8">
          <Cartao tom="fechado">
            <Rotulo>Esta estação não abre agora</Rotulo>
            <p className="mt-2 text-medio">{estado.mensagem}</p>
          </Cartao>
          <Link href="/" className="mt-5 min-h-[48px] text-mini text-tinta-2 underline">
            Voltar ao início
          </Link>
        </main>
      </div>
    );
  }

  const { estacao } = estado;

  return (
    <div className="sala min-h-dvh bg-fundo text-tinta">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-5 pb-8">
        {/* O tempo da sessão fica no alto e grande: é o relógio que decide o
            jogo. Antes era uma linha de 11px no canto, do tamanho de um
            rodapé — e era a informação mais importante da tela. */}
        <div className="flex items-center gap-3 border-b border-linha pb-4">
          <Celula numero={estacao.ordem} sigla={siglaDaEstacao(estacao.nome)} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-mini font-semibold">{estacao.nome}</span>
            <span className="block font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
              {estacao.slug}
            </span>
          </span>
        </div>

        <div className="mt-4">
          <Rotulo>Tempo da sessão</Rotulo>
          <Proveta
            className="mt-2"
            restanteSegundos={estado.restanteSessaoS}
            totalSegundos={config.duracao_sessao_min * 60}
            tamanho="mini"
            limiteAlertaSegundos={300}
          />
        </div>

        {estado.tipo === "fechada" ? (
          <div className="mt-9">
            <h1 className="titulo-editorial text-[clamp(1.75rem,8vw,2.25rem)]">
              {estacao.nome}
            </h1>
            <p className="mt-3 text-medio text-tinta-2">
              {estado.perguntas === 1
                ? "Uma pergunta de química nesta estação."
                : `${estado.perguntas} perguntas de química nesta estação.`}{" "}
              O tempo da pergunta só começa a contar quando vocês tocarem em começar &mdash;
              olhem a estação antes.
            </p>
            <div className="mt-7">
              <BotaoAbrir slug={estacao.slug} />
            </div>
          </div>
        ) : estado.tipo === "concluida" ? (
          <div className="mt-9">
            <p className="font-dados text-micro tracking-[0.22em] text-acento uppercase">
              estação destrancada
            </p>
            <h1 className="titulo-editorial mt-2 text-[clamp(2rem,9vw,2.75rem)]">
              <span className="tabular text-acento">{estado.acertos}</span> de{" "}
              <span className="tabular">{estado.total}</span> certas
            </h1>
            <p className="mt-3 text-medio text-tinta-2">
              Sigam para a próxima estação e leiam o QR de lá.
            </p>
          </div>
        ) : (
          <div className="mt-7">
            <FormularioResposta
              slug={estacao.slug}
              pergunta={estado.pergunta}
              feitas={estado.feitas}
              total={estado.total}
              tentativasPorPergunta={config.tentativas_por_pergunta}
            />
            {config.detectar_saida_de_tela ? <Vigilante slug={estacao.slug} /> : null}
          </div>
        )}
      </main>
    </div>
  );
}
