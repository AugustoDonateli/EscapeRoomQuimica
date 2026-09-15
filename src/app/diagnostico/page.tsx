import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { conferirAmbiente, ambienteCompleto } from "@/lib/ambiente";
import { criarClienteServico } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnóstico · Escape Químico" };

/**
 * Autodiagnóstico da publicação.
 *
 * Mostra o que está configurado e se o banco responde. Não precisa de login de
 * propósito: se a configuração está quebrada, o login também está, e uma tela
 * de diagnóstico que exige login não diagnostica nada.
 *
 * Só revela NOME de variável, nunca valor. O teste do banco reporta ok ou
 * falhou, com o código do erro — não a mensagem crua, que poderia contar mais
 * sobre o banco do que precisa.
 */
export default async function PaginaDiagnostico() {
  const variaveis = conferirAmbiente();
  const completo = ambienteCompleto();

  let banco: { ok: boolean; detalhe: string } = {
    ok: false,
    detalhe: "não testado: falta configuração",
  };

  if (completo) {
    try {
      const supabase = criarClienteServico();
      const { error, count } = await supabase
        .from("station")
        .select("id", { count: "exact", head: true });

      banco = error
        ? { ok: false, detalhe: `o banco respondeu com erro ${error.code ?? "sem código"}` }
        : { ok: true, detalhe: `respondeu. ${count ?? 0} estações cadastradas` };
    } catch {
      banco = { ok: false, detalhe: "não foi possível alcançar o banco" };
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-10">
      <Link href="/">
        <Marca tamanho="icone" />
      </Link>

      <h1 className="mt-6 font-display text-titulo font-bold tracking-tight">
        Diagnóstico da publicação
      </h1>
      <p className="mt-2 text-mini text-tinta-2">
        Esta tela existe para quem publica descobrir o que falta sem precisar abrir o registro
        de erros da Vercel.
      </p>

      <Cartao className="mt-6" destaque={!completo}>
        <Rotulo>Variáveis de ambiente</Rotulo>
        <ul className="mt-2 divide-y divide-linha">
          {variaveis.map((v) => (
            <li key={v.nome} className="flex items-start gap-3 py-2">
              <span
                className={`font-dados text-mini font-semibold ${
                  v.presente ? "text-acento" : v.obrigatoria ? "text-perigo" : "text-tinta-3"
                }`}
                aria-hidden="true"
              >
                {v.presente ? "✓" : v.obrigatoria ? "✗" : "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-dados text-mini break-all">{v.nome}</span>
                <span className="block text-mini text-tinta-2">{v.paraQue}</span>
                {v.aceitaTambem ? (
                  <span className="block font-dados text-micro text-tinta-3 break-all">
                    ou {v.aceitaTambem}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-dados text-micro tracking-[0.1em] text-tinta-3 uppercase">
                {v.presente ? "ok" : v.obrigatoria ? "falta" : "opcional"}
              </span>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao className="mt-4" destaque={completo && !banco.ok}>
        <Rotulo>Banco de dados</Rotulo>
        <p className={`mt-2 text-base ${banco.ok ? "text-acento" : "text-perigo"}`}>
          {banco.ok ? "Conectado" : "Sem conexão"}
        </p>
        <p className="mt-1 text-mini text-tinta-2">{banco.detalhe}</p>
      </Cartao>

      {completo && banco.ok ? (
        <p className="mt-6 rounded-base bg-acento-suave px-4 py-3 text-mini text-acento">
          Está tudo de pé. <Link href="/" className="font-semibold underline">Abrir o totem</Link>.
        </p>
      ) : (
        <div className="mt-6">
          <Rotulo>Como resolver</Rotulo>
          <ol className="mt-2 flex flex-col gap-2 pl-5 text-mini text-tinta-2">
            <li>
              Na Vercel, em <strong className="text-tinta">Settings → Environment Variables</strong>,
              preencha o que está marcado como “falta”.
            </li>
            <li>
              Os valores ficam no painel do Supabase, em{" "}
              <strong className="text-tinta">Settings → API</strong>. A chave de serviço é a que
              costuma ser esquecida.
            </li>
            <li>
              Variável adicionada <strong className="text-tinta">depois</strong> de uma publicação
              não entra nela: a Vercel injeta as variáveis no momento do deploy. Se a variável
              existe no painel e aqui aparece “falta”, é quase sempre isso — falta o{" "}
              <strong className="text-tinta">Redeploy</strong>.
            </li>
            <li>
              Os dois nomes funcionam. Os sem <code>NEXT_PUBLIC_</code> são os preferidos porque
              esse prefixo significa “pode ir para o navegador”, e aqui nenhuma delas vai.
            </li>
            <li>
              Marque o ambiente <strong className="text-tinta">Production</strong>.
            </li>
            <li>
              Faça <strong className="text-tinta">Redeploy</strong>: variável nova não entra numa
              publicação que já existe.
            </li>
          </ol>
        </div>
      )}
    </main>
  );
}
