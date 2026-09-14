import { Proveta } from "@/components/ui/Proveta";

/**
 * A tela que o jogador vê ao ler o QR da estação. Só desenho — quem valida a
 * resposta é o servidor (etapa 5).
 *
 * Vive dentro do contexto `sala` porque o jogador está no escuro, com pressa:
 * enunciado, resposta e cronômetro, e nenhuma navegação para ele se perder.
 *
 * Já existe agora porque o painel usa esta mesma tela como prévia — assim quem
 * escreve a pergunta vê exatamente o que o jogador vai ver, e não uma
 * aproximação que engana.
 */
export function TelaPergunta({
  estacao,
  enunciado,
  tipo,
  alternativas,
  tempoLimiteS,
  restanteS,
  interativo = false,
}: {
  estacao: string;
  enunciado: string;
  tipo: "texto" | "multipla";
  alternativas: string[];
  tempoLimiteS: number;
  restanteS?: number;
  interativo?: boolean;
}) {
  const restante = restanteS ?? Math.round(tempoLimiteS * 0.68);

  return (
    <div className="sala rounded-base bg-fundo p-5 text-tinta">
      <div className="flex items-center justify-between gap-3">
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          {estacao}
        </span>
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          Escape Químico
        </span>
      </div>

      <Proveta
        className="mt-3"
        restanteSegundos={restante}
        totalSegundos={tempoLimiteS}
        tamanho="mini"
        limiteAlertaSegundos={Math.max(10, Math.round(tempoLimiteS / 3))}
      />

      <p className="mt-5 text-medio leading-snug font-semibold text-balance">
        {enunciado || "O enunciado da pergunta aparece aqui."}
      </p>

      {tipo === "multipla" ? (
        <ul className="mt-5 flex flex-col gap-2">
          {(alternativas.length > 0 ? alternativas : ["Primeira alternativa", "Segunda alternativa"]).map(
            (a, i) => (
              <li key={`${i}-${a}`}>
                <span className="flex min-h-[48px] items-center gap-3 rounded-base border border-linha-2 bg-superficie px-3.5 text-base">
                  <span className="font-dados text-mini text-tinta-3">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="min-w-0">{a}</span>
                </span>
              </li>
            ),
          )}
        </ul>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
            Sua resposta
          </span>
          <span className="flex min-h-[48px] items-center rounded-base border border-linha-2 bg-superficie px-3.5 text-base text-tinta-3">
            {interativo ? "" : "digite aqui"}
          </span>
        </div>
      )}

      <span className="mt-5 flex min-h-[48px] items-center justify-center rounded-base bg-acento px-5 text-base font-semibold text-fundo">
        Responder
      </span>
    </div>
  );
}
