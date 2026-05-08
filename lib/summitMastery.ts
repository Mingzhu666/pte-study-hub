import type { CommandTarget } from '@/data/commandMap';

export const STORAGE_KEY = 'pte-summit-mastery-v1';

export interface MasteryEntry {
  checked: string[];
}

export interface SummitMasteryState {
  target: CommandTarget;
  mastery: Record<string, MasteryEntry>;
}

export interface ModuleCompletion {
  checked: number;
  total: number;
  percent: number;
}

export interface NextFocus {
  moduleId: string | null;
  remaining: number;
}

export interface TotalMastery {
  masteredCount: number;
  totalModules: number;
  pointsChecked: number;
  pointsTotal: number;
}

export function createInitialState(): SummitMasteryState {
  return { target: 'eight', mastery: {} };
}

export function loadState(): SummitMasteryState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<SummitMasteryState>;
    if (parsed.target !== 'seven' && parsed.target !== 'eight') return createInitialState();

    const mastery: Record<string, MasteryEntry> = {};
    if (parsed.mastery && typeof parsed.mastery === 'object' && !Array.isArray(parsed.mastery)) {
      for (const [moduleId, entry] of Object.entries(parsed.mastery)) {
        const checkedRaw = (entry as MasteryEntry | undefined)?.checked;
        if (Array.isArray(checkedRaw)) {
          mastery[moduleId] = { checked: checkedRaw.filter((id): id is string => typeof id === 'string') };
        }
      }
    }
    return { target: parsed.target, mastery };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: SummitMasteryState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or disabled; failing silently is acceptable here.
  }
}

export function setTarget(state: SummitMasteryState, target: CommandTarget): SummitMasteryState {
  if (state.target === target) return state;
  return { ...state, target };
}

export function toggleStrategy(
  state: SummitMasteryState,
  moduleId: string,
  strategyId: string,
): SummitMasteryState {
  const current = state.mastery[moduleId] ?? { checked: [] };
  const has = current.checked.includes(strategyId);
  const nextChecked = has
    ? current.checked.filter((id) => id !== strategyId)
    : [...current.checked, strategyId];

  return {
    ...state,
    mastery: {
      ...state.mastery,
      [moduleId]: { checked: nextChecked },
    },
  };
}

export function getModuleCompletion(
  state: SummitMasteryState,
  moduleId: string,
  total: number,
): ModuleCompletion {
  const rawChecked = state.mastery[moduleId]?.checked.length ?? 0;
  const safeTotal = Math.max(total, 0);
  const safeChecked = Math.min(Math.max(rawChecked, 0), safeTotal);
  const percent = safeTotal === 0 ? 0 : Math.round((safeChecked / safeTotal) * 100);
  return { checked: safeChecked, total: safeTotal, percent };
}

export function getNextFocus(
  state: SummitMasteryState,
  priorityOrder: string[],
  totals: Map<string, number>,
): NextFocus {
  for (const moduleId of priorityOrder) {
    const total = totals.get(moduleId) ?? 0;
    if (total === 0) continue;
    const checked = state.mastery[moduleId]?.checked.length ?? 0;
    if (checked < total) {
      return { moduleId, remaining: total - checked };
    }
  }
  return { moduleId: null, remaining: 0 };
}

export function getTotalMastery(
  state: SummitMasteryState,
  climbModuleIds: string[],
  totals: Map<string, number>,
): TotalMastery {
  let masteredCount = 0;
  let pointsChecked = 0;
  let pointsTotal = 0;

  for (const id of climbModuleIds) {
    const total = totals.get(id) ?? 0;
    const checked = state.mastery[id]?.checked.length ?? 0;
    pointsTotal += total;
    pointsChecked += Math.min(checked, total);
    if (total > 0 && checked >= total) masteredCount += 1;
  }

  return {
    masteredCount,
    totalModules: climbModuleIds.length,
    pointsChecked,
    pointsTotal,
  };
}
