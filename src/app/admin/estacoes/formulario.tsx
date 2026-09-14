"use client";

import { useActionState, useState } from "react";
import { salvarEstacao } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Cartao } from "@/components/ui/Cartao";
import { Interruptor } from "@/components/ui/Interruptor";
import type { Estacao } from "@/lib/dados";

export function FormularioEstacao({
  estacao,
  proximaOrdem,
  onFechar,
}: {
  estacao?: Estacao;
  proximaOrdem: number;
  onFechar?: () => void;
}) {
  const [resultado, acao, enviando] = useActionState(salvarEstacao, null);
  const editando = Boolean(estacao);

  return (
    <Cartao destaque={editando}>
      <form action={acao} className="flex flex-col gap-4">
        {estacao ? <input type="hidden" name="id" value={estacao.id} /> : null}

        <p className="font-display text-medio font-bold">
          {editando ? `Editando ${estacao!.slug}` : "Nova estação"}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id={`slug-${estacao?.id ?? "nova"}`}
            name="slug"
            etiqueta="Código do QR"
            defaultValue={estacao?.slug ?? ""}
            placeholder="EST-06"
            ajuda="Vai impresso no cartaz. Só letras, números e hífen."
            required
          />
          <Campo
            id={`nome-${estacao?.id ?? "nova"}`}
            name="nome"
            etiqueta="Nome da estação"
            defaultValue={estacao?.nome ?? ""}
            placeholder="Titulação"
            required
          />
          <Campo
            id={`ordem-${estacao?.id ?? "nova"}`}
            name="ordem"
            etiqueta="Ordem"
            type="number"
            min={1}
            max={99}
            defaultValue={estacao?.ordem ?? proximaOrdem}
            required
          />
          <Campo
            id={`peso-${estacao?.id ?? "nova"}`}
            name="peso_dificuldade"
            etiqueta="Peso de dificuldade"
            type="number"
            step="0.25"
            min={0.25}
            max={10}
            defaultValue={estacao?.peso_dificuldade ?? 1}
            ajuda="Estação mais difícil vale mais ponto no progresso."
            required
          />
        </div>

        <Interruptor
          id={`tem-pergunta-${estacao?.id ?? "nova"}`}
          name="tem_pergunta"
          etiqueta="Esta estação tem pergunta de química"
          ajuda="Desligado, ela é só enigma físico e não recebe QR de pergunta."
          defaultChecked={estacao?.tem_pergunta ?? true}
        />

        {resultado ? (
          <p
            role="status"
            className={`rounded-base px-3 py-2 text-mini ${
              resultado.ok ? "bg-acento-suave text-acento" : "bg-perigo-suave text-perigo"
            }`}
          >
            {resultado.ok ? resultado.mensagem : resultado.erro}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : editando ? "Salvar alterações" : "Criar estação"}
          </Botao>
          {onFechar ? (
            <Botao type="button" variante="fantasma" onClick={onFechar}>
              Cancelar
            </Botao>
          ) : null}
        </div>
      </form>
    </Cartao>
  );
}

/** Abre e fecha o formulário de edição de uma estação já existente. */
export function EditorEstacao({ estacao }: { estacao: Estacao }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <Botao tamanho="pequeno" variante="secundario" onClick={() => setAberto(true)}>
        Editar
      </Botao>
    );
  }

  return (
    <div className="mt-3 w-full">
      <FormularioEstacao
        estacao={estacao}
        proximaOrdem={estacao.ordem}
        onFechar={() => setAberto(false)}
      />
    </div>
  );
}
