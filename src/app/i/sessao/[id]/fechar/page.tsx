import { notFound } from "next/navigation";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { formatarTempo } from "@/components/ui/Proveta";
import { exigirPapel } from "@/lib/auth";
import { lerSessao } from "@/lib/instrutor";
import { sugerirNotas } from "@/lib/rubrica";
import { FormularioRubrica } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fechamento · Escape Químico" };

export default async function PaginaFechar({ params }: { params: Promise<{ id: string }> }) {
  await exigirPapel(["admin", "instrutor"]);

  const { id } = await params;
  const sessao = await lerSessao(id);
  if (!sessao) notFound();

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Fechamento da sessão</h1>
      <p className="mt-1 font-dados text-micro text-tinta-2">
        {sessao.equipe.nome} · {sessao.equipe.codigo}
      </p>

      <Cartao className="mt-5">
        <Rotulo>Como foi</Rotulo>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {[
            { r: "Tempo", v: formatarTempo(sessao.tempo.decorridoS) },
            { r: "Estações", v: `${sessao.estacoes.filter((e) => e.concluidaEm).length}` },
            { r: "Acertos", v: `${sessao.acertos}/${sessao.tentativas}` },
            { r: "Dicas", v: `${sessao.dicas}` },
          ].map((i) => (
            <div key={i.r}>
              <Rotulo>{i.r}</Rotulo>
              <p className="tabular mt-0.5 font-dados text-medio font-semibold">{i.v}</p>
            </div>
          ))}
        </div>
      </Cartao>

      <p className="mt-6 max-w-[60ch] text-mini text-tinta-2">
        As notas abaixo já vêm sugeridas pelos toques que você deu durante a sessão. Ajuste o que
        discordar — cada nota tem descritor escrito, e é isso que torna o resultado discutível em
        vez de opinião.
      </p>

      <div className="mt-5">
        <FormularioRubrica
          sessaoId={sessao.id}
          jogadores={sessao.jogadores.map((j) => ({
            id: j.id,
            nome: j.nome,
            sugestao: sugerirNotas(j.contagem),
          }))}
        />
      </div>
    </>
  );
}
