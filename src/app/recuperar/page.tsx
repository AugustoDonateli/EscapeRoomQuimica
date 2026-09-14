import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Cartao } from "@/components/ui/Cartao";
import { FormularioRecuperar } from "./formulario";

export const metadata = { title: "Recuperar código · Escape Químico" };

export default function PaginaRecuperar() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/">
        <Marca tamanho="icone" />
      </Link>

      <h1 className="mt-6 font-display text-titulo font-bold tracking-tight">
        Recuperar o código da equipe
      </h1>
      <p className="mt-2 text-mini text-tinta-2">
        Trocou de celular, limpou o navegador ou perdeu o papel? Diga o nome da equipe e o e-mail
        do cadastro e a gente devolve vocês para a fila.
      </p>

      <Cartao className="mt-6">
        <FormularioRecuperar />
      </Cartao>
    </main>
  );
}
