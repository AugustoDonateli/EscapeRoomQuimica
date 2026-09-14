import assert from "node:assert/strict";
import { test } from "vitest";
import {
  calcularPontuacao,
  compararParaRanking,
  ESCALA,
  explicarTotal,
  type EntradaDaConta,
  type Pesos,
} from "@/lib/pontuacao";

const PESOS: Pesos = { progresso: 0.4, precisao: 0.25, tempo: 0.15, instrutor: 0.2 };

const PERFEITA: EntradaDaConta = {
  pesoConcluido: 7.5,
  pesoTotal: 7.5,
  acertos: 8,
  tentativas: 8,
  dicas: 0,
  penalidadeDica: 0.05,
  decorridoS: 1200,
  alvoS: 1200,
  notas: [5, 5, 5, 5],
};

const VAZIA: EntradaDaConta = {
  pesoConcluido: 0,
  pesoTotal: 7.5,
  acertos: 0,
  tentativas: 0,
  dicas: 0,
  penalidadeDica: 0.05,
  decorridoS: 1200,
  alvoS: 1200,
  notas: [],
};

test("pontuação: equipe perfeita tira exatamente a escala cheia", () => {
  const p = calcularPontuacao(PERFEITA, PESOS);
  assert.equal(p.total, ESCALA);
  assert.equal(p.progresso, 400);
  assert.equal(p.precisao, 250);
  assert.equal(p.tempo, 150);
  assert.equal(p.instrutor, 200);
});

test("pontuação: equipe que não fez nada tira zero", () => {
  const p = calcularPontuacao(VAZIA, PESOS);
  assert.equal(p.total, 0);
});

test("pontuação: as quatro parcelas sempre somam o total", () => {
  const casos: EntradaDaConta[] = [
    PERFEITA,
    VAZIA,
    { ...PERFEITA, acertos: 5, tentativas: 9, dicas: 2 },
    { ...PERFEITA, pesoConcluido: 3, decorridoS: 2400, notas: [2, 3] },
    { ...PERFEITA, notas: [1, 1, 1, 1] },
  ];

  for (const caso of casos) {
    const p = calcularPontuacao(caso, PESOS);
    const soma = p.progresso + p.precisao + p.tempo + p.instrutor;
    assert.ok(Math.abs(soma - p.total) < 0.01, `parcelas ${soma} != total ${p.total}`);
  }
});

test("pontuação: nenhuma parcela passa do peso publicado", () => {
  // Uma equipe absurdamente rápida e com nota acima da escala não pode
  // estourar o teto — senão o peso de 15% para tempo seria mentira.
  const p = calcularPontuacao(
    { ...PERFEITA, decorridoS: 1, notas: [9, 9, 9, 9] },
    PESOS,
  );
  assert.equal(p.tempo, 150);
  assert.equal(p.instrutor, 200);
  assert.ok(p.total <= ESCALA);
});

test("pontuação: desistir no segundo minuto não vira nota alta em tempo", () => {
  // O erro que a fórmula tem que impedir: sair correndo da sala como estratégia.
  const desistiu = calcularPontuacao(
    { ...VAZIA, decorridoS: 120, acertos: 0, tentativas: 1 },
    PESOS,
  );
  assert.equal(desistiu.tempo, 0, "sem progresso, tempo não pontua");

  const terminouRapido = calcularPontuacao({ ...PERFEITA, decorridoS: 600 }, PESOS);
  assert.equal(terminouRapido.tempo, 150);
});

test("pontuação: passar do tempo-alvo desconta na proporção", () => {
  const noAlvo = calcularPontuacao(PERFEITA, PESOS);
  const dobro = calcularPontuacao({ ...PERFEITA, decorridoS: 2400 }, PESOS);

  assert.equal(noAlvo.tempo, 150);
  assert.equal(dobro.tempo, 75, "o dobro do tempo vale metade da parcela");
});

test("pontuação: dica desconta da precisão, e o desconto tem piso", () => {
  const semDica = calcularPontuacao(PERFEITA, PESOS);
  const tresDicas = calcularPontuacao({ ...PERFEITA, dicas: 3 }, PESOS);
  const muitasDicas = calcularPontuacao({ ...PERFEITA, dicas: 100 }, PESOS);

  assert.equal(semDica.precisao, 250);
  assert.equal(tresDicas.precisao, 212.5, "3 dicas a 5% descontam 15%");
  assert.equal(muitasDicas.precisao, 0, "desconto não deixa a precisão negativa");
});

test("pontuação: não responder não é o mesmo que acertar", () => {
  const naoRespondeu = calcularPontuacao({ ...PERFEITA, acertos: 0, tentativas: 0 }, PESOS);
  assert.equal(naoRespondeu.precisao, 0);
});

test("pontuação: rubrica ausente vale zero, não meio ponto", () => {
  const semAvaliacao = calcularPontuacao({ ...PERFEITA, notas: [] }, PESOS);
  assert.equal(semAvaliacao.instrutor, 0);

  const notaMinima = calcularPontuacao({ ...PERFEITA, notas: [1, 1, 1, 1] }, PESOS);
  assert.equal(notaMinima.instrutor, 0, "nota 1 é o piso da escala");

  const notaMedia = calcularPontuacao({ ...PERFEITA, notas: [3, 3, 3, 3] }, PESOS);
  assert.equal(notaMedia.instrutor, 100, "nota 3 é metade da parcela");
});

test("pontuação: dado corrompido não derruba a conta", () => {
  const p = calcularPontuacao(
    {
      pesoConcluido: Number.NaN,
      pesoTotal: 0,
      acertos: -5,
      tentativas: 0,
      dicas: -2,
      penalidadeDica: 0.05,
      decorridoS: 0,
      alvoS: 0,
      notas: [],
    },
    PESOS,
  );
  assert.ok(Number.isFinite(p.total));
  assert.equal(p.total, 0);
});

test("pontuação: a parte subjetiva não pode virar a maior", () => {
  // A rubrica do instrutor vale 20%: uma equipe com nota máxima e nada feito
  // tem que perder de uma equipe que jogou bem e foi mal avaliada.
  const sóSimpatia = calcularPontuacao({ ...VAZIA, notas: [5, 5, 5, 5] }, PESOS);
  const jogouBem = calcularPontuacao({ ...PERFEITA, notas: [1, 1, 1, 1] }, PESOS);

  assert.equal(sóSimpatia.total, 200);
  assert.ok(jogouBem.total > sóSimpatia.total, `${jogouBem.total} deveria passar de 200`);
});

test("ranking: desempata por precisão, depois tempo, depois menos dicas", () => {
  const base = { total: 700, fracaoPrecisao: 0.8, fracaoTempo: 0.5, dicas: 1 };

  const maisTotal = compararParaRanking({ ...base, total: 701 }, base);
  assert.ok(maisTotal < 0, "total maior vem antes");

  const maisPreciso = compararParaRanking({ ...base, fracaoPrecisao: 0.9 }, base);
  assert.ok(maisPreciso < 0, "empate no total: precisão decide");

  const maisRapido = compararParaRanking({ ...base, fracaoTempo: 0.6 }, base);
  assert.ok(maisRapido < 0, "empate em precisão: tempo decide");

  const menosDicas = compararParaRanking({ ...base, dicas: 0 }, base);
  assert.ok(menosDicas < 0, "empate em tempo: menos dicas decide");

  assert.equal(compararParaRanking(base, { ...base }), 0, "empate de verdade é empate");
});

test("ranking: a ordem é estável quando tudo empata", () => {
  const iguais = [
    { nome: "A", total: 500, fracaoPrecisao: 0.5, fracaoTempo: 0.5, dicas: 0 },
    { nome: "B", total: 500, fracaoPrecisao: 0.5, fracaoTempo: 0.5, dicas: 0 },
    { nome: "C", total: 500, fracaoPrecisao: 0.5, fracaoTempo: 0.5, dicas: 0 },
  ];
  const ordenado = [...iguais].sort(compararParaRanking).map((l) => l.nome);
  assert.deepEqual(ordenado, ["A", "B", "C"], "placar não pode embaralhar sozinho na TV");
});

test("auditoria: a explicação fecha a conta", () => {
  const p = calcularPontuacao({ ...PERFEITA, acertos: 6, tentativas: 8, dicas: 1 }, PESOS);
  const frase = explicarTotal(p);

  assert.match(frase, new RegExp(`= ${p.total}$`));
  assert.match(frase, /progresso 400/);
});
