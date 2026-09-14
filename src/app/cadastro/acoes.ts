"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { lerConfig } from "@/lib/dados";
import { cadastrarEquipe, estadoDoAgendamento, jaEstaNaFila, type Integrante } from "@/lib/fila";
import { guardarCodigo } from "@/lib/sessao-jogador";

/**
 * Esta ação é pública: o jogador não faz login. Ações de servidor são
 * alcançáveis por POST direto, sem passar pela tela — então tudo que decide se
 * o cadastro pode acontecer é conferido aqui, e não no formulário:
 * se o agendamento está aberto, se há vaga, o tamanho da equipe, os anos
 * declarados e se essa equipe já está na fila.
 */

const esquemaIntegrante = z.object({
  nome: z.string().trim().min(2, "Todo integrante precisa de nome.").max(60),
  ano_escolar: z.number().int().min(1).max(12),
});

export type ResultadoCadastro = { erro: string } | null;

export async function cadastrar(
  _anterior: ResultadoCadastro,
  dados: FormData,
): Promise<ResultadoCadastro> {
  const config = await lerConfig();
  const estado = await estadoDoAgendamento(config);

  if (!estado.aberto) return { erro: estado.detalhe };

  const nome = String(dados.get("nome") ?? "").trim();
  const email = String(dados.get("email_capitao") ?? "").trim();
  const consentiu = dados.get("consentimento") === "on";
  const brutoIntegrantes = String(dados.get("integrantes") ?? "[]");

  if (!consentiu) {
    return { erro: "Precisamos do seu ok para guardar os dados da equipe." };
  }

  if (nome.length < 2 || nome.length > 60) {
    return { erro: "O nome da equipe precisa ter de 2 a 60 letras." };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { erro: "Confira o e-mail do capitão." };
  }

  let integrantes: Integrante[];
  try {
    const lista = z.array(esquemaIntegrante).parse(JSON.parse(brutoIntegrantes));
    integrantes = lista;
  } catch {
    return { erro: "Confira os integrantes: cada um precisa de nome e ano escolar." };
  }

  if (integrantes.length < config.equipe_min || integrantes.length > config.equipe_max) {
    return {
      erro: `A equipe precisa ter de ${config.equipe_min} a ${config.equipe_max} jogadores.`,
    };
  }

  const anosValidos = new Set(config.anos_participantes);
  if (integrantes.some((i) => !anosValidos.has(i.ano_escolar))) {
    return { erro: "Algum ano escolar não está entre os que participam da feira." };
  }

  // Uma pessoa cadastrando três equipes para pegar posição melhor é o abuso
  // mais óbvio de uma fila do dia. Um e-mail, uma equipe na fila.
  const jaTem = await jaEstaNaFila(email);
  if (jaTem) {
    return {
      erro: `Já existe uma equipe na fila com este e-mail. O código dela é ${jaTem} — abra /fila/${jaTem}.`,
    };
  }

  const criado = await cadastrarEquipe({
    nome,
    email_capitao: email,
    integrantes,
    lote: estado.lote,
  });

  if (!criado.ok) return { erro: criado.erro };

  await guardarCodigo(criado.codigo);
  redirect(`/fila/${criado.codigo}?novo=1`);
}
