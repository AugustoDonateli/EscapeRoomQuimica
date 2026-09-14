"use client";

import { useEffect, useRef } from "react";
import { registrarSaidaDeTela } from "./acoes";

/**
 * Registra saída de tela, quando a organização liga essa opção.
 *
 * Só monta quando a chave está ligada, e a própria tela diz ao jogador que
 * isso está sendo registrado — o aviso é o que dissuade, e esconder seria
 * desonesto.
 *
 * Tem um intervalo mínimo entre registros para uma notificação que aparece e
 * desaparece não virar dez linhas no banco.
 */
export function Vigilante({ slug }: { slug: string }) {
  const ultimo = useRef(0);

  useEffect(() => {
    function aoSair() {
      if (!document.hidden) return;

      const agora = Date.now();
      if (agora - ultimo.current < 5000) return;
      ultimo.current = agora;

      void registrarSaidaDeTela(slug).catch(() => undefined);
    }

    document.addEventListener("visibilitychange", aoSair);
    return () => document.removeEventListener("visibilitychange", aoSair);
  }, [slug]);

  return (
    <p className="mt-4 text-center font-dados text-micro tracking-[0.1em] text-tinta-3 uppercase">
      Sair desta tela fica registrado
    </p>
  );
}
