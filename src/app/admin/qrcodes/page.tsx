import QRCode from "qrcode";
import { exigirPapel } from "@/lib/auth";
import { listarEstacoes, listarPerguntas } from "@/lib/dados";
import { Marca } from "@/components/marca/Marca";
import { Rotulo } from "@/components/ui/Cartao";
import { enderecoDoSite } from "@/lib/supabase/ambiente";

export const metadata = { title: "QRs para imprimir · Escape Químico" };

/**
 * A folha de cartazes que vai colada em cada estação.
 *
 * O QR guarda só o endereço da estação — nada de token nem de sessão dentro
 * dele. Cartaz impresso não se atualiza: quem decide se aquela pergunta pode
 * abrir é o servidor, conferindo se a equipe tem sessão ativa e se a estação
 * está liberada. Assim o mesmo cartaz serve o dia inteiro, para todas as
 * equipes, e não abre nada fora de hora.
 */
export default async function PaginaQRCodes() {
  await exigirPapel(["admin"]);

  const [estacoes, perguntas] = await Promise.all([listarEstacoes(), listarPerguntas()]);

  const base = (enderecoDoSite() ?? "").replace(/\/+$/, "");
  const paraImprimir = estacoes.filter((e) => e.ativa && e.tem_pergunta);

  const cartazes = await Promise.all(
    paraImprimir.map(async (e) => {
      const url = `${base || "https://escape-quimico-sem-endereco"}/e/${e.slug}`;
      const imagem = await QRCode.toDataURL(url, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      const quantas = perguntas.filter((p) => p.station_id === e.id && p.ativa).length;
      return { ...e, url, imagem, quantas };
    }),
  );

  return (
    <>
      <div className="esconder-na-impressao">
        <h1 className="font-display text-titulo font-bold tracking-tight">QRs para imprimir</h1>
        <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
          Um cartaz por estação. O jogador aponta a câmera normal do celular — não precisa
          instalar nada, e o QR não precisa de leitor dentro do site.
        </p>

        {!base ? (
          <p className="mt-5 rounded-base bg-alerta-suave px-4 py-3 text-mini text-alerta">
            <strong>Falta o endereço do site.</strong> Defina <code>SITE_URL</code> no
            ambiente depois de publicar na Vercel. Sem isso os QRs abaixo apontam para um endereço
            que não existe — dá para ver o formato da folha, mas não dá para imprimir e colar.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <p className="text-mini text-tinta-2">
            {cartazes.length} estaç{cartazes.length === 1 ? "ão" : "ões"} ativa
            {cartazes.length === 1 ? "" : "s"} com pergunta. Imprima em A4 e recorte.
          </p>
        </div>
      </div>

      <div className="folha-qr mt-8 grid gap-5 sm:grid-cols-2">
        {cartazes.map((c) => (
          <div
            key={c.id}
            className="cartaz-qr flex flex-col items-center rounded-base border border-linha bg-superficie p-5 text-center"
          >
            <Marca tamanho="icone" />

            <p className="mt-4 font-display text-titulo leading-tight font-extrabold tracking-tight">
              {c.nome}
            </p>
            <p className="font-dados text-micro tracking-[0.16em] text-tinta-2 uppercase">
              {c.slug}
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.imagem}
              alt={`QR da estação ${c.nome}`}
              className="mt-4 h-auto w-full max-w-[220px]"
            />

            <p className="mt-3 font-display text-medio font-bold">Aponte a câmera aqui</p>
            <p className="mt-1 break-all font-dados text-micro text-tinta-2">{c.url}</p>

            <p className="mt-3 text-mini text-tinta-2">
              {c.quantas} pergunta{c.quantas === 1 ? "" : "s"} nesta estação
            </p>
          </div>
        ))}
      </div>

      {cartazes.length === 0 ? (
        <p className="mt-6 rounded-base border border-linha bg-superficie px-4 py-6 text-center text-mini text-tinta-2">
          Nenhuma estação ativa com pergunta. Cadastre estações na aba Estações.
        </p>
      ) : null}

      <div className="esconder-na-impressao mt-10 border-t border-linha pt-5">
        <Rotulo>Antes de imprimir</Rotulo>
        <ul className="mt-3 flex flex-col gap-2">
          {[
            "Confira se cada estação já tem pergunta cadastrada — cartaz colado numa estação sem pergunta abre tela vazia.",
            "O endereço aparece escrito embaixo do QR de propósito: se a câmera de alguém falhar, dá para digitar.",
            "O mesmo cartaz serve o dia inteiro e todas as equipes. Quem controla o acesso é o servidor, não o QR.",
          ].map((t) => (
            <li key={t} className="flex gap-2.5 text-mini">
              <span className="text-acento" aria-hidden="true">
                ✓
              </span>
              <span className="text-tinta-2">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
