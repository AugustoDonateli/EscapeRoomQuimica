import Link from "next/link";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { exigirPapel } from "@/lib/auth";
import { filaDoInstrutor, sessaoAberta } from "@/lib/instrutor";
import { normalizarCodigo } from "@/lib/codigo";
import { iniciarSessao } from "../../acoes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Check-in · Escape Químico" };

/**
 * Check-in: confere quem veio e valida os anos que a equipe declarou sozinha no
 * cadastro. É o único momento em que um olho humano confirma esse dado — e é
 * ele que decide a categoria no ranking.
 */
export default async function PaginaCheckin({ params }: { params: Promise<{ codigo: string }> }) {
  await exigirPapel(["admin", "instrutor"]);

  const { codigo: bruto } = await params;
  const codigo = normalizarCodigo(decodeURIComponent(bruto));

  const [fila, aberta] = await Promise.all([filaDoInstrutor(), sessaoAberta()]);
  const equipe = fila.find((f) => f.codigo === codigo);

  if (!equipe) {
    return (
      <Cartao>
        <Rotulo>Equipe não está na fila</Rotulo>
        <p className="mt-2 text-base">
          Este código não aparece entre as equipes aguardando ou chamadas.
        </p>
        <Link href="/i/fila" className="mt-4 inline-block">
          <Botao variante="secundario">Ver a fila</Botao>
        </Link>
      </Cartao>
    );
  }

  const media =
    equipe.jogadores.reduce((s, j) => s + j.ano_escolar, 0) / (equipe.jogadores.length || 1);

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Check-in</h1>

      <Cartao className="mt-5">
        <p className="font-display text-titulo leading-tight font-bold">{equipe.nome}</p>
        <p className="font-dados text-micro text-tinta-2">
          {equipe.codigo} · posição {equipe.posicao} · média de ano {media.toFixed(1)}
        </p>

        <Rotulo className="mt-5">Confira quem veio e o ano de cada um</Rotulo>
        <ul className="mt-2 divide-y divide-linha border-y border-linha">
          {equipe.jogadores.map((j) => (
            <li key={j.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate text-base">{j.nome}</span>
              <span className="font-dados text-mini text-tinta-2">{j.ano_escolar}º ano</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-mini text-tinta-2">
          Algum dado errado? Corrija na hora, em voz alta com a equipe — este é o único momento em
          que alguém confere o que eles declararam sozinhos.
        </p>
      </Cartao>

      {aberta ? (
        <p className="mt-5 rounded-base bg-alerta-suave px-3 py-2.5 text-mini text-alerta">
          Já existe uma sessão em andamento. Encerre a atual antes de começar outra — uma sala, uma
          sessão de cada vez.
        </p>
      ) : (
        <form action={iniciarSessao} className="mt-6">
          <input type="hidden" name="entradaId" value={equipe.entradaId} />
          <input type="hidden" name="teamId" value={equipe.teamId} />
          <Botao type="submit" tamanho="grande" larguraTotal>
            Começar a sessão agora
          </Botao>
          <p className="mt-2 text-center text-mini text-tinta-2">
            O cronômetro começa neste toque e passa a viver no servidor.
          </p>
        </form>
      )}
    </>
  );
}
