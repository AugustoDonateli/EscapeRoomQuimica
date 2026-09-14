import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { exigirPapel } from "@/lib/auth";
import { sair } from "@/app/entrar/acoes";

/**
 * O instrutor não tem menu, tem dois lugares: a sala e a fila. É o máximo que
 * cabe em quem está de pé, andando, olhando os jogadores e não a tela.
 */
export const dynamic = "force-dynamic";

export default async function LayoutInstrutor({ children }: { children: React.ReactNode }) {
  const perfil = await exigirPapel(["admin", "instrutor"]);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-linha bg-superficie">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <Link href="/i" className="shrink-0">
            <Marca tamanho="icone" />
          </Link>
          <span className="min-w-0 flex-1 truncate text-mini font-semibold">{perfil.nome}</span>

          <Link
            href="/i/fila"
            className="min-h-[36px] rounded-base border border-linha-2 px-3 text-mini leading-9 hover:border-acento"
          >
            Fila
          </Link>
          <form action={sair}>
            <button type="submit" className="min-h-[36px] px-2 text-mini text-tinta-3 underline">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-16">{children}</main>
    </div>
  );
}
