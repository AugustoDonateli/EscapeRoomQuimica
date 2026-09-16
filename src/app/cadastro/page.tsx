import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { lerConfig } from "@/lib/dados";
import { estadoDoAgendamento } from "@/lib/fila";
import { FormularioCadastro } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agendar · Escape Químico" };

export default async function PaginaCadastro() {
  const config = await lerConfig();
  const estado = await estadoDoAgendamento(config);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/">
        <Marca tamanho="icone" />
      </Link>

      <p className="mt-7 font-dados text-micro tracking-[0.22em] text-tinta-3 uppercase">
        01 &mdash; cadastro
      </p>
      <h1 className="titulo-editorial mt-2 text-[clamp(1.9rem,9vw,2.5rem)] uppercase">
        Quem entra
        <br />
        na sala
      </h1>

      {estado.aberto ? (
        <>
          <p className="mt-4 text-mini text-tinta-2">
            De {config.equipe_min} a {config.equipe_max} pessoas por equipe. Podem ser de anos
            diferentes.{" "}
            {estado.vagas === 1 ? "Resta 1 vaga" : `Restam ${estado.vagas} vagas`} no lote da{" "}
            {estado.lote === "manha" ? "manhã" : "tarde"}.
          </p>

          <div className="mt-6">
            <FormularioCadastro
              equipeMin={config.equipe_min}
              equipeMax={config.equipe_max}
              anos={config.anos_participantes}
              rotulosAnos={{ "1": "1º", "2": "2º", "3": "3º", "4": "4º" }}
            />
          </div>
        </>
      ) : (
        <Cartao tom="fechado" className="mt-6">
          <Rotulo>A fila está fechada</Rotulo>
          <p className="mt-2 text-base">{estado.detalhe}</p>
          <Link href="/" className="mt-4 inline-block text-mini font-semibold text-acento underline">
            Voltar ao início
          </Link>
        </Cartao>
      )}
    </main>
  );
}
