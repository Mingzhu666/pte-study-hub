'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CommandTarget } from '@/data/commandMap';
import {
  createInitialState,
  loadState,
  saveState,
  resetMastery as resetMasteryAction,
  setModuleGameResult as setModuleGameResultAction,
  setTarget as setTargetAction,
  toggleStrategy as toggleStrategyAction,
  STORAGE_KEY,
  type SummitMasteryState,
} from '@/lib/summitMastery';

interface SummitMasteryContextValue {
  state: SummitMasteryState;
  hydrated: boolean;
  hasStoredState: boolean;
  setTarget: (target: CommandTarget) => void;
  resetMastery: () => void;
  toggleStrategy: (moduleId: string, strategyId: string) => void;
  setModuleGameResult: (moduleId: string, passed: boolean) => void;
  replaceState: (next: SummitMasteryState) => void;
}

const SummitMasteryContext = createContext<SummitMasteryContextValue | undefined>(undefined);

export function SummitMasteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SummitMasteryState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [hasStoredState, setHasStoredState] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(loadState());
      setHasStoredState(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const setTarget = useCallback((target: CommandTarget) => {
    setState((current) => setTargetAction(current, target));
  }, []);

  const resetMastery = useCallback(() => {
    setState((current) => resetMasteryAction(current));
  }, []);

  const toggleStrategy = useCallback((moduleId: string, strategyId: string) => {
    setState((current) => toggleStrategyAction(current, moduleId, strategyId));
  }, []);

  const setModuleGameResult = useCallback((moduleId: string, passed: boolean) => {
    setState((current) => setModuleGameResultAction(current, moduleId, passed));
  }, []);

  const replaceState = useCallback((next: SummitMasteryState) => {
    setState(next);
    setHasStoredState(true);
  }, []);

  const value = useMemo<SummitMasteryContextValue>(
    () => ({
      state,
      hydrated,
      hasStoredState,
      setTarget,
      resetMastery,
      toggleStrategy,
      setModuleGameResult,
      replaceState,
    }),
    [state, hydrated, hasStoredState, setTarget, resetMastery, toggleStrategy, setModuleGameResult, replaceState],
  );

  return <SummitMasteryContext.Provider value={value}>{children}</SummitMasteryContext.Provider>;
}

export function useSummitMastery(): SummitMasteryContextValue {
  const ctx = useContext(SummitMasteryContext);
  if (!ctx) throw new Error('useSummitMastery must be used within SummitMasteryProvider');
  return ctx;
}

export function useTarget(): { target: CommandTarget; setTarget: (target: CommandTarget) => void } {
  const { state, setTarget } = useSummitMastery();
  return { target: state.target, setTarget };
}
