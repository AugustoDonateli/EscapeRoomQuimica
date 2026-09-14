import assert from "node:assert/strict";
import { test } from "vitest";
import { estadoDoTempo, pausaAberta, somarPausas } from "@/lib/sessao";
import { conferirResposta, normalizarResposta } from "@/lib/resposta";
import { estacaoLiberada } from "@/lib/desbloqueio";
import { contarObservacoes, sugerirNotas } from "@/lib/rubrica";

const INICIO = "2026-09-14T13:00:00.000Z";
const em = (min: number, seg = 0) =>
  new Date(Date.parse(INICIO) + min * 60_000 + seg * 1000);

test("tempo: conta do início do servidor, não do celular", () => {
  const t = estadoDoTempo({ iniciadaEm: INICIO, pausas: [], duracaoMin: 20, agora: em(7, 30) });
  assert.equal(t.decorridoS, 450);
  assert.equal(t.restanteS, 750);
  assert.equal(t.esgotado, false);
});

test("tempo: pausa não custa a sessão da equipe", () => {
  // Pausou do minuto 5 ao 9: quatro minutos não contam.
  const pausas = [{ de: em(5).toISOString(), ate: em(9).toISOString() }];
  const t = estadoDoTempo({ iniciadaEm: INICIO, pausas, duracaoMin: 20, agora: em(12) });
  assert.equal(t.decorridoS, 8 * 60);
  assert.equal(t.restanteS, 12 * 60);
  assert.equal(t.pausadoAgora, false);
});

test("tempo: pausa aberta congela o cronômetro", () => {
  const pausas = [{ de: em(5).toISOString(), ate: null }];
  const aos10 = estadoDoTempo({ iniciadaEm: INICIO, pausas, duracaoMin: 20, agora: em(10) });
  const aos15 = estadoDoTempo({ iniciadaEm: INICIO, pausas, duracaoMin: 20, agora: em(15) });

  assert.equal(aos10.decorridoS, 5 * 60);
  assert.equal(aos15.decorridoS, 5 * 60, "o tempo não pode andar durante a pausa");
  assert.equal(aos15.pausadoAgora, true);
});

test("tempo: várias pausas somam", () => {
  const pausas = [
    { de: em(3).toISOString(), ate: em(4).toISOString() },
    { de: em(8).toISOString(), ate: em(10).toISOString() },
  ];
  const t = estadoDoTempo({ iniciadaEm: INICIO, pausas, duracaoMin: 20, agora: em(15) });
  assert.equal(t.decorridoS, 12 * 60);
});

test("tempo: sessão encerrada para de contar", () => {
  const encerradaEm = em(18).toISOString();
  const logoDepois = estadoDoTempo({ iniciadaEm: INICIO, encerradaEm, pausas: [], duracaoMin: 20, agora: em(19) });
  const muitoDepois = estadoDoTempo({ iniciadaEm: INICIO, encerradaEm, pausas: [], duracaoMin: 20, agora: em(300) });

  assert.equal(logoDepois.decorridoS, 18 * 60);
  assert.equal(muitoDepois.decorridoS, 18 * 60);
});

test("tempo: nunca devolve restante negativo", () => {
  const t = estadoDoTempo({ iniciadaEm: INICIO, pausas: [], duracaoMin: 20, agora: em(45) });
  assert.equal(t.restanteS, 0);
  assert.equal(t.esgotado, true);
});

test("tempo: dado corrompido não derruba a sessão", () => {
  const t = estadoDoTempo({ iniciadaEm: "não é data", pausas: [], duracaoMin: 20 });
  assert.equal(t.restanteS, 20 * 60);

  const comLixo = somarPausas(
    [{ de: "banana", ate: "melão" }, { de: em(5).toISOString(), ate: em(6).toISOString() }],
    em(10),
  );
  assert.equal(comLixo, 60, "pausa inválida é ignorada, a boa continua contando");
});

test("tempo: pausa que termina antes de começar é ignorada", () => {
  const invertida = somarPausas([{ de: em(9).toISOString(), ate: em(5).toISOString() }], em(10));
  assert.equal(invertida, 0);
  assert.equal(pausaAberta([{ de: INICIO, ate: INICIO }]), false);
});

test("resposta: perdoa caixa, espaço e acento", () => {
  assert.ok(conferirResposta("  Enxofre ", "enxofre"));
  assert.ok(conferirResposta("ENXOFRE", "Enxofre"));
  assert.ok(conferirResposta("ficou basico", "Ficou básico"));
  assert.ok(conferirResposta("ficou   básico", "ficou básico"));
});

test("resposta: vírgula e ponto são o mesmo decimal", () => {
  assert.ok(conferirResposta("0.20", "0,20"));
  assert.ok(conferirResposta("0,2", "0.20"));
  assert.ok(conferirResposta("12,5", "12.5"));
  assert.ok(conferirResposta("31", "31"));
});

test("resposta: vírgula de pontuação não é mexida", () => {
  // Aqui a vírgula separa frase, não decimal: não pode virar ponto.
  assert.equal(normalizarResposta("ficou ácido, depois básico"), "ficou acido, depois basico");
  assert.ok(!conferirResposta("ficou ácido, depois", "ficou ácido. depois"));
});

test("resposta: errada continua errada", () => {
  assert.ok(!conferirResposta("enxofre", "cloro"));
  assert.ok(!conferirResposta("0,21", "0,20"));
  assert.ok(!conferirResposta("", "31"));
  assert.ok(!conferirResposta("311", "31"));
});

test("desbloqueio: em ordem fixa, só a estação seguinte abre", () => {
  const base = { ativa: true, temPergunta: true, ordemLivre: false };

  assert.deepEqual(estacaoLiberada({ ...base, ordem: 1, ordensConcluidas: [] }), { liberada: true });
  assert.deepEqual(estacaoLiberada({ ...base, ordem: 2, ordensConcluidas: [1] }), { liberada: true });
  assert.deepEqual(estacaoLiberada({ ...base, ordem: 4, ordensConcluidas: [1] }), {
    liberada: false,
    motivo: "fora_de_ordem",
  });
});

test("desbloqueio: ler o QR da última estação não pula o jogo", () => {
  // É o ataque óbvio: o cartaz é público e está colado na parede.
  const r = estacaoLiberada({
    ordem: 5,
    ativa: true,
    temPergunta: true,
    ordensConcluidas: [],
    ordemLivre: false,
  });
  assert.deepEqual(r, { liberada: false, motivo: "fora_de_ordem" });
});

test("desbloqueio: em ordem livre, qualquer estação pendente abre", () => {
  const r = estacaoLiberada({
    ordem: 5,
    ativa: true,
    temPergunta: true,
    ordensConcluidas: [1],
    ordemLivre: true,
  });
  assert.deepEqual(r, { liberada: true });
});

test("desbloqueio: estação já concluída não reabre, nem em ordem livre", () => {
  for (const ordemLivre of [true, false]) {
    const r = estacaoLiberada({
      ordem: 2,
      ativa: true,
      temPergunta: true,
      ordensConcluidas: [1, 2],
      ordemLivre,
    });
    assert.deepEqual(r, { liberada: false, motivo: "ja_concluida" });
  }
});

test("desbloqueio: estação inativa ou sem pergunta não abre", () => {
  assert.deepEqual(
    estacaoLiberada({ ordem: 1, ativa: false, temPergunta: true, ordensConcluidas: [], ordemLivre: true }),
    { liberada: false, motivo: "inativa" },
  );
  assert.deepEqual(
    estacaoLiberada({ ordem: 1, ativa: true, temPergunta: false, ordensConcluidas: [], ordemLivre: true }),
    { liberada: false, motivo: "sem_pergunta" },
  );
});

test("rubrica: sem toque nenhum, a sugestão é o meio da escala", () => {
  const n = sugerirNotas({});
  assert.deepEqual(n, { colaboracao: 3, raciocinio: 3, seguranca: 3, autonomia: 3 });
});

test("rubrica: toque a favor sobe, toque contra desce", () => {
  const n = sugerirNotas({ ajudou: 2, explicou: 1, passivo: 1 });
  assert.equal(n.colaboracao, 4, "2 ajudou menos 1 passivo");
  assert.equal(n.raciocinio, 3, "1 explicou menos 1 passivo");
  assert.equal(n.autonomia, 2, "1 passivo, sem liderou");
});

test("rubrica: a nota não escapa de 1 a 5", () => {
  const muito = sugerirNotas({ ajudou: 40, explicou: 40, seguranca: 40, liderou: 40 });
  const nenhum = sugerirNotas({ passivo: 40, atropelou: 40 });

  for (const v of Object.values(muito)) assert.equal(v, 5);
  for (const v of Object.values(nenhum)) assert.equal(v, 1);
});

test("rubrica: a contagem de toques bate com a lista", () => {
  const c = contarObservacoes([
    { tipo: "ajudou" }, { tipo: "ajudou" }, { tipo: "explicou" }, { tipo: "passivo" },
  ]);
  assert.deepEqual(c, { ajudou: 2, explicou: 1, passivo: 1 });
});
