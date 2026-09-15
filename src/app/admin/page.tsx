import Link from "next/link";
import { exigirPapel } from "@/lib/auth";
import { lerConfig } from "@/lib/dados";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { FormularioConfig } from "./formulario-config";

/**
 * As telas que não estão nas abas do painel.
 *
 * O jogador e o instrutor não têm menu de propósito — cada um vê só o que
 * precisa, onde está. Mas quem organiza precisa alcançar tudo, e ficar
 * decorando endereço é atrito bobo num projeto que seis equipes vão usar.
 */
const ATALHOS = [
  { href: "/i", nome: "Painel do instrutor", oQueE: "A sala agora, e a próxima equipe" },
  { href: "/placar", nome: "Placar da TV", oQueE: "Para projetar no dia" },
  { href: "/", nome: "Totem da entrada", oQueE: "O que o jogador vê ao ler o QR" },
  { href: "/estilo", nome: "Catálogo visual", oQueE: "Cores, tipografia e componentes" },
  { href: "/diagnostico", nome: "Diagnóstico", oQueE: "Variáveis e conexão com o banco" },
];

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

      <Cartao className="mt-6">
        <Rotulo>Outras telas</Rotulo>
        <ul className="mt-2 divide-y divide-linha">
          {ATALHOS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="flex min-h-[48px] items-center gap-3 py-1 hover:text-acento"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{a.nome}</span>
                  <span className="block text-mini text-tinta-2">{a.oQueE}</span>
                </span>
                <span className="font-dados text-micro text-tinta-3">{a.href}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Cartao>

      <div className="mt-8">
        <FormularioConfig config={config} />
      </div>
    </>
  );
}
