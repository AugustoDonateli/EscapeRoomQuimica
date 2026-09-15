/**
 * Conferência do ambiente.
 *
 * Existe porque a primeira publicação na Vercel mostrou "a server error
 * occurred" e nada mais: sem uma das variáveis, o cliente do Supabase lança
 * exceção na renderização da primeira tela, e a pessoa fica sem saber o que
 * faltou. Falha de configuração tem que dizer o que falta.
 *
 * Só reporta NOME de variável, nunca valor.
 */

export type Variavel = {
  nome: string;
  presente: boolean;
  obrigatoria: boolean;
  paraQue: string;
};

export function conferirAmbiente(): Variavel[] {
  return [
    {
      nome: "NEXT_PUBLIC_SUPABASE_URL",
      presente: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      obrigatoria: true,
      paraQue: "Endereço do projeto Supabase.",
    },
    {
      nome: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      presente: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      obrigatoria: true,
      paraQue: "Chave pública, usada no navegador e no login.",
    },
    {
      nome: "SUPABASE_SERVICE_ROLE_KEY",
      presente: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      obrigatoria: true,
      paraQue: "Chave de serviço, só no servidor. É a que costuma ser esquecida.",
    },
    {
      nome: "NEXT_PUBLIC_SITE_URL",
      presente: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
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

export function ambienteCompleto(): boolean {
  return faltandoNoAmbiente().length === 0;
}
