import { exigirPapel } from "@/lib/auth";
import { listarEstacoes, listarPerguntas } from "@/lib/dados";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { EditorEstacao, FormularioEstacao } from "./formulario";
import { alternarEstacao } from "./acoes";

export const metadata = { title: "Estações · Escape Químico" };

export default async function PaginaEstacoes() {
  await exigirPapel(["admin"]);

  const [estacoes, perguntas] = await Promise.all([listarEstacoes(), listarPerguntas()]);
  const proximaOrdem = Math.max(0, ...estacoes.map((e) => e.ordem)) + 1;

  function contarPerguntas(idEstacao: string) {
    return perguntas.filter((p) => p.station_id === idEstacao && p.ativa).length;
  }

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Estações</h1>
      <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
        Quantas estações existem e o que cada uma faz é decisão da equipe das estações. Aqui é onde
        essa informação entra — e de onde saem os QRs para imprimir.
      </p>

      <ul className="mt-8 flex flex-col gap-2">
        {estacoes.map((e) => {
          const quantas = contarPerguntas(e.id);
          const semPergunta = e.tem_pergunta && quantas === 0;

          return (
            <li key={e.id}>
              <Cartao className={e.ativa ? "" : "opacity-60"}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="tabular font-dados text-grande leading-none font-semibold text-tinta-3">
                    {String(e.ordem).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-medio font-bold">{e.nome}</span>
                    <span className="block font-dados text-micro tracking-[0.1em] text-tinta-3 uppercase">
                      {e.slug} · peso {e.peso_dificuldade}
                      {e.ativa ? "" : " · desativada"}
                    </span>
                  </span>

                  <span className="text-right">
                    <Rotulo>Perguntas</Rotulo>
                    <span className="tabular block text-medio font-semibold">
                      {e.tem_pergunta ? quantas : "—"}
                    </span>
                  </span>

                  <span className="flex flex-wrap items-center gap-2">
                    <EditorEstacao estacao={e} />
                    <form action={alternarEstacao}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="ativar" value={e.ativa ? "0" : "1"} />
                      <button
                        type="submit"
                        className="min-h-[36px] rounded-base border border-linha-2 px-3 text-mini hover:border-acento"
                      >
                        {e.ativa ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  </span>
                </div>

                {semPergunta ? (
                  <p className="mt-3 rounded-base bg-alerta-suave px-3 py-2 text-mini text-alerta">
                    Marcada como tendo pergunta, mas nenhuma cadastrada ainda. O QR desta estação
                    abriria uma tela vazia no dia da feira.
                  </p>
                ) : null}
              </Cartao>
            </li>
          );
        })}
      </ul>

      {estacoes.length === 0 ? (
        <p className="mt-6 rounded-base border border-linha bg-superficie px-4 py-6 text-center text-mini text-tinta-2">
          Nenhuma estação ainda. Crie a primeira abaixo.
        </p>
      ) : null}

      <div className="mt-8">
        <FormularioEstacao proximaOrdem={proximaOrdem} />
      </div>
    </>
  );
}
