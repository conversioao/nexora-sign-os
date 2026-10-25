/**
 * Formats duration in seconds to standard MM:SS or HH:MM:SS format
 * e.g. 75 -> "01:15"
 * e.g. 3675 -> "01:01:15"
 */
export function formatDurationClock(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats duration in seconds to human readable Portuguese string
 * e.g. 75 -> "1 min 15 seg" or "01m 15s"
 * e.g. 3600 -> "1 h"
 */
export function formatDurationHuman(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Transition labels in Portuguese
 */
export const TRANSITION_LABELS: Record<string, string> = {
  NONE: 'Sem Transição',
  FADE: 'Fade (Dissolver)',
  SLIDE_LEFT: 'Deslizar Esquerda',
  SLIDE_RIGHT: 'Deslizar Direita',
  ZOOM: 'Zoom Suave',
};

/**
 * Status colors and labels
 */
export const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'purple' | 'neutral' | 'blue'; dotColor: string }
> = {
  ACTIVE: { label: 'Ativa', variant: 'success', dotColor: 'bg-[#10B981]' },
  SCHEDULED: { label: 'Agendada', variant: 'blue', dotColor: 'bg-[#38BDF8]' },
  PAUSED: { label: 'Pausada', variant: 'warning', dotColor: 'bg-[#F59E0B]' },
  DRAFT: { label: 'Rascunho', variant: 'neutral', dotColor: 'bg-[#94A3B8]' },
  ARCHIVED: { label: 'Arquivada', variant: 'neutral', dotColor: 'bg-[#64748B]' },
};
