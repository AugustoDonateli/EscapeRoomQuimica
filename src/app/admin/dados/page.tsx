import { Cartao, Rotulo } from "@/components/ui/Cartao";
import { exigirPapel } from "@/lib/auth";
import { criarClienteServico } from "@/lib/supabase/server";
import { FormularioAnonimizar } from "./formulario";

export const metadata = { title: "Dados pessoais · Escape Químico" };

/**
 * A tela que cumpre o que foi prometido ao jogador no cadastro.
 *
 * Ela existe porque a promessa existe: "apagamos tudo depois do evento" está
 * escrito na tela de consentimento, e promessa sem botão é só texto.
 */
export default async function PaginaDados() {
  await exigirPapel(["admin"]);

  const supabase = criarClienteServico();
  const [{ count: equipes }, { count: jogadores }, { count: avaliacoes }] = await Promise.all([
    supabase.from("team").select("id", { count: "exact", head: true }),
    supabase.from("player").select("id", { count: "exact", head: true }),
    supabase.from("player_feedback").select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      <h1 className="font-display text-titulo font-bold tracking-tight">Dados pessoais</h1>
      <p className="mt-2 max-w-[64ch] text-mini text-tinta-2">
        No cadastro, a plataforma promete a cada equipe que os dados são usados só para
        organizar a fila e o placar, e que são apagados depois do evento. Esta tela é o que
        cumpre essa promessa.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { r: "Equipes", v: equipes ?? 0 },
          { r: "Jogadores", v: jogadores ?? 0 },
          { r: "Avaliações", v: avaliacoes ?? 0 },
        ].map((i) => (
          <div key={i.r} className="rounded-base border border-linha bg-superficie px-3 py-2.5">
            <Rotulo>{i.r}</Rotulo>
            <p className="tabular mt-1 font-display text-grande leading-none font-extrabold">
              {i.v}
            </p>
          </div>
        ))}
      </div>

      <Cartao className="mt-8">
        <Rotulo>O que exatamente acontece</Rotulo>
        <ul className="mt-3 flex flex-col gap-2">
          {[
            "Nome de cada equipe vira “Equipe 1”, “Equipe 2” e assim por diante.",
            "E-mail do capitão vira um endereço inválido e genérico.",
            "Nome de cada jogador vira “Jogador 1”, “Jogador 2”…",
            "Ano escolar fica: ele não identifica ninguém e é o que sustenta a categoria.",
            "Tempos, acertos, dicas, observações, rubrica e pontuação ficam inteiros.",
            "As avaliações já eram anônimas e continuam como estão.",
          ].map((t) => (
            <li key={t} className="flex gap-2.5 text-mini">
              <span className="text-acento" aria-hidden="true">
                ✓
              </span>
              <span className="text-tinta-2">{t}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 rounded-base bg-alerta-suave px-3 py-2.5 text-mini text-alerta">
          Anonimiza em vez de apagar de propósito. Apagar a equipe levaria em cascata a sessão,
          as respostas e a pontuação — o placar da feira desapareceria junto com o registro do
          que vocês construíram. Assim nenhum dado pessoal fica, e a estatística sobrevive.
        </p>
      </Cartao>

      <div className="mt-8 border-t-2 border-perigo pt-5">
        <Rotulo>Fazer agora</Rotulo>
        <p className="mt-2 mb-4 text-mini text-tinta-2">
          Faça isso <strong>depois</strong> da feira e depois de conferir o placar final.
        </p>
        <FormularioAnonimizar />
      </div>
    </>
  );
}
