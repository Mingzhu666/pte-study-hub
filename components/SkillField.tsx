'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsLeft } from 'lucide-react';
import type { PTEModule } from '@/types/pte';
import {
  SKILL_FIELD_NODES,
  SKILL_META,
  isHighROI,
  nodeNameForLanguage,
  skillMetaName,
  type SkillFieldNode,
  type SkillKey,
} from '@/data/skillFieldModules';
import { commandNodes } from '@/data/commandMap';
import { useLanguage } from '@/context/LanguageContext';
import { useSummitMastery } from '@/context/SummitMasteryContext';
import {
  DEFAULT_SPLIT_PERCENT,
  MAX_SPLIT_PERCENT,
  MIN_SPLIT_PERCENT,
  clampSplitPercent,
  splitPercentFromPointer,
} from '@/lib/layoutSizing';
import MissionPanel from './MissionPanel';

interface Props {
  modules: PTEModule[];
  onOpenModule: (module: PTEModule) => void;
  mapCollapsed?: boolean;
  onCollapseMap?: () => void;
}

// Four skill corner targets (relative 0..1 inside the map area).
const CORNERS: Record<SkillKey, { x: number; y: number }> = {
  L: { x: 0.22, y: 0.30 }, // top-left  Listening
  S: { x: 0.78, y: 0.30 }, // top-right Speaking
  R: { x: 0.22, y: 0.74 }, // bot-left  Reading
  W: { x: 0.78, y: 0.74 }, // bot-right Writing
};

// Pixel-offset target the hover lines land on (the giant skill label).
const SKILL_LABEL_POS: Record<SkillKey, { x: number; y: number }> = {
  L: { x: 0.10, y: 0.16 },
  S: { x: 0.90, y: 0.16 },
  R: { x: 0.10, y: 0.88 },
  W: { x: 0.90, y: 0.88 },
};

const ZONE_TINT: Record<SkillKey, string> = {
  L: '#fff8f4',
  S: '#fff4ef',
  R: '#fbf6ff',
  W: '#f5fbf9',
};

// Canonical map size used only for layout math (node placement, jitter, relax).
// The map itself is rendered fluid — see `.pte-sf-map` CSS — and these values
// are converted to percentages / cqw units at the call sites.
const MAP_W = 720;
const MAP_H = 720;
const MAP_PAD = 64;

const pct = (n: number) => `${(n / MAP_W) * 100}%`;
const cqw = (n: number) => `${(n / MAP_W) * 100}cqw`;

interface Position {
  x: number;
  y: number;
  size: number;
}

interface LayoutResult {
  positions: Record<string, Position>;
  labelAnchors: Record<SkillKey, { x: number; y: number }>;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function relax(
  arr: { id: string; x: number; y: number; size: number }[],
  bounds: { l: number; r: number; t: number; b: number },
  iters = 120,
) {
  for (let it = 0; it < iters; it++) {
    let moved = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) {
          dx = (hash(a.id + b.id) % 7) - 3;
          dy = (hash(b.id + a.id) % 7) - 3;
          dist = 5;
        }
        const minDist = (a.size + b.size) / 2 + 6;
        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
          moved += push;
        }
      }
    }
    arr.forEach((p) => {
      p.x = Math.max(bounds.l + p.size / 2, Math.min(bounds.r - p.size / 2, p.x));
      p.y = Math.max(bounds.t + p.size / 2, Math.min(bounds.b - p.size / 2, p.y));
    });
    if (moved < 0.3) break;
  }
  return arr;
}

function layout(): LayoutResult {
  const bounds = {
    l: MAP_PAD,
    r: MAP_W - MAP_PAD,
    t: MAP_PAD,
    b: MAP_H - MAP_PAD,
  };

  const arr = SKILL_FIELD_NODES.map((m) => {
    let wx = 0;
    let wy = 0;
    let total = 0;
    (['L', 'R', 'S', 'W'] as SkillKey[]).forEach((k) => {
      const v = m.skills[k];
      if (v) {
        wx += CORNERS[k].x * v;
        wy += CORNERS[k].y * v;
        total += v;
      }
    });
    const rx = wx / Math.max(total, 1);
    const ry = wy / Math.max(total, 1);
    const h = hash(m.designId);
    const jx = ((h % 17) / 17 - 0.5) * 0.04;
    const jy = (((h >> 4) % 19) / 19 - 0.5) * 0.04;
    return {
      id: m.designId,
      x: (rx + jx) * MAP_W,
      y: (ry + jy) * MAP_H,
      // Wider spread (≈30–90px across weights 16–98) so high-weight modules
      // stand out clearly vs low-weight ones.
      size: 20 + (m.weight / 100) * 72,
    };
  });

  relax(arr, bounds, 140);

  const positions: Record<string, Position> = {};
  arr.forEach((p) => {
    positions[p.id] = { x: p.x, y: p.y, size: p.size };
  });

  const labelAnchors = {} as Record<SkillKey, { x: number; y: number }>;
  (Object.entries(SKILL_LABEL_POS) as [SkillKey, { x: number; y: number }][]).forEach(
    ([k, rel]) => {
      labelAnchors[k] = { x: rel.x * MAP_W, y: rel.y * MAP_H };
    },
  );

  return { positions, labelAnchors };
}

export default function SkillField({ modules, onOpenModule, mapCollapsed = false, onCollapseMap }: Props) {
  const { t, language } = useLanguage();
  const [hover, setHover] = useState<string | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>('WFD');
  const [tour, setTour] = useState<number>(0);
  const [filter, setFilter] = useState<SkillKey | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);
  const [isResizing, setIsResizing] = useState(false);

  const { positions, labelAnchors } = useMemo(() => layout(), []);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSplitPercent(splitPercentFromPointer(event.clientX, rect));
    };
    const stopResize = () => setIsResizing(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    document.body.classList.add('split-resizing');

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
      document.body.classList.remove('split-resizing');
    };
  }, [isResizing]);

  const active = hover ?? selectedDesignId;

  // Map design id → existing PTEModule, for the "open detail" callback.
  const moduleById = useMemo(() => {
    const m: Record<string, PTEModule> = {};
    modules.forEach((mod) => (m[mod.id] = mod));
    return m;
  }, [modules]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem('pte-skill-field-tour-seen') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTour(5);
      return;
    }
    const tid = setTimeout(() => setTour(1), 900);
    return () => clearTimeout(tid);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (tour >= 5) {
      window.localStorage.setItem('pte-skill-field-tour-seen', 'true');
    }
  }, [tour]);

  const hoverNode = hover ? SKILL_FIELD_NODES.find((n) => n.designId === hover) : undefined;
  const selectedNode = selectedDesignId
    ? SKILL_FIELD_NODES.find((n) => n.designId === selectedDesignId)
    : undefined;
  const activeNode = hoverNode ?? selectedNode;

  // Practice (right column) — reuses the same MissionPanel as the Strategy Guide.
  const { state, hydrated, toggleStrategy, setModuleGameResult } = useSummitMastery();
  const target = state.target;
  const practiceNode = selectedNode
    ? commandNodes.find((n) => n.id === selectedNode.commandNodeId)
    : undefined;
  const practiceModule = selectedNode ? moduleById[selectedNode.moduleId] : undefined;

  const handleSelect = (node: SkillFieldNode) => {
    setSelectedDesignId(node.designId);
  };

  return (
    <div className="pte-skill-field-root">
      <div
        ref={shellRef}
        className={`pte-sf-shell ${isResizing ? 'resizing' : ''} ${mapCollapsed ? 'map-collapsed' : ''}`}
        style={{ ['--sf-map-width' as string]: `${splitPercent}%` }}
      >
      <div className="pte-sf-map-wrap">
      {/* Top header — sits inside the collapsible map wrap */}
      <div className="pte-sf-header">
        <div className="pte-sf-header-top">
          <div className="pte-eyebrow">{t('skillFieldEyebrow')}</div>
          {onCollapseMap && (
            <button
              type="button"
              className="split-collapse-button"
              onClick={onCollapseMap}
              title={t('sidebarCollapseMap')}
              aria-label={t('sidebarCollapseMap')}
            >
              <ChevronsLeft size={16} strokeWidth={1.8} />
            </button>
          )}
        </div>
        <div
          className="pte-serif"
          style={{ fontSize: 18, lineHeight: 1.2, marginTop: 4, letterSpacing: '-0.02em' }}
        >
          {t('skillFieldTaglinePrefix')}
          <span style={{ fontStyle: 'italic', color: 'var(--pte-accent)' }}>{t('skillFieldTaglineEmphasis')}</span>
          {t('skillFieldTaglineSuffix')}
        </div>
        <div className="pte-sf-legend-inline">
          <span className="pte-sf-legend-dots">
            <span style={{ width: 7, height: 7 }} />
            <span style={{ width: 11, height: 11 }} />
            <span style={{ width: 15, height: 15 }} />
          </span>
          <span>{t('skillFieldLegendSizeWeight')}</span>
          <span className="pte-sf-legend-sep">·</span>
          <span style={{ fontSize: 13, lineHeight: 1 }}>🔥</span>
          <span>{t('skillFieldLegendHighRoi')}</span>
        </div>
      </div>

      <div className="pte-sf-inner">
        {/* MIDDLE: map canvas */}
        <div className="pte-sf-middle">
          <div className="pte-sf-map">
            {/* 4 zone backgrounds */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '50%',
                height: '50%',
                background: ZONE_TINT.L,
                opacity: filter === 'L' ? 1 : filter ? 0.25 : 0.55,
                transition: 'opacity .35s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '50%',
                height: '50%',
                background: ZONE_TINT.S,
                opacity: filter === 'S' ? 1 : filter ? 0.25 : 0.55,
                transition: 'opacity .35s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '50%',
                height: '50%',
                background: ZONE_TINT.R,
                opacity: filter === 'R' ? 1 : filter ? 0.25 : 0.55,
                transition: 'opacity .35s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '50%',
                height: '50%',
                background: ZONE_TINT.W,
                opacity: filter === 'W' ? 1 : filter ? 0.25 : 0.55,
                transition: 'opacity .35s',
              }}
            />

            {/* thin dividers */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 1,
                background: '#ebe9e4',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 1,
                background: '#ebe9e4',
              }}
            />

            <ZoneLabel
              pos="tl"
              k="L"
              active={!!activeNode && activeNode.skills.L > 0}
              filtered={filter === 'L'}
              onClick={() => setFilter(filter === 'L' ? null : 'L')}
            />
            <ZoneLabel
              pos="tr"
              k="S"
              active={!!activeNode && activeNode.skills.S > 0}
              filtered={filter === 'S'}
              onClick={() => setFilter(filter === 'S' ? null : 'S')}
            />
            <ZoneLabel
              pos="bl"
              k="R"
              active={!!activeNode && activeNode.skills.R > 0}
              filtered={filter === 'R'}
              onClick={() => setFilter(filter === 'R' ? null : 'R')}
            />
            <ZoneLabel
              pos="br"
              k="W"
              active={!!activeNode && activeNode.skills.W > 0}
              filtered={filter === 'W'}
              onClick={() => setFilter(filter === 'W' ? null : 'W')}
            />

            {/* hover rays */}
            {active && positions[active] && activeNode && (
              <svg
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
                width="100%"
                height="100%"
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                preserveAspectRatio="none"
              >
                {(['L', 'R', 'S', 'W'] as SkillKey[])
                  .filter((k) => activeNode.skills[k] > 0)
                  .map((k) => {
                    const p = positions[active];
                    const c = labelAnchors[k];
                    const midX = (p.x + c.x) / 2;
                    const midY = (p.y + c.y) / 2;
                    return (
                      <g key={k}>
                        <line
                          x1={p.x}
                          y1={p.y}
                          x2={c.x}
                          y2={c.y}
                          stroke="var(--pte-accent)"
                          strokeWidth={1 + activeNode.skills[k] * 0.6}
                          strokeOpacity={0.75}
                          strokeLinecap="round"
                          strokeDasharray="200"
                          style={{ animation: 'pte-thread-draw .5s ease-out forwards' }}
                        />
                        <text
                          x={midX}
                          y={midY - 8}
                          fontSize="10"
                          fill="var(--pte-accent)"
                          textAnchor="middle"
                          fontWeight="500"
                          style={{
                            fontFamily: 'var(--pte-mono)',
                            letterSpacing: '0.06em',
                          }}
                        >
                          → {skillMetaName(SKILL_META[k], language)}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            )}

            {/* nodes */}
            {SKILL_FIELD_NODES.map((m) => {
              const p = positions[m.designId];
              if (!p) return null;
              const isActive = active === m.designId;
              const isSelected = selectedDesignId === m.designId;
              const isHovered = hover === m.designId;
              const matchFilter = filter ? m.skills[filter] > 0 : true;
              const dim = (!!active && !isActive) || (!!filter && !matchFilter);
              const isTour2 = tour === 2 && (m.designId === 'WFD' || m.designId === 'RS');

              return (
                <button
                  key={m.designId}
                  onMouseEnter={() => setHover(m.designId)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => handleSelect(m)}
                  style={{
                    position: 'absolute',
                    left: pct(p.x),
                    top: pct(p.y),
                    width: pct(p.size),
                    height: pct(p.size),
                    transform: 'translate(-50%,-50%)',
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--pte-ink)' : '#fff',
                    color: isSelected ? '#fff' : 'var(--pte-ink)',
                    boxShadow: isSelected
                      ? '0 10px 28px rgba(255,77,46,0.32), 0 0 0 2.5px var(--pte-accent)'
                      : isHovered
                        ? '0 4px 14px rgba(0,0,0,0.10), 0 0 0 2px var(--pte-accent)'
                        : filter && matchFilter
                          ? '0 1.5px 4px rgba(0,0,0,0.08), 0 0 0 1.5px var(--pte-accent)'
                          : '0 2px 5px rgba(0,0,0,0.08), 0 0 0 1.5px rgba(0,0,0,0.28)',
                    opacity: dim ? 0.32 : 1,
                    transition: 'all 0.25s cubic-bezier(.2,.7,.3,1)',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: isSelected ? 3 : isHovered ? 2 : 1,
                  }}
                >
                  <span
                    className="pte-mono"
                    style={{
                      fontSize: `clamp(8px, ${cqw(p.size * 0.26)}, ${Math.max(10, p.size * 0.26)}px)`,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      lineHeight: 1,
                    }}
                  >
                    {m.designId.replace('_', '·')}
                  </span>
                  {p.size > 44 && (
                    <span
                      style={{
                        fontSize: `clamp(7px, ${cqw(10)}, 10px)`,
                        marginTop: 2,
                        fontWeight: 500,
                        color: isSelected ? 'rgba(255,255,255,0.78)' : 'var(--pte-ink-2)',
                      }}
                    >
                      {nodeNameForLanguage(m, language)}
                    </span>
                  )}
                  {isHighROI(m) && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        fontSize: 14,
                        lineHeight: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(255,77,46,0.35))',
                        pointerEvents: 'none',
                        zIndex: 2,
                        transform: isActive ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform .25s',
                      }}
                    >
                      🔥
                    </span>
                  )}
                  {isTour2 && (
                    <span
                      style={{
                        position: 'absolute',
                        inset: -8,
                        borderRadius: '50%',
                        border: '2px solid var(--pte-accent)',
                        animation: 'pte-pulse 1.6s ease-out infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </button>
              );
            })}

            {/* Hover card near the active node */}
            {active && positions[active] && activeNode && (
              <div
                style={{
                  position: 'absolute',
                  left: pct(positions[active].x),
                  top: pct(positions[active].y + positions[active].size / 2 + 10),
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  border: '1.5px solid var(--pte-ink)',
                  padding: 'clamp(5px, 1.1cqw, 8px) clamp(7px, 1.7cqw, 12px)',
                  boxShadow: '0 4px 0 var(--pte-accent)',
                  pointerEvents: 'none',
                  zIndex: 4,
                  whiteSpace: 'nowrap',
                  maxWidth: '92%',
                  animation: 'pte-fade-up .25s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(5px, 1.1cqw, 8px)' }}>
                  <span
                    className="pte-mono"
                    style={{
                      fontSize: 'clamp(8px, 1.4cqw, 10px)',
                      color: 'var(--pte-accent)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {activeNode.designId.replace('_', '·')}
                  </span>
                  <span className="pte-serif" style={{ fontSize: 'clamp(11px, 2.1cqw, 15px)' }}>
                    {nodeNameForLanguage(activeNode, language)}
                  </span>
                </div>
                <div style={{ marginTop: 4, fontSize: 'clamp(9px, 1.6cqw, 11.5px)', color: 'var(--pte-ink-2)' }}>
                  {t('skillFieldHoverAlsoCountsFor')}
                  {(['L', 'R', 'S', 'W'] as SkillKey[])
                    .filter((k) => activeNode.skills[k] > 0)
                    .map((k, i, arr) => (
                      <span key={k}>
                        <strong style={{ color: 'var(--pte-accent)' }}>{skillMetaName(SKILL_META[k], language)}</strong>
                        {Array(activeNode.skills[k]).fill('●').join('')}
                        {i < arr.length - 1 ? (
                          <span style={{ color: 'var(--pte-ink-4)' }}> ┼ </span>
                        ) : null}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {tour > 0 && tour < 5 && (
              <TourOverlay
                step={tour}
                onNext={() => setTour(tour + 1)}
                onSkip={() => setTour(5)}
              />
            )}
          </div>
        </div>
      </div>
      </div>

      <button
        type="button"
        role="separator"
        className="split-resize-handle"
        aria-label="Resize skill field map and practice panel"
        aria-orientation="vertical"
        aria-valuemin={MIN_SPLIT_PERCENT}
        aria-valuemax={MAX_SPLIT_PERCENT}
        aria-valuenow={splitPercent}
        onPointerDown={(event) => {
          event.preventDefault();
          setIsResizing(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setSplitPercent((current) => clampSplitPercent(current - 2));
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            setSplitPercent((current) => clampSplitPercent(current + 2));
          }
          if (event.key === 'Home') {
            event.preventDefault();
            setSplitPercent(MIN_SPLIT_PERCENT);
          }
          if (event.key === 'End') {
            event.preventDefault();
            setSplitPercent(MAX_SPLIT_PERCENT);
          }
        }}
      >
        <span aria-hidden="true" />
      </button>

      {/* RIGHT column: MissionPanel — shares the Strategy Guide practice area */}
      <div className="pte-sf-right">
        {hydrated && practiceNode ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={practiceNode.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="pte-sf-mission-wrap"
            >
              <MissionPanel
                node={practiceNode}
                module={practiceModule}
                target={target}
                mastery={state.mastery[`${target}:${practiceNode.id}`]}
                gameResult={state.gameResults?.[`${target}:${practiceNode.id}`]}
                onToggle={toggleStrategy}
                onGameResult={setModuleGameResult}
                onOpenDetail={onOpenModule}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="pte-sf-mission-empty">
            <div className="pte-eyebrow">{t('skillFieldPracticeArea')}</div>
            <div
              className="pte-serif"
              style={{ fontSize: 17, marginTop: 8, lineHeight: 1.3 }}
            >
              {t('skillFieldEmptyPromptLine1')}
              <br />
              {t('skillFieldEmptyPromptLine2')}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function ZoneLabel({
  pos,
  k,
  active,
  filtered,
  onClick,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
  k: SkillKey;
  active: boolean;
  filtered: boolean;
  onClick: () => void;
}) {
  const { t, language } = useLanguage();
  const s = SKILL_META[k];
  const posStyles: Record<typeof pos, CSSProperties> = {
    tl: { top: '3.5%', left: '3.5%' },
    tr: { top: '3.5%', right: '3.5%' },
    bl: { bottom: '3.5%', left: '3.5%' },
    br: { bottom: '3.5%', right: '3.5%' },
  };
  const align = pos === 'tr' || pos === 'br' ? 'flex-end' : 'flex-start';
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        ...posStyles[pos],
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        padding: 0,
        gap: 2,
        fontFamily: 'inherit',
      }}
    >
      <span
        className="pte-mono"
        style={{
          fontSize: 'clamp(8px, 1.4cqw, 10px)',
          letterSpacing: '0.2em',
          color: active || filtered ? 'var(--pte-accent)' : 'var(--pte-ink-3)',
          transition: 'color .3s',
        }}
      >
        {s.en.toUpperCase()}{t('skillFieldZoneSuffix')}
      </span>
      <span
        className="pte-serif"
        style={{
          fontSize: 'clamp(18px, 6.1cqw, 44px)',
          lineHeight: 1,
          fontWeight: 500,
          color: active ? 'var(--pte-accent)' : filtered ? 'var(--pte-ink)' : 'var(--pte-ink-2)',
          transition: 'color .3s, transform .3s',
          transform: active ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: pos === 'tr' || pos === 'br' ? 'right' : 'left',
          letterSpacing: '-0.02em',
        }}
      >
        {skillMetaName(s, language)}
      </span>
    </button>
  );
}

function TourOverlay({
  step,
  onNext,
  onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { t } = useLanguage();
  const positions: Record<number, CSSProperties> = {
    1: { left: '50%', top: '38%', transform: 'translateX(-50%)' },
    2: { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' },
    3: { right: '8%', top: '48%' },
    4: { right: '8%', top: '20%' },
  };
  const titleKey =
    step === 1 ? 'skillFieldTour1Title' :
    step === 2 ? 'skillFieldTour2Title' :
    step === 3 ? 'skillFieldTour3Title' :
    'skillFieldTour4Title';
  const bodyKey =
    step === 1 ? 'skillFieldTour1BodyHtml' :
    step === 2 ? 'skillFieldTour2BodyHtml' :
    step === 3 ? 'skillFieldTour3BodyHtml' :
    'skillFieldTour4BodyHtml';
  const title = t(titleKey);
  const bodyHtml = t(bodyKey);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      <div
        style={{
          position: 'absolute',
          ...positions[step],
          width: 300,
          padding: 20,
          pointerEvents: 'auto',
          background: '#fff',
          border: '1px solid var(--pte-ink)',
          boxShadow: '10px 10px 0 var(--pte-accent)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span
            className="pte-mono"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--pte-ink-4)' }}
          >
            {String(step).padStart(2, '0')} / 04 · {title.toUpperCase()}
          </span>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--pte-mono)',
              fontSize: 10,
              color: 'var(--pte-ink-4)',
            }}
          >
            {t('skillFieldTourSkip')}
          </button>
        </div>
        <div
          className="pte-serif"
          style={{ fontSize: 18, lineHeight: 1.35, marginTop: 10, marginBottom: 14 }}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              style={{
                width: 22,
                height: 2,
                background: i <= step ? 'var(--pte-ink)' : 'var(--pte-rule)',
              }}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          style={{
            background: 'var(--pte-ink)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: 'var(--pte-sans)',
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          {step < 4 ? t('skillFieldTourNext') : t('skillFieldTourStart')}
        </button>
      </div>
    </div>
  );
}
