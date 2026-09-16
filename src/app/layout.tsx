import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--fonte-bricolage",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--fonte-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--fonte-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Escape Químico",
  description:
    "Agendamento, condução e avaliação da sala de fuga de química da feira de ciências.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // A plataforma é usada no sol da feira e no escuro da sala: a cor da barra
  // do navegador acompanha o fundo claro, que é onde o jogador começa.
  themeColor: "#f1efe8",
};

/**
 * As variáveis das fontes ficam no <html>, não no <body>, e isso não é
 * preferência de estilo — é o que faz a tipografia existir.
 *
 * globals.css define --fonte-corpo em :root como
 * "var(--fonte-plex-sans), Segoe UI, system-ui, sans-serif". A substituição de
 * um var() dentro de uma custom property acontece no elemento onde a
 * propriedade foi declarada: em :root, que é o próprio <html>. Com
 * --fonte-plex-sans declarada só no <body>, ela não existia em :root, e uma
 * var() indefinida dentro de font-family invalida a declaração INTEIRA em vez
 * de cair para o próximo nome da lista. Resultado: o site inteiro renderizava
 * na fonte padrão do navegador, com Bricolage e Plex baixadas e nunca usadas.
 *
 * <html> é :root, então declarar aqui resolve os dois lados de uma vez.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
