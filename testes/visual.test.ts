import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import { siglaDaEstacao } from "@/lib/sigla";

const ler = (caminho: string) => readFileSync(new URL(`../${caminho}`, import.meta.url), "utf8");

/**
 * Este teste lê o código-fonte em vez de rodar a página, e isso é de propósito.
 *
 * O defeito que ele guarda não aparece em lugar nenhum: as fontes baixam com
 * status 200, o build passa, nada dá erro, e o site inteiro renderiza na fonte
 * padrão do navegador. Foi assim durante todas as etapas anteriores, e só
 * apareceu quando alguém disse que o site parecia genérico.
 *
 * A causa: globals.css declara --fonte-corpo em :root apontando para
 * var(--fonte-plex-sans). Um var() dentro de uma custom property é substituído
 * no elemento onde a propriedade foi DECLARADA — :root, que é o <html>. Com a
 * variável da fonte só no <body>, ela não existia em :root; e var() indefinida
 * dentro de font-family invalida a declaração inteira em vez de cair para o
 * próximo nome da lista. Daí a fonte do navegador.
 */
test("tipografia: as variáveis de fonte ficam no <html>, senão a fonte não aplica", () => {
  const layout = ler("src/app/layout.tsx");

  // Exige espaço depois de "html" para não casar com o <html> citado no
  // comentário do próprio arquivo.
  const tagHtml = /<html\s[\s\S]*?>/.exec(layout)?.[0] ?? "";
  assert.ok(tagHtml.length > 0, "não achei a tag <html> no layout");

  for (const fonte of ["bricolage.variable", "plexSans.variable", "plexMono.variable"]) {
    assert.ok(
      tagHtml.includes(fonte),
      `${fonte} precisa estar na tag <html>: em :root é onde globals.css resolve a fonte`,
    );
  }

  const tagBody = /<body[\s\S]*?>/.exec(layout)?.[0] ?? "";
  assert.ok(
    !tagBody.includes(".variable"),
    "variável de fonte no <body> não alcança :root e apaga a tipografia inteira",
  );

  // E a ponta de lá: :root tem que montar as três famílias a partir delas.
  const css = ler("src/app/globals.css");
  for (const nome of ["--fonte-bricolage", "--fonte-plex-sans", "--fonte-plex-mono"]) {
    assert.ok(css.includes(`var(${nome})`), `globals.css deveria usar var(${nome})`);
  }
});

test("as telas de ferramenta não voltam para a plataforma", () => {
  // /estilo (catálogo de componentes) e /diagnostico (estado do ambiente) eram
  // ferramenta de quem constrói o site, publicadas junto do resto. Saíram, e
  // a de diagnóstico também por segurança: página aberta que conta quais
  // variáveis existem e se o banco responde não é coisa de plataforma que
  // estranhos vão usar. O que era útil nela virou a tela FaltaConfigurar, que
  // só aparece enquanto o defeito existe.
  for (const rota of ["src/app/estilo", "src/app/diagnostico"]) {
    assert.throws(() => ler(`${rota}/page.tsx`), `${rota} não deveria existir`);
  }
});

test("sigla da estação: símbolo de elemento tirado do nome escrito", () => {
  assert.equal(siglaDaEstacao("Cofre da Tabela"), "Ct");
  assert.equal(siglaDaEstacao("Bancada das Ligações"), "Bl");
  assert.equal(siglaDaEstacao("Balança e Mol"), "Bm");

  // Uma palavra só usa as duas primeiras letras, sem acento: Ti, não Tí.
  assert.equal(siglaDaEstacao("Titulação"), "Ti");
  assert.equal(siglaDaEstacao("Ácido"), "Ac");

  // Nome esquisito não pode derrubar a página inicial.
  assert.equal(siglaDaEstacao(""), "Eq");
  assert.equal(siglaDaEstacao("   "), "Eq");
  assert.equal(siglaDaEstacao("de da do"), "Eq");
  assert.equal(siglaDaEstacao("X"), "X");
  assert.equal(siglaDaEstacao("EST-01 Cofre"), "Ec");
});
