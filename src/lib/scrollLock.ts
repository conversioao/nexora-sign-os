/**
 * scrollLock — trava do scroll do documento, com contagem de referências.
 *
 * Porque existe: o `Modal` fazia `document.body.style.overflow = 'hidden'` ao
 * abrir e `= ''` ao fechar. Com dois modais sobrepostos, o primeiro a fechar
 * libertava o scroll enquanto o outro continuava aberto; e se um modal
 * permanecesse montado (por exemplo dentro de um painel escondido por CSS em
 * vez de desmontado), a trava ficava presa PARA SEMPRE — a página deixava de
 * rolar em todo o lado.
 *
 * A contagem de referências resolve o caso de vários modais. O
 * `forceReleaseBodyScroll` é a rede de segurança: chamado na mudança de rota,
 * garante que nenhuma trava órfã sobrevive a uma navegação.
 */

let lockCount = 0;

/** Valor original do `overflow` do body, para reposição fiel. */
let originalOverflow: string | null = null;

function body(): HTMLElement | null {
  return typeof document !== 'undefined' ? document.body : null;
}

export function lockBodyScroll(): void {
  const el = body();
  if (!el) return;

  lockCount += 1;
  if (lockCount === 1) {
    originalOverflow = el.style.overflow;
    el.style.overflow = 'hidden';
  }
}

export function unlockBodyScroll(): void {
  const el = body();
  if (!el) return;

  lockCount -= 1;
  if (lockCount <= 0) {
    lockCount = 0;
    el.style.overflow = originalOverflow ?? '';
    originalOverflow = null;
  }
}

/**
 * Liberta a trava incondicionalmente, independentemente da contagem.
 * Usado na mudança de rota: se algo ficou preso, deixa de estar.
 */
export function forceReleaseBodyScroll(): void {
  const el = body();
  if (!el) return;
  lockCount = 0;
  el.style.overflow = originalOverflow ?? '';
  originalOverflow = null;
}

/** Diagnóstico (útil em testes e para depurar uma página que não rola). */
export function getScrollLockCount(): number {
  return lockCount;
}
