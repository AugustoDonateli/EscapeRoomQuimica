"use client";

import Link from "next/link";

/**
 * A tela de erro do site.
 *
 * Em produção o Next não entrega a mensagem do erro para o navegador, só um
 * identificador — e é por isso que a primeira publicação mostrou "a server
 * error occurred" e nada mais. Esta tela dá as duas coisas que servem para
 * alguma coisa: o botão de tentar de novo, que resolve falha de rede, e o
 * identificador, que é o que se procura no registro do servidor.
 */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <h1 className="font-display text-titulo font-bold tracking-tight">Algo quebrou aqui</h1>
      <p className="mt-2 text-mini text-tinta-2">
        Ninguém perdeu progresso: o código da equipe continua valendo. Tente de novo &mdash; e se
        insistir, procure alguém da organização.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="min-h-[48px] rounded-base border border-acento bg-acento px-5 text-base text-fundo"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="flex min-h-[48px] items-center rounded-base border border-linha-2 bg-superficie px-5 text-base"
        >
          Voltar ao início
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-6 font-dados text-micro text-tinta-3">
          Identificador do erro: {error.digest} — é o que procurar no registro da Vercel, em
          Deployments → Functions.
        </p>
      ) : null}
    </main>
  );
}
