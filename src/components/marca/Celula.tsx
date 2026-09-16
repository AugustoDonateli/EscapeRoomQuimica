/**
 * A célula da tabela periódica usada como índice de seção — o mesmo desenho da
 * marca, repetido como estrutura: número de ordem em cima, sigla embaixo.
 *
 * É o recurso que dá ao site o ar de material de química sem cair em clip-art
 * de béquer. A tabela periódica já é um dos melhores objetos de design de
 * informação que existem; emprestar a forma dela é mais honesto do que
 * desenhar uma molécula genérica de enfeite.
 *
 * Decorativa por natureza: sai da árvore de acessibilidade, porque quem usa
 * leitor de tela já recebe o título da seção logo ao lado.
 */
export function Celula({
  numero,
  sigla,
  className = "",
}: {
  numero: string | number;
  sigla: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-base border border-linha-2 bg-superficie px-2 py-1 text-left leading-none font-dados ${className}`}
    >
      <span className="block text-[9px] text-tinta-3">{numero}</span>
      <span className="block text-[15px] font-semibold text-tinta">{sigla}</span>
    </span>
  );
}
