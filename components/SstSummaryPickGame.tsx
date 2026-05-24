'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, BadgeCheck, Headphones, MousePointerClick, Play, RotateCcw, Send, Volume2 } from 'lucide-react';
import { sstSummaryPickChallenges } from '@/lib/sstSummaryPick';
import { useLanguage } from '@/context/LanguageContext';
import GameModal from './GameModal';

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

export default function SstSummaryPickGame({ latestPassed, onLatestResult }: Props) {
  const { t, language } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [pickedSummaryId, setPickedSummaryId] = useState<'a' | 'b' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedPassed, setCompletedPassed] = useState(false);
  const [played, setPlayed] = useState(false);
  const [shake, setShake] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const challenge = sstSummaryPickChallenges[challengeIndex];
  const isCorrect = submitted && pickedSummaryId === challenge.correctSummaryId;
  const progress = completed ? sstSummaryPickChallenges.length : challengeIndex + (isCorrect ? 1 : 0);

  const resetRound = (nextIndex: number) => {
    setChallengeIndex(nextIndex);
    setPickedSummaryId(null);
    setSubmitted(false);
    setPlayed(false);
  };

  const playLecture = () => {
    setPlayed(true);
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(challenge.lectureText);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const preferredVoice =
      voices.find((v) => v.lang === 'en-US' && /enhanced|premium|svs/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US' && /samantha|victoria|karen|zira|google.*english.*female/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US' && /female/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  const handlePick = (id: 'a' | 'b') => {
    if (submitted) return;
    setPickedSummaryId(id);
  };

  const handleSubmit = () => {
    if (pickedSummaryId === null) {
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      return;
    }
    setSubmitted(true);
    const passed = pickedSummaryId === challenge.correctSummaryId;
    if (!passed) onLatestResult(false);
  };

  const handleNext = () => {
    if (challengeIndex === sstSummaryPickChallenges.length - 1) {
      const passed = isCorrect;
      setCompleted(true);
      setCompletedPassed(passed);
      if (passed) onLatestResult(true);
      return;
    }
    resetRound(challengeIndex + 1);
  };

  const completeView = (
    <section
      className={`wfd-game-card complete ${completedPassed ? '' : 'fail'}`}
      aria-label={t('sstGameTitle')}
    >
      <div className="wfd-game-complete-icon" aria-hidden="true">
        {completedPassed
          ? <BadgeCheck size={22} strokeWidth={2.2} />
          : <AlertCircle size={22} strokeWidth={2.2} />}
      </div>
      <div className="wfd-game-complete-copy">
        <h3>{completedPassed ? t('sstGameCompleteTitle') : t('sstGameFailTitle')}</h3>
        <p>{completedPassed ? t('sstGameCompleteBody') : t('sstGameFailBody')}</p>
      </div>
      <button
        type="button"
        className="wfd-game-secondary"
        onClick={() => {
          setCompleted(false);
          setCompletedPassed(false);
          resetRound(0);
        }}
      >
        <RotateCcw size={13} strokeWidth={2} />
        {completedPassed ? t('sstGameStartAgain') : t('sstGameRetry')}
      </button>
    </section>
  );

  const gameView = (
    <section className="wfd-game-card we-game-card" aria-label={t('sstGameTitle')}>
      <header className="wfd-game-header">
        <div>
          <p>{t('sstGameEyebrow')}</p>
          <h3>{t('sstGameTitle')}</h3>
        </div>
        <span className="wfd-game-progress">{challengeIndex + 1} / {sstSummaryPickChallenges.length}</span>
      </header>

      <div className="wfd-game-rules">
        <span><Headphones size={13} strokeWidth={2} />{t('sstGameRuleListen')}</span>
        <span><MousePointerClick size={13} strokeWidth={2} />{t('sstGameRulePick')}</span>
      </div>

      <div className="wfd-game-meter" aria-hidden="true">
        <span style={{ width: `${(progress / sstSummaryPickChallenges.length) * 100}%` }} />
      </div>

      <button type="button" className="sst-game-play" onClick={playLecture}>
        <Volume2 size={14} strokeWidth={2.2} />
        {played ? t('sstGameReplay') : t('sstGamePlay')}
      </button>

      <motion.div
        className="we-template-list"
        animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.28 }}
      >
        {challenge.summaries.map((s) => {
          const isPicked = pickedSummaryId === s.id;
          const isCorrectPick = submitted && s.id === challenge.correctSummaryId;
          const isWrongPick = submitted && isPicked && s.id !== challenge.correctSummaryId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handlePick(s.id)}
              disabled={submitted}
              className={[
                'we-template-card',
                isPicked ? 'picked' : '',
                isCorrectPick ? 'correct' : '',
                isWrongPick ? 'wrong' : '',
              ].join(' ')}
            >
              <header className="we-template-card-head">
                <span className="we-template-card-tag">{t('sstGameSummaryLabel')} {s.id.toUpperCase()}</span>
                <span className="sst-summary-wordcount">{s.wordCount} {t('sstGameWordsLabel')}</span>
              </header>
              <p className="sst-summary-text">{s.text}</p>
            </button>
          );
        })}
      </motion.div>

      <div className="wfd-game-helper">
        {submitted
          ? isCorrect ? t('sstGameCorrectHint') : t('sstGameIncorrectHint')
          : t('sstGamePickHint')}
      </div>

      {!submitted && (
        <button type="button" className="wfd-game-primary" onClick={handleSubmit}>
          {t('sstGameSubmit')}
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
            <p>{isCorrect ? t('sstGameCorrectTitle') : t('sstGameIncorrectTitle')}</p>
            <p className="we-game-explanation">{challenge.explanation[language]}</p>
            <div className="wfd-game-actions">
              {!isCorrect && (
                <button type="button" className="wfd-game-secondary" onClick={() => resetRound(challengeIndex)}>
                  <RotateCcw size={13} strokeWidth={2} />
                  {t('sstGameTryAgain')}
                </button>
              )}
              <button type="button" className="wfd-game-primary" onClick={handleNext}>
                {challengeIndex === sstSummaryPickChallenges.length - 1 ? t('sstGameFinish') : t('sstGameNext')}
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
      <section className="wfd-game-entry" aria-label={t('sstGameTitle')}>
        <button type="button" className="wfd-game-start" onClick={() => setModalOpen(true)}>
          <Play size={14} strokeWidth={2.2} />
          {latestPassed ? t('sstGameStartAgain') : t('sstGameStart')}
        </button>
      </section>
      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ariaLabel={t('sstGameTitle')}
      >
        {completed ? completeView : gameView}
      </GameModal>
    </>
  );
}
