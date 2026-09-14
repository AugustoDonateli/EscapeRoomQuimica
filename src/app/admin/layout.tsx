import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { exigirPapel, type Papel } from "@/lib/auth";
import { sair } from "@/app/entrar/acoes";

/**
 * O painel é a única parte da plataforma com abas de verdade — porque é a única
 * em que alguém navega. O jogador vê uma tela por vez e o instrutor tem dois
 * lugares; aqui é trabalho de escritório, feito sentado, antes da feira.
 */

/**
 * O painel nunca é pré-renderizado: cada tela depende de quem está logado e do
 * que está no banco naquele instante. Sem isto, o build tentaria gerar uma
 * versão estática do painel — e uma tela de administração congelada no momento
 * do build é, na melhor das hipóteses, informação velha.
 */
export const dynamic = "force-dynamic";

const ABAS: { href: string; nome: string; papeis: Papel[] }[] = [
  { href: "/admin", nome: "Configuração", papeis: ["admin"] },
  { href: "/admin/estacoes", nome: "Estações", papeis: ["admin"] },
  { href: "/admin/perguntas", nome: "Perguntas", papeis: ["admin", "autor"] },
  { href: "/admin/qrcodes", nome: "QRs para imprimir", papeis: ["admin"] },
  { href: "/admin/placar", nome: "Placar", papeis: ["admin"] },
  { href: "/admin/avaliacao", nome: "Avaliação", papeis: ["admin"] },
  { href: "/admin/dados", nome: "Dados pessoais", papeis: ["admin"] },
];

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  // O grupo das perguntas entra, cadastra e não alcança mais nada.
  const perfil = await exigirPapel(["admin", "autor"]);
  const abas = ABAS.filter((a) => a.papeis.includes(perfil.papel));

  return (
    <div className="min-h-dvh">
      <header className="border-b border-linha bg-superficie">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-5 py-3">
          <Link href="/admin" className="shrink-0">
            <Marca tamanho="icone" />
          </Link>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-mini font-semibold">{perfil.nome}</span>
            <span className="block font-dados text-micro tracking-[0.1em] text-tinta-3 uppercase">
              {perfil.papel === "admin" ? "administração" : "autor de perguntas"}
            </span>
          </span>

          <form action={sair}>
            <button
              type="submit"
              className="min-h-[36px] rounded-base border border-linha-2 px-3 text-mini hover:border-acento"
            >
              Sair
            </button>
          </form>
        </div>

        <nav aria-label="Seções do painel" className="mx-auto max-w-5xl overflow-x-auto px-5">
          <ul className="flex gap-1 whitespace-nowrap">
            {abas.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="inline-block border-b-2 border-transparent px-3 py-2.5 text-mini hover:border-linha-2 focus-visible:border-acento"
                >
                  {a.nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 pb-20">{children}</main>
    </div>
  );
}
