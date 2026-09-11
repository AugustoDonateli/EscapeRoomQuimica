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
  themeColor: "#f2f5f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
