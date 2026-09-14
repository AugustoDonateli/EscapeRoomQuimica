import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Pilula } from "@/components/ui/Pilula";
import { lerConfig } from "@/lib/dados";
import { lerCartao } from "@/lib/fila";
import { normalizarCodigo } from "@/lib/codigo";
import { formatarHora } from "@/lib/tempo";
import { cancelarVaga } from "./acoes";
import { Atualizador } from "./atualizador";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sua fila · Escape Químico" };

/**
 * O cartão da fila. A pessoa está em pé no meio da feira, com uma mão livre, e
 * quer saber uma coisa só: falta quanto? Por isso a posição é a maior coisa da
 * tela e não existe menu nenhum.
 */
export default async function PaginaFila({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ novo?: string; erro?: string }>;
}) {
  const { codigo: bruto } = await params;
  const { novo, erro } = await searchParams;

  const codigo = normalizarCodigo(decodeURIComponent(bruto));
  const cartao = codigo ? await lerCartao(codigo) : null;

  if (!cartao) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
        <Link href="/">
          <Marca tamanho="icone" />
        </Link>
        <Cartao className="mt-8">
          <Rotulo>Código não encontrado</Rotulo>
          <p className="mt-2 text-base">
            Não achamos nenhuma equipe com esse código. Confira as letras — o código não tem a
            letra O nem o número zero, para não confundir.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/recuperar">
              <Botao variante="secundario">Recuperar por e-mail</Botao>
            </Link>
            <Link href="/">
              <Botao variante="fantasma">Início</Botao>
            </Link>
          </div>
        </Cartao>
      </main>
    );
  }

  const config = await lerConfig();
  const { equipe, jogadores, entrada, quantasNaFrente, estimativaDe, estimativaAte } = cartao;
  const chamada = entrada.status === "chamada";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/">
        <Marca tamanho="icone" />
      </Link>

      {novo ? (
        <p className="mt-5 rounded-base bg-acento-suave px-3 py-2 text-mini text-acento">
          Prontinho, vocês estão na fila. Deixe esta tela aberta — ela avisa quando a vez chegar.
        </p>
      ) : null}

      {erro === "nao-e-sua" ? (
        <p role="alert" className="mt-5 rounded-base bg-perigo-suave px-3 py-2 text-mini text-perigo">
          Só dá para cancelar a vaga no celular que fez o cadastro.
        </p>
      ) : null}

      <p className="mt-6 font-display text-titulo leading-tight font-extrabold tracking-tight">
        {equipe.nome}
      </p>

      {chamada ? (
        /* O momento que importa. Nada de sutileza: é a única tela da
           plataforma que grita. */
        <div className="mt-5 rounded-base bg-acento p-5 text-fundo">
          <p className="font-dados text-micro tracking-[0.16em] uppercase opacity-80">
            É a vez de vocês
          </p>
          <p className="mt-2 font-display text-[2.5rem] leading-none font-extrabold">
            Vão para a sala
          </p>
          <p className="mt-3 text-base opacity-90">
            Procurem o instrutor na entrada. Se ninguém aparecer em{" "}
            {config.ausencia_tolerancia_min} minutos, a vez passa para a próxima equipe.
          </p>
        </div>
      ) : entrada.status === "aguardando" ? (
        <>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="tabular font-display text-enorme leading-[0.82] font-extrabold text-acento">
              {quantasNaFrente === 0 ? "1ª" : `${quantasNaFrente + 1}ª`}
            </span>
            <span className="text-mini leading-tight text-tinta-2">
              na fila
              <br />
              do lote da {entrada.lote === "manha" ? "manhã" : "tarde"}
            </span>
          </div>

          <div className="mt-5 rounded-base border border-linha bg-superficie-2 px-4 py-3">
            <Rotulo>Estimativa da sua vez</Rotulo>
            <p className="tabular mt-1 font-dados text-medio font-semibold">
              {estimativaDe && estimativaAte
                ? `${formatarHora(new Date(estimativaDe))} – ${formatarHora(new Date(estimativaAte))}`
                : "calculando"}
            </p>
            <p className="mt-1.5 text-mini text-tinta-2">
              {quantasNaFrente === 0
                ? "Vocês são os próximos. Fiquem por aqui."
                : quantasNaFrente === 1
                  ? "Falta 1 equipe na frente de vocês."
                  : `Faltam ${quantasNaFrente} equipes na frente de vocês.`}{" "}
              A previsão se corrige sozinha conforme as sessões andam.
            </p>
          </div>
        </>
      ) : (
        <div className="mt-5">
          <Pilula estado={entrada.status} />
          <p className="mt-3 text-base text-tinta-2">
            {entrada.status === "em_jogo"
              ? "A sessão de vocês está em andamento. Bom jogo!"
              : entrada.status === "concluida"
                ? "A sessão de vocês terminou. Obrigado por jogar!"
                : entrada.status === "no_show"
                  ? "A equipe foi chamada e não apareceu, então a vez passou. Dá para se cadastrar de novo se ainda houver vaga."
                  : "Esta vaga foi cancelada."}
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Botao variante="secundario">Voltar ao início</Botao>
          </Link>
        </div>
      )}

      <div className="mt-6">
        <Rotulo>Código da equipe</Rotulo>
        <p className="tabular mt-1 font-dados text-grande leading-none font-semibold tracking-[0.08em]">
          {equipe.codigo_acesso}
        </p>
        <p className="mt-1.5 text-mini text-tinta-2">
          Anote num papel. Se o celular morrer, é com ele que vocês voltam para esta tela.
        </p>
      </div>

      <div className="mt-6">
        <Rotulo>Quem joga</Rotulo>
        <ul className="mt-2 divide-y divide-linha border-y border-linha">
          {jogadores.map((j) => (
            <li key={j.nome} className="flex justify-between gap-3 py-2 text-base">
              <span className="min-w-0 truncate">{j.nome}</span>
              <span className="font-dados text-mini text-tinta-2">{j.ano_escolar}º ano</span>
            </li>
          ))}
        </ul>
      </div>

      {entrada.status === "aguardando" || chamada ? (
        <div className="mt-8">
          <Atualizador />
          <form action={cancelarVaga} className="mt-5 text-center">
            <input type="hidden" name="codigo" value={equipe.codigo_acesso} />
            <button type="submit" className="min-h-[48px] px-3 text-mini text-tinta-3 underline">
              Desistir e liberar a vaga
            </button>
          </form>
        </div>
      ) : null}

      <footer className="mt-auto pt-10">
        <p className="font-dados text-micro tracking-[0.08em] text-tinta-3 uppercase">
          {config.nome_evento}
        </p>
      </footer>
    </main>
  );
}
