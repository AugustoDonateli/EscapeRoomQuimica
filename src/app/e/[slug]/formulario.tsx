"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { responder } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Proveta } from "@/components/ui/Proveta";
import type { Pergunta } from "@/lib/estacao";

/**
 * A pergunta, na sala escura, com o tempo correndo.
 *
 * O cronômetro por pergunta é pressão, não regra de segurança: quando zera, o
 * próprio celular manda uma resposta vazia, que conta como tentativa gasta.
 * Enrolar não ajuda ninguém — o cronômetro que vale de verdade é o da sessão,
 * esse sim guardado no servidor.
 */
export function FormularioResposta({
  slug,
  pergunta,
  feitas,
  total,
}: {
  slug: string;
  pergunta: Pergunta;
  feitas: number;
  total: number;
}) {
  const router = useRouter();
  const [resultado, acao, enviando] = useActionState(responder, null);

  const [restante, setRestante] = useState(pergunta.tempoLimiteS);
  const [escolha, setEscolha] = useState("");
  const [texto, setTexto] = useState("");
  const inicio = useRef(Date.now());
  const formulario = useRef<HTMLFormElement>(null);
  const jaEnviou = useRef(false);

  // Reinicia o cronômetro quando muda a pergunta.
  useEffect(() => {
    setRestante(pergunta.tempoLimiteS);
    setEscolha("");
    setTexto("");
    inicio.current = Date.now();
    jaEnviou.current = false;
  }, [pergunta.id, pergunta.tempoLimiteS]);

  useEffect(() => {
    const tique = setInterval(() => {
      setRestante((s) => {
        if (s <= 1) {
          if (!jaEnviou.current) {
            jaEnviou.current = true;
            formulario.current?.requestSubmit();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tique);
  }, [pergunta.id]);

  // Depois de acertar, busca a próxima pergunta da estação.
  useEffect(() => {
    if (resultado?.acertou) {
      const t = setTimeout(() => router.refresh(), 1200);
      return () => clearTimeout(t);
    }
  }, [resultado, router]);

  return (
    <form
      ref={formulario}
      action={acao}
      className="flex flex-col gap-5"
      onSubmit={() => {
        jaEnviou.current = true;
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="perguntaId" value={pergunta.id} />
      <input type="hidden" name="msGastos" value={Date.now() - inicio.current} />
      <input type="hidden" name="resposta" value={pergunta.tipo === "multipla" ? escolha : texto} />

      <div className="flex items-center justify-between gap-3">
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          pergunta {feitas + 1} de {total}
        </span>
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          {pergunta.tentativasRestantes === 1
            ? "última tentativa"
            : `${pergunta.tentativasRestantes} tentativas`}
        </span>
      </div>

      <Proveta
        restanteSegundos={restante}
        totalSegundos={pergunta.tempoLimiteS}
        tamanho="mini"
        limiteAlertaSegundos={Math.max(10, Math.round(pergunta.tempoLimiteS / 3))}
      />

      <p className="text-medio leading-snug font-semibold text-balance">{pergunta.enunciado}</p>

      {pergunta.tipo === "multipla" ? (
        <div role="radiogroup" aria-label="Alternativas" className="flex flex-col gap-2">
          {(pergunta.alternativas ?? []).map((a, i) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={escolha === a}
              onClick={() => setEscolha(a)}
              className={`flex min-h-[56px] items-center gap-3 rounded-base border px-3.5 text-left text-base ${
                escolha === a
                  ? "border-acento bg-acento-suave text-tinta"
                  : "border-linha-2 bg-superficie text-tinta"
              }`}
            >
              <span className="font-dados text-mini text-tinta-3">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0">{a}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="resposta-texto"
            className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase"
          >
            Sua resposta
          </label>
          <input
            id="resposta-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            className="min-h-[56px] rounded-base border border-linha-2 bg-superficie px-3.5 text-medio text-tinta"
          />
        </div>
      )}

      {resultado?.acertou ? (
        <p role="status" className="rounded-base bg-acento px-3 py-2.5 text-base font-semibold text-fundo">
          Acertaram! Indo para a próxima…
        </p>
      ) : resultado && resultado.acertou === false ? (
        <p role="alert" className="rounded-base bg-perigo-suave px-3 py-2.5 text-base text-perigo">
          Não é essa. Pensem de novo no que a bancada está mostrando.
        </p>
      ) : resultado?.erro ? (
        <p role="alert" className="rounded-base bg-alerta-suave px-3 py-2.5 text-base text-alerta">
          {resultado.erro}
        </p>
      ) : null}

      <Botao
        type="submit"
        tamanho="grande"
        larguraTotal
        disabled={enviando || Boolean(resultado?.acertou)}
      >
        {enviando ? "Conferindo…" : "Responder"}
      </Botao>
    </form>
  );
}
