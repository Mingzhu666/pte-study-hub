'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Info, MousePointerClick, Play, RotateCcw, Send } from 'lucide-react';
import {
  findErrorForToken,
  getSelectedErrorIds,
  hasFoundEveryError,
  wfdSpotRepairChallenges,
} from '@/lib/wfdSpotRepair';
import { useLanguage } from '@/context/LanguageContext';
import GameModal from './GameModal';

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

export default function WfdSpotRepairGame({ latestPassed, onLatestResult }: Props) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [wrongTokenId, setWrongTokenId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const challenge = wfdSpotRepairChallenges[challengeIndex];
  const selectedErrorIds = useMemo(() => getSelectedErrorIds(challenge, selectedTokenIds), [challenge, selectedTokenIds]);
  const foundAll = hasFoundEveryError(challenge, selectedErrorIds);
  const selectedWrongTokenIds = useMemo(() => {
    return selectedTokenIds.filter((tokenId) => !findErrorForToken(challenge, tokenId));
  }, [challenge, selectedTokenIds]);
  const isCorrect = submitted && foundAll && selectedWrongTokenIds.length === 0;
  const progress = completed ? wfdSpotRepairChallenges.length : challengeIndex + (isCorrect ? 1 : 0);
  const trainedTags = useMemo(() => {
    const tags = new Set<string>();
    for (const item of wfdSpotRepairChallenges) {
      for (const error of item.errors) {
        error.tags.forEach((tag) => tags.add(tag));
      }
    }
    return [...tags];
  }, []);

  const resetRound = (nextIndex: number) => {
    setChallengeIndex(nextIndex);
    setSelectedTokenIds([]);
    setWrongTokenId(null);
    setSubmitted(false);
  };

  const handleTokenClick = (tokenId: string) => {
    if (submitted) return;
    setSelectedTokenIds((current) => current.includes(tokenId)
      ? current.filter((id) => id !== tokenId)
      : [...current, tokenId]);
  };

  const handleNext = () => {
    if (challengeIndex === wfdSpotRepairChallenges.length - 1) {
      setCompleted(true);
      if (isCorrect) onLatestResult(true);
      return;
    }
    resetRound(challengeIndex + 1);
  };

  const handleSubmit = () => {
    if (selectedTokenIds.length === 0) {
      setWrongTokenId('none');
      window.setTimeout(() => setWrongTokenId(null), 450);
      return;
    }
    setSubmitted(true);
    const passed = foundAll && selectedWrongTokenIds.length === 0;
    if (!passed) onLatestResult(false);
  };

  const completeView = (
    <section className="wfd-game-card complete" aria-label={t('wfdGameTitle')}>
      <div className="wfd-game-complete-icon" aria-hidden="true">
        <BadgeCheck size={22} strokeWidth={2.2} />
      </div>
      <div className="wfd-game-complete-copy">
        <h3>{t('wfdGameCompleteTitle')}</h3>
        <p>{t('wfdGameCompleteBody')}</p>
      </div>
      <div className="wfd-game-tags" aria-label={t('wfdGameTrainingTags')}>
        {trainedTags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <button type="button" className="wfd-game-secondary" onClick={() => {
        setCompleted(false);
        resetRound(0);
      }}>
        <RotateCcw size={13} strokeWidth={2} />
        {t('wfdGameStartAgain')}
      </button>
    </section>
  );

  const gameView = (
    <section className="wfd-game-card" aria-label={t('wfdGameTitle')}>
      <header className="wfd-game-header">
        <div>
          <p>{t('wfdGameEyebrow')}</p>
          <h3>{t('wfdGameTitle')}</h3>
        </div>
        <span className="wfd-game-progress">{challengeIndex + 1} / {wfdSpotRepairChallenges.length}</span>
      </header>

      <div className="wfd-game-rules">
        <span><MousePointerClick size={13} strokeWidth={2} />{t('wfdGameRuleFind')}</span>
      </div>

      <div className="wfd-game-meter" aria-hidden="true">
        <span style={{ width: `${(progress / wfdSpotRepairChallenges.length) * 100}%` }} />
      </div>

      <div className="wfd-game-prompt">
        {challenge.tokens.map((token) => {
          const error = findErrorForToken(challenge, token.id);
          const selected = selectedTokenIds.includes(token.id);
          const shouldRevealMissed = submitted && error && !selected;
          const shouldRevealWrong = submitted && selected && !error;
          return (
            <motion.button
              key={token.id}
              type="button"
              onClick={() => handleTokenClick(token.id)}
              animate={wrongTokenId === token.id ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.28 }}
              className={[
                'wfd-token',
                selected ? 'selected' : '',
                submitted && isCorrect && selected && error ? 'correct' : '',
                submitted && !isCorrect && selected ? 'wrong-choice' : '',
                shouldRevealMissed ? 'missed' : '',
                shouldRevealWrong ? 'wrong-choice' : '',
                wrongTokenId === 'none' ? 'wrong' : '',
              ].join(' ')}
            >
              {token.text}
            </motion.button>
          );
        })}
      </div>

      <div className="wfd-game-helper">
        {submitted
          ? isCorrect ? t('wfdGameCorrectHint') : t('wfdGameIncorrectHint')
          : t('wfdGameFindHint')}
      </div>

      {!submitted && (
        <button type="button" className="wfd-game-primary" onClick={handleSubmit}>
          {t('wfdGameSubmit')}
          <Send size={13} strokeWidth={2} />
        </button>
      )}

      <AnimatePresence mode="wait">
        {submitted && (
          <motion.div
            key={challenge.id}
            className={`wfd-game-result ${isCorrect ? 'correct' : 'incorrect'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p>{isCorrect ? t('wfdGameCorrectTitle') : t('wfdGameIncorrectTitle')}</p>
            <div className="wfd-corrected-sentence">{challenge.correctedSentence}</div>
            <div className="wfd-repair-list revealed">
              {challenge.errors.map((error) => (
                <span key={error.id} className={`wfd-repair-chip ${isCorrect ? 'done' : 'review'}`}>
                  {isCorrect ? <Check size={13} strokeWidth={2.4} /> : <Info size={13} strokeWidth={2.2} />}
                  {error.answer}
                </span>
              ))}
            </div>
            <ul>
              {challenge.errors.map((error) => (
                <li key={error.id}>
                  <span>{error.tags.join(' / ')}</span>
                  {error.explanation}
                </li>
              ))}
            </ul>
            <div className="wfd-game-actions">
              {!isCorrect && (
                <button type="button" className="wfd-game-secondary" onClick={() => resetRound(challengeIndex)}>
                  <RotateCcw size={13} strokeWidth={2} />
                  {t('wfdGameTryAgain')}
                </button>
              )}
              <button type="button" className="wfd-game-primary" onClick={handleNext}>
                {challengeIndex === wfdSpotRepairChallenges.length - 1 ? t('wfdGameFinish') : t('wfdGameNext')}
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );

  return (
    <>
      <section className="wfd-game-entry" aria-label={t('wfdGameTitle')}>
        <button type="button" className="wfd-game-start" onClick={() => setModalOpen(true)}>
          <Play size={14} strokeWidth={2.2} />
          {latestPassed ? t('wfdGameStartAgain') : t('wfdGameStart')}
        </button>
      </section>
      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ariaLabel={t('wfdGameTitle')}
      >
        {completed ? completeView : gameView}
      </GameModal>
    </>
  );
}
