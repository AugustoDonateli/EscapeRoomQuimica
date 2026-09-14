import { Marca } from "@/components/marca/Marca";
import { Atualizador } from "@/components/Atualizador";
import { lerConfig } from "@/lib/dados";
import { lerPlacar, porCategoria } from "@/lib/placar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Placar · Escape Químico" };

/**
 * O placar público, para a TV ou o projetor da feira.
 *
 * É a única tela do projeto que não é mobile: ela é vista de cinco metros, de
 * passagem, por gente que não vai chegar perto. Então tipografia enorme, três
 * informações por linha no máximo, e nada que precise ser lido com atenção.
 *
 * Usa o fundo grafite mesmo estando fora da sala — e este é o terceiro caso,
 * declarado: TV é tela que emite a própria luz, num salão iluminado. Fundo
 * escuro com texto claro é o que aguenta ser visto de longe sem lavar.
 */
export default async function PaginaPlacar() {
  const config = await lerConfig();
  const linhas = await lerPlacar(config);
  const grupos = porCategoria(linhas);

  return (
    <div className="sala min-h-dvh bg-fundo text-tinta">
      <main className="mx-auto max-w-[1700px] px-[3vw] py-[2vw]">
        <header className="flex flex-wrap items-center justify-between gap-6 border-b-2 border-tinta pb-5">
          <Marca tamanho="tela" comNome />
          <p className="font-dados text-medio tracking-[0.16em] text-tinta-2 uppercase">
            Placar ao vivo
          </p>
        </header>

        {linhas.length === 0 ? (
          <p className="mt-24 text-center font-display text-[clamp(1.8rem,5vw,3rem)] font-extrabold text-tinta-2">
            Nenhuma equipe concluiu a sala ainda.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-12">
            {grupos.map((g) => (
              <section key={g.rotulo}>
                <h2 className="font-dados text-[clamp(0.9rem,1.4vw,1.6rem)] tracking-[0.18em] text-acento uppercase">
                  {g.rotulo}
                </h2>

                <ul className="mt-4 flex flex-col gap-2">
                  {g.linhas.slice(0, 8).map((l) => {
                    const podio = l.posicao <= 3;

                    return (
                      <li
                        key={l.sessaoId}
                        className={`flex items-center gap-[2vw] rounded-base px-[1.5vw] py-[0.8vw] ${
                          podio ? "bg-superficie-2" : ""
                        }`}
                      >
                        <span
                          className={`tabular w-[2.5ch] shrink-0 text-right font-display leading-none font-extrabold ${
                            podio ? "text-[clamp(2.5rem,5.5vw,7rem)] text-acento" : "text-[clamp(1.5rem,3vw,3.5rem)] text-tinta-3"
                          }`}
                        >
                          {l.posicao}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate font-display font-extrabold tracking-tight ${
                              podio ? "text-[clamp(1.8rem,4.2vw,5rem)]" : "text-[clamp(1.2rem,2.6vw,3rem)]"
                            }`}
                          >
                            {l.equipe}
                          </span>
                          {podio ? (
                            <span className="block font-dados text-[clamp(0.75rem,1.1vw,1.25rem)] tracking-[0.1em] text-tinta-3 uppercase">
                              {l.entrada.estacoesConcluidas} de {l.entrada.estacoesTotais} estações ·{" "}
                              {l.entrada.acertos} acertos
                            </span>
                          ) : null}
                        </span>

                        <span
                          className={`tabular shrink-0 font-display leading-none font-extrabold ${
                            podio ? "text-[clamp(3rem,7vw,9rem)] text-acento" : "text-[clamp(1.5rem,3.4vw,4rem)]"
                          }`}
                        >
                          {Math.round(l.parcelas.total)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-14 border-t border-linha pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-dados text-mini tracking-[0.1em] text-tinta-3 uppercase">
              {config.nome_evento} · pontuação de 0 a 1000
            </p>
            <Atualizador segundos={15} className="text-left" />
          </div>
          <p className="mt-3 max-w-[80ch] text-mini text-tinta-2">
            Progresso {Math.round(config.peso_progresso * 100)}% · precisão{" "}
            {Math.round(config.peso_precisao * 100)}% · tempo{" "}
            {Math.round(config.peso_tempo * 100)}% · avaliação do instrutor{" "}
            {Math.round(config.peso_instrutor * 100)}%. Desempate: precisão, depois tempo, depois
            menos dicas.
          </p>
        </footer>
      </main>
    </div>
  );
}
