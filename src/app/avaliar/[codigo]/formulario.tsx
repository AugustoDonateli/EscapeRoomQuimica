"use client";

import { useActionState, useState } from "react";
import { enviarAvaliacao } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import type { PerguntaAvaliacao } from "@/lib/avaliacao";

const ESTRELAS = [1, 2, 3, 4, 5];

export function FormularioAvaliacao({
  codigo,
  perguntas,
}: {
  codigo: string;
  perguntas: PerguntaAvaliacao[];
}) {
  const [resultado, acao, enviando] = useActionState(enviarAvaliacao, null);
  const [notas, setNotas] = useState<Record<string, number>>({});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="codigo" value={codigo} />

      {perguntas.map((p) => (
        <Cartao key={p.id}>
          <Rotulo>{p.texto}</Rotulo>

          {p.tipo === "estrelas" ? (
            <>
              <input type="hidden" name={`r:${p.id}`} value={notas[p.id] ?? ""} />
              <div
                role="radiogroup"
                aria-label={p.texto}
                className="mt-3 flex gap-1.5"
              >
                {ESTRELAS.map((n) => {
                  const marcada = (notas[p.id] ?? 0) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={(notas[p.id] ?? 0) === n}
                      aria-label={`${n} de 5`}
                      onClick={() => setNotas((a) => ({ ...a, [p.id]: n }))}
                      className={`min-h-[56px] flex-1 rounded-base border text-titulo ${
                        marcada
                          ? "border-acento bg-acento-suave text-acento"
                          : "border-linha-2 bg-superficie text-tinta-3"
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <textarea
              name={`r:${p.id}`}
              rows={3}
              maxLength={600}
              className="mt-3 w-full rounded-base border border-linha-2 bg-superficie px-3.5 py-2.5 text-base text-tinta"
            />
          )}
        </Cartao>
      ))}

      {resultado?.erro ? (
        <p role="alert" className="rounded-base bg-perigo-suave px-3 py-2 text-mini text-perigo">
          {resultado.erro}
        </p>
      ) : null}

      <Botao type="submit" tamanho="grande" larguraTotal disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar avaliação"}
      </Botao>

      <p className="text-center text-mini text-tinta-2">
        A avaliação é anônima e não muda a pontuação de vocês.
      </p>
    </form>
  );
}
