import { cookies } from "next/headers";

/**
 * O jogador não tem senha e não deveria ter: ele está em pé no meio da feira,
 * com uma mão livre. O celular dele guarda o código da equipe num cookie, e a
 * raiz do site usa isso para levá-lo de volta ao lugar certo — pode fechar o
 * navegador, abrir de novo, e cai na própria fila.
 *
 * httpOnly porque nada no navegador precisa ler o código: quem lê é o servidor.
 */
const COOKIE = "equipe";
const DOZE_HORAS = 60 * 60 * 12;

export async function lerCodigoGuardado(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

/** Só pode ser chamado de dentro de uma ação de servidor. */
export async function guardarCodigo(codigo: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, codigo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DOZE_HORAS,
  });
}

export async function esquecerCodigo(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
