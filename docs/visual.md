# Direção visual

**Caderno de laboratório sob pressão.** A referência não é site de produto: é a página de
anotação de bancada — tinta quase preta, número grande na margem, fita de risco na porta do
que está fechado.

**O fundo é liso.** Houve uma tentativa de quadriculado com grão e ela foi reprovada: grade
fina de fundo é hoje marca de site gerado por IA, exatamente o efeito que esta direção
existe para evitar. Textura de fundo não volta.

Este arquivo existe porque site sem restrição escrita volta para a média: fundo branco,
cartão com borda de 1px, três colunas iguais, tudo com o mesmo peso. A lista abaixo é
fechada. **Recurso que não está aqui não entra sem entrar aqui primeiro.**

## Os oito recursos permitidos

| Recurso | Onde | Regra |
|---|---|---|
| Tinta editorial | manchete de cada tela | `titulo-editorial`: Bricolage 800, `-0.03em`, caixa alta. Número em `acento`. |
| Índice na margem | acima da manchete | Mono, `01 — ENTRADA`. Numera a tela dentro do fluxo. |
| Célula de elemento | estações, atalhos | O desenho da marca repetido como estrutura. Número em cima, sigla embaixo. |
| Sombra dura | **um** objeto por tela | Deslocada, sem desfoque. É o objeto principal daquela tela, não decoração. |
| Fita de risco | o que está fechado | Listrada a −45°. Só para bloqueado ou interrompido. Nunca enfeite. |
| Escala graduada | quantidade contável | A régua da bureta: vagas livres, tempo restante. |

Seis recursos, e o fundo não é um deles. O que carrega a identidade tem que resistir a
olhar de perto: tipografia, estrutura e número de verdade — não pano de fundo.

## O que é proibido

- **Textura de fundo.** Quadriculado, malha de pontos, grão, gradiente sutil. Tudo isso é
  assinatura de gerador, e nenhum deles sobrevive a alguém olhando com atenção.
- **Borda de 1px em tudo.** Achata a hierarquia e é o que faz tela parecer lista de caixas.
  Cartão de lista é `plano`; só o objeto principal ganha sombra.
- **Coluna centrada fechada.** Ao menos uma régua sai pela borda da tela em cada layout.
- **Tamanho de fonte fora da escala** de `globals.css`.
- **Cor fora das duas paletas**, e nenhuma cor nova sem contraste medido.
- **Molécula, béquer ou átomo de enfeite.** A química aparece por célula de elemento, seta de
  reação e escala graduada — objetos que também informam.
- **Movimento** além da seta que anda 4 px e do líquido que baixa.

## Tipografia

Bricolage Grotesque (display) · IBM Plex Sans (texto) · IBM Plex Mono (dados e rótulos).

As três variáveis de fonte ficam no **`<html>`**, nunca no `<body>`. Em `:root` é onde
`globals.css` monta as famílias, e `var()` indefinida dentro de `font-family` invalida a
declaração inteira — o site cai para a fonte do navegador sem dar nenhum erro. Já aconteceu:
durante sete etapas o site renderizou em Arial com Bricolage baixada e nunca usada.
`testes/visual.test.ts` guarda isso.

## Contraste

36 pares medidos em número, não no olho: 4.5:1 para texto, 3:1 para borda de campo
(WCAG 2.2 1.4.11), 7:1 para corpo. O script é `scripts/contraste.py`: mudou cor em
`globals.css`, roda de novo antes de publicar.

A borda de campo passou de 1.67:1 para 3.08:1 nesta revisão — a anterior reprovava.

## Voz

Cada tela fala com quem está na frente dela, e só com essa pessoa:

- **Totem, cadastro, fila, resultado** → a equipe, no plural: *vocês*. Nunca menciona painel,
  variável de ambiente, `/admin` ou qualquer coisa que a equipe não possa resolver.
- **Painel do instrutor** → quem conduz, no imperativo curto: *toque no que você vê*.
- **Painel da administração** → a organização, impessoal: *a organização muda aqui*. Não é
  recado para uma pessoa específica; seis equipes usam este site.

Erro de sistema nunca vira culpa de quem está usando. *"E-mail ou senha não conferem"* é para
credencial errada; falha de serviço diz que é falha de serviço.
