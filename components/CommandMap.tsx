'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { commandEdges, commandNodes, targetProfiles, type CommandNode } from '@/data/commandMap';
import type { PTEModule } from '@/types/pte';
import {
  getCoachRecommendation,
  getCoreChainStability,
  getFocusCompletion,
  getPracticeStatus,
  getRouteSteps,
  getTodayKey,
  hasPracticedToday,
  markPracticedToday,
  type CommandProgress,
  type CommandTarget,
} from '@/lib/commandMapLogic';

interface CommandMapProps {
  modules: PTEModule[];
  onOpenModule: (module: PTEModule) => void;
}

const STORAGE_KEY = 'pte-command-map-progress-v1';

const categoryColors: Record<PTEModule['category'], string> = {
  speaking: '#FF375F',
  writing: '#0071E3',
  reading: '#30D158',
  listening: '#BF5AF2',
};

const priorityLabels = {
  focus: 'Focus',
  active: 'Active',
  support: 'Maintain',
  low: 'Low Yield',
};

const actionLabels = ['Run Focus Sprint', 'Review Failure Points', 'Lock Today\'s Pattern'];

function getConnectorPath(from: CommandNode, to: CommandNode): string {
  const startY = from.y + 3.4;
  const endY = to.y - 3.6;
  const midY = startY + (endY - startY) * 0.5;

  if (Math.abs(from.x - to.x) < 2) {
    return `M ${from.x} ${startY} V ${endY}`;
  }

  return `M ${from.x} ${startY} V ${midY} H ${to.x} V ${endY}`;
}

function createInitialProgress(): CommandProgress {
  return { target: 'eight', modules: {} };
}

function loadProgress(): CommandProgress {
  if (typeof window === 'undefined') {
    return createInitialProgress();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createInitialProgress();
    const parsed = JSON.parse(stored) as CommandProgress;
    if (parsed.target !== 'seven' && parsed.target !== 'eight') return createInitialProgress();
    return { target: parsed.target, modules: parsed.modules ?? {} };
  } catch {
    return createInitialProgress();
  }
}

export default function CommandMap({ modules, onOpenModule }: CommandMapProps) {
  const today = getTodayKey();
  const moduleMap = useMemo(() => new Map(modules.map((module) => [module.id, module])), [modules]);
  const [progress, setProgress] = useState<CommandProgress>(() => loadProgress());
  const [selectedId, setSelectedId] = useState('rs');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  const target = progress.target;
  const profile = targetProfiles[target];
  const recommendation = getCoachRecommendation(progress, today);
  const completion = getFocusCompletion(progress, today);
  const stability = getCoreChainStability(progress);
  const routeSteps = getRouteSteps(progress, today);

  const selectedNode = commandNodes.find((node) => node.id === selectedId) ?? commandNodes[0];
  const selectedModule = moduleMap.get(selectedNode.id);
  const selectedPractice = progress.modules[selectedNode.id];
  const selectedStatus = getPracticeStatus(selectedPractice);
  const selectedDoneToday = hasPracticedToday(selectedPractice, today);
  const selectedRouteStep = routeSteps.find((step) => step.moduleId === selectedNode.id);

  const relatedIds = useMemo(() => {
    const activeId = hoveredId ?? selectedId;
    return new Set(
      commandEdges
        .filter((edge) => edge.targets.includes(target) && (edge.from === activeId || edge.to === activeId))
        .flatMap((edge) => [edge.from, edge.to]),
    );
  }, [hoveredId, selectedId, target]);

  const updateTarget = (nextTarget: CommandTarget) => {
    setProgress((current) => ({ ...current, target: nextTarget }));
    const nextFocus = getCoachRecommendation({ ...progress, target: nextTarget }, today).nextModuleId;
    setSelectedId(nextFocus);
  };

  const completeNode = (nodeId: string) => {
    const nextProgress = markPracticedToday(progress, nodeId, today);
    setProgress(nextProgress);
    setPulseId(nodeId);
    window.setTimeout(() => setPulseId(null), 900);
    window.setTimeout(() => {
      setSelectedId(getCoachRecommendation(nextProgress, today).nextModuleId);
    }, 520);
  };

  const openDetail = () => {
    if (selectedModule) {
      onOpenModule(selectedModule);
    }
  };

  return (
    <div className="pte-roadmap-page">
      <section className="pte-roadmap-main" aria-label="PTE roadmap">
        <div className="roadmap-canvas">
          <svg className="roadmap-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {commandEdges.map((edge) => {
              const from = commandNodes.find((node) => node.id === edge.from);
              const to = commandNodes.find((node) => node.id === edge.to);
              if (!from || !to) return null;
              const isTargetEdge = edge.targets.includes(target);
              const isRelated = relatedIds.has(edge.from) && relatedIds.has(edge.to);
              const isCompleted = hasPracticedToday(progress.modules[edge.from], today);

              return (
                <motion.path
                  key={`${edge.from}-${edge.to}-${target}`}
                  d={getConnectorPath(from, to)}
                  className={[
                    'roadmap-line',
                    isTargetEdge ? 'target' : '',
                    isRelated ? 'related' : '',
                    isCompleted ? 'completed' : '',
                  ].join(' ')}
                  initial={false}
                  animate={{ opacity: isTargetEdge ? (isRelated ? 1 : 0.72) : 0.18 }}
                />
              );
            })}
          </svg>

          {commandNodes.map((node, index) => {
              const pteModule = moduleMap.get(node.id);
              const color = pteModule ? categoryColors[pteModule.category] : '#6E6E73';
              const priority = node.priority[target];
              const status = getPracticeStatus(progress.modules[node.id]);
              const doneToday = hasPracticedToday(progress.modules[node.id], today);
              const isSelected = selectedId === node.id;
              const isRecommended = recommendation.nextModuleId === node.id;
              const isRelated = relatedIds.has(node.id);
              const isPulse = pulseId === node.id;

              return (
                <motion.button
                  key={node.id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: isPulse ? 1.12 : 1 }}
                  transition={{ delay: index * 0.018, type: 'spring', stiffness: 260, damping: 22 }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(node.id)}
                  onBlur={() => setHoveredId(null)}
                  onClick={() => setSelectedId(node.id)}
                  className={[
                    'road-node',
                    priority,
                    status,
                    node.roadmapWidth ?? 'md',
                    isSelected ? 'selected' : '',
                    isRecommended ? 'recommended' : '',
                    isRelated ? 'related' : '',
                    doneToday ? 'done-today' : '',
                  ].join(' ')}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    ['--node-color' as string]: color,
                  }}
                  aria-label={`${node.label} ${priorityLabels[priority]}`}
                >
                  <span className="road-node-label">{node.label}</span>
                  <span className="road-node-bar" />
                  <span className="road-node-state">
                    {doneToday ? <Icons.Check size={13} /> : isRecommended ? <Icons.Play size={12} /> : priorityLabels[priority]}
                  </span>
                </motion.button>
              );
            })}

            <AnimatePresence>
              {hoveredId && (
                <motion.div
                  key={hoveredId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="roadmap-tooltip"
                >
                  {commandNodes.find((node) => node.id === hoveredId)?.rationale[target]}
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </section>

      <RoadmapSidebar
        target={target}
        profileTitle={profile.title}
        profileSubtitle={profile.subtitle}
        recommendation={recommendation.message}
        completion={completion}
        stability={stability}
        routeSteps={routeSteps}
        selectedNode={selectedNode}
        selectedModule={selectedModule}
        selectedStatus={selectedStatus}
        selectedDoneToday={selectedDoneToday}
        selectedRouteState={selectedRouteStep?.state ?? 'locked'}
        isNext={recommendation.nextModuleId === selectedNode.id}
        onTargetChange={updateTarget}
        onSelectNode={setSelectedId}
        onComplete={() => completeNode(selectedNode.id)}
        onOpenDetail={openDetail}
      />
    </div>
  );
}

interface RoadmapSidebarProps {
  target: CommandTarget;
  profileTitle: string;
  profileSubtitle: string;
  recommendation: string;
  completion: { completed: number; total: number };
  stability: number;
  routeSteps: ReturnType<typeof getRouteSteps>;
  selectedNode: CommandNode;
  selectedModule?: PTEModule;
  selectedStatus: ReturnType<typeof getPracticeStatus>;
  selectedDoneToday: boolean;
  selectedRouteState: 'done' | 'current' | 'locked';
  isNext: boolean;
  onTargetChange: (target: CommandTarget) => void;
  onSelectNode: (id: string) => void;
  onComplete: () => void;
  onOpenDetail: () => void;
}

function RoadmapSidebar({
  target,
  profileTitle,
  profileSubtitle,
  recommendation,
  completion,
  stability,
  routeSteps,
  selectedNode,
  selectedModule,
  selectedStatus,
  selectedDoneToday,
  selectedRouteState,
  isNext,
  onTargetChange,
  onSelectNode,
  onComplete,
  onOpenDetail,
}: RoadmapSidebarProps) {
  return (
    <aside className="roadmap-sidebar">
      <section className="roadmap-progress-card">
        <div className="roadmap-score-row" aria-label="Target scores">
          {targetProfiles[target].scores.map((score) => (
            <span key={score.skill}>{score.skill}{score.value}</span>
          ))}
        </div>

        <div className="target-switch dark" role="tablist" aria-label="PTE target">
          {(['seven', 'eight'] as CommandTarget[]).map((targetId) => (
            <button
              key={targetId}
              type="button"
              role="tab"
              aria-selected={target === targetId}
              onClick={() => onTargetChange(targetId)}
              className={target === targetId ? 'active' : ''}
            >
              {targetProfiles[targetId].label}
            </button>
          ))}
        </div>

        <div className="roadmap-ring" style={{ ['--stability' as string]: `${stability * 3.6}deg` }}>
          <div>
            <strong>{completion.completed}</strong>
            <span>/{completion.total}</span>
            <p>Today</p>
          </div>
        </div>

        <h3>{profileTitle}</h3>
        <p>{profileSubtitle}</p>
      </section>

      <section className="roadmap-coach-card">
        <Icons.Radar size={18} />
        <p>{recommendation}</p>
      </section>

      <section className="roadmap-route-card">
        <div className="route-card-header">
          <span>Route Queue</span>
          <strong>{stability}% stable</strong>
        </div>
        <div className="roadmap-route-list">
          {routeSteps.map((step) => {
            const node = commandNodes.find((item) => item.id === step.moduleId);
            if (!node) return null;
            return (
              <button
                key={step.moduleId}
                type="button"
                className={`roadmap-route-item ${step.state} ${selectedNode.id === step.moduleId ? 'selected' : ''}`}
                onClick={() => onSelectNode(step.moduleId)}
              >
                <span>{step.state === 'done' ? <Icons.Check size={12} /> : step.index + 1}</span>
                {node.label}
              </button>
            );
          })}
        </div>
      </section>

      <ActionPanel
          key={`${target}-${selectedNode.id}-${selectedDoneToday}`}
          node={selectedNode}
          target={target}
        pteModule={selectedModule}
        status={selectedStatus}
        doneToday={selectedDoneToday}
        routeState={selectedRouteState}
        isNext={isNext}
        onComplete={onComplete}
        onOpenDetail={onOpenDetail}
        />
    </aside>
  );
}

interface ActionPanelProps {
  node: CommandNode;
  target: CommandTarget;
  pteModule?: PTEModule;
  status: ReturnType<typeof getPracticeStatus>;
  doneToday: boolean;
  routeState: 'done' | 'current' | 'locked';
  isNext: boolean;
  onComplete: () => void;
  onOpenDetail: () => void;
}

function ActionPanel({ node, target, pteModule, status, doneToday, routeState, isNext, onComplete, onOpenDetail }: ActionPanelProps) {
  const color = pteModule ? categoryColors[pteModule.category] : '#0071E3';
  const priority = node.priority[target];
  const [activeActions, setActiveActions] = useState<number[]>([]);
  const drillCompletion = doneToday ? 100 : Math.round((activeActions.length / actionLabels.length) * 100);

  const toggleAction = (index: number) => {
    setActiveActions((current) => {
      if (current.includes(index)) {
        return current.filter((item) => item !== index);
      }

      return [...current, index];
    });

    if (index === actionLabels.length - 1) {
      onComplete();
    }
  };

  return (
    <aside className="action-panel">
      <div className={`mission-banner ${routeState}`}>
        <Icons.Activity size={16} />
        <span>{isNext ? 'Next recommended action' : routeState === 'done' ? 'Completed in today\'s route' : 'Optional exploration node'}</span>
      </div>

      <div className="panel-header">
        <div className="panel-icon" style={{ background: `${color}14`, color }}>
          <Icons.Crosshair size={20} />
        </div>
        <div>
          <p>{priorityLabels[priority]}</p>
          <h3>{node.label}</h3>
        </div>
      </div>

      <div className="panel-status-row">
        <span className={`status-pill ${status}`}>{status}</span>
        <span className="daily-volume">{node.dailyVolume[target]}</span>
      </div>

      <div className="panel-section">
        <span>Why it matters</span>
        <p>{node.rationale[target]}</p>
      </div>

      <div className="panel-section">
        <span>Failure points</span>
        <ul>
          {node.failurePoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="panel-section drill-actions">
        <div className="drill-header">
          <span>Interactive drill</span>
          <strong>{drillCompletion}% armed</strong>
        </div>
        <div className="drill-progress" aria-hidden="true">
          <span style={{ width: `${drillCompletion}%` }} />
        </div>
        <div>
          {actionLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              className={activeActions.includes(index) || doneToday ? 'active' : ''}
              onClick={() => toggleAction(index)}
            >
              <span>{activeActions.includes(index) || doneToday ? <Icons.Check size={12} /> : index + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="skill-chips">
        {node.skills.map((skill) => (
          <span key={skill} style={{ color: categoryColors[skill], background: `${categoryColors[skill]}12` }}>
            {skill}
          </span>
        ))}
      </div>

      <button type="button" className={`practice-button ${doneToday ? 'done' : ''}`} onClick={onComplete}>
        {doneToday ? <Icons.CheckCircle2 size={18} /> : <Icons.Zap size={18} />}
        {doneToday ? 'Practiced today' : 'Mark practiced today'}
      </button>

      {pteModule && (
        <button type="button" className="detail-button" onClick={onOpenDetail}>
          <Icons.ExternalLink size={16} />
          Open module strategy
        </button>
      )}
    </aside>
  );
}
