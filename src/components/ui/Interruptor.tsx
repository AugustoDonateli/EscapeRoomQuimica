import type { InputHTMLAttributes } from "react";

/**
 * Caixa de marcar com alvo de toque inteiro: a área clicável é a linha toda,
 * não o quadradinho de 16px. Quem está configurando no celular agradece.
 */
export function Interruptor({
  id,
  etiqueta,
  ajuda,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  etiqueta: string;
  ajuda?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-base border border-linha bg-superficie px-3 py-2.5"
    >
      <input
        id={id}
        type="checkbox"
        {...props}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--cor-acento)]"
      />
      <span className="min-w-0">
        <span className="block text-mini font-semibold">{etiqueta}</span>
        {ajuda ? <span className="block text-mini text-tinta-2">{ajuda}</span> : null}
      </span>
    </label>
  );
}
