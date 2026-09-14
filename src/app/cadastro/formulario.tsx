"use client";

import { useActionState, useState } from "react";
import { cadastrar } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Interruptor } from "@/components/ui/Interruptor";
import { SeletorAno } from "@/components/ui/SeletorAno";

/**
 * Cadastro em três passos, num único envio no fim. Nada vai para o banco antes
 * de a pessoa confirmar — equipe pela metade no banco é sujeira que só aparece
 * na hora de chamar a fila.
 *
 * O teclado aparece duas vezes em todo o fluxo: nome da equipe e nome de cada
 * integrante. Ano escolar é toque. Quem já tentou digitar em pé, com barulho e
 * gente esperando atrás, sabe por quê.
 */

type Integrante = { nome: string; ano: number | null };

export function FormularioCadastro({
  equipeMin,
  equipeMax,
  anos,
  rotulosAnos,
}: {
  equipeMin: number;
  equipeMax: number;
  anos: number[];
  rotulosAnos: Record<string, string>;
}) {
  const [resultado, acao, enviando] = useActionState(cadastrar, null);

  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [integrantes, setIntegrantes] = useState<Integrante[]>(
    Array.from({ length: Math.min(equipeMin, equipeMax) }, () => ({ nome: "", ano: null })),
  );

  const prontos = integrantes.filter((i) => i.nome.trim().length >= 2 && i.ano !== null);
  const passo1Ok = nome.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const passo2Ok = prontos.length === integrantes.length && integrantes.length >= equipeMin;

  function mexer(indice: number, mudanca: Partial<Integrante>) {
    setIntegrantes((atual) =>
      atual.map((i, n) => (n === indice ? { ...i, ...mudanca } : i)),
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-6">
      <input type="hidden" name="nome" value={nome} />
      <input type="hidden" name="email_capitao" value={email} />
      <input
        type="hidden"
        name="integrantes"
        value={JSON.stringify(
          integrantes
            .filter((i) => i.nome.trim() && i.ano !== null)
            .map((i) => ({ nome: i.nome.trim(), ano_escolar: i.ano })),
        )}
      />

      <ol className="flex gap-2" aria-label="Passos do cadastro">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex-1">
            <span
              className={`block h-1 rounded-full ${passo >= n ? "bg-acento" : "bg-superficie-2"}`}
            />
            <span className="mt-1.5 block font-dados text-micro tracking-[0.1em] text-tinta-3 uppercase">
              {n === 1 ? "equipe" : n === 2 ? "quem joga" : "confirmar"}
            </span>
          </li>
        ))}
      </ol>

      {passo === 1 ? (
        <div className="flex flex-col gap-4">
          <Campo
            id="nome-equipe"
            etiqueta="Nome da equipe"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ácido Cítrico"
            ajuda="É como vocês vão aparecer no placar."
            autoComplete="off"
            required
          />
          <Campo
            id="email-capitao"
            etiqueta="E-mail de quem representa a equipe"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            ajuda="Um só, de uma pessoa da equipe. É para avisar quando a vez chegar."
            autoComplete="email"
            required
          />
          <Botao type="button" tamanho="grande" disabled={!passo1Ok} onClick={() => setPasso(2)}>
            Continuar
          </Botao>
        </div>
      ) : null}

      {passo === 2 ? (
        <div className="flex flex-col gap-4">
          <p className="text-mini text-tinta-2">
            De {equipeMin} a {equipeMax} jogadores. O ano escolar de cada um serve para
            equilibrar o ranking — não muda as perguntas, que são iguais para todos.
          </p>

          {integrantes.map((integrante, indice) => (
            <Cartao key={indice}>
              <div className="flex items-baseline justify-between gap-2">
                <Rotulo>Jogador {indice + 1}</Rotulo>
                {integrantes.length > equipeMin ? (
                  <button
                    type="button"
                    onClick={() =>
                      setIntegrantes((atual) => atual.filter((_, n) => n !== indice))
                    }
                    className="min-h-[36px] px-2 text-mini text-perigo underline"
                  >
                    Tirar
                  </button>
                ) : null}
              </div>

              <div className="mt-2 flex flex-col gap-3">
                <Campo
                  id={`jogador-${indice}`}
                  etiqueta="Nome"
                  value={integrante.nome}
                  onChange={(e) => mexer(indice, { nome: e.target.value })}
                  placeholder="Primeiro nome basta"
                  autoComplete="off"
                />
                <div>
                  <Rotulo className="mb-2">Ano escolar</Rotulo>
                  <SeletorAno
                    anos={anos}
                    rotulos={Object.fromEntries(
                      Object.entries(rotulosAnos).map(([k, v]) => [Number(k), v]),
                    )}
                    valor={integrante.ano}
                    onChange={(ano) => mexer(indice, { ano })}
                  />
                </div>
              </div>
            </Cartao>
          ))}

          {integrantes.length < equipeMax ? (
            <Botao
              type="button"
              variante="secundario"
              onClick={() => setIntegrantes((atual) => [...atual, { nome: "", ano: null }])}
            >
              + Mais um jogador
            </Botao>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Botao type="button" variante="fantasma" onClick={() => setPasso(1)}>
              Voltar
            </Botao>
            <Botao type="button" tamanho="grande" disabled={!passo2Ok} onClick={() => setPasso(3)}>
              Continuar
            </Botao>
          </div>
        </div>
      ) : null}

      {passo === 3 ? (
        <div className="flex flex-col gap-4">
          <Cartao>
            <Rotulo>Confira antes de entrar na fila</Rotulo>
            <p className="mt-2 font-display text-titulo leading-tight font-bold">{nome}</p>
            <p className="font-dados text-micro text-tinta-2">{email}</p>

            <ul className="mt-4 divide-y divide-linha border-t border-linha">
              {integrantes.map((i, n) => (
                <li key={n} className="flex justify-between gap-3 py-2 text-base">
                  <span className="min-w-0 truncate">{i.nome}</span>
                  <span className="font-dados text-mini text-tinta-2">
                    {i.ano !== null ? (rotulosAnos[String(i.ano)] ?? `${i.ano}º`) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Cartao>

          <Interruptor
            id="consentimento"
            name="consentimento"
            etiqueta="Podem guardar estes dados"
            ajuda="Nome, ano escolar e um e-mail, usados só para organizar a fila e o placar da feira. Apagamos tudo depois do evento."
          />

          {resultado?.erro ? (
            <p role="alert" className="rounded-base bg-perigo-suave px-3 py-2 text-mini text-perigo">
              {resultado.erro}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Botao type="button" variante="fantasma" onClick={() => setPasso(2)}>
              Voltar
            </Botao>
            <Botao type="submit" tamanho="grande" disabled={enviando}>
              {enviando ? "Entrando na fila…" : "Entrar na fila"}
            </Botao>
          </div>
        </div>
      ) : null}
    </form>
  );
}
