import { Marca } from "@/components/marca/Marca";
import { Cartao } from "@/components/ui/Cartao";
import { FormularioEntrar } from "./formulario";

export const metadata = { title: "Entrar · Escape Químico" };

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; erro?: string }>;
}) {
  const { de = "", erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <Marca tamanho="tela" comNome />

      <h1 className="mt-8 font-display text-titulo font-bold tracking-tight">
        Área da equipe organizadora
      </h1>
      <p className="mt-2 text-mini text-tinta-2">
        Jogador não entra por aqui — a tela de vocês abre pelo QR do totem, sem senha.
      </p>

      {erro === "sem-permissao" ? (
        <p
          role="alert"
          className="mt-5 rounded-base bg-alerta-suave px-3 py-2 text-mini text-alerta"
        >
          Sua conta existe, mas não tem permissão para essa parte do painel.
        </p>
      ) : null}

      <Cartao className="mt-5">
        <FormularioEntrar de={de} />
      </Cartao>
    </main>
  );
}
