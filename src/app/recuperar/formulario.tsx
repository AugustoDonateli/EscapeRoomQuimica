"use client";

import { useActionState } from "react";
import { recuperar } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";

export function FormularioRecuperar() {
  const [erro, acao, enviando] = useActionState(recuperar, null);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo id="nome" name="nome" etiqueta="Nome da equipe" autoComplete="off" required />
      <Campo
        id="email"
        name="email"
        etiqueta="E-mail usado no cadastro"
        type="email"
        autoComplete="email"
        required
      />

      {erro ? (
        <p role="alert" className="rounded-base bg-perigo-suave px-3 py-2 text-mini text-perigo">
          {erro}
        </p>
      ) : null}

      <Botao type="submit" tamanho="grande" disabled={enviando}>
        {enviando ? "Procurando…" : "Voltar para a minha fila"}
      </Botao>
    </form>
  );
}
