import type { ButtonHTMLAttributes } from "react";

/**
 * Três tamanhos porque há três contextos de uso:
 *   pequeno — ações secundárias em telas de leitura
 *   medio   — o padrão, com 48px de altura (alvo de toque mínimo)
 *   grande  — 64px, o botão do instrutor: ele está de pé, andando, olhando os
 *             jogadores e não a tela, e acerta com um polegar só.
 */

type Variante = "primario" | "secundario" | "fantasma" | "perigo" | "alerta";
type Tamanho = "pequeno" | "medio" | "grande";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-acento text-fundo border-acento",
  secundario: "bg-superficie text-tinta border-linha-2 hover:border-acento",
  fantasma: "bg-transparent text-tinta-2 border-transparent hover:text-tinta",
  perigo: "bg-perigo-suave text-perigo border-perigo",
  alerta: "bg-alerta-suave text-alerta border-alerta",
};

const TAMANHOS: Record<Tamanho, string> = {
  pequeno: "min-h-[36px] px-3 text-mini",
  medio: "min-h-[48px] px-5 text-base",
  grande: "min-h-[64px] px-6 text-medio font-semibold",
};

export function Botao({
  variante = "primario",
  tamanho = "medio",
  larguraTotal = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamanho?: Tamanho;
  larguraTotal?: boolean;
}) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-base border font-corpo",
        "transition-colors disabled:opacity-45 disabled:pointer-events-none",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        larguraTotal ? "w-full" : "",
        className,
      ].join(" ")}
    />
  );
}
