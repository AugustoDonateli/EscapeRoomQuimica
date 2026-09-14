import { exigirPapel } from "@/lib/auth";
import { lerConfig, listarEstacoes, listarPerguntas } from "@/lib/dados";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { EditorPergunta, FormularioPergunta } from "./formulario";
import { alternarPergunta } from "./acoes";

export const metadata = { title: "Perguntas · Escape Químico" };

export default async function PaginaPerguntas() {
  await exigirPapel(["admin", "autor"]);

  const [config, estacoes, perguntas] = await Promise.all([
    lerConfig(),
    listarEstacoes(),
    listarPerguntas(),
  ]);

  const comPergunta = estacoes.filter((e) => e.tem_pergunta);
  const proximaOrdem = Math.max(0, ...perguntas.map((p) => p.ordem)) + 1;

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Perguntas de química</h1>
      <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
        Cada pergunta precisa de um dado que só exista dentro da sala. Isso resolve duas coisas de
        uma vez: ninguém pesquisa a resposta no celular, e o desafio deixa de depender de conteúdo
        que só o último ano já viu.
      </p>

      {comPergunta.length === 0 ? (
        <p className="mt-6 rounded-base bg-alerta-suave px-4 py-3 text-mini text-alerta">
          Nenhuma estação está marcada como tendo pergunta. Marque na aba Estações antes de
          cadastrar pergunta aqui.
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-8">
            {comPergunta.map((e) => {
              const daEstacao = perguntas
                .filter((p) => p.station_id === e.id)
                .sort((a, b) => a.ordem - b.ordem);

              return (
                <section key={e.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linha-2 pb-2">
                    <h2 className="font-display text-medio font-bold">
                      {e.slug} · {e.nome}
                    </h2>
                    <span className="font-dados text-micro tracking-[0.1em] text-tinta-3 uppercase">
                      {daEstacao.length} pergunta{daEstacao.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {daEstacao.length === 0 ? (
                    <p className="mt-3 rounded-base bg-alerta-suave px-3 py-2 text-mini text-alerta">
                      Esta estação ainda não tem pergunta. O QR dela abriria uma tela vazia.
                    </p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {daEstacao.map((p) => (
                        <li key={p.id}>
                          <Cartao className={p.ativa ? "" : "opacity-60"}>
                            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                              <span className="tabular font-dados text-mini text-tinta-3">
                                {String(p.ordem).padStart(2, "0")}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block text-base">{p.enunciado}</span>
                                <span className="mt-1 block font-dados text-micro text-tinta-2">
                                  {p.tipo === "multipla" ? "múltipla escolha" : "digitada"} ·
                                  resposta: <strong className="text-tinta">{p.resposta}</strong> ·{" "}
                                  {p.tempo_limite_s ?? config.tempo_limite_pergunta_s}s
                                  {p.ativa ? "" : " · desativada"}
                                </span>
                              </span>

                              <span className="flex flex-wrap items-center gap-2">
                                <EditorPergunta
                                  pergunta={p}
                                  estacoes={comPergunta}
                                  tempoPadraoS={config.tempo_limite_pergunta_s}
                                />
                                <form action={alternarPergunta}>
                                  <input type="hidden" name="id" value={p.id} />
                                  <input type="hidden" name="ativar" value={p.ativa ? "0" : "1"} />
                                  <button
                                    type="submit"
                                    className="min-h-[36px] rounded-base border border-linha-2 px-3 text-mini hover:border-acento"
                                  >
                                    {p.ativa ? "Desativar" : "Reativar"}
                                  </button>
                                </form>
                              </span>
                            </div>
                          </Cartao>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          <div className="mt-10">
            <Rotulo className="mb-3">Cadastrar pergunta</Rotulo>
            <FormularioPergunta
              estacoes={comPergunta}
              tempoPadraoS={config.tempo_limite_pergunta_s}
              proximaOrdem={proximaOrdem}
            />
          </div>
        </>
      )}
    </>
  );
}
