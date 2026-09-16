import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/components/marca/Marca";
import { Celula } from "@/components/marca/Celula";
import { Botao } from "@/components/ui/Botao";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Escala } from "@/components/ui/Escala";
import { listarEstacoes, lerConfig } from "@/lib/dados";
import { estadoDoAgendamento, lerCartao } from "@/lib/fila";
import { siglaDaEstacao } from "@/lib/sigla";
import { lerCodigoGuardado } from "@/lib/sessao-jogador";
import { faltandoNoAmbiente } from "@/lib/ambiente";
import { FaltaConfigurar } from "@/components/FaltaConfigurar";

/**
 * O totem da entrada — a tela que abre quando alguém lê o QR ou aproxima o
 * celular da tag NFC.
 *
 * Quem lê esta tela é JOGADOR, de pé na feira, no sol, com fila atrás. Então:
 * nada aqui fala com a organização, nada manda ninguém configurar nada, e a
 * manchete diz em três linhas o que é o jogo. Os números da manchete saem do
 * banco — se a sessão passar a ter 25 minutos, a chamada muda junto.
 *
 * Também é o roteador do jogador: se o celular já guarda um código de equipe
 * ativo, a pessoa não vê esta tela, vai direto para a própria fila. Ele nunca
 * escolhe para onde ir; o site mostra a próxima coisa.
 */
export const dynamic = "force-dynamic";

export default async function Totem() {
  // Antes de qualquer coisa: sem configuração, dizer o que falta em vez de
  // estourar e deixar a Vercel mostrar "a server error occurred".
  const faltando = faltandoNoAmbiente();
  if (faltando.length > 0) return <FaltaConfigurar faltando={faltando} />;

  const guardado = await lerCodigoGuardado();

  if (guardado) {
    const cartao = await lerCartao(guardado);
    if (cartao && ["aguardando", "chamada", "em_jogo"].includes(cartao.entrada.status)) {
      redirect(`/fila/${cartao.equipe.codigo_acesso}`);
    }
  }

  const config = await lerConfig();
  const [estado, estacoes] = await Promise.all([estadoDoAgendamento(config), listarEstacoes()]);
  const sala = estacoes.filter((e) => e.ativa);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-7 pb-10">
      <header className="flex items-center justify-between gap-4">
        <Marca tamanho="tela" comNome />
        <span className="font-dados text-micro tracking-[0.12em] text-tinta-3 uppercase">
          feira de ciências
        </span>
      </header>

      {/* A régua sai pela borda direita da tela em vez de fechar a coluna:
          é o que impede a página de parecer um cartão centrado. */}
      <div className="mt-5 -mr-5 h-px bg-linha-2" />

      <p className="mt-8 font-dados text-micro tracking-[0.22em] text-tinta-3 uppercase">
        01 &mdash; entrada
      </p>

      <h1 className="titulo-editorial mt-3 text-[clamp(2.5rem,12vw,4.25rem)] uppercase">
        <span className="tabular text-acento">{config.equipe_max}</span> pessoas.
        <br />
        <span className="tabular text-acento">{config.duracao_sessao_min}</span> minutos.
        <br />
        Uma saída.
      </h1>

      <p className="mt-6 max-w-prose text-medio text-tinta-2">
        A química é a chave. Cada bancada da sala guarda uma pergunta, e é a resposta certa que
        destranca a bancada seguinte &mdash; até a última.
      </p>

      {/* A sala desenhada como fileira de células da tabela periódica. Não é
          enfeite: são as estações que existem no banco, na ordem em que a
          equipe vai encontrar. */}
      {sala.length > 0 ? (
        <section className="mt-9" aria-labelledby="titulo-sala">
          <h2 id="titulo-sala" className="font-dados text-micro tracking-[0.14em] text-tinta-3 uppercase">
            {sala.length === 1 ? "1 bancada" : `${sala.length} bancadas`} nesta sala
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sala.map((e) => (
              <li key={e.id}>
                <span className="flex items-center gap-2">
                  <Celula numero={e.ordem} sigla={siglaDaEstacao(e.nome)} />
                  <span className="sr-only">{e.nome}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-9">
        {estado.aberto ? (
          <>
            <Link href="/cadastro" className="block">
              <Botao tamanho="grande" larguraTotal seta>
                Cadastrar a nossa equipe
              </Botao>
            </Link>

            <div className="mt-4">
              <p className="flex items-baseline gap-2 font-dados text-mini text-tinta-2">
                <span className="tabular text-medio font-semibold text-tinta">
                  {estado.vagas}/{estado.capacidade}
                </span>
                <span>
                  {estado.vagas === 1 ? "vaga livre" : "vagas livres"} no lote da{" "}
                  {estado.lote === "manha" ? "manhã" : "tarde"}
                </span>
              </p>
              <Escala cheio={estado.vagas} total={estado.capacidade} className="mt-2" />
            </div>
          </>
        ) : (
          <Cartao tom="fechado">
            <Rotulo>A fila está fechada</Rotulo>
            <p className="mt-2 text-medio">{estado.detalhe}</p>

            {estado.motivo === "lote_cheio" ? (
              <p className="mt-3 text-mini text-tinta-2">
                Volte a ler este QR no horário do próximo lote. A fila reabre sozinha.
              </p>
            ) : estado.motivo === "sem_horario" ? (
              <p className="mt-3 text-mini text-tinta-2">
                Procure alguém da organização na entrada da sala.
              </p>
            ) : null}
          </Cartao>
        )}
      </div>

      <div className="mt-10 border-t border-linha pt-5">
        <Rotulo>Já se cadastraram?</Rotulo>
        <p className="mt-2 text-mini text-tinta-2">
          Se o celular da equipe fechou tudo sem querer, ou se quem se cadastrou não está aqui,{" "}
          <Link href="/recuperar" className="font-semibold text-acento underline">
            recupere o código pelo e-mail
          </Link>
          .
        </p>
      </div>

      <footer className="mt-auto flex items-end justify-between gap-4 pt-12">
        <p className="font-dados text-micro tracking-[0.08em] text-tinta-3 uppercase">
          {config.nome_evento}
        </p>
        <Link
          href="/placar"
          className="font-dados text-micro tracking-[0.08em] text-tinta-3 uppercase underline"
        >
          placar do dia
        </Link>
      </footer>
    </main>
  );
}
