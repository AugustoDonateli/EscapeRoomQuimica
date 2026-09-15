import { Marca } from "@/components/marca/Marca";
import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { FormularioEntrar } from "./formulario";
import { faltandoNoAmbiente } from "@/lib/ambiente";
import { FaltaConfigurar } from "@/components/FaltaConfigurar";

export const metadata = { title: "Entrar · Escape Químico" };

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; erro?: string }>;
}) {
  const { de = "", erro } = await searchParams;

  // O login também depende das chaves: sem elas, esta tela aceitaria a senha e
  // quebraria depois, o que é pior que avisar antes.
  const faltando = faltandoNoAmbiente();
  if (faltando.length > 0) return <FaltaConfigurar faltando={faltando} />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <Marca tamanho="tela" comNome />

      <h1 className="mt-8 font-display text-titulo font-bold tracking-tight">
        Área da equipe organizadora
      </h1>
      <p className="mt-2 text-mini text-tinta-2">
        Jogador não entra por aqui — a tela de vocês abre pelo QR do totem, sem senha.
      </p>

      {/* Ninguém cria conta sozinho, e a tela precisa dizer isso: sem esta
          linha, quem chega aqui procura um botão de "criar conta" que não
          existe e conclui que o site está quebrado. Aconteceu. */}
      <Cartao className="mt-5">
        <Rotulo>Não existe cadastro aqui</Rotulo>
        <p className="mt-2 text-mini text-tinta-2">
          As contas da equipe organizadora são criadas por quem administra o projeto, uma para
          cada papel: administração, instrutor e autor de perguntas. Se você deveria ter acesso e
          não tem, peça a conta a quem cuida da plataforma — não tem botão para se cadastrar, e
          isso é de propósito.
        </p>
      </Cartao>

      {erro === "sem-permissao" ? (
        <p
          role="alert"
          className="mt-5 rounded-base bg-alerta-suave px-3 py-2 text-mini text-alerta"
        >
          Sua conta existe, mas não tem permissão para essa parte do painel.
        </p>
      ) : null}

      <Cartao className="mt-5">
        <FormularioEntrar de={de} />
      </Cartao>
    </main>
  );
}
