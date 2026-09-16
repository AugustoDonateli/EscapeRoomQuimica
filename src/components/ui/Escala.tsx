/**
 * A escala graduada da bureta: quanto ainda tem de uma coisa contável.
 *
 * Existe porque número sozinho não se lê de relance — "restam 3" e "restam 13"
 * têm a mesma cara no canto da tela, e a barra graduada mostra a diferença
 * antes de a pessoa terminar de ler.
 *
 * Puro desenho: o número vai escrito ao lado, em texto de verdade, e esta
 * barra sai da árvore de acessibilidade.
 */
export function Escala({
  cheio,
  total,
  className = "",
}: {
  cheio: number;
  total: number;
  className?: string;
}) {
  const fracao = total > 0 ? Math.min(1, Math.max(0, cheio / total)) : 0;
  // Uma marca por unidade enquanto isso ainda se distingue; depois, de dez.
  const divisoes = total > 1 && total <= 16 ? total : 10;

  return (
    <div
      aria-hidden="true"
      className={`relative h-2.5 overflow-hidden rounded-base border border-linha-2 bg-superficie ${className}`}
    >
      <div
        className="h-full bg-acento transition-[width] duration-500 ease-out"
        style={{ width: `${fracao * 100}%` }}
      />
      {Array.from({ length: divisoes - 1 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 bottom-0 w-px bg-fundo/70"
          style={{ left: `${((i + 1) / divisoes) * 100}%` }}
        />
      ))}
    </div>
  );
}
