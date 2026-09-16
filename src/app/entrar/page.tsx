import { Marca } from "@/components/marca/Marca";
import { Cartao } from "@/components/ui/Cartao";
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

      <p className="mt-8 font-dados text-micro tracking-[0.22em] text-tinta-3 uppercase">
        acesso restrito
      </p>
      <h1 className="titulo-editorial mt-2 text-[clamp(1.9rem,9vw,2.5rem)] uppercase">
        Entrada da
        <br />
        organização
      </h1>

      <p className="mt-4 text-mini text-tinta-2">
        Quem joga não entra por aqui: a tela da equipe abre pelo QR da entrada, sem senha.
      </p>

      {/* Sem esta linha, quem chega aqui procura um botão de "criar conta" que
          não existe e conclui que o site está quebrado. Aconteceu de verdade. */}
      <p className="mt-2 text-mini text-tinta-2">
        As contas de instrutor, administração e autoria são criadas pela administração da
        plataforma. Esta tela só faz login.
      </p>

      {erro === "sem-permissao" ? (
        <p
          role="alert"
          className="mt-5 rounded-base bg-alerta-suave px-3 py-2 text-mini text-alerta"
        >
          Essa conta existe, mas não alcança essa parte do painel.
        </p>
      ) : null}

      {/* Cartão plano de propósito: o botão primário já tem sombra dura, e duas
          empilhadas viram sujeira na borda em vez de profundidade. */}
      <Cartao className="mt-6">
        <FormularioEntrar de={de} />
      </Cartao>
    </main>
  );
}
