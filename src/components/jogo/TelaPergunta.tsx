import { Proveta } from "@/components/ui/Proveta";
import { Tentativas } from "@/components/ui/Tentativas";

/**
 * A tela que o jogador vê ao ler o QR da estação. Só desenho — quem valida a
 * resposta é o servidor (etapa 5).
 *
 * Vive dentro do contexto `sala` porque o jogador está no escuro, com pressa:
 * enunciado, resposta e cronômetro, e nenhuma navegação para ele se perder.
 *
 * O painel usa esta mesma tela como prévia: quem escreve a pergunta vê o que o
 * jogador vai ver, e não uma aproximação que engana. Por isso ela precisa
 * acompanhar src/app/e/[slug]/formulario.tsx — se as duas divergirem, a prévia
 * vira mentira, que é pior que não ter prévia.
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
      {/* Sem a marca do projeto: aqui dentro o jogador tem noventa segundos e
          nenhum pixel sobrando, e ele já sabe onde está. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="truncate font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          {estacao}
        </span>
        <Tentativas restantes={3} total={3} />
      </div>

      <p className="mt-5 text-[clamp(1.3rem,5.8vw,1.75rem)] leading-[1.25] font-semibold text-balance">
        {enunciado || "O enunciado da pergunta aparece aqui."}
      </p>

      <div className="mt-5">
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          tempo desta pergunta
        </span>
        <Proveta
          className="mt-1.5"
          restanteSegundos={restante}
          totalSegundos={tempoLimiteS}
          tamanho="mini"
          limiteAlertaSegundos={Math.max(10, Math.round(tempoLimiteS / 3))}
        />
      </div>

      {tipo === "multipla" ? (
        <ul className="mt-5 flex flex-col gap-2">
          {(alternativas.length > 0 ? alternativas : ["Primeira alternativa", "Segunda alternativa"]).map(
            (a, i) => (
              <li key={`${i}-${a}`}>
                <span className="flex min-h-[64px] items-center gap-3 rounded-base border border-linha-2 bg-superficie px-3 text-medio">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border border-linha-2 font-dados text-mini text-tinta-3">
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
            Resposta da equipe
          </span>
          <span className="flex min-h-[64px] items-center rounded-base border border-linha-2 bg-superficie px-3.5 text-medio text-tinta-3">
            {interativo ? "" : "digite aqui"}
          </span>
        </div>
      )}

      <span className="mt-5 flex min-h-[64px] items-center justify-center rounded-base bg-acento px-5 text-medio font-semibold text-fundo shadow-dura-forte">
        Responder
      </span>
    </div>
  );
}
