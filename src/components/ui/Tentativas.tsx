/**
 * As tentativas que ainda restam nesta pergunta, em bolinhas que apagam.
 *
 * Era texto — "3 tentativas", depois "2 tentativas". Sob pressão, com seis
 * pessoas lendo o mesmo celular no escuro, ninguém lê número: conta forma. Três
 * bolinhas acesas viram duas e isso se vê sem ler.
 *
 * As bolinhas são decorativas; a contagem em texto vai junto, para leitor de
 * tela e para quem não distingue as cores.
 */
export function Tentativas({
  restantes,
  total,
  className = "",
}: {
  restantes: number;
  total: number;
  className?: string;
}) {
  const ultima = restantes <= 1;

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: Math.max(total, restantes) }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < restantes ? (ultima ? "bg-perigo" : "bg-acento") : "bg-linha-2"
            }`}
          />
        ))}
      </span>
      <span
        className={`font-dados text-micro tracking-[0.12em] uppercase ${
          ultima ? "text-perigo" : "text-tinta-3"
        }`}
      >
        {ultima ? "última tentativa" : `${restantes} tentativas`}
      </span>
    </span>
  );
}
