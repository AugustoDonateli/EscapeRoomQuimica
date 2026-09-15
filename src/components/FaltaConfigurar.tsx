import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Cartao, Rotulo } from "@/components/ui/Cartao";

/**
 * A tela que aparece quando a publicação está sem configuração.
 *
 * Melhor que a tela genérica de erro do servidor por um motivo prático: quem
 * publica não é necessariamente quem escreveu o código, e "a server error
 * occurred" não ajuda ninguém a consertar nada.
 */
export function FaltaConfigurar({ faltando }: { faltando: string[] }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Marca tamanho="tela" comNome />

      <h1 className="mt-8 font-display text-titulo font-bold tracking-tight">
        Falta configurar a publicação
      </h1>
      <p className="mt-2 text-mini text-tinta-2">
        O site subiu, mas não sabe onde está o banco de dados. Nada foi perdido — é só
        preencher as variáveis e publicar de novo.
      </p>

      <Cartao className="mt-6">
        <Rotulo>Faltando</Rotulo>
        <ul className="mt-2 flex flex-col gap-1.5">
          {faltando.map((nome) => (
            <li key={nome} className="font-dados text-mini text-perigo">
              {nome}
            </li>
          ))}
        </ul>
      </Cartao>

      <ol className="mt-6 flex flex-col gap-2 pl-5 text-mini text-tinta-2">
        <li>
          Na Vercel: <strong className="text-tinta">Settings → Environment Variables</strong>.
        </li>
        <li>
          Os valores estão no painel do Supabase, em{" "}
          <strong className="text-tinta">Settings → API</strong>.
        </li>
        <li>
          Marque também o ambiente <strong className="text-tinta">Production</strong> — variável
          criada só em Preview não vale para o endereço público.
        </li>
        <li>
          <strong className="text-tinta">Redeploy</strong> depois de salvar: variável nova não
          entra numa publicação que já existe.
        </li>
      </ol>

      <p className="mt-5 rounded-base bg-alerta-suave px-3 py-2.5 text-mini text-alerta">
        Se você jura que já cadastrou tudo: o diagnóstico lista os nomes parecidos que existem no
        ambiente. Um caractere trocado no nome é invisível no painel e é a causa mais comum.
      </p>

      <Link
        href="/diagnostico"
        className="mt-5 inline-block text-mini font-semibold text-acento underline"
      >
        Ver o diagnóstico completo
      </Link>
    </main>
  );
}
