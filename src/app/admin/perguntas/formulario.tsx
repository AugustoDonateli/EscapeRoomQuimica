"use client";

import { useActionState, useState } from "react";
import { salvarPergunta } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { TelaPergunta } from "@/components/jogo/TelaPergunta";
import { listarAlternativas } from "@/lib/validacao";
import type { Estacao, Pergunta } from "@/lib/dados";

/**
 * Formulário com prévia ao vivo: quem escreve a pergunta vê, do lado, a tela
 * exata que o jogador vai ver no escuro da sala. É o mesmo componente da tela
 * real, não um desenho parecido.
 */
export function FormularioPergunta({
  estacoes,
  pergunta,
  tempoPadraoS,
  proximaOrdem,
  onFechar,
}: {
  estacoes: Estacao[];
  pergunta?: Pergunta;
  tempoPadraoS: number;
  proximaOrdem: number;
  onFechar?: () => void;
}) {
  const [resultado, acao, enviando] = useActionState(salvarPergunta, null);
  const editando = Boolean(pergunta);
  const sufixo = pergunta?.id ?? "nova";

  const [estacaoId, setEstacaoId] = useState(pergunta?.station_id ?? estacoes[0]?.id ?? "");
  const [enunciado, setEnunciado] = useState(pergunta?.enunciado ?? "");
  const [tipo, setTipo] = useState<"texto" | "multipla">(pergunta?.tipo ?? "texto");
  const [alternativas, setAlternativas] = useState((pergunta?.alternativas ?? []).join("\n"));
  const [tempo, setTempo] = useState(String(pergunta?.tempo_limite_s ?? ""));

  const estacao = estacoes.find((e) => e.id === estacaoId);
  const tempoEfetivo = Number(tempo) || tempoPadraoS;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
      <Cartao destaque={editando}>
        <form action={acao} className="flex flex-col gap-4">
          {pergunta ? <input type="hidden" name="id" value={pergunta.id} /> : null}

          <p className="font-display text-medio font-bold">
            {editando ? "Editando pergunta" : "Nova pergunta"}
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`station-${sufixo}`}
              className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase"
            >
              Estação
            </label>
            <select
              id={`station-${sufixo}`}
              name="station_id"
              value={estacaoId}
              onChange={(e) => setEstacaoId(e.target.value)}
              required
              className="min-h-[48px] rounded-base border border-linha-2 bg-superficie px-3 text-base text-tinta"
            >
              {estacoes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.slug} · {e.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`enunciado-${sufixo}`}
              className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase"
            >
              Enunciado
            </label>
            <textarea
              id={`enunciado-${sufixo}`}
              name="enunciado"
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              rows={4}
              required
              placeholder="A balança mostra 11,7 g deste sal de cozinha. Quantos mols vocês têm nas mãos?"
              className="rounded-base border border-linha-2 bg-superficie px-3.5 py-2.5 text-base text-tinta placeholder:text-tinta-3"
            />
            <p className="text-mini text-tinta-2">
              Inclua um dado que só exista <strong>dentro da sala</strong> — uma massa na balança,
              uma cor observada, um volume medido. Pergunta que funciona fora da sala é pergunta
              que o jogador pesquisa no celular em quatro segundos.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
              Tipo de resposta
            </span>
            <div role="radiogroup" aria-label="Tipo de resposta" className="flex flex-wrap gap-2">
              {(["texto", "multipla"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={tipo === t}
                  onClick={() => setTipo(t)}
                  className={`min-h-[48px] rounded-base border px-4 text-base font-semibold ${
                    tipo === t
                      ? "border-acento bg-acento text-fundo"
                      : "border-linha-2 bg-superficie text-tinta hover:border-acento"
                  }`}
                >
                  {t === "texto" ? "Digitada" : "Múltipla escolha"}
                </button>
              ))}
            </div>
            <input type="hidden" name="tipo" value={tipo} />
          </div>

          {tipo === "multipla" ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`alternativas-${sufixo}`}
                className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase"
              >
                Alternativas
              </label>
              <textarea
                id={`alternativas-${sufixo}`}
                name="alternativas"
                value={alternativas}
                onChange={(e) => setAlternativas(e.target.value)}
                rows={4}
                placeholder={"Ficou ácido\nFicou básico\nContinua neutro"}
                className="rounded-base border border-linha-2 bg-superficie px-3.5 py-2.5 text-base text-tinta placeholder:text-tinta-3"
              />
              <p className="text-mini text-tinta-2">Uma por linha. Mínimo de duas.</p>
            </div>
          ) : (
            <input type="hidden" name="alternativas" value="" />
          )}

          <Campo
            id={`resposta-${sufixo}`}
            name="resposta"
            etiqueta="Resposta correta"
            defaultValue={pergunta?.resposta ?? ""}
            ajuda={
              tipo === "multipla"
                ? "Escreva igual a uma das alternativas, letra por letra."
                : "A comparação ignora maiúscula e espaço sobrando."
            }
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id={`tempo-${sufixo}`}
              name="tempo_limite_s"
              etiqueta="Tempo limite (s)"
              type="number"
              min={15}
              max={600}
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              placeholder={String(tempoPadraoS)}
              ajuda={`Em branco usa o padrão do evento: ${tempoPadraoS}s.`}
            />
            <Campo
              id={`ordem-${sufixo}`}
              name="ordem"
              etiqueta="Ordem na estação"
              type="number"
              min={1}
              max={99}
              defaultValue={pergunta?.ordem ?? proximaOrdem}
              required
            />
          </div>

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
              {enviando ? "Salvando…" : editando ? "Salvar alterações" : "Criar pergunta"}
            </Botao>
            {onFechar ? (
              <Botao type="button" variante="fantasma" onClick={onFechar}>
                Cancelar
              </Botao>
            ) : null}
          </div>
        </form>
      </Cartao>

      <div>
        <Rotulo className="mb-2">Como o jogador vai ver</Rotulo>
        <TelaPergunta
          estacao={estacao ? `${estacao.slug} · ${estacao.nome}` : "Estação"}
          enunciado={enunciado}
          tipo={tipo}
          alternativas={listarAlternativas(alternativas)}
          tempoLimiteS={tempoEfetivo}
        />
        <p className="mt-2 text-mini text-tinta-2">
          É a mesma tela da sala, no escuro, com o cronômetro andando.
        </p>
      </div>
    </div>
  );
}

/** Abre e fecha o formulário de edição de uma pergunta já existente. */
export function EditorPergunta({
  pergunta,
  estacoes,
  tempoPadraoS,
}: {
  pergunta: Pergunta;
  estacoes: Estacao[];
  tempoPadraoS: number;
}) {
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
      <FormularioPergunta
        estacoes={estacoes}
        pergunta={pergunta}
        tempoPadraoS={tempoPadraoS}
        proximaOrdem={pergunta.ordem}
        onFechar={() => setAberto(false)}
      />
    </div>
  );
}
