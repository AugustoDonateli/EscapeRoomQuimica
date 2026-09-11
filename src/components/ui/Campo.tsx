import type { InputHTMLAttributes } from "react";

/**
 * O cadastro acontece em pé, no meio da feira, num celular. Cada campo de
 * texto é atrito: no fluxo do jogador só o nome da equipe e um e-mail são
 * digitados — ano escolar vai no SeletorAno, que é toque e não teclado.
 */
export function Campo({
  id,
  etiqueta,
  ajuda,
  erro,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  etiqueta: string;
  ajuda?: string;
  erro?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
        {etiqueta}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined}
        className={[
          "min-h-[48px] rounded-base border bg-superficie px-3.5 text-base text-tinta",
          "placeholder:text-tinta-3",
          erro ? "border-perigo" : "border-linha-2",
        ].join(" ")}
      />
      {erro ? (
        <p id={`${id}-erro`} className="text-mini text-perigo">
          {erro}
        </p>
      ) : ajuda ? (
        <p id={`${id}-ajuda`} className="text-mini text-tinta-2">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}
