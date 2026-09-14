"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registrarObservacoes } from "@/app/i/acoes";
import { AvisoRede } from "@/components/ui/AvisoRede";
import { OBSERVACOES, type TipoObservacao } from "@/lib/rubrica";

/**
 * O painel de toques — a parte mais difícil da etapa, e a que mais aparece no
 * dia da feira.
 *
 * O instrutor está de pé, andando pela sala, olhando os jogadores e não a tela.
 * Então: alvo de 56px, um toque por observação, nada de digitar, e resposta
 * visual imediata mesmo antes de o servidor confirmar.
 *
 * E o Wi-Fi da sala vai cair em algum momento. Cada toque é guardado no próprio
 * celular com um id gerado ali; quando a rede volta, sobe. O banco tem índice
 * único nesse id, então subir de novo não conta em dobro — nota de equipe não
 * pode crescer por causa de rede ruim, nem encolher porque a rede piscou.
 */

type Toque = { clienteId: string; jogadorId: string; tipo: TipoObservacao };

type Jogador = {
  id: string;
  nome: string;
  contagem: Partial<Record<TipoObservacao, number>>;
};

function chave(sessaoId: string) {
  return `toques-pendentes:${sessaoId}`;
}

function lerGuardados(sessaoId: string): Toque[] {
  try {
    const bruto = localStorage.getItem(chave(sessaoId));
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? (lista as Toque[]) : [];
  } catch {
    return [];
  }
}

export function PainelDeToques({
  sessaoId,
  jogadores,
  encerrada,
}: {
  sessaoId: string;
  jogadores: Jogador[];
  encerrada: boolean;
}) {
  const [pendentes, setPendentes] = useState<Toque[]>([]);
  const [confirmados, setConfirmados] = useState<Toque[]>([]);
  const [online, setOnline] = useState(true);

  /**
   * Espelho síncrono da fila. O estado do React e a gravação no localStorage só
   * acontecem depois da renderização, então subir logo após o toque leria a
   * lista velha e não mandaria nada — o toque só subiria no próximo tique de
   * três segundos. Com a referência, o envio sai no mesmo instante do toque.
   */
  const fila = useRef<Toque[]>([]);

  // Recupera o que ficou guardado de uma queda de rede anterior.
  useEffect(() => {
    const guardados = lerGuardados(sessaoId);
    fila.current = guardados;
    setPendentes(guardados);
    setOnline(navigator.onLine);

    const mudou = () => setOnline(navigator.onLine);
    window.addEventListener("online", mudou);
    window.addEventListener("offline", mudou);
    return () => {
      window.removeEventListener("online", mudou);
      window.removeEventListener("offline", mudou);
    };
  }, [sessaoId]);

  useEffect(() => {
    try {
      localStorage.setItem(chave(sessaoId), JSON.stringify(pendentes));
    } catch {
      /* navegador sem espaço: o toque ainda vai na próxima subida */
    }
  }, [pendentes, sessaoId]);

  const subir = useCallback(async () => {
    const lote = fila.current;
    if (lote.length === 0) return;

    try {
      const r = await registrarObservacoes(sessaoId, lote);
      if (!r.ok) return;

      const idsSubidos = new Set(lote.map((t) => t.clienteId));
      fila.current = fila.current.filter((t) => !idsSubidos.has(t.clienteId));
      setPendentes((atual) => atual.filter((t) => !idsSubidos.has(t.clienteId)));
      setConfirmados((atual) => [...atual, ...lote]);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [sessaoId]);

  // Tenta subir a cada três segundos e quando a rede volta.
  useEffect(() => {
    if (encerrada) return;
    const tique = setInterval(subir, 3000);
    window.addEventListener("online", subir);
    return () => {
      clearInterval(tique);
      window.removeEventListener("online", subir);
    };
  }, [subir, encerrada]);

  function tocar(jogadorId: string, tipo: TipoObservacao) {
    const clienteId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const toque = { clienteId, jogadorId, tipo };
    fila.current = [...fila.current, toque];
    setPendentes((atual) => [...atual, toque]);

    if (navigator.vibrate) navigator.vibrate(12);
    void subir();
  }

  /** O que a tela mostra: o que o servidor já tem, mais o que foi tocado aqui. */
  const contagens = useMemo(() => {
    const mapa = new Map<string, Partial<Record<TipoObservacao, number>>>();

    for (const j of jogadores) mapa.set(j.id, { ...j.contagem });
    for (const t of [...confirmados, ...pendentes]) {
      const atual = mapa.get(t.jogadorId);
      if (atual) atual[t.tipo] = (atual[t.tipo] ?? 0) + 1;
    }

    return mapa;
  }, [jogadores, confirmados, pendentes]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-dados text-micro tracking-[0.14em] text-tinta-3 uppercase">
          Toque no que você vê
        </span>
        <AvisoRede online={online} pendentes={pendentes.length} />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {jogadores.map((j) => {
          const c = contagens.get(j.id) ?? {};

          return (
            <div key={j.id} className="rounded-base border border-linha bg-superficie p-3">
              <p className="truncate font-display text-medio font-bold">{j.nome}</p>

              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {OBSERVACOES.map((o) => {
                  const quantos = c[o.tipo] ?? 0;
                  const marcado = quantos > 0;

                  return (
                    <button
                      key={o.tipo}
                      type="button"
                      onClick={() => tocar(j.id, o.tipo)}
                      disabled={encerrada}
                      aria-label={`${o.rotulo} — ${j.nome}`}
                      title={o.rotulo}
                      className={`flex min-h-[56px] flex-col items-center justify-center rounded-base border px-1 disabled:opacity-45 ${
                        marcado
                          ? o.bom
                            ? "border-acento bg-acento-suave text-acento"
                            : "border-perigo bg-perigo-suave text-perigo"
                          : "border-linha-2 bg-superficie text-tinta-2"
                      }`}
                    >
                      <span className="font-dados text-medio leading-none font-semibold">
                        {o.curto}
                      </span>
                      <span className="tabular mt-0.5 font-dados text-micro leading-none">
                        {quantos > 0 ? quantos : "·"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
        {OBSERVACOES.map((o) => (
          <div key={o.tipo} className="flex gap-2 text-micro">
            <dt className="font-dados font-semibold text-tinta-2">{o.curto}</dt>
            <dd className="text-tinta-3">{o.rotulo}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
