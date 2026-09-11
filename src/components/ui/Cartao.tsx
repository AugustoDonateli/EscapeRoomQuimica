/**
 * Cartão é para objeto de verdade: uma equipe, uma estação, uma pergunta.
 * Não é para embrulhar qualquer bloco de texto — borda em tudo achata a
 * hierarquia e faz a tela parecer uma lista de caixas.
 */
export function Cartao({
  children,
  destaque = false,
  className = "",
}: {
  children: React.ReactNode;
  destaque?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-base border bg-superficie p-4",
        destaque ? "border-acento" : "border-linha",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Rótulo em maiúscula e mono. Diz o que o número ao lado significa. */
export function Rotulo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`block font-dados text-micro tracking-[0.14em] text-tinta-3 uppercase ${className}`}
    >
      {children}
    </span>
  );
}
