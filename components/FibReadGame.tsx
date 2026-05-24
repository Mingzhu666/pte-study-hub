'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Grip, MousePointerClick, Play, RotateCcw, Send, X } from 'lucide-react';
import { fibReadChallenges, type FibReadChallenge } from '@/lib/fibRead';
import { useLanguage } from '@/context/LanguageContext';
import GameModal from './GameModal';

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

interface ParsedSegment {
  type: 'text';
  content: string;
}

interface ParsedBlank {
  type: 'blank';
  index: number;
}

type ParsedContent = ParsedSegment | ParsedBlank;

function parsePassage(passage: string): ParsedContent[] {
  const parts = passage.split('{{blank}}');
  const result: ParsedContent[] = [];
  parts.forEach((text, i) => {
    if (text) result.push({ type: 'text', content: text });
    if (i < parts.length - 1) result.push({ type: 'blank', index: i });
  });
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FibReadGame({ latestPassed, onLatestResult }: Props) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [filled, setFilled] = useState<(string | null)[]>([]);
  const [draggingWord, setDraggingWord] = useState<string | null>(null);
  const [dragOverBlank, setDragOverBlank] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const challenge = fibReadChallenges[challengeIndex];
  const segments = useMemo(() => parsePassage(challenge.passage), [challenge.passage]);
  const wordBankShuffled = useMemo(() => shuffle(challenge.wordBank), [challenge]);

  const progress = completed ? fibReadChallenges.length : challengeIndex + (submitted ? 1 : 0);
  const isCorrect = submitted && challenge.answers.every((w, i) => w === filled[i]);

  const resetRound = (nextIndex: number) => {
    setChallengeIndex(nextIndex);
    setFilled(Array(challenge.answers.length).fill(null));
    setDraggingWord(null);
    setDragOverBlank(null);
    setSelectedWord(null);
    setSubmitted(false);
  };

  const handleStart = () => {
    setModalOpen(true);
    resetRound(0);
  };

  const handleWordDragStart = (word: string) => {
    setDraggingWord(word);
    setSelectedWord(null);
  };

  const handleBlankDragOver = (e: React.DragEvent, blankIndex: number) => {
    e.preventDefault();
    setDragOverBlank(blankIndex);
  };

  const handleBlankDragLeave = () => {
    setDragOverBlank(null);
  };

  const handleBlankDrop = (e: React.DragEvent, blankIndex: number) => {
    e.preventDefault();
    if (!draggingWord) return;
    placeWord(draggingWord, blankIndex);
    setDraggingWord(null);
    setDragOverBlank(null);
  };

  const placeWord = (word: string, blankIndex: number) => {
    setFilled((prev) => {
      const next = [...prev];
      // if this blank already has a word, return it to the bank (implicit, we just overwrite)
      next[blankIndex] = word;
      return next;
    });
    setSelectedWord(null);
  };

  const handleBlankClick = (blankIndex: number) => {
    if (submitted) return;
    if (selectedWord) {
      placeWord(selectedWord, blankIndex);
    }
  };

  const handleWordClick = (word: string) => {
    if (submitted) return;
    setSelectedWord((prev) => (prev === word ? null : word));
  };

  const handleWordReturn = (blankIndex: number) => {
    if (submitted) return;
    setFilled((prev) => {
      const next = [...prev];
      next[blankIndex] = null;
      return next;
    });
  };

  const handleSubmit = () => {
    if (filled.includes(null)) return;
    setSubmitted(true);
    const correct = challenge.answers.every((w, i) => w === filled[i]);
    if (correct) {
      onLatestResult(true);
    } else {
      onLatestResult(false);
    }
  };

  const handleNext = () => {
    if (challengeIndex === fibReadChallenges.length - 1) {
      setCompleted(true);
      return;
    }
    resetRound(challengeIndex + 1);
  };

  const completeView = (
    <section className="wfd-game-card complete" aria-label={t('fibGameTitle')}>
      <div className="wfd-game-complete-icon" aria-hidden="true">
        <BadgeCheck size={22} strokeWidth={2.2} />
      </div>
      <div className="wfd-game-complete-copy">
        <h3>{t('fibGameCompleteTitle')}</h3>
        <p>{t('fibGameCompleteBody')}</p>
      </div>
      <button
        type="button"
        className="wfd-game-secondary"
        onClick={() => {
          setCompleted(false);
          resetRound(0);
        }}
      >
        <RotateCcw size={13} strokeWidth={2} />
        {t('fibGameStartAgain')}
      </button>
    </section>
  );

  const gameView = (
    <section className="wfd-game-card fib-game-card" aria-label={t('fibGameTitle')}>
      <header className="wfd-game-header">
        <div>
          <p>{t('fibGameEyebrow')}</p>
          <h3>{t('fibGameTitle')}</h3>
        </div>
        <span className="wfd-game-progress">{challengeIndex + 1} / {fibReadChallenges.length}</span>
      </header>

      <div className="wfd-game-rules">
        <span>
          <Grip size={13} strokeWidth={2} />
          {t('fibGameRuleDrag')}
        </span>
        <span>
          <MousePointerClick size={13} strokeWidth={2} />
          {t('fibGameRuleFill')}
        </span>
      </div>

      <div className="wfd-game-meter" aria-hidden="true">
        <span style={{ width: `${(progress / fibReadChallenges.length) * 100}%` }} />
      </div>

      {/* Passage */}
      <div className="fib-passage">
        {segments.map((seg, i) =>
          seg.type === 'text' ? (
            <span key={i}>{seg.content}</span>
          ) : (
            <span
              key={i}
              className={[
                'fib-blank',
                submitted
                  ? isCorrect
                    ? 'correct'
                    : filled[seg.index] !== challenge.answers[seg.index]
                      ? 'wrong'
                      : 'correct'
                  : dragOverBlank === seg.index
                    ? 'drag-over'
                    : filled[seg.index]
                      ? 'filled'
                      : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onDragOver={(e) => handleBlankDragOver(e, seg.index)}
              onDragLeave={handleBlankDragLeave}
              onDrop={(e) => handleBlankDrop(e, seg.index)}
              onClick={() => handleBlankClick(seg.index)}
              title={filled[seg.index] ? t('fibGameClickToRemove') : undefined}
            >
              {filled[seg.index] ?? t('fibGameBlank')}
            </span>
          ),
        )}
      </div>

      {/* Word Bank */}
      <div className="fib-word-bank" aria-label={t('fibGameWordBank')}>
        {wordBankShuffled.map((word) => {
          const isUsed = filled.includes(word);
          const isSelected = selectedWord === word;
          const isDragging = draggingWord === word;
          return (
            <motion.button
              key={word}
              type="button"
              draggable={!submitted && !isUsed}
              onDragStart={() => handleWordDragStart(word)}
              onClick={() => handleWordClick(word)}
              animate={isSelected ? { scale: 0.95 } : { scale: 1 }}
              className={[
                'fib-word',
                isUsed ? 'used' : '',
                isSelected ? 'selected' : '',
                submitted ? 'submitted' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {word}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence mode="wait">
        {submitted && (
          <motion.div
            className={`wfd-game-result ${isCorrect ? 'correct' : 'incorrect'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {!isCorrect && <p>{t('fibGameIncorrectTitle')}</p>}
            <div className="fib-feedback-list">
              {challenge.answers.map((correct, i) => (
                <div key={i} className={`fib-feedback-item ${filled[i] === correct ? 'good' : 'review'}`}>
                  {filled[i] === correct
                    ? <Check size={13} strokeWidth={2.4} />
                    : <X size={13} strokeWidth={2.2} />}
                  <span>{filled[i] ?? t('fibGameBlank')}</span>
                </div>
              ))}
            </div>
            {!isCorrect && (
              <p className="fib-hint">{t('fibGameHintLabel')}: {challenge.hint}</p>
            )}
            <div className="wfd-game-actions">
              <button type="button" className="wfd-game-secondary" onClick={() => resetRound(challengeIndex)}>
                <RotateCcw size={13} strokeWidth={2} />
                {t('fibGameTryAgain')}
              </button>
              <button type="button" className="wfd-game-primary" onClick={handleNext}>
                {challengeIndex === fibReadChallenges.length - 1 ? t('fibGameFinish') : t('fibGameNext')}
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      {!submitted && (
        <button
          type="button"
          className="wfd-game-primary"
          onClick={handleSubmit}
          disabled={filled.includes(null)}
        >
          {t('fibGameSubmit')}
          <Send size={13} strokeWidth={2} />
        </button>
      )}
    </section>
  );

  return (
    <>
      <section className="wfd-game-entry" aria-label={t('fibGameTitle')}>
        <button type="button" className="wfd-game-start" onClick={handleStart}>
          <Play size={14} strokeWidth={2.2} />
          {latestPassed ? t('fibGameStartAgain') : t('fibGameStart')}
        </button>
      </section>
      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ariaLabel={t('fibGameTitle')}
      >
        {completed ? completeView : gameView}
      </GameModal>
    </>
  );
}
