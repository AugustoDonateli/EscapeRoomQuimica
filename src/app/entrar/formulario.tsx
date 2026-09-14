"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";

export function FormularioEntrar({ de }: { de: string }) {
  const [erro, acao, enviando] = useActionState(entrar, null);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="de" value={de} />

      <Campo id="email" name="email" etiqueta="E-mail" type="email" autoComplete="email" required />
      <Campo
        id="senha"
        name="senha"
        etiqueta="Senha"
        type="password"
        autoComplete="current-password"
        required
      />

      {erro ? (
        <p role="alert" className="rounded-base bg-perigo-suave px-3 py-2 text-mini text-perigo">
          {erro}
        </p>
      ) : null}

      <Botao type="submit" larguraTotal disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Botao>
    </form>
  );
}
