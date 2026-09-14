"use client";

import { useActionState, useState } from "react";
import { salvarRubrica } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { CRITERIOS, type Criterio } from "@/lib/rubrica";

type JogadorParaAvaliar = {
  id: string;
  nome: string;
  sugestao: Record<Criterio, number>;
};

/**
 * A rubrica chega preenchida com a sugestão dos toques. O instrutor só ajusta
 * o que discordar — depois de vinte minutos de sala, ninguém lembra de nada, e
 * formulário em branco no fim é formulário inventado.
 */
export function FormularioRubrica({
  sessaoId,
  jogadores,
}: {
  sessaoId: string;
  jogadores: JogadorParaAvaliar[];
}) {
  const [resultado, acao, enviando] = useActionState(salvarRubrica, null);

  const [notas, setNotas] = useState<Record<string, Record<Criterio, number>>>(() =>
    Object.fromEntries(jogadores.map((j) => [j.id, { ...j.sugestao }])),
  );

  function mudar(jogadorId: string, criterio: Criterio, nota: number) {
    setNotas((atual) => ({ ...atual, [jogadorId]: { ...atual[jogadorId], [criterio]: nota } }));
  }

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="sessaoId" value={sessaoId} />

      {jogadores.map((j) => (
        <Cartao key={j.id}>
          <p className="font-display text-medio font-bold">{j.nome}</p>

          <div className="mt-3 flex flex-col gap-4">
            {CRITERIOS.map((c) => {
              const atual = notas[j.id]?.[c.criterio] ?? 3;
              const sugerida = j.sugestao[c.criterio];
              const mexido = atual !== sugerida;

              return (
                <div key={c.criterio}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Rotulo>{c.rotulo}</Rotulo>
                    {mexido ? (
                      <span className="font-dados text-micro text-alerta">
                        ajustado de {sugerida}
                      </span>
                    ) : (
                      <span className="font-dados text-micro text-tinta-3">
                        sugerido pelos toques
                      </span>
                    )}
                  </div>

                  <input type="hidden" name={`nota:${j.id}:${c.criterio}`} value={atual} />

                  <div role="radiogroup" aria-label={`${c.rotulo} de ${j.nome}`} className="mt-2 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={atual === n}
                        onClick={() => mudar(j.id, c.criterio, n)}
                        className={`min-h-[48px] flex-1 rounded-base border text-medio font-semibold ${
                          atual === n
                            ? "border-acento bg-acento text-fundo"
                            : "border-linha-2 bg-superficie text-tinta"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <p className="mt-1.5 text-mini text-tinta-2">{c.descritores[atual - 1]}</p>
                </div>
              );
            })}
          </div>
        </Cartao>
      ))}

      {resultado?.erro ? (
        <p role="alert" className="rounded-base bg-perigo-suave px-3 py-2 text-mini text-perigo">
          {resultado.erro}
        </p>
      ) : null}

      <Botao type="submit" tamanho="grande" larguraTotal disabled={enviando}>
        {enviando ? "Gravando…" : "Gravar avaliação"}
      </Botao>
    </form>
  );
}
