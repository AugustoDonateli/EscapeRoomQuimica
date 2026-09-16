"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { responder } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Proveta } from "@/components/ui/Proveta";
import { Tentativas } from "@/components/ui/Tentativas";
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
  tentativasPorPergunta,
}: {
  slug: string;
  pergunta: Pergunta;
  feitas: number;
  total: number;
  tentativasPorPergunta: number;
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

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          pergunta {feitas + 1} de {total}
        </span>
        <Tentativas restantes={pergunta.tentativasRestantes} total={tentativasPorPergunta} />
      </div>

      {/* O enunciado é o maior texto da plataforma inteira, e é de propósito:
          seis pessoas leem este parágrafo ao mesmo tempo, no escuro, por cima
          do ombro de quem segura o celular. Estava em 17px. */}
      <h1 className="text-[clamp(1.3rem,5.8vw,1.75rem)] leading-[1.25] font-semibold text-balance">
        {pergunta.enunciado}
      </h1>

      <div>
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          tempo desta pergunta
        </span>
        <Proveta
          className="mt-1.5"
          restanteSegundos={restante}
          totalSegundos={pergunta.tempoLimiteS}
          tamanho="mini"
          limiteAlertaSegundos={Math.max(10, Math.round(pergunta.tempoLimiteS / 3))}
        />
      </div>

      {pergunta.tipo === "multipla" ? (
        <div role="radiogroup" aria-label="Alternativas" className="flex flex-col gap-2">
          {(pergunta.alternativas ?? []).map((a, i) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={escolha === a}
              onClick={() => setEscolha(a)}
              className={`flex min-h-[64px] items-center gap-3 rounded-base border px-3 text-left text-medio ${
                escolha === a
                  ? "border-acento bg-acento-suave text-tinta shadow-dura"
                  : "border-linha-2 bg-superficie text-tinta"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-base border font-dados text-mini ${
                  escolha === a ? "border-acento text-acento" : "border-linha-2 text-tinta-3"
                }`}
              >
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
            Resposta da equipe
          </label>
          <input
            id="resposta-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            className="min-h-[64px] rounded-base border border-linha-2 bg-superficie px-3.5 text-medio text-tinta"
          />
        </div>
      )}

      {resultado?.acertou ? (
        <p
          role="status"
          className="rounded-base bg-acento px-4 py-4 text-fundo shadow-dura-forte"
        >
          <span className="block titulo-editorial text-[2rem]">Acertaram.</span>
          <span className="mt-1 block text-mini opacity-90">Indo para a próxima…</span>
        </p>
      ) : resultado && resultado.acertou === false ? (
        <p role="alert" className="rounded-base bg-perigo-suave px-3 py-2.5 text-base text-perigo">
          Não é essa. Pensem de novo no que a estação está mostrando.
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
