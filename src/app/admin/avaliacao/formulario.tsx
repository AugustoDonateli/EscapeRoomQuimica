"use client";

import { useActionState, useState } from "react";
import { salvarPerguntasAvaliacao } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import type { PerguntaAvaliacao } from "@/lib/avaliacao";

function idDoTexto(texto: string, usados: string[]): string {
  const base =
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "pergunta";

  let id = base;
  let n = 2;
  while (usados.includes(id)) id = `${base}-${n++}`;
  return id;
}

export function EditorPerguntasAvaliacao({ iniciais }: { iniciais: PerguntaAvaliacao[] }) {
  const [resultado, acao, enviando] = useActionState(salvarPerguntasAvaliacao, null);
  const [perguntas, setPerguntas] = useState<PerguntaAvaliacao[]>(iniciais);

  function mexer(indice: number, mudanca: Partial<PerguntaAvaliacao>) {
    setPerguntas((atual) => atual.map((p, i) => (i === indice ? { ...p, ...mudanca } : p)));
  }

  function mover(indice: number, direcao: -1 | 1) {
    setPerguntas((atual) => {
      const destino = indice + direcao;
      if (destino < 0 || destino >= atual.length) return atual;
      const copia = [...atual];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="perguntas" value={JSON.stringify(perguntas)} />

      {perguntas.map((p, i) => (
        <Cartao key={p.id}>
          <div className="flex items-baseline justify-between gap-2">
            <Rotulo>
              Pergunta {i + 1} · {p.id}
            </Rotulo>
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                aria-label="Subir"
                className="min-h-[36px] min-w-[36px] rounded-base border border-linha-2 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === perguntas.length - 1}
                aria-label="Descer"
                className="min-h-[36px] min-w-[36px] rounded-base border border-linha-2 disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setPerguntas((a) => a.filter((_, n) => n !== i))}
                className="min-h-[36px] px-2 text-mini text-perigo underline"
              >
                Tirar
              </button>
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <Campo
              id={`texto-${p.id}`}
              etiqueta="Texto da pergunta"
              value={p.texto}
              onChange={(e) => mexer(i, { texto: e.target.value })}
            />
            <div>
              <Rotulo className="mb-2">Como responde</Rotulo>
              <div role="radiogroup" aria-label="Tipo de resposta" className="flex gap-2">
                {(["estrelas", "texto"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={p.tipo === t}
                    onClick={() => mexer(i, { tipo: t })}
                    className={`min-h-[48px] rounded-base border px-4 text-base font-semibold ${
                      p.tipo === t
                        ? "border-acento bg-acento text-fundo"
                        : "border-linha-2 bg-superficie text-tinta"
                    }`}
                  >
                    {t === "estrelas" ? "Nota de 1 a 5" : "Texto livre"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Cartao>
      ))}

      {perguntas.length < 12 ? (
        <Botao
          type="button"
          variante="secundario"
          onClick={() =>
            setPerguntas((a) => [
              ...a,
              {
                id: idDoTexto("nova pergunta", a.map((p) => p.id)),
                texto: "",
                tipo: "estrelas",
              },
            ])
          }
        >
          + Mais uma pergunta
        </Botao>
      ) : null}

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
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar perguntas"}
        </Botao>
      </div>
    </form>
  );
}
