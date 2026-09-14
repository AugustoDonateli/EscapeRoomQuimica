import { exigirPapel } from "@/lib/auth";
import { lerConfig } from "@/lib/dados";
import { FormularioConfig } from "./formulario-config";

export const metadata = { title: "Configuração · Escape Químico" };

export default async function PaginaConfig() {
  await exigirPapel(["admin"]);
  const config = await lerConfig();

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Configuração do evento</h1>
      <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
        Tudo que depende das outras equipes da sala mora nesta tela. Nenhum número do projeto está
        escrito no código — quando a informação chegar, é digitar aqui.
      </p>

      <div className="mt-8">
        <FormularioConfig config={config} />
      </div>
    </>
  );
}
