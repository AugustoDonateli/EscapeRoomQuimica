import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Rotulo } from "@/components/ui/Cartao";

/**
 * Entrega da etapa 1: endereço no ar, com a cara do projeto e nada dentro.
 * Esta página vira o totem de entrada na etapa 4 — por enquanto ela é honesta
 * sobre o que existe e o que não existe.
 */

const ETAPAS = [
  { n: 1, nome: "Fundação", estado: "pronta" },
  { n: 2, nome: "Sistema visual", estado: "pronta" },
  { n: 3, nome: "Admin e conteúdo", estado: "pronta" },
  { n: 4, nome: "Cadastro e fila", estado: "a fazer" },
  { n: 5, nome: "Sessão e painel do instrutor", estado: "a fazer" },
  { n: 6, nome: "Pontuação e placar", estado: "a fazer" },
  { n: 7, nome: "Fechamento e ensaio", estado: "a fazer" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-10">
      <Marca tamanho="tela" comNome />

      <h1 className="mt-12 font-display text-[clamp(2rem,8vw,3.25rem)] leading-[1.03] font-extrabold tracking-tight text-balance">
        A sala de fuga de química da feira de ciências.
      </h1>

      <p className="mt-4 max-w-[52ch] text-medio text-tinta-2">
        Esta é a plataforma que organiza a fila, conduz a sessão e avalia as equipes. Ela
        ainda está sendo construída — e esta página diz exatamente até onde chegou.
      </p>

      <div className="mt-10">
        <Rotulo>Construção</Rotulo>
        <ul className="mt-3 divide-y divide-linha border-y border-linha">
          {ETAPAS.map((e) => (
            <li key={e.n} className="flex items-center gap-3 py-2.5">
              <span className="tabular font-dados text-micro text-tinta-3">
                {String(e.n).padStart(2, "0")}
              </span>
              <span className="flex-1 text-base">{e.nome}</span>
              <span
                className={`font-dados text-micro tracking-[0.1em] uppercase ${
                  e.estado === "pronta" ? "text-acento" : "text-tinta-3"
                }`}
              >
                {e.estado}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <Link
          href="/estilo"
          className="inline-flex min-h-[48px] items-center rounded-base border border-linha-2 bg-superficie px-5 text-base hover:border-acento"
        >
          Ver o sistema visual →
        </Link>
      </div>

      <footer className="mt-auto pt-12">
        <p className="font-dados text-micro tracking-[0.08em] text-tinta-3 uppercase">
          Feira de ciências · projeto escolar
        </p>
      </footer>
    </main>
  );
}
