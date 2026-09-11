/**
 * O instrutor toca em observações durante a sessão inteira. Se o Wi-Fi cair e
 * ele não souber, o toque dele vira erro invisível — e depois a nota da equipe
 * não bate com o que ele viu. Por isso o estado da conexão é permanente na
 * tela dele, não um aviso que aparece e desaparece.
 *
 * "pendentes" é quantos toques estão na fila local esperando a rede voltar.
 */
export function AvisoRede({ online, pendentes = 0 }: { online: boolean; pendentes?: number }) {
  if (online && pendentes === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 font-dados text-micro tracking-[0.1em] text-acento uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-acento" aria-hidden="true" />
        Online
      </span>
    );
  }

  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 font-dados text-micro tracking-[0.1em] text-alerta uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-alerta" aria-hidden="true" />
        Enviando {pendentes}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-base bg-perigo-suave px-2 py-1 font-dados text-micro tracking-[0.1em] text-perigo uppercase">
      <span className="h-1.5 w-1.5 rounded-full bg-perigo" aria-hidden="true" />
      Sem rede · {pendentes} guardado{pendentes === 1 ? "" : "s"}
    </span>
  );
}
