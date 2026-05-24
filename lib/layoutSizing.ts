export const DEFAULT_SPLIT_PERCENT = 60;
export const MIN_SPLIT_PERCENT = 30;
export const MAX_SPLIT_PERCENT = 72;

interface SplitRect {
  left: number;
  width: number;
}

export function clampSplitPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPLIT_PERCENT;
  }

  return Math.min(MAX_SPLIT_PERCENT, Math.max(MIN_SPLIT_PERCENT, Math.round(value)));
}

export function splitPercentFromPointer(clientX: number, rect: SplitRect): number {
  if (rect.width <= 0) {
    return DEFAULT_SPLIT_PERCENT;
  }

  return clampSplitPercent(((clientX - rect.left) / rect.width) * 100);
}
