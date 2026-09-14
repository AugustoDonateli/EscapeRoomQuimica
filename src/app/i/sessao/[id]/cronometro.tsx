"use client";

import { useEffect, useState } from "react";
import { Proveta } from "@/components/ui/Proveta";

/**
 * O cronômetro desenhado.
 *
 * O servidor manda quanto falta; aqui só desce de um em um segundo para a tela
 * não ficar parada. Toda vez que a página é renderizada de novo, o número volta
 * a vir do servidor — então recarregar, trocar de aparelho ou ficar sem bateria
 * não mexe no tempo da equipe.
 *
 * Pausado, não desce: quem decide isso é o servidor, não este componente.
 */
export function Cronometro({
  restanteInicialS,
  totalS,
  pausado,
}: {
  restanteInicialS: number;
  totalS: number;
  pausado: boolean;
}) {
  const [restante, setRestante] = useState(restanteInicialS);

  // Ressincroniza sempre que o servidor manda um valor novo.
  useEffect(() => setRestante(restanteInicialS), [restanteInicialS]);

  useEffect(() => {
    if (pausado) return;
    const tique = setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tique);
  }, [pausado]);

  return <Proveta restanteSegundos={restante} totalSegundos={totalS} tamanho="sessao" />;
}
