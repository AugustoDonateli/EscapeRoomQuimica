/**
 * A marca do Escape Químico é uma casinha da tabela periódica: o número
 * pequeno em cima, o símbolo grande embaixo.
 *
 * O número não finge ser um elemento que já existe — é o ano do evento. Uma
 * célula de tabela periódica com "2026 / Eq" lê como logo desenhado, não como
 * química inventada.
 *
 * Três tamanhos porque as exigências são diferentes: "cartaz" é impresso em A3
 * no totem e visto de longe; "tela" fica no canto da interface; "icone" tem que
 * sobreviver a 32 pixels.
 */

type Tamanho = "icone" | "tela" | "cartaz";

const MEDIDAS: Record<Tamanho, { caixa: string; numero: string; simbolo: string; borda: string }> = {
  icone: { caixa: "px-1.5 py-1", numero: "text-[7px]", simbolo: "text-[13px]", borda: "border-[1.5px]" },
  tela: { caixa: "px-2 py-1.5", numero: "text-[9px]", simbolo: "text-[19px]", borda: "border-2" },
  cartaz: { caixa: "px-5 py-4", numero: "text-[22px]", simbolo: "text-[64px]", borda: "border-[4px]" },
};

export function Marca({
  tamanho = "tela",
  simbolo = "Eq",
  numero = "2026",
  comNome = false,
  className = "",
}: {
  tamanho?: Tamanho;
  simbolo?: string;
  numero?: string;
  comNome?: boolean;
  className?: string;
}) {
  const m = MEDIDAS[tamanho];

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`inline-block rounded-base border-acento text-left leading-none font-dados ${m.caixa} ${m.borda}`}
      >
        <span className={`block text-tinta-2 ${m.numero}`}>{numero}</span>
        <span className={`block font-semibold text-tinta ${m.simbolo}`}>{simbolo}</span>
      </span>
      {comNome ? (
        <span
          className={`font-display font-extrabold tracking-tight ${
            tamanho === "cartaz" ? "text-[40px]" : tamanho === "tela" ? "text-titulo" : "text-mini"
          }`}
        >
          Escape Químico
        </span>
      ) : null}
    </span>
  );
}
