'use client';

import { ExternalLink } from 'lucide-react';
import StrategyChecklistItem from './StrategyChecklistItem';
import WfdSpotRepairGame from './WfdSpotRepairGame';
import RsKeywordRecallGame from './RsKeywordRecallGame';
import FibReadGame from './FibReadGame';
import FibRwSwipeGame from './FibRwSwipeGame';
import WeAiEssayGame from './WeAiEssayGame';
import SstSummaryPickGame from './SstSummaryPickGame';
import AsqFlashcardDeck from './AsqFlashcardDeck';
import RaAiMirrorGame from './RaAiMirrorGame';
import { useLanguage } from '@/context/LanguageContext';
import { buildStrategyList } from '@/lib/strategyChecklist';
import type { CommandNode, CommandTarget } from '@/data/commandMap';
import type { PTEModule } from '@/types/pte';
import type { MasteryEntry, ModuleGameResult } from '@/lib/summitMastery';

const categoryColors: Record<PTEModule['category'], string> = {
  speaking: '#FF375F',
  writing: '#0071E3',
  reading: '#30D158',
  listening: '#BF5AF2',
};

const tierTranslationKey = {
  focus: 'focusTier',
  active: 'activeTier',
  support: 'supportTier',
  low: 'lowYieldTier',
} as const;

interface Props {
  node: CommandNode;
  module?: PTEModule;
  target: CommandTarget;
  mastery: MasteryEntry | undefined;
  gameResult?: ModuleGameResult;
  onToggle: (moduleId: string, strategyId: string) => void;
  onGameResult: (moduleId: string, passed: boolean) => void;
  onOpenDetail: (module: PTEModule) => void;
}

export default function MissionPanel({ node, module, target, mastery, gameResult, onToggle, onGameResult, onOpenDetail }: Props) {
  const { language, t } = useLanguage();
  const items = module
    ? buildStrategyList(module, language, { target, checklist: node.checklist[target] })
    : [];
  const checked = new Set(mastery?.checked ?? []);
  const tier = node.priority[target];
  const accent = module ? categoryColors[module.category] : '#0071E3';

  const checkedCount = items.filter((item) => checked.has(item.id)).length;
  const gameRequired = (node.id === 'wfd' || node.id === 'essay' || node.id === 'sst') && items.length > 0;
  const gamePassed = gameResult?.passed === true;
  const progressTotal = items.length + (gameRequired ? 1 : 0);
  const progressChecked = checkedCount + (gameRequired && gamePassed ? 1 : 0);
  const percent = progressTotal === 0 ? 0 : Math.round((progressChecked / progressTotal) * 100);

  return (
    <aside className="mission-panel">
      <header className="mission-header">
        <p className="mission-eyebrow">{t(tierTranslationKey[tier])}</p>
        <h2 className="mission-name">{node.label}</h2>
        <p className="mission-rationale">{node.rationale[target][language]}</p>
      </header>

      <div className="mission-stats">
        <span className="mission-stat">
          <span className="mission-stat-label">{t('dailyVolume')}</span>
          <span className="mission-stat-value">{node.dailyVolume[target][language]}</span>
        </span>
        <span className="mission-stat">
          <span className="mission-stat-label">{t('strategyChecklist')}</span>
          <span className="mission-stat-value">{checkedCount} / {items.length}</span>
        </span>
      </div>

      <div className="mission-progress" aria-hidden="true">
        <span style={{ width: `${percent}%`, background: accent }} />
      </div>

      <section className="mission-section">
        <h3 className="mission-section-title">{t('strategyChecklist')}</h3>
        <div className="mission-strategy-list">
          {items.length === 0 && <p className="mission-empty">—</p>}
          {items.map((item) => (
            <StrategyChecklistItem
              key={item.id}
              id={item.id}
              text={item.text}
              checked={checked.has(item.id)}
              onToggle={(id) => onToggle(node.id, id)}
            />
          ))}
        </div>
      </section>

      {node.id === 'wfd' && (
        <WfdSpotRepairGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}
      {node.id === 'rs' && (
        <RsKeywordRecallGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}
      {node.id === 'r-fib' && (
        <FibReadGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}
      {node.id === 'rw-fib' && (
        <FibRwSwipeGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}
      {node.id === 'essay' && (
        <WeAiEssayGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}
      {node.id === 'sst' && (
        <SstSummaryPickGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}
      {node.id === 'asq' && <AsqFlashcardDeck />}
      {node.id === 'ra' && (
        <RaAiMirrorGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}

      {node.failurePoints[target][language].length > 0 && (
        <section className="mission-section">
          <h3 className="mission-section-title">{t('failurePoints')}</h3>
          <ul className="mission-failure-list">
            {node.failurePoints[target][language].map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {module && (
        <button type="button" className="mission-detail-link" onClick={() => onOpenDetail(module)}>
          <ExternalLink size={14} strokeWidth={1.8} />
          {t('openFullStrategy')}
        </button>
      )}
    </aside>
  );
}
