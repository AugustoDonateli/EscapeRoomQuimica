"use client";

import { useActionState, useState } from "react";
import { salvarConfig } from "./acoes";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Interruptor } from "@/components/ui/Interruptor";
import { Rotulo } from "@/components/ui/Cartao";
import { calcularCapacidade } from "@/lib/capacidade";
import type { Config } from "@/lib/dados";

function Grupo({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-linha pt-4">
      <legend className="font-display text-medio font-bold">{titulo}</legend>
      {nota ? <p className="mt-1 max-w-[62ch] text-mini text-tinta-2">{nota}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function FormularioConfig({ config }: { config: Config }) {
  const [resultado, acao, enviando] = useActionState(salvarConfig, null);

  // Só estes quatro precisam de estado: são os que mudam a capacidade do dia,
  // e ver esse número mexer enquanto se ajusta é o ponto desta tela.
  const [abre, setAbre] = useState(config.abre_em?.slice(0, 5) ?? "08:00");
  const [fecha, setFecha] = useState(config.fecha_em?.slice(0, 5) ?? "14:00");
  const [duracao, setDuracao] = useState(String(config.duracao_sessao_min));
  const [reset, setReset] = useState(String(config.reset_min));
  const [equipeMax, setEquipeMax] = useState(String(config.equipe_max));

  const capacidade = calcularCapacidade({
    abre_em: abre,
    fecha_em: fecha,
    duracao_sessao_min: Number(duracao) || 0,
    reset_min: Number(reset) || 0,
    equipe_max: Number(equipeMax) || 0,
  });

  return (
    <form action={acao} className="flex flex-col gap-8">
      <Grupo titulo="O evento" nota="Data e horário vêm da organização da feira.">
        <Campo id="nome_evento" name="nome_evento" etiqueta="Nome do evento" defaultValue={config.nome_evento} required />
        <Campo id="data_evento" name="data_evento" etiqueta="Data" type="date" defaultValue={config.data_evento ?? ""} ajuda="Pode ficar em branco até a feira ter data." />
        <Campo id="abre_em" name="abre_em" etiqueta="Abre às" type="time" value={abre} onChange={(e) => setAbre(e.target.value)} required />
        <Campo id="fecha_em" name="fecha_em" etiqueta="Fecha às" type="time" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      </Grupo>

      <Grupo
        titulo="A sessão"
        nota="Estes dois números vêm da equipe das estações. O reset é o tempo de rearmar a sala entre uma equipe e a próxima — sem ele na conta, a fila mente desde a primeira sessão."
      >
        <Campo id="duracao_sessao_min" name="duracao_sessao_min" etiqueta="Duração-alvo (min)" type="number" min={5} max={180} value={duracao} onChange={(e) => setDuracao(e.target.value)} required />
        <Campo id="reset_min" name="reset_min" etiqueta="Reset entre sessões (min)" type="number" min={0} max={60} value={reset} onChange={(e) => setReset(e.target.value)} required />
      </Grupo>

      <div className="rounded-base border border-acento bg-acento-suave p-4">
        <Rotulo>Capacidade do dia, com estes números</Rotulo>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tabular font-display text-grande leading-none font-extrabold text-acento">
            {capacidade.sessoes}
          </span>
          <span className="text-mini text-tinta-2">
            sessões · até <strong className="tabular font-semibold text-tinta">{capacidade.jogadores}</strong> jogadores
          </span>
        </p>
        <p className="mt-2 text-mini text-tinta-2">
          {capacidade.minutosDeFeira} minutos de feira ÷ {capacidade.minutosPorSessao} minutos por
          equipe. Quando o dia enche, o agendamento fecha — é melhor dizer não às nove da manhã do
          que às treze, depois de três horas de espera.
        </p>
      </div>

      <Grupo titulo="As equipes" nota="Tamanho mínimo e máximo de uma equipe de jogadores.">
        <Campo id="equipe_min" name="equipe_min" etiqueta="Mínimo de jogadores" type="number" min={1} max={20} defaultValue={config.equipe_min} required />
        <Campo id="equipe_max" name="equipe_max" etiqueta="Máximo de jogadores" type="number" min={1} max={20} value={equipeMax} onChange={(e) => setEquipeMax(e.target.value)} required />
      </Grupo>

      <Grupo titulo="A fila" nota="Quando os lotes abrem e quanto tempo a equipe chamada tem para aparecer.">
        <Campo id="lote_manha_abre_em" name="lote_manha_abre_em" etiqueta="Lote da manhã abre às" type="time" defaultValue={config.lote_manha_abre_em?.slice(0, 5)} required />
        <Campo id="lote_tarde_abre_em" name="lote_tarde_abre_em" etiqueta="Lote da tarde abre às" type="time" defaultValue={config.lote_tarde_abre_em?.slice(0, 5)} required />
        <Campo id="ausencia_tolerancia_min" name="ausencia_tolerancia_min" etiqueta="Tolerância de ausência (min)" type="number" min={1} max={30} defaultValue={config.ausencia_tolerancia_min} ajuda="Chamou, passou esse tempo, perde a vez." required />
      </Grupo>

      <Grupo titulo="As perguntas" nota="Tempo padrão por pergunta, tentativas e o desconto por dica.">
        <Campo id="tempo_limite_pergunta_s" name="tempo_limite_pergunta_s" etiqueta="Tempo por pergunta (s)" type="number" min={15} max={600} defaultValue={config.tempo_limite_pergunta_s} required />
        <Campo id="tentativas_por_pergunta" name="tentativas_por_pergunta" etiqueta="Tentativas por pergunta" type="number" min={1} max={10} defaultValue={config.tentativas_por_pergunta} ajuda="Cada tentativa fica registrada e conta na precisão." required />
        <Campo id="penalidade_dica" name="penalidade_dica" etiqueta="Penalidade por dica" type="number" step="0.01" min={0} max={0.5} defaultValue={config.penalidade_dica} ajuda="0,05 desconta 5% da precisão." required />
      </Grupo>

      <Grupo
        titulo="O placar"
        nota="Os quatro pesos precisam somar exatamente 1 — o banco também recusa se não somarem. A parte do instrutor é a única subjetiva, e é de propósito que ela seja a menor."
      >
        <Campo id="peso_progresso" name="peso_progresso" etiqueta="Peso do progresso" type="number" step="0.05" min={0} max={1} defaultValue={config.peso_progresso} required />
        <Campo id="peso_precisao" name="peso_precisao" etiqueta="Peso da precisão" type="number" step="0.05" min={0} max={1} defaultValue={config.peso_precisao} required />
        <Campo id="peso_tempo" name="peso_tempo" etiqueta="Peso do tempo" type="number" step="0.05" min={0} max={1} defaultValue={config.peso_tempo} required />
        <Campo id="peso_instrutor" name="peso_instrutor" etiqueta="Peso do instrutor" type="number" step="0.05" min={0} max={1} defaultValue={config.peso_instrutor} required />
        <Campo id="corte_categoria" name="corte_categoria" etiqueta="Corte entre categorias" type="number" step="0.1" min={1} max={12} defaultValue={config.corte_categoria} ajuda="Média de ano da equipe abaixo disso entra como iniciante." required />
      </Grupo>

      <Grupo titulo="Decisões em aberto" nota="Ficam como chave: a organização muda aqui, sem ninguém mexer no código.">
        <Interruptor id="usar_categorias" name="usar_categorias" etiqueta="Ranquear em duas categorias" ajuda="Iniciante e avançado, pela média de ano da equipe." defaultChecked={config.usar_categorias} />
        <Interruptor id="nota_individual_no_premio" name="nota_individual_no_premio" etiqueta="Nota individual conta no prêmio da equipe" ajuda="Desligado, ela vira só reconhecimento — o destaque da sessão." defaultChecked={config.nota_individual_no_premio} />
        <Interruptor id="ordem_livre" name="ordem_livre" etiqueta="A equipe pode fazer as estações em qualquer ordem" ajuda="Desligado, só a estação seguinte à última concluída abre — é o que impede ler o QR da última e pular o jogo." defaultChecked={config.ordem_livre} />
        <Interruptor id="detectar_saida_de_tela" name="detectar_saida_de_tela" etiqueta="Registrar quando o jogador sai da tela" ajuda="Dissuade pesquisa no celular, mas gera falso positivo com ligação e notificação." defaultChecked={config.detectar_saida_de_tela} />
      </Grupo>

      {resultado ? (
        <p
          role="status"
          className={`rounded-base px-3 py-2 text-mini ${
            resultado.ok ? "bg-acento-suave text-acento" : "bg-perigo-suave text-perigo"
          }`}
        >
          {resultado.ok ? resultado.mensagem : resultado.erro}
        </p>
      ) : null}

      <div>
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar configuração"}
        </Botao>
      </div>
    </form>
  );
}
