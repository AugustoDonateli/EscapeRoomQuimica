/**
 * Estado tem que ser legível sem ler: a cor e a forma dizem antes do texto.
 * Os nomes são os mesmos status que existem no banco, para não haver tradução
 * solta espalhada pelo código.
 */

export type EstadoPilula =
  | "aguardando"
  | "chamada"
  | "em_jogo"
  | "concluida"
  | "no_show"
  | "cancelada"
  | "pausada";

const ESTADOS: Record<EstadoPilula, { texto: string; classe: string }> = {
  aguardando: { texto: "Aguardando chamada", classe: "bg-superficie-2 text-tinta-2" },
  chamada: { texto: "Chamada agora", classe: "bg-acento-suave text-acento" },
  em_jogo: { texto: "Em jogo", classe: "bg-acento-2-suave text-acento-2" },
  concluida: { texto: "Concluída", classe: "bg-superficie-2 text-tinta-2" },
  no_show: { texto: "Não compareceu", classe: "bg-perigo-suave text-perigo" },
  cancelada: { texto: "Cancelada", classe: "bg-superficie-2 text-tinta-3" },
  pausada: { texto: "Pausada", classe: "bg-alerta-suave text-alerta" },
};

export function Pilula({ estado, className = "" }: { estado: EstadoPilula; className?: string }) {
  const e = ESTADOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-mini font-semibold ${e.classe} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {e.texto}
    </span>
  );
}
