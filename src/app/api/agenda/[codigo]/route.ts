import { lerConfig } from "@/lib/dados";
import { lerCartao } from "@/lib/fila";
import { normalizarCodigo } from "@/lib/codigo";
import { montarIcs } from "@/lib/agenda";

/**
 * Entrega o convite de calendário da equipe.
 *
 * Não exige o cookie de propósito: o código já é o segredo, e a pessoa pode
 * querer abrir isso no computador enquanto o celular está com outro integrante.
 * O que vai dentro do arquivo é só o que a equipe já vê no próprio cartão.
 */
export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo: bruto } = await params;
  const codigo = normalizarCodigo(decodeURIComponent(bruto));

  if (!codigo) return new Response("Código inválido", { status: 400 });

  const [config, cartao] = await Promise.all([lerConfig(), lerCartao(codigo)]);
  if (!cartao) return new Response("Equipe não encontrada", { status: 404 });

  const inicio = cartao.estimativaDe ? new Date(cartao.estimativaDe) : new Date();

  const ics = montarIcs({
    nomeEvento: config.nome_evento,
    equipe: cartao.equipe.nome,
    codigo: cartao.equipe.codigo_acesso,
    inicio,
    duracaoMin: config.duracao_sessao_min,
    minutosDeAviso: 10,
  });

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="escape-quimico-${codigo}.ics"`,
      "cache-control": "no-store",
    },
  });
}
