/**
 * Cartão é para objeto de verdade: uma equipe, uma estação, uma pergunta.
 * Não é para embrulhar qualquer bloco de texto.
 *
 * O tom existe porque borda de 1px em TUDO achata a hierarquia e faz a tela
 * parecer uma lista de caixas geradas — foi exatamente essa a crítica que
 * reescreveu este arquivo. Agora a profundidade é escassa de propósito:
 *
 *   plano    padrão. Fio de cabelo, nada de sombra. É o item de lista, o que
 *            aparece vinte vezes numa tela.
 *   papel    folha solta sobre a mesa: sombra dura deslocada, sem desfoque.
 *            No máximo UM por tela — é o objeto principal daquela tela.
 *   fechado  fita de risco na borda de cima. Só para o que está bloqueado ou
 *            interrompido; não é decoração.
 */

type Tom = "plano" | "papel" | "fechado";

const TONS: Record<Tom, string> = {
  plano: "border border-linha",
  papel: "border border-linha-2 shadow-dura",
  fechado: "border border-alerta/40",
};

export function Cartao({
  children,
  tom = "plano",
  destaque = false,
  className = "",
}: {
  children: React.ReactNode;
  tom?: Tom;
  destaque?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative rounded-base bg-superficie",
        tom === "fechado" ? "overflow-hidden" : "",
        destaque ? "border-2 border-acento shadow-dura-forte" : TONS[tom],
        className,
      ].join(" ")}
    >
      {tom === "fechado" ? (
        <span className="fita-risco absolute inset-x-0 top-0 h-2" aria-hidden="true" />
      ) : null}
      <div className={tom === "fechado" ? "p-4 pt-5" : "p-4"}>{children}</div>
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
