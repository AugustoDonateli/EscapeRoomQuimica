import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/components/marca/Marca";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { lerConfig } from "@/lib/dados";
import { estadoDoAgendamento, lerCartao } from "@/lib/fila";
import { lerCodigoGuardado } from "@/lib/sessao-jogador";

/**
 * O totem da entrada — a tela que abre quando alguém lê o QR ou aproxima o
 * celular da tag NFC.
 *
 * Também é o roteador do jogador: se o celular já guarda um código de equipe
 * ativo, a pessoa não vê esta tela, vai direto para a própria fila. Ele nunca
 * escolhe para onde ir; o site mostra a próxima coisa.
 */
export const dynamic = "force-dynamic";

export default async function Totem() {
  const guardado = await lerCodigoGuardado();

  if (guardado) {
    const cartao = await lerCartao(guardado);
    if (cartao && ["aguardando", "chamada", "em_jogo"].includes(cartao.entrada.status)) {
      redirect(`/fila/${cartao.equipe.codigo_acesso}`);
    }
  }

  const config = await lerConfig();
  const estado = await estadoDoAgendamento(config);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
      <Marca tamanho="tela" comNome />

      <h1 className="mt-10 font-display text-[clamp(1.9rem,7.5vw,2.75rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
        Uma sala de fuga feita de química.
      </h1>

      <p className="mt-4 text-medio text-tinta-2">
        Monte sua equipe, entre na fila e resolva os enigmas antes que o tempo acabe. A sessão
        dura <strong className="font-semibold text-tinta">{config.duracao_sessao_min} minutos</strong>.
      </p>

      <div className="mt-8">
        {estado.aberto ? (
          <>
            <Link href="/cadastro" className="block">
              <Botao tamanho="grande" larguraTotal>
                Agendar a nossa sessão
              </Botao>
            </Link>

            <p className="mt-3 text-center text-mini text-tinta-2">
              {estado.vagas === 1
                ? "Resta 1 vaga neste lote."
                : `Restam ${estado.vagas} vagas neste lote.`}
            </p>
          </>
        ) : (
          <Cartao>
            <Rotulo>Agendamento fechado</Rotulo>
            <p className="mt-2 text-base">{estado.detalhe}</p>
            {estado.motivo === "lote_cheio" ? (
              <p className="mt-3 text-mini text-tinta-2">
                Passe aqui de novo no horário do próximo lote — o totem volta a abrir sozinho.
              </p>
            ) : null}
          </Cartao>
        )}
      </div>

      <div className="mt-10 border-t border-linha pt-5">
        <Rotulo>Já se cadastrou?</Rotulo>
        <p className="mt-2 text-mini text-tinta-2">
          Se você trocou de celular ou fechou tudo sem querer,{" "}
          <Link href="/recuperar" className="font-semibold text-acento underline">
            recupere o código da equipe
          </Link>
          .
        </p>
      </div>

      <footer className="mt-auto pt-12">
        <p className="font-dados text-micro tracking-[0.08em] text-tinta-3 uppercase">
          {config.nome_evento} · feira de ciências
        </p>
      </footer>
    </main>
  );
}
