"use client";

import { useState } from "react";

/**
 * Ano escolar por botão, nunca por lista suspensa. Lista suspensa em celular
 * abre um seletor do sistema, rola, erra e custa três toques; aqui custa um.
 *
 * Os rótulos vêm de fora porque quais são os anos participantes é decisão da
 * escola, não nossa (ver seção 4 da ata de decisões).
 */

export function SeletorAno({
  anos = [1, 2, 3, 4],
  rotulos,
  valor,
  onChange,
  nome = "ano",
}: {
  anos?: number[];
  rotulos?: Record<number, string>;
  valor?: number | null;
  onChange?: (ano: number) => void;
  nome?: string;
}) {
  const [interno, setInterno] = useState<number | null>(valor ?? null);
  const atual = valor !== undefined ? valor : interno;

  function escolher(ano: number) {
    setInterno(ano);
    onChange?.(ano);
  }

  return (
    <div role="radiogroup" aria-label="Ano escolar" className="flex flex-wrap gap-2">
      {anos.map((ano) => {
        const marcado = atual === ano;
        return (
          <button
            key={ano}
            type="button"
            role="radio"
            aria-checked={marcado}
            name={nome}
            onClick={() => escolher(ano)}
            className={[
              "min-h-[48px] min-w-[64px] rounded-base border px-4 text-base font-semibold transition-colors",
              marcado
                ? "border-acento bg-acento text-fundo"
                : "border-linha-2 bg-superficie text-tinta hover:border-acento",
            ].join(" ")}
          >
            {rotulos?.[ano] ?? `${ano}º`}
          </button>
        );
      })}
    </div>
  );
}
