import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { lerConfig } from "@/lib/dados";
import { lerPerguntas } from "@/lib/avaliacao";
import { normalizarCodigo } from "@/lib/codigo";
import { lerRelatorio } from "@/lib/resultado";
import { FormularioAvaliacao } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avaliar · Escape Químico" };

export default async function PaginaAvaliar({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: bruto } = await params;
  const codigo = normalizarCodigo(decodeURIComponent(bruto));

  const config = await lerConfig();
  const perguntas = lerPerguntas(config.perguntas_avaliacao);
  const relatorio = codigo ? await lerRelatorio(codigo, config) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/">
        <Marca tamanho="icone" />
      </Link>

      {!relatorio ? (
        <Cartao className="mt-8">
          <Rotulo>Não achamos essa equipe</Rotulo>
          <p className="mt-2 text-base">Confira o código do cartão da fila.</p>
        </Cartao>
      ) : relatorio.avaliouJaFoi ? (
        <Cartao className="mt-8">
          <Rotulo>Vocês já avaliaram</Rotulo>
          <p className="mt-2 text-base">Obrigado! Uma avaliação por equipe é o suficiente.</p>
          <Link href={`/resultado/${codigo}`} className="mt-4 inline-block">
            <Botao variante="secundario">Ver o relatório</Botao>
          </Link>
        </Cartao>
      ) : perguntas.length === 0 ? (
        <Cartao className="mt-8">
          <Rotulo>Avaliação indisponível</Rotulo>
          <p className="mt-2 text-base">Ninguém configurou as perguntas ainda.</p>
        </Cartao>
      ) : (
        <>
          <h1 className="mt-6 font-display text-titulo font-bold tracking-tight">
            Como foi para vocês?
          </h1>
          <p className="mt-2 text-mini text-tinta-2">
            {relatorio.equipe.nome} · leva menos de um minuto, e é o que a gente usa para
            melhorar a sala.
          </p>

          <div className="mt-6">
            <FormularioAvaliacao codigo={codigo} perguntas={perguntas} />
          </div>
        </>
      )}
    </main>
  );
}
