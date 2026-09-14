import { Marca } from "@/components/marca/Marca";
import { AvisoRede } from "@/components/ui/AvisoRede";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { Interruptor } from "@/components/ui/Interruptor";
import { Pilula } from "@/components/ui/Pilula";
import { Proveta } from "@/components/ui/Proveta";
import { SeletorAno } from "@/components/ui/SeletorAno";

/**
 * Catálogo do sistema visual — entrega da etapa 2.
 *
 * Existe para a gente discutir e ajustar o visual ANTES de haver tela de
 * produto. Mudar uma cor aqui custa um minuto; mudar depois de vinte telas
 * construídas custa um fim de semana.
 */

export const metadata = { title: "Sistema visual · Escape Químico" };

const PALETA_FORA = [
  { nome: "fundo", hex: "#f2f5f4", uso: "o papel de tudo, fora da sala" },
  { nome: "superficie", hex: "#ffffff", uso: "cartão, campo, painel" },
  { nome: "superficie-2", hex: "#e7edeb", uso: "faixa, cabeçalho de tabela" },
  { nome: "tinta", hex: "#101614", uso: "texto principal", contraste: "16,7" },
  { nome: "tinta-2", hex: "#4e5b58", uso: "texto de apoio", contraste: "6,5" },
  { nome: "tinta-3", hex: "#637070", uso: "rótulo em maiúscula", contraste: "4,7" },
  { nome: "acento", hex: "#0d7263", uso: "ação principal, estado positivo", contraste: "5,3" },
  { nome: "acento-2", hex: "#2b5fcc", uso: "em jogo, informação", contraste: "5,3" },
  { nome: "alerta", hex: "#8f5400", uso: "dica, pausa, últimos minutos", contraste: "5,6" },
  { nome: "perigo", hex: "#a01f35", uso: "ausência, erro, tempo esgotado", contraste: "7,0" },
];

const PALETA_SALA = [
  { nome: "fundo", hex: "#0c1211", uso: "o grafite da sala" },
  { nome: "superficie", hex: "#131c1a", uso: "cartão do jogador" },
  { nome: "superficie-2", hex: "#1b2624", uso: "faixa da estação" },
  { nome: "tinta", hex: "#dfe9e6", uso: "texto principal", contraste: "15,3" },
  { nome: "tinta-2", hex: "#93a5a1", uso: "texto de apoio", contraste: "7,3" },
  { nome: "tinta-3", hex: "#7a8b87", uso: "rótulo em maiúscula", contraste: "5,3" },
  { nome: "acento", hex: "#3fd9c4", uso: "ação principal, tempo normal", contraste: "10,8" },
  { nome: "acento-2", hex: "#8fb8ff", uso: "informação", contraste: "9,4" },
  { nome: "alerta", hex: "#e8a64a", uso: "últimos cinco minutos", contraste: "9,0" },
  { nome: "perigo", hex: "#ff7089", uso: "tempo esgotado, aborto", contraste: "7,1" },
];

const ESCALA = [
  { classe: "text-micro", nome: "micro", px: "11px", uso: "rótulo em maiúscula, mono", mono: true },
  { classe: "text-mini", nome: "mini", px: "13px", uso: "legenda, apoio" },
  { classe: "text-base", nome: "base", px: "15px", uso: "corpo" },
  { classe: "text-medio", nome: "medio", px: "17px", uso: "corpo destacado" },
  { classe: "text-titulo", nome: "titulo", px: "22px", uso: "título de tela", display: true },
  { classe: "text-grande", nome: "grande", px: "32px", uso: "número importante", display: true },
  { classe: "text-enorme", nome: "enorme", px: "56px", uso: "posição na fila", display: true },
];

function Secao({
  numero,
  titulo,
  nota,
  children,
}: {
  numero: string;
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 border-t-2 border-tinta pt-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-dados text-micro font-semibold tracking-[0.1em] text-acento">
          {numero}
        </span>
        <h2 className="font-display text-titulo font-bold tracking-tight">{titulo}</h2>
      </div>
      {nota ? <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">{nota}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ListaCores({ cores }: { cores: typeof PALETA_FORA }) {
  return (
    <ul className="divide-y divide-linha border-y border-linha">
      {cores.map((c) => (
        <li key={c.nome} className="flex items-center gap-3 py-2">
          <span
            className="h-9 w-9 shrink-0 rounded-base border border-linha-2"
            style={{ background: c.hex }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block font-dados text-mini font-semibold">{c.nome}</span>
            <span className="block text-mini text-tinta-2">{c.uso}</span>
          </span>
          <span className="text-right">
            <span className="block font-dados text-micro text-tinta-3 uppercase">{c.hex}</span>
            {c.contraste ? (
              <span className="block font-dados text-micro text-tinta-2">{c.contraste}:1</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A tela da fila em miniatura. Serve para provar que as duas paletas
 *  funcionam com exatamente o mesmo código — só muda o contexto. */
function MiniFila({ estado }: { estado: "aguardando" | "chamada" }) {
  return (
    <div className="rounded-base border border-linha bg-superficie p-4">
      <Rotulo>Escape Químico</Rotulo>
      <p className="mt-3 font-display text-medio leading-tight font-bold">Equipe Ácido Cítrico</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="tabular font-display text-enorme leading-[0.82] font-extrabold text-acento">
          5ª
        </span>
        <span className="text-mini leading-tight text-tinta-2">
          na fila
          <br />
          de hoje
        </span>
      </div>
      <div className="mt-4 rounded-base border border-linha bg-superficie-2 px-3 py-2">
        <Rotulo>Estimativa da sua vez</Rotulo>
        <p className="tabular mt-0.5 font-dados text-medio font-semibold">14:20 – 14:40</p>
      </div>
      <div className="mt-3">
        <Pilula estado={estado} />
      </div>
    </div>
  );
}

export default function Estilo() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 pb-24">
      <Marca tamanho="tela" comNome />

      <h1 className="mt-10 font-display text-[clamp(1.9rem,7vw,2.75rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
        Sistema visual
      </h1>
      <p className="mt-3 max-w-[60ch] text-medio text-tinta-2">
        Tudo que as telas do Escape Químico vão usar, num lugar só. Se algo aqui estiver
        errado, é agora que sai barato consertar.
      </p>

      <Secao
        numero="2.1"
        titulo="As duas paletas"
        nota="A cor é escolhida pelo lugar onde a pessoa está, não pela configuração do celular dela. Fora da sala o fundo é claro porque a feira é de dia; dentro da sala é grafite porque a sala é escura. O número ao lado de cada cor é o contraste real medido contra o fundo — o mínimo aceito é 4,5:1."
      >
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <Rotulo className="mb-3">Fora da sala · totem, cadastro, fila, placar</Rotulo>
            <ListaCores cores={PALETA_FORA} />
          </div>
          <div className="sala rounded-base bg-fundo p-4 text-tinta">
            <Rotulo className="mb-3">Dentro da sala · estação, painel em sessão</Rotulo>
            <ListaCores cores={PALETA_SALA} />
          </div>
        </div>
      </Secao>

      <Secao
        numero="2.2"
        titulo="Escala tipográfica"
        nota="Bricolage Grotesque nos títulos e números grandes, IBM Plex Sans no texto, IBM Plex Mono em tempo, código de equipe e pontuação. Tamanho fora desta escala não entra no projeto."
      >
        <ul className="divide-y divide-linha border-y border-linha">
          {ESCALA.map((t) => (
            <li key={t.nome} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              <span className="w-full sm:w-32">
                <span className="block font-dados text-micro text-tinta-3">
                  {t.nome} · {t.px}
                </span>
                <span className="block text-mini text-tinta-2">{t.uso}</span>
              </span>
              <span
                className={`${t.classe} ${
                  t.display ? "font-display font-extrabold tracking-tight" : ""
                } ${t.mono ? "font-dados tracking-[0.14em] uppercase" : ""} min-w-0 flex-1 truncate`}
              >
                Ácido cítrico
              </span>
            </li>
          ))}
          <li className="flex flex-wrap items-baseline gap-x-4 py-3">
            <span className="w-full sm:w-32">
              <span className="block font-dados text-micro text-tinta-3">placar · 88px</span>
              <span className="block text-mini text-tinta-2">TV, visto a cinco metros</span>
            </span>
            <span className="tabular font-display text-placar leading-none font-extrabold tracking-tight">
              842
            </span>
          </li>
        </ul>
      </Secao>

      <Secao
        numero="2.3"
        titulo="A marca"
        nota="Uma casinha da tabela periódica: número pequeno em cima, símbolo grande embaixo. O número é o ano do evento, não um elemento inventado. Três tamanhos porque as exigências são diferentes — o cartaz é impresso em A3 e visto de longe, o ícone tem que sobreviver a 32 pixels."
      >
        <div className="flex flex-wrap items-end gap-8">
          <div>
            <Rotulo className="mb-3">Cartaz do totem</Rotulo>
            <Marca tamanho="cartaz" />
          </div>
          <div>
            <Rotulo className="mb-3">Canto da tela</Rotulo>
            <Marca tamanho="tela" comNome />
          </div>
          <div>
            <Rotulo className="mb-3">Ícone</Rotulo>
            <Marca tamanho="icone" />
          </div>
        </div>
      </Secao>

      <Secao
        numero="2.4"
        titulo="Botões"
        nota="Alvo de toque de 48px no padrão e 64px no painel do instrutor — ele está de pé, andando, olhando os jogadores e não a tela. Todo botão tem contorno de foco visível: o dedo erra e o teclado precisa funcionar."
      >
        <div className="flex flex-col gap-5">
          <div>
            <Rotulo className="mb-2">Variantes · 48px</Rotulo>
            <div className="flex flex-wrap gap-2">
              <Botao variante="primario">Agendar sessão</Botao>
              <Botao variante="secundario">Ver a fila</Botao>
              <Botao variante="alerta">Dar dica</Botao>
              <Botao variante="perigo">Encerrar sessão</Botao>
              <Botao variante="fantasma">Cancelar</Botao>
              <Botao variante="primario" disabled>
                Fila cheia
              </Botao>
            </div>
          </div>
          <div>
            <Rotulo className="mb-2">Tamanhos</Rotulo>
            <div className="flex flex-wrap items-center gap-2">
              <Botao tamanho="pequeno" variante="secundario">
                36px
              </Botao>
              <Botao tamanho="medio">48px · padrão</Botao>
              <Botao tamanho="grande">64px · instrutor</Botao>
            </div>
          </div>
        </div>
      </Secao>

      <Secao
        numero="2.5"
        titulo="Entrada de dados"
        nota="Ano escolar por botão, nunca por lista suspensa: lista abre o seletor do sistema, rola, erra e custa três toques. No cadastro inteiro só o nome da equipe e um e-mail são digitados."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Cartao>
            <div className="flex flex-col gap-4">
              <Campo
                id="exemplo-equipe"
                etiqueta="Nome da equipe"
                placeholder="Ácido Cítrico"
                ajuda="É como vocês vão aparecer no placar."
              />
              <Campo
                id="exemplo-email"
                etiqueta="E-mail do capitão"
                type="email"
                placeholder="voce@exemplo.com"
                erro="Precisamos de um e-mail para confirmar o agendamento."
              />
            </div>
          </Cartao>
          <Cartao>
            <Rotulo className="mb-2">Ano escolar do integrante</Rotulo>
            <SeletorAno />
            <p className="mt-3 mb-4 text-mini text-tinta-2">
              Os anos participantes são configuráveis — é decisão da escola, não da plataforma.
            </p>
            <Interruptor
              id="exemplo-consentimento"
              etiqueta="Podem guardar estes dados"
              ajuda="A área clicável é a linha toda, não o quadradinho de 16 px."
            />
          </Cartao>
        </div>
      </Secao>

      <Secao
        numero="2.6"
        titulo="Estados"
        nota="Estado tem que ser legível sem ler: a cor e a forma chegam antes do texto. Os nomes são os mesmos do banco, para não existir tradução solta espalhada pelo código."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Pilula estado="aguardando" />
            <Pilula estado="chamada" />
            <Pilula estado="em_jogo" />
            <Pilula estado="pausada" />
            <Pilula estado="concluida" />
            <Pilula estado="no_show" />
            <Pilula estado="cancelada" />
          </div>
          <div>
            <Rotulo className="mb-2">Estado da rede · fica permanente na tela do instrutor</Rotulo>
            <div className="flex flex-wrap items-center gap-4">
              <AvisoRede online />
              <AvisoRede online pendentes={3} />
              <AvisoRede online={false} pendentes={7} />
            </div>
          </div>
        </div>
      </Secao>

      <Secao
        numero="2.7"
        titulo="A proveta"
        nota="O cronômetro é o objeto mais visto da plataforma. Um número sozinho conta o tempo; a proveta mostra quanto ainda tem, e isso se lê de longe sem interpretar dígito. Três estados, porque o tempo muda de significado no fim."
      >
        <div className="sala flex flex-col gap-7 rounded-base bg-fundo p-5 text-tinta">
          <div>
            <Rotulo className="mb-2">Normal · painel do instrutor</Rotulo>
            <Proveta restanteSegundos={768} totalSegundos={1200} />
          </div>
          <div>
            <Rotulo className="mb-2">Últimos cinco minutos</Rotulo>
            <Proveta restanteSegundos={184} totalSegundos={1200} />
          </div>
          <div>
            <Rotulo className="mb-2">Tempo esgotado</Rotulo>
            <Proveta restanteSegundos={0} totalSegundos={1200} />
          </div>
          <div>
            <Rotulo className="mb-2">Miniatura · dentro da pergunta da estação</Rotulo>
            <Proveta restanteSegundos={62} totalSegundos={90} tamanho="mini" limiteAlertaSegundos={30} />
          </div>
        </div>
        <div className="mt-5">
          <Rotulo className="mb-2">Tamanho de TV · placar visto a cinco metros</Rotulo>
          <Proveta restanteSegundos={455} totalSegundos={1200} tamanho="tv" />
        </div>
      </Secao>

      <Secao
        numero="2.8"
        titulo="Teste dos extremos"
        nota="A mesma tela, o mesmo código, os dois contextos. É assim que se confere se o sistema de cores aguenta o sol da feira e o escuro da sala sem virar dois projetos separados."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Rotulo className="mb-3">Fora da sala</Rotulo>
            <MiniFila estado="aguardando" />
          </div>
          <div className="sala rounded-base bg-fundo p-4 text-tinta">
            <Rotulo className="mb-3">Dentro da sala</Rotulo>
            <MiniFila estado="chamada" />
          </div>
        </div>
      </Secao>

      <Secao
        numero="2.9"
        titulo="Conferido"
        nota="O que foi medido de verdade, não no olhômetro."
      >
        <ul className="flex flex-col gap-2.5">
          {[
            "Contraste de todos os textos nas duas paletas: mínimo 4,7:1, acima do exigido de 4,5:1.",
            "Dois tokens foram corrigidos por reprovarem na medição — o rótulo cinza e o verde de ação.",
            "Alvo de toque: 48px no padrão, 64px no painel do instrutor, 36px só em ação secundária.",
            "Contorno de foco visível em todo elemento interativo, inclusive por teclado.",
            "Nenhuma cor escrita solta no código: tudo sai das variáveis das duas paletas.",
            "Movimento respeitando prefers-reduced-motion, conforme a escolha de movimento mínimo.",
          ].map((item) => (
            <li key={item} className="flex gap-2.5 text-mini">
              <span className="text-acento" aria-hidden="true">
                ✓
              </span>
              <span className="text-tinta-2">{item}</span>
            </li>
          ))}
        </ul>
      </Secao>

      <footer className="mt-16 border-t border-linha pt-5">
        <p className="font-dados text-micro tracking-[0.08em] text-tinta-3 uppercase">
          Catálogo do sistema visual · etapa 2
        </p>
      </footer>
    </main>
  );
}
