'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Play, RotateCcw, X } from 'lucide-react';
import { fibRwSwipeChallenges } from '@/lib/fibRwSwipe';
import { useLanguage } from '@/context/LanguageContext';
import GameModal from './GameModal';

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FibRwSwipeGame({ latestPassed, onLatestResult }: Props) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [optionIndex, setOptionIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);

  const challenges = useMemo(
    () => shuffle(fibRwSwipeChallenges).slice(0, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const challenge = challenges[challengeIndex];
  const shuffledOptions = useMemo(() => shuffle(challenge.options), [challenge]);
  const currentWord = shuffledOptions[optionIndex];
  const isCurrentCorrect = currentWord === challenge.correctWord;
  const currentResult = results[optionIndex]; // undefined = not yet judged
  const progress = completed
    ? challenges.length
    : challengeIndex + (results.length / shuffledOptions.length);

  const resetRound = (nextChallengeIndex: number) => {
    setChallengeIndex(nextChallengeIndex);
    setOptionIndex(0);
    setResults([]);
  };

  const handleStart = () => {
    setModalOpen(true);
    resetRound(0);
    setCompleted(false);
  };

  const handleSwipe = (dir: 'left' | 'right') => {
    if (currentResult !== undefined) return; // already judged
    const userSaysCorrect = dir === 'right';
    const isRight = userSaysCorrect === isCurrentCorrect;
    const nextResults = [...results, isRight];
    setResults(nextResults);

    if (optionIndex < shuffledOptions.length - 1) {
      // move to next word after a brief pause
      setTimeout(() => setOptionIndex((i) => i + 1), 700);
    } else {
      // all options judged
      const allCorrect = nextResults.every((r) => r);
      if (allCorrect) onLatestResult(true);
      if (challengeIndex < challenges.length - 1) {
        setTimeout(() => resetRound(challengeIndex + 1), 900);
      } else {
        setTimeout(() => setCompleted(true), 900);
      }
    }
  };

  const completeView = (
    <section className="wfd-game-card complete" aria-label={t('fibRwSwipeGameTitle')}>
      <div className="wfd-game-complete-icon" aria-hidden="true">
        <BadgeCheck size={22} strokeWidth={2.2} />
      </div>
      <div className="wfd-game-complete-copy">
        <h3>{t('fibRwSwipeGameCompleteTitle')}</h3>
        <p>{t('fibRwSwipeGameCompleteBody')}</p>
      </div>
      <button type="button" className="wfd-game-secondary" onClick={handleStart}>
        <RotateCcw size={13} strokeWidth={2} />
        {t('fibRwSwipeGameStartAgain')}
      </button>
    </section>
  );

  const gameView = (
    <section className="wfd-game-card fib-rw-game-card" aria-label={t('fibRwSwipeGameTitle')}>
      <header className="wfd-game-header">
        <div>
          <p>{t('fibRwSwipeGameEyebrow')}</p>
          <h3>{t('fibRwSwipeGameTitle')}</h3>
        </div>
        <span className="wfd-game-progress">
          {challengeIndex + 1} / {challenges.length}
          <span className="fib-rw-option-counter"> · {optionIndex + 1}/{shuffledOptions.length}</span>
        </span>
      </header>

      <div className="wfd-game-rules">
        <span>
          <ArrowLeft size={13} strokeWidth={2} />
          {t('fibRwSwipeGameRuleLeft')}
        </span>
        <span>
          <ArrowRight size={13} strokeWidth={2} />
          {t('fibRwSwipeGameRuleRight')}
        </span>
      </div>

      <div className="wfd-game-meter" aria-hidden="true">
        <span style={{ width: `${(progress / challenges.length) * 100}%` }} />
      </div>

      {/* Sentence with blank */}
      <div className="fib-rw-sentence">
        {challenge.sentence.split('{{blank}}').map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span className="fib-rw-blank">{t('fibRwSwipeGameBlank')}</span>
            )}
          </span>
        ))}
      </div>

      {/* Swipeable word card */}
      <div className="fib-rw-swipe-zone">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${challenge.id}-${optionIndex}`}
            className={[
              'fib-rw-card',
              currentResult === undefined ? '' : currentResult ? 'card-correct' : 'card-wrong',
            ].join(' ')}
            drag={currentResult === undefined ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (currentResult !== undefined) return;
              if (info.offset.x > 50) handleSwipe('right');
              else if (info.offset.x < -50) handleSwipe('left');
            }}
            initial={{ x: 0, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <span className="fib-rw-word">{currentWord}</span>
            {currentResult === undefined && (
              <span className="fib-rw-swipe-hint">
                <span className="swipe-left-hint">
                  <ArrowLeft size={14} strokeWidth={2}></ArrowLeft> {t('fibRwSwipeGameWrong')}
                </span>
                <span className="swipe-right-hint">
                  {t('fibRwSwipeGameCorrect')} <ArrowRight size={14} strokeWidth={2}></ArrowRight>
                </span>
              </span>
            )}
            {currentResult !== undefined && (
              <span className="fib-rw-card-icon">
                {currentResult
                  ? <Check size={22} strokeWidth={2.5}></Check>
                  : <X size={22} strokeWidth={2.5}></X>}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Option dots */}
      <div className="fib-rw-dots" aria-hidden="true">
        {shuffledOptions.map((_, i) => (
          <span
            key={i}
            className={[
              'fib-rw-dot',
              i === optionIndex ? 'active' : '',
              results[i] === true ? 'done-correct' : results[i] === false ? 'done-wrong' : '',
            ].join(' ')}
          />
        ))}
      </div>
    </section>
  );

  return (
    <>
      <section className="wfd-game-entry" aria-label={t('fibRwSwipeGameTitle')}>
        <button type="button" className="wfd-game-start" onClick={handleStart}>
          <Play size={14} strokeWidth={2.2} />
          {latestPassed ? t('fibRwSwipeGameStartAgain') : t('fibRwSwipeGameStart')}
        </button>
      </section>
      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ariaLabel={t('fibRwSwipeGameTitle')}
      >
        {completed ? completeView : gameView}
      </GameModal>
    </>
  );
}
