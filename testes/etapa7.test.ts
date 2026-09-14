import assert from "node:assert/strict";
import { test } from "vitest";
import { lerPerguntas, validarRespostas, type PerguntaAvaliacao } from "@/lib/avaliacao";
import { montarIcs } from "@/lib/agenda";

const PERGUNTAS: PerguntaAvaliacao[] = [
  { id: "sala", texto: "O que acharam da sala?", tipo: "estrelas" },
  { id: "melhorar", texto: "O que melhorar?", tipo: "texto" },
];

test("avaliação: jsonb malformado não derruba a tela", () => {
  for (const lixo of [null, "não é lista", 42, [{ sem: "campos" }], [{ id: "A B", texto: "x", tipo: "estrelas" }]]) {
    assert.deepEqual(lerPerguntas(lixo), [], `deveria recusar: ${JSON.stringify(lixo)}`);
  }
});

test("avaliação: lista boa passa inteira", () => {
  assert.deepEqual(lerPerguntas(PERGUNTAS), PERGUNTAS);
});

test("avaliação: identificador repetido é recusado", () => {
  const repetido = [PERGUNTAS[0], { ...PERGUNTAS[0], texto: "outra coisa" }];
  assert.deepEqual(lerPerguntas(repetido), []);
});

test("avaliação: campo inventado não entra no banco", () => {
  // A ação é pública e alcançável por POST direto: só passa o que está
  // configurado.
  const r = validarRespostas(PERGUNTAS, { sala: "4", inventado: "malicioso", melhorar: "nada" });
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(Object.keys(r.respostas).sort(), ["melhorar", "sala"]);
  }
});

test("avaliação: nota fora de 1 a 5 é recusada", () => {
  for (const ruim of ["0", "6", "-1", "3.5", "muitas"]) {
    const r = validarRespostas(PERGUNTAS, { sala: ruim });
    assert.equal(r.ok, false, `deveria recusar nota ${ruim}`);
  }
});

test("avaliação: tudo em branco é recusado", () => {
  const r = validarRespostas(PERGUNTAS, { sala: "", melhorar: "   " });
  assert.equal(r.ok, false);
});

test("avaliação: texto longo é cortado, não rejeitado", () => {
  const r = validarRespostas(PERGUNTAS, { melhorar: "a".repeat(5000) });
  assert.ok(r.ok);
  if (r.ok) assert.equal(String(r.respostas.melhorar).length, 600);
});

test("calendário: o arquivo tem a estrutura que o celular espera", () => {
  const ics = montarIcs({
    nomeEvento: "Escape Químico",
    equipe: "Ácido Cítrico",
    codigo: "ACD-K7M",
    inicio: new Date("2026-11-20T17:20:00Z"),
    duracaoMin: 20,
    minutosDeAviso: 10,
  });

  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.match(ics, /DTSTART:20261120T172000Z/);
  assert.match(ics, /DTEND:20261120T174000Z/);
  assert.match(ics, /TRIGGER:-PT10M/);
  assert.match(ics, /UID:ACD-K7M@escape-quimico/);

  // Toda linha termina em CRLF, como o formato exige.
  const linhas = ics.split("\r\n").slice(0, -1);
  assert.ok(linhas.length > 10);
  assert.ok(!linhas.some((l) => l.includes("\n")), "não pode sobrar quebra solta");
});

test("calendário: nenhuma linha passa de 75 octetos", () => {
  const ics = montarIcs({
    nomeEvento: "Escape Químico da Feira de Ciências do Colégio",
    equipe: "Equipe com um nome absurdamente comprido para testar a dobra de linha do formato",
    codigo: "ABC-DEF",
    inicio: new Date("2026-11-20T17:20:00Z"),
    duracaoMin: 20,
  });

  for (const linha of ics.split("\r\n")) {
    assert.ok(
      Buffer.byteLength(linha, "utf8") <= 75,
      `linha de ${Buffer.byteLength(linha, "utf8")} octetos: ${linha.slice(0, 40)}…`,
    );
  }
});

test("calendário: ponto e vírgula no nome não quebra o arquivo", () => {
  const ics = montarIcs({
    nomeEvento: "Escape; Químico",
    equipe: "Ácido, Cítrico",
    codigo: "ABC-DEF",
    inicio: new Date("2026-11-20T17:20:00Z"),
    duracaoMin: 20,
  });

  assert.match(ics, /SUMMARY:Escape\\; Químico — Ácido\\, Cítrico/);
});
