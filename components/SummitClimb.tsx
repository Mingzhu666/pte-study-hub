'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { commandNodes, targetProfiles, type CommandNode, type CommandTarget } from '@/data/commandMap';
import { useLanguage } from '@/context/LanguageContext';
import { buildStrategyList } from '@/lib/strategyChecklist';
import {
  createInitialState,
  loadState,
  saveState,
  setTarget,
  toggleStrategy,
  getModuleCompletion,
  getNextFocus,
  getTotalMastery,
  type SummitMasteryState,
} from '@/lib/summitMastery';
import type { PTEModule } from '@/types/pte';
import MissionPanel from './MissionPanel';
import SummitOnboarding from './SummitOnboarding';

const categoryColors: Record<PTEModule['category'], string> = {
  speaking: '#FF375F',
  writing: '#0071E3',
  reading: '#30D158',
  listening: '#BF5AF2',
};

interface Props {
  modules: PTEModule[];
  onOpenModule: (module: PTEModule) => void;
}

interface Layout {
  main: { node: CommandNode; x: number; y: number; index: number }[];
  side: { node: CommandNode; x: number; y: number }[];
}

function priorityRank(node: CommandNode, target: CommandTarget): number {
  const order = { focus: 0, active: 1, support: 2, low: 3 } as const;
  const tier = order[node.priority[target]];
  const route = targetProfiles[target].route;
  const inRoute = route.indexOf(node.id);
  const support = targetProfiles[target].support;
  const inSupport = support.indexOf(node.id);
  // Within tier, sort by route order, then support order, then label.
  const seq = inRoute >= 0 ? inRoute : inSupport >= 0 ? 100 + inSupport : 200;
  return tier * 1000 + seq;
}

function computeLayout(target: CommandTarget): Layout {
  const main: Layout['main'] = [];
  const side: Layout['side'] = [];

  const ordered = [...commandNodes].sort((a, b) => priorityRank(a, target) - priorityRank(b, target));

  const mainList = ordered.filter((n) => n.priority[target] !== 'low');
  const sideList = ordered.filter((n) => n.priority[target] === 'low');

  const yMin = 14;
  const yMax = 86;
  const totalSteps = Math.max(mainList.length - 1, 1);

  mainList.forEach((node, index) => {
    const y = yMin + (index / totalSteps) * (yMax - yMin);
    const x = 50 + Math.sin(index * 0.95) * 18;
    main.push({ node, x, y, index });
  });

  sideList.forEach((node, index) => {
    const x = 80 + (index % 2 === 0 ? -6 : 6);
    const y = 88 + Math.floor(index / 2) * 5;
    side.push({ node, x, y });
  });

  return { main, side };
}

function buildPathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  const segments: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cy = (prev.y + cur.y) / 2;
    segments.push(`C ${prev.x} ${cy}, ${cur.x} ${cy}, ${cur.x} ${cur.y}`);
  }
  return segments.join(' ');
}

export default function SummitClimb({ modules, onOpenModule }: Props) {
  const { t, language } = useLanguage();
  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const [state, setState] = useState<SummitMasteryState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<'onboarding' | 'climbing'>('climbing');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Hydrate from localStorage after mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('pte-summit-mastery-v1');
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(loadState());
      setPhase('climbing');
    } else {
      setPhase('onboarding');
    }
    setHydrated(true);
  }, []);

  // Persist on every state change after hydration.
  useEffect(() => {
    if (hydrated && phase === 'climbing') saveState(state);
  }, [state, hydrated, phase]);

  const target = state.target;
  const layout = useMemo(() => computeLayout(target), [target]);

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of commandNodes) {
      const pteModule = moduleMap.get(node.id);
      const items = pteModule ? buildStrategyList(pteModule, language) : [];
      map.set(node.id, items.length);
    }
    return map;
  }, [moduleMap, language]);

  const climbModuleIds = useMemo(() => commandNodes.map((n) => n.id), []);
  const priorityOrder = useMemo(() => {
    return [...commandNodes].sort((a, b) => priorityRank(a, target) - priorityRank(b, target)).map((n) => n.id);
  }, [target]);

  const nextFocus = useMemo(() => getNextFocus(state, priorityOrder, totals), [state, priorityOrder, totals]);
  const totalMastery = useMemo(() => getTotalMastery(state, climbModuleIds, totals), [state, climbModuleIds, totals]);

  // Default selected node: nextFocus on first climb render, sticky thereafter.
  useEffect(() => {
    if (phase === 'climbing' && !selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(nextFocus.moduleId ?? layout.main[0]?.node.id ?? null);
    }
  }, [phase, selectedId, nextFocus.moduleId, layout.main]);

  if (!hydrated) {
    // Avoid flashing onboarding before hydration when target is already set.
    return <div className="summit-loading" aria-hidden="true" />;
  }

  if (phase === 'onboarding') {
    return (
      <SummitOnboarding
        onPick={(targetChoice) => {
          const next = { ...state, target: targetChoice };
          setState(next);
          saveState(next);
          setPhase('climbing');
        }}
      />
    );
  }

  const selectedNode = commandNodes.find((n) => n.id === selectedId) ?? commandNodes[0];
  const selectedModule = moduleMap.get(selectedNode.id);
  const profile = targetProfiles[target];

  const allPoints = [{ x: 50, y: 8 }, ...layout.main.map((p) => ({ x: p.x, y: p.y })), { x: 50, y: 92 }];
  const pathD = buildPathD(allPoints);

  return (
    <div className="summit-climb">
      <section className="summit-canvas-wrap">
        <header className="summit-banner">
          <div className="summit-target-row">
            <span className="summit-eyebrow">{t('summitTitle')}</span>
            <div className="summit-switch" role="tablist" aria-label="Target">
              {(['seven', 'eight'] as CommandTarget[]).map((tg) => (
                <button
                  key={tg}
                  type="button"
                  role="tab"
                  aria-selected={target === tg}
                  onClick={() => setState((current) => setTarget(current, tg))}
                  className={target === tg ? 'on' : ''}
                >
                  {targetProfiles[tg].label}
                </button>
              ))}
            </div>
          </div>
          <div className="summit-scores">
            {profile.scores.map((s) => (
              <span key={s.skill}>
                <span>{s.skill}</span>
                <strong>{s.value}</strong>
              </span>
            ))}
          </div>
          <p className="summit-coach">
            {nextFocus.moduleId
              ? `${t('nextFocus')} → ${commandNodes.find((n) => n.id === nextFocus.moduleId)?.label} (${nextFocus.remaining} ${t('strategiesRemaining')})`
              : t('routeMastered')}
          </p>
        </header>

        <div className="summit-canvas">
          <svg className="summit-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={pathD} className="summit-path" fill="none" stroke="#1D1D1F" strokeWidth="0.4" />
            {layout.side.length > 0 && (
              <path
                d={`M 50 86 C 65 86, 75 86, 80 88`}
                className="summit-side-path"
                fill="none"
                stroke="rgba(0,0,0,0.18)"
                strokeWidth="0.3"
                strokeDasharray="1 1.4"
              />
            )}
          </svg>

          <div className="summit-peak" style={{ top: '4%' }}>
            <span className="summit-peak-pin" />
            <span className="summit-peak-label">{profile.label}</span>
          </div>

          {layout.main.map(({ node, x, y }) => {
            const completion = getModuleCompletion(state, node.id, totals.get(node.id) ?? 0);
            const isSelected = selectedId === node.id;
            const isNext = nextFocus.moduleId === node.id;
            const pteModule = moduleMap.get(node.id);
            const accent = pteModule ? categoryColors[pteModule.category] : '#0071E3';
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                className={[
                  'summit-checkpoint',
                  isSelected ? 'selected' : '',
                  isNext ? 'next' : '',
                  completion.percent === 100 ? 'mastered' : '',
                ].join(' ')}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  ['--accent' as string]: accent,
                  ['--ring' as string]: `${completion.percent}%`,
                }}
                aria-label={`${node.label} ${completion.percent}%`}
              >
                <span className="checkpoint-ring" aria-hidden="true" />
                <span className="checkpoint-dot" aria-hidden="true">
                  {completion.percent === 100 && <Icons.Flag size={11} strokeWidth={2.4} />}
                </span>
                <span className="checkpoint-label">{node.label}</span>
              </button>
            );
          })}

          {layout.side.map(({ node, x, y }) => {
            const completion = getModuleCompletion(state, node.id, totals.get(node.id) ?? 0);
            const isSelected = selectedId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                className={`summit-side-node ${isSelected ? 'selected' : ''} ${completion.percent === 100 ? 'mastered' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={`${node.label} (${t('lowYieldTier')})`}
              >
                <span>{node.label}</span>
              </button>
            );
          })}
        </div>

        <footer className="summit-base-camp">
          <span className="summit-base-text">
            {totalMastery.masteredCount} / {totalMastery.totalModules} {t('baseCampMastered')} · {totalMastery.pointsChecked} / {totalMastery.pointsTotal} {t('baseCampPoints')}
          </span>
          {layout.side.length > 0 && (
            <span className="summit-base-side">{t('lowYieldTier')}</span>
          )}
        </footer>
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="summit-mission-wrap"
        >
          <MissionPanel
            node={selectedNode}
            module={selectedModule}
            target={target}
            mastery={state.mastery[selectedNode.id]}
            onToggle={(moduleId, strategyId) =>
              setState((current) => toggleStrategy(current, moduleId, strategyId))
            }
            onOpenDetail={onOpenModule}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
