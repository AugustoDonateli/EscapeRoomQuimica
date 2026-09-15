import assert from "node:assert/strict";
import { test } from "vitest";
import { calcularCapacidade, capacidadePorLote } from "@/lib/capacidade";
import { gerarCodigo, normalizarCodigo } from "@/lib/codigo";
import { mensagemDeFalhaNoLogin } from "@/lib/login";
import { hojeLocal, horaLocal, minutosDoDia } from "@/lib/tempo";

const FEIRA = {
  abre_em: "08:00",
  fecha_em: "14:00",
  lote_tarde_abre_em: "11:00",
  duracao_sessao_min: 20,
  reset_min: 5,
  equipe_max: 6,
};

test("capacidade: o reset entra na conta", () => {
  // 360 minutos de feira ÷ 25 por equipe = 14 sessões.
  const c = calcularCapacidade(FEIRA);
  assert.equal(c.minutosDeFeira, 360);
  assert.equal(c.minutosPorSessao, 25);
  assert.equal(c.sessoes, 14);
  assert.equal(c.jogadores, 84);
});

test("capacidade: ignorar o reset infla o dia em três sessões", () => {
  // É exatamente o erro que a conta precisa impedir: sem reset dariam 18.
  const semReset = calcularCapacidade({ ...FEIRA, reset_min: 0 });
  assert.equal(semReset.sessoes, 18);
  assert.equal(calcularCapacidade(FEIRA).sessoes, 14);
});

test("capacidade: horário inválido não gera número mentiroso", () => {
  for (const horario of ["", "24:00", "8h", "88:88"]) {
    const c = calcularCapacidade({ ...FEIRA, abre_em: horario });
    assert.equal(c.minutosDeFeira, 0);
    assert.equal(c.sessoes, 0);
  }
});

test("capacidade: fechar antes de abrir não vira número negativo", () => {
  const c = calcularCapacidade({ ...FEIRA, abre_em: "14:00", fecha_em: "08:00" });
  assert.equal(c.sessoes, 0);
  assert.equal(c.jogadores, 0);
});

test("capacidade: duração zero não divide por zero", () => {
  const c = calcularCapacidade({ ...FEIRA, duracao_sessao_min: 0, reset_min: 0 });
  assert.equal(c.sessoes, 0);
});

test("lotes: a soma dos dois é a capacidade do dia", () => {
  const l = capacidadePorLote(FEIRA);
  assert.equal(l.manha + l.tarde, l.total);
  assert.equal(l.total, 14);
  // 08:00–11:00 são 180 minutos ÷ 25 = 7 sessões na manhã.
  assert.equal(l.manha, 7);
  assert.equal(l.tarde, 7);
});

test("lotes: tarde abrindo no fim do dia deixa tudo na manhã", () => {
  const l = capacidadePorLote({ ...FEIRA, lote_tarde_abre_em: "14:00" });
  assert.equal(l.manha, 14);
  assert.equal(l.tarde, 0);
});

test("lotes: a manhã nunca passa do total do dia", () => {
  const l = capacidadePorLote({ ...FEIRA, lote_tarde_abre_em: "23:00" });
  assert.equal(l.manha, l.total);
  assert.equal(l.tarde, 0);
});

test("código: não usa caractere que se confunde ao ler em voz alta", () => {
  for (let i = 0; i < 300; i++) {
    const c = gerarCodigo();
    assert.match(c, /^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
    assert.ok(!/[IO01]/.test(c), `código com caractere ambíguo: ${c}`);
  }
});

test("código: normaliza o que a pessoa digita errado", () => {
  assert.equal(normalizarCodigo("abc-d2f"), "ABC-D2F");
  assert.equal(normalizarCodigo("abcd2f"), "ABC-D2F");
  assert.equal(normalizarCodigo(" a b c d 2 f "), "ABC-D2F");
  assert.equal(normalizarCodigo("abc--d2f"), "ABC-D2F");
});

test("código: recusa o que não tem o tamanho certo", () => {
  for (const ruim of ["", "abc", "abcd2fg", "!!!!!!"]) {
    assert.equal(normalizarCodigo(ruim), "");
  }
});

test("código: o que é gerado sobrevive à normalização", () => {
  for (let i = 0; i < 50; i++) {
    const c = gerarCodigo();
    assert.equal(normalizarCodigo(c), c);
  }
});

test("fuso: a virada do dia usa o horário de Brasília, não UTC", () => {
  // 02:00 UTC do dia 15 ainda é 23:00 do dia 14 em São Paulo. Se a plataforma
  // usasse UTC, o agendamento abriria um dia antes da feira.
  const madrugadaUtc = new Date("2026-09-15T02:00:00Z");
  assert.equal(hojeLocal(madrugadaUtc), "2026-09-14");
  assert.equal(horaLocal(madrugadaUtc), "23:00");
});

test("fuso: meio-dia de Brasília cai no dia certo", () => {
  const meioDia = new Date("2026-09-14T15:00:00Z");
  assert.equal(hojeLocal(meioDia), "2026-09-14");
  assert.equal(horaLocal(meioDia), "12:00");
});

test("minutos do dia: aceita hh:mm e hh:mm:ss do Postgres", () => {
  assert.equal(minutosDoDia("08:00"), 480);
  assert.equal(minutosDoDia("08:00:00"), 480);
  assert.equal(minutosDoDia("23:59"), 1439);
  assert.equal(minutosDoDia("00:00"), 0);
  assert.equal(minutosDoDia("banana"), null);
});

test("capacidade: aceita o hh:mm:ss que vem da coluna time do Postgres", () => {
  // Este teste existe por causa de um bug real: havia dois parsers de horário,
  // e o da capacidade recusava segundos. A capacidade dava zero e a fila
  // aparecia permanentemente cheia para todo visitante da feira.
  const comSegundos = calcularCapacidade({
    ...FEIRA,
    abre_em: "08:00:00",
    fecha_em: "14:00:00",
  });
  assert.equal(comSegundos.sessoes, 14);

  const lotes = capacidadePorLote({
    ...FEIRA,
    abre_em: "08:00:00",
    fecha_em: "14:00:00",
    lote_tarde_abre_em: "11:00:00",
  });
  assert.equal(lotes.total, 14);
  assert.equal(lotes.manha, 7);
  assert.equal(lotes.tarde, 7);
});

test("capacidade: horário ausente no banco não derruba a conta", () => {
  // Regressão de um bug que só apareceu na primeira publicação real: as colunas
  // abre_em e fecha_em são nuláveis e ficaram vazias, o tipo em TypeScript
  // dizia que eram texto obrigatório, e .trim() num nulo derrubou a página
  // inicial. O dublê local sempre mandava valor — por isso passou batido.
  for (const ausente of [null, undefined]) {
    const c = calcularCapacidade({
      ...FEIRA,
      abre_em: ausente as unknown as string,
      fecha_em: ausente as unknown as string,
    });
    assert.equal(c.sessoes, 0);
    assert.equal(c.jogadores, 0);
    assert.equal(c.minutosDeFeira, 0);

    const l = capacidadePorLote({
      ...FEIRA,
      abre_em: ausente as unknown as string,
      fecha_em: ausente as unknown as string,
      lote_tarde_abre_em: ausente as unknown as string,
    });
    assert.equal(l.total, 0);
    assert.equal(l.manha, 0);
    assert.equal(l.tarde, 0);
  }
});

test("minutos do dia: nulo e indefinido voltam nulo em vez de estourar", () => {
  assert.equal(minutosDoDia(null), null);
  assert.equal(minutosDoDia(undefined), null);
  assert.equal(minutosDoDia(""), null);
});

test("login: falha do serviço não é apresentada como senha errada", () => {
  // Regressão da primeira publicação real: as contas foram criadas por SQL na
  // mão e ficaram com NULL em confirmation_token, recovery_token,
  // email_change_token_new e email_change. O GoTrue lê essas colunas como
  // texto, quebrou no 500, e a tela dizia "e-mail ou senha não conferem" —
  // mandando procurar no lugar errado uma senha que estava certa.
  const servico = mensagemDeFalhaNoLogin(500);
  assert.match(servico, /serviço de login falhou/);
  assert.equal(mensagemDeFalhaNoLogin(503), servico);
  assert.equal(mensagemDeFalhaNoLogin(undefined), servico);
  assert.equal(mensagemDeFalhaNoLogin(null), servico);
  assert.equal(mensagemDeFalhaNoLogin(0), servico);

  // Credencial errada continua genérica: não conta quais e-mails existem.
  assert.equal(mensagemDeFalhaNoLogin(400), "E-mail ou senha não conferem.");
  assert.equal(mensagemDeFalhaNoLogin(401), "E-mail ou senha não conferem.");

  // Bloqueio por tentativas tem recado próprio: esperar resolve.
  assert.match(mensagemDeFalhaNoLogin(429), /Espere um minuto/);
});
