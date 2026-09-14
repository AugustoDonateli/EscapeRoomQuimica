"use client";

import { useActionState, useState } from "react";
import { anonimizar } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";

const FRASE = "APAGAR DADOS PESSOAIS";

export function FormularioAnonimizar() {
  const [resultado, acao, enviando] = useActionState(anonimizar, null);
  const [texto, setTexto] = useState("");

  const confere = texto.trim().toUpperCase() === FRASE;

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo
        id="confirmacao"
        name="confirmacao"
        etiqueta={`Digite "${FRASE}" para confirmar`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoComplete="off"
        ajuda="Não tem volta. Os nomes e e-mails não voltam depois."
      />

      {resultado ? (
        <p
          role="status"
          className={`rounded-base px-3 py-2 text-mini ${
            resultado.ok ? "bg-acento-suave text-acento" : "bg-perigo-suave text-perigo"
          }`}
        >
          {resultado.ok ? resultado.mensagem : resultado.erro}
        </p>
      ) : null}

      <div>
        <Botao type="submit" variante="perigo" tamanho="grande" disabled={!confere || enviando}>
          {enviando ? "Apagando…" : "Apagar os dados pessoais"}
        </Botao>
      </div>
    </form>
  );
}
