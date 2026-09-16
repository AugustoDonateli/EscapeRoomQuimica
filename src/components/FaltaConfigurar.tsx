import { Marca } from "@/components/marca/Marca";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { nomesParecidos } from "@/lib/ambiente";

/**
 * A tela que aparece quando a publicação está sem configuração.
 *
 * Melhor que a tela genérica de erro do servidor por um motivo prático: quem
 * publica não é necessariamente quem escreveu o código, e "a server error
 * occurred" não ajuda ninguém a consertar nada.
 *
 * Esta tela é a ÚNICA da plataforma que fala de infraestrutura, e só existe
 * enquanto o defeito existe: com o ambiente completo, ninguém nunca a vê.
 * Havia uma página fixa de diagnóstico no lugar; ela foi removida, porque
 * página aberta que expõe o estado do ambiente é ferramenta de quem constrói o
 * site e não função de uma plataforma que estranhos vão usar.
 */
export function FaltaConfigurar({ faltando }: { faltando: string[] }) {
  // A causa mais comum é um caractere trocado no nome da variável, que é
  // invisível de bater o olho no painel. Então a tela mostra os nomes
  // parecidos que existem de fato no ambiente, ao lado dos que faltam.
  const parecidos = nomesParecidos();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Marca tamanho="tela" comNome />

      <h1 className="titulo-editorial mt-8 text-[clamp(1.75rem,8vw,2.25rem)]">
        Falta configurar a publicação
      </h1>
      <p className="mt-3 text-mini text-tinta-2">
        O site subiu, mas não sabe onde está o banco de dados. Nada foi perdido &mdash; é só
        preencher as variáveis e publicar de novo.
      </p>

      <Cartao tom="fechado" className="mt-6">
        <Rotulo>Não chegaram ao servidor</Rotulo>
        <ul className="mt-2 flex flex-col gap-1.5">
          {faltando.map((nome) => (
            <li key={nome} className="font-dados text-mini text-perigo">
              {nome}
            </li>
          ))}
        </ul>

        {parecidos.length > 0 ? (
          <>
            <Rotulo className="mt-4">Existem no ambiente, com nome parecido</Rotulo>
            <ul className="mt-2 flex flex-col gap-1.5">
              {parecidos.map((nome) => (
                <li key={nome} className="font-dados text-mini text-alerta">
                  {nome}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-mini text-tinta-2">
              Um caractere trocado no nome não aparece de bater o olho no painel, e é a causa mais
              comum disto aqui.
            </p>
          </>
        ) : null}
      </Cartao>

      <ol className="mt-6 flex flex-col gap-2 pl-5 text-mini text-tinta-2">
        <li>
          Na Vercel: <strong className="text-tinta">Settings &rarr; Environment Variables</strong>.
        </li>
        <li>
          Os valores estão no painel do Supabase, em{" "}
          <strong className="text-tinta">Settings &rarr; API</strong>.
        </li>
        <li>
          Marque também o ambiente <strong className="text-tinta">Production</strong>: variável
          criada só em Preview não vale para o endereço público.
        </li>
        <li>
          <strong className="text-tinta">Redeploy</strong> depois de salvar &mdash; variável nova
          não entra numa publicação que já existe.
        </li>
      </ol>
    </main>
  );
}
