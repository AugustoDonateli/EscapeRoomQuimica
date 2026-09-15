import { chaveDeServico, chavePublica, enderecoDoSite, urlDoSupabase } from "@/lib/supabase/ambiente";

/**
 * Conferência do ambiente.
 *
 * Existe porque a primeira publicação na Vercel mostrou "a server error
 * occurred" e nada mais: sem uma das variáveis, o cliente do Supabase lança
 * exceção na renderização da primeira tela e a pessoa fica sem saber o que
 * faltou. Falha de configuração tem que dizer o que falta.
 *
 * Só reporta NOME de variável, nunca valor.
 */

export type Variavel = {
  nome: string;
  aceitaTambem?: string;
  presente: boolean;
  obrigatoria: boolean;
  paraQue: string;
};

export function conferirAmbiente(): Variavel[] {
  return [
    {
      nome: "SUPABASE_URL",
      aceitaTambem: "NEXT_PUBLIC_SUPABASE_URL",
      presente: Boolean(urlDoSupabase()),
      obrigatoria: true,
      paraQue: "Endereço do projeto Supabase.",
    },
    {
      nome: "SUPABASE_ANON_KEY",
      aceitaTambem: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      presente: Boolean(chavePublica()),
      obrigatoria: true,
      paraQue: "Chave pública, usada no login da equipe organizadora.",
    },
    {
      nome: "SUPABASE_SERVICE_ROLE_KEY",
      presente: Boolean(chaveDeServico()),
      obrigatoria: true,
      paraQue: "Chave de serviço. É a única que realmente não pode vazar.",
    },
    {
      nome: "SITE_URL",
      aceitaTambem: "NEXT_PUBLIC_SITE_URL",
      presente: Boolean(enderecoDoSite()),
      obrigatoria: false,
      paraQue: "Endereço público do site. É o que vai dentro dos QRs impressos.",
    },
    {
      nome: "RESEND_API_KEY",
      presente: Boolean(process.env.RESEND_API_KEY),
      obrigatoria: false,
      paraQue: "E-mail de confirmação. Sem ela, o lembrete é o convite de calendário.",
    },
    {
      nome: "EMAIL_REMETENTE",
      presente: Boolean(process.env.EMAIL_REMETENTE),
      obrigatoria: false,
      paraQue: "Remetente do e-mail, num domínio verificado no Resend.",
    },
  ];
}

/** Nomes das variáveis obrigatórias que estão faltando. */
export function faltandoNoAmbiente(): string[] {
  return conferirAmbiente()
    .filter((v) => v.obrigatoria && !v.presente)
    .map((v) => v.nome);
}

/**
 * Nomes de variável que o ambiente tem e que se parecem com configuração
 * deste projeto, mas não são nenhum dos nomes esperados.
 *
 * Existe por um caso real: as variáveis estavam no painel da Vercel, a
 * publicação era mais nova que elas, e o app insistia que faltavam. Por
 * eliminação só sobrava erro de digitação no nome — mas ninguém acha um
 * `SUPBASE` no meio de um `SUPABASE` olhando. O servidor acha.
 *
 * Só nomes, nunca valores. E só nomes que já parecem ser desta configuração,
 * para não listar o ambiente inteiro da máquina.
 */
export function nomesParecidos(): string[] {
  const esperados = new Set(
    conferirAmbiente().flatMap((v) => [v.nome, v.aceitaTambem]).filter((n): n is string => Boolean(n)),
  );

  const parece = /supa|^next_public_|service_role|resend|remetente|site_url/i;

  return Object.keys(process.env)
    .filter((nome) => parece.test(nome) && !esperados.has(nome))
    .sort();
}

export function ambienteCompleto(): boolean {
  return faltandoNoAmbiente().length === 0;
}
