/**
 * A proveta é o cronômetro do Escape Químico — o objeto mais visto da
 * plataforma inteira. Um número sozinho conta o tempo; a proveta mostra
 * QUANTO ainda tem, e isso se lê de longe, sem precisar interpretar dígito.
 *
 * Três estados, porque o tempo muda de significado no fim:
 *   normal    — ainda dá
 *   alerta    — últimos cinco minutos (configurável)
 *   esgotado  — acabou
 *
 * Este componente é só desenho: recebe os segundos e desenha. Quem faz o tempo
 * andar é o servidor (etapa 5) — se o cronômetro viver no celular, recarregar a
 * página zera a sessão.
 */

type Tamanho = "mini" | "sessao" | "tv";

const MEDIDAS: Record<Tamanho, { tubo: string; texto: string; espaco: string }> = {
  mini: { tubo: "h-3", texto: "text-medio", espaco: "gap-2.5" },
  sessao: { tubo: "h-6", texto: "text-enorme", espaco: "gap-4" },
  tv: { tubo: "h-12", texto: "text-placar", espaco: "gap-7" },
};

export function formatarTempo(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function Proveta({
  restanteSegundos,
  totalSegundos,
  tamanho = "sessao",
  limiteAlertaSegundos = 300,
  className = "",
}: {
  restanteSegundos: number;
  totalSegundos: number;
  tamanho?: Tamanho;
  limiteAlertaSegundos?: number;
  className?: string;
}) {
  const m = MEDIDAS[tamanho];
  const restante = Math.max(0, restanteSegundos);
  const fracao = totalSegundos > 0 ? Math.min(1, restante / totalSegundos) : 0;

  const estado = restante <= 0 ? "esgotado" : restante <= limiteAlertaSegundos ? "alerta" : "normal";

  const corLiquido =
    estado === "esgotado" ? "bg-perigo" : estado === "alerta" ? "bg-alerta" : "bg-acento";
  const corTexto =
    estado === "esgotado" ? "text-perigo" : estado === "alerta" ? "text-alerta" : "text-tinta";
  const corTubo =
    estado === "esgotado" ? "border-perigo" : estado === "alerta" ? "border-alerta" : "border-tinta-2";

  return (
    <div
      className={`flex items-center ${m.espaco} ${className}`}
      role="timer"
      aria-label={
        estado === "esgotado" ? "Tempo esgotado" : `Faltam ${formatarTempo(restante)} de sessão`
      }
    >
      <div
        className={`relative flex-1 overflow-hidden rounded-full border-2 ${m.tubo} ${corTubo}`}
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-linear ${corLiquido}`}
          style={{ width: `${fracao * 100}%` }}
        />
        {/* Graduação da proveta: as marcas de um quarto, meio e três quartos. */}
        {[25, 50, 75].map((p) => (
          <span
            key={p}
            className="absolute top-0 bottom-0 w-px bg-fundo/50"
            style={{ left: `${p}%` }}
          />
        ))}
      </div>

      <span
        className={`tabular font-dados font-semibold ${m.texto} ${corTexto}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatarTempo(restante)}
      </span>
    </div>
  );
}
