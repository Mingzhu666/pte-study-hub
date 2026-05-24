import type { CommandTarget } from '@/data/commandMap';

export const STORAGE_KEY = 'pte-summit-mastery-v2';

export interface MasteryEntry {
  checked: string[];
}

export interface ModuleGameResult {
  passed: boolean;
}

export interface SummitMasteryState {
  target: CommandTarget;
  mastery: Record<string, MasteryEntry>;
  gameResults?: Record<string, ModuleGameResult>;
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

export interface RouteMastery extends TotalMastery {
  isComplete: boolean;
}

function masteryKey(target: CommandTarget, moduleId: string): string {
  return `${target}:${moduleId}`;
}

function moduleRequiresGame(moduleId: string): boolean {
  return (
    moduleId === 'wfd' ||
    moduleId === 'rs' ||
    moduleId === 'r-fib' ||
    moduleId === 'rw-fib' ||
    moduleId === 'essay' ||
    moduleId === 'sst'
  );
}

function gamePassed(state: SummitMasteryState, moduleId: string): boolean {
  return state.gameResults?.[masteryKey(state.target, moduleId)]?.passed === true;
}

function effectiveTotal(moduleId: string, total: number): number {
  return moduleRequiresGame(moduleId) && total > 0 ? total + 1 : total;
}

function effectiveChecked(state: SummitMasteryState, moduleId: string, checked: number, total: number): number {
  const safeChecked = Math.min(Math.max(checked, 0), Math.max(total, 0));
  if (!moduleRequiresGame(moduleId) || total === 0) return safeChecked;
  return safeChecked + (gamePassed(state, moduleId) ? 1 : 0);
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
    const gameResults: Record<string, ModuleGameResult> = {};
    if (parsed.gameResults && typeof parsed.gameResults === 'object' && !Array.isArray(parsed.gameResults)) {
      for (const [moduleId, result] of Object.entries(parsed.gameResults)) {
        if (typeof (result as ModuleGameResult | undefined)?.passed === 'boolean') {
          gameResults[moduleId] = { passed: (result as ModuleGameResult).passed };
        }
      }
    }
    return Object.keys(gameResults).length > 0 ? { target: parsed.target, mastery, gameResults } : { target: parsed.target, mastery };
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

export function resetMastery(state: SummitMasteryState): SummitMasteryState {
  return { target: state.target, mastery: {} };
}

export function setModuleGameResult(
  state: SummitMasteryState,
  moduleId: string,
  passed: boolean,
): SummitMasteryState {
  return {
    ...state,
    gameResults: {
      ...state.gameResults,
      [masteryKey(state.target, moduleId)]: { passed },
    },
  };
}

export function toggleStrategy(
  state: SummitMasteryState,
  moduleId: string,
  strategyId: string,
): SummitMasteryState {
  const key = masteryKey(state.target, moduleId);
  const current = state.mastery[key] ?? { checked: [] };
  const has = current.checked.includes(strategyId);
  const nextChecked = has
    ? current.checked.filter((id) => id !== strategyId)
    : [...current.checked, strategyId];

  return {
    ...state,
    mastery: {
      ...state.mastery,
      [key]: { checked: nextChecked },
    },
  };
}

export function getModuleCompletion(
  state: SummitMasteryState,
  moduleId: string,
  total: number,
): ModuleCompletion {
  const rawChecked = state.mastery[masteryKey(state.target, moduleId)]?.checked.length ?? 0;
  const safeTotal = Math.max(total, 0);
  const totalWithGate = effectiveTotal(moduleId, safeTotal);
  const checkedWithGate = effectiveChecked(state, moduleId, rawChecked, safeTotal);
  const percent = totalWithGate === 0 ? 0 : Math.round((checkedWithGate / totalWithGate) * 100);
  return { checked: checkedWithGate, total: totalWithGate, percent };
}

export function getNextFocus(
  state: SummitMasteryState,
  priorityOrder: string[],
  totals: Map<string, number>,
): NextFocus {
  for (const moduleId of priorityOrder) {
    const baseTotal = totals.get(moduleId) ?? 0;
    const total = effectiveTotal(moduleId, baseTotal);
    if (total === 0) continue;
    const rawChecked = state.mastery[masteryKey(state.target, moduleId)]?.checked.length ?? 0;
    const checked = effectiveChecked(state, moduleId, rawChecked, baseTotal);
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
    const baseTotal = totals.get(id) ?? 0;
    const total = effectiveTotal(id, baseTotal);
    const rawChecked = state.mastery[masteryKey(state.target, id)]?.checked.length ?? 0;
    const checked = effectiveChecked(state, id, rawChecked, baseTotal);
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

export function getRouteMastery(
  state: SummitMasteryState,
  routeModuleIds: string[],
  totals: Map<string, number>,
): RouteMastery {
  const totalMastery = getTotalMastery(state, routeModuleIds, totals);
  return {
    ...totalMastery,
    isComplete: totalMastery.totalModules > 0 && totalMastery.masteredCount === totalMastery.totalModules,
  };
}
