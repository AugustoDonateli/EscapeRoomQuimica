"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Páginas que se atualizam sozinhas: o cartão da fila e o placar da TV. O jogador está no meio da feira e não
 * vai ficar recarregando — e o e-mail não serve para "é a sua vez", porque
 * ninguém abre e-mail andando pela feira. A página é o lugar da verdade.
 *
 * Para quando a aba não está visível: o celular fica no bolso a maior parte do
 * tempo e não faz sentido gastar bateria e dados pedindo o que ninguém está
 * olhando. Ao voltar para a tela, atualiza na hora.
 */
export function Atualizador({
  segundos = 8,
  className = "",
}: {
  segundos?: number;
  className?: string;
}) {
  const router = useRouter();
  const [desdeUltima, setDesdeUltima] = useState(0);

  useEffect(() => {
    const tique = setInterval(() => {
      if (document.hidden) return;
      setDesdeUltima((s) => {
        if (s + 1 >= segundos) {
          router.refresh();
          return 0;
        }
        return s + 1;
      });
    }, 1000);

    function aoVoltar() {
      if (!document.hidden) {
        router.refresh();
        setDesdeUltima(0);
      }
    }

    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(tique);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [router, segundos]);

  return (
    <p className={`text-center font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase ${className}`}>
      Atualiza sozinho
    </p>
  );
}
