export const DEFAULT_CORE_MAX_RESULTS_CAP = 100;
export const HARD_CORE_MAX_RESULTS_CAP = 500;

export function getCoreMaxResultsCap(): number {
  const raw = process.env.CORE_MAX_RESULTS_CAP || '';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_CORE_MAX_RESULTS_CAP;
  return Math.max(1, Math.min(Math.floor(parsed), HARD_CORE_MAX_RESULTS_CAP));
}
