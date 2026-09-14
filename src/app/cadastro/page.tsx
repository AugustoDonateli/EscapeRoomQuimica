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

      <h1 className="mt-6 font-display text-titulo font-bold tracking-tight">
        Agendar a sessão de vocês
      </h1>

      {estado.aberto ? (
        <>
          <p className="mt-2 text-mini text-tinta-2">
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
        <Cartao className="mt-6">
          <Rotulo>Agendamento fechado</Rotulo>
          <p className="mt-2 text-base">{estado.detalhe}</p>
          <Link href="/" className="mt-4 inline-block text-mini font-semibold text-acento underline">
            Voltar ao início
          </Link>
        </Cartao>
      )}
    </main>
  );
}
