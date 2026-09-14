"use client";

import { useActionState } from "react";
import { abrirEstacao } from "./acoes";
import { Botao } from "@/components/ui/Botao";

export function BotaoAbrir({ slug }: { slug: string }) {
  const [resultado, acao, enviando] = useActionState(
    async (_anterior: { erro: string } | null, dados: FormData) => abrirEstacao(dados),
    null,
  );

  return (
    <form action={acao}>
      <input type="hidden" name="slug" value={slug} />
      <Botao type="submit" tamanho="grande" larguraTotal disabled={enviando}>
        {enviando ? "Abrindo…" : "Começar esta estação"}
      </Botao>
      {resultado?.erro ? (
        <p role="alert" className="mt-3 rounded-base bg-alerta-suave px-3 py-2 text-mini text-alerta">
          {resultado.erro}
        </p>
      ) : null}
    </form>
  );
}
