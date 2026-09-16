import Link from "next/link";
import { exigirPapel } from "@/lib/auth";
import { lerConfig } from "@/lib/dados";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Celula } from "@/components/marca/Celula";
import { FormularioConfig } from "./formulario-config";

/**
 * As telas que existem fora das abas do painel — as três que a organização
 * precisa abrir no dia, cada uma num aparelho diferente: o celular do
 * instrutor, a TV da sala e o totem da entrada.
 *
 * Tela de diagnóstico e catálogo de componentes não entram aqui. Ferramenta de
 * quem constrói o site não é função da plataforma, e listar isso junto do
 * resto trata quem organiza a feira como se fosse desenvolvedor.
 */
const OUTRAS_TELAS = [
  {
    href: "/i",
    numero: 1,
    sigla: "In",
    nome: "Painel do instrutor",
    oQueE: "A sala agora, a próxima equipe e a avaliação ao vivo",
    onde: "No celular de quem conduz",
  },
  {
    href: "/placar",
    numero: 2,
    sigla: "Pl",
    nome: "Placar",
    oQueE: "A classificação do dia, em tamanho de ser lido de longe",
    onde: "Na TV ou no projetor",
  },
  {
    href: "/",
    numero: 3,
    sigla: "To",
    nome: "Totem da entrada",
    oQueE: "O que a equipe vê ao ler o QR ou encostar o celular na tag",
    onde: "No tablet da entrada",
  },
];

export const metadata = { title: "Configuração · Escape Químico" };

export default async function PaginaConfig() {
  await exigirPapel(["admin"]);
  const config = await lerConfig();

  // O horário é o que define a capacidade do dia inteiro: sem ele a fila não
  // abre para ninguém. Já derrubou a plataforma em produção uma vez, então o
  // aviso fica no alto, onde quem pode resolver está olhando.
  const semHorario = !config.abre_em || !config.fecha_em;

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Configuração do evento</h1>
      <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
        Tudo que depende das outras equipes da feira mora nesta tela. Nenhum número do projeto está
        escrito no código: quando a informação chegar, ela é digitada aqui e vale na hora.
      </p>

      {semHorario ? (
        <Cartao tom="fechado" className="mt-6">
          <Rotulo>A fila não vai abrir assim</Rotulo>
          <p className="mt-2 text-medio">
            A hora de abrir e a de fechar a feira estão em branco. São elas que dizem quantas
            sessões cabem no dia &mdash; sem as duas, o totem recebe as equipes e não deixa
            ninguém entrar na fila.
          </p>
          <p className="mt-3 text-mini text-tinta-2">
            Os dois campos estão no formulário abaixo, em &ldquo;Horário da feira&rdquo;.
          </p>
        </Cartao>
      ) : null}

      <section className="mt-8" aria-labelledby="titulo-outras-telas">
        <h2 id="titulo-outras-telas">
          <Rotulo>As três telas do dia</Rotulo>
        </h2>

        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {OUTRAS_TELAS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="group block h-full">
                <Cartao tom="papel" className="h-full transition-colors group-hover:border-acento">
                  <span className="flex items-center gap-2">
                    <Celula numero={t.numero} sigla={t.sigla} />
                    <span className="font-dados text-micro text-tinta-3">{t.href}</span>
                  </span>
                  <span className="mt-3 block text-base font-semibold group-hover:text-acento">
                    {t.nome}
                  </span>
                  <span className="mt-1 block text-mini text-tinta-2">{t.oQueE}</span>
                  <span className="mt-2 block font-dados text-micro tracking-[0.1em] text-tinta-3 uppercase">
                    {t.onde}
                  </span>
                </Cartao>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <FormularioConfig config={config} />
      </div>
    </>
  );
}
