'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Info, Keyboard, Play, RotateCcw, Send, Volume2 } from 'lucide-react';
import { rsKeywordChallenges, scoreRsKeywords, type RsKeywordScore } from '@/lib/rsKeywordRecall';
import { useLanguage } from '@/context/LanguageContext';
import GameModal from './GameModal';

const ratingTranslationKey = {
  excellent: 'rsGameRatingExcellent',
  solid: 'rsGameRatingSolid',
  'needs-work': 'rsGameRatingNeedsWork',
} as const;

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

export default function RsKeywordRecallGame({ latestPassed, onLatestResult }: Props) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [keywords, setKeywords] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<RsKeywordScore | null>(null);
  const [played, setPlayed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const challenge = rsKeywordChallenges[challengeIndex];
  const progress = challengeIndex + (submitted ? 1 : 0);

  const resetRound = (nextIndex: number) => {
    setChallengeIndex(nextIndex);
    setKeywords(['', '', '']);
    setSubmitted(false);
    setScore(null);
    setPlayed(false);
  };

  const playSentence = () => {
    setPlayed(true);
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(challenge.sentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const preferredVoice =
      voices.find((v) => v.lang === 'en-US' && /enhanced|premium|svs/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US' && /samantha|victoria|karen|zira|google.*english.*female/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US' && /female/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US' && /samantha|victoria|karen|zira/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    const result = scoreRsKeywords(challenge, keywords.join(' '));
    setScore(result);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (challengeIndex === rsKeywordChallenges.length - 1) {
      setCompleted(true);
      if (score?.caughtCore) onLatestResult(true);
      else onLatestResult(false);
      return;
    }
    resetRound(challengeIndex + 1);
  };

  const completeView = (
    <section className="wfd-game-card complete" aria-label={t('rsGameTitle')}>
      <div className="wfd-game-complete-icon" aria-hidden="true">
        <BadgeCheck size={22} strokeWidth={2.2} />
      </div>
      <div className="wfd-game-complete-copy">
        <h3>{t('rsGameCompleteTitle')}</h3>
        <p>{t('rsGameCompleteBody')}</p>
      </div>
      <button type="button" className="wfd-game-secondary" onClick={() => {
        setCompleted(false);
        resetRound(0);
      }}>
        <RotateCcw size={13} strokeWidth={2} />
        {t('rsGameStartAgain')}
      </button>
    </section>
  );

  const gameView = (
    <section className="wfd-game-card rs-game-card" aria-label={t('rsGameTitle')}>
      <header className="wfd-game-header">
        <div>
          <p>{t('rsGameEyebrow')}</p>
          <h3>{t('rsGameTitle')}</h3>
        </div>
        <span className="wfd-game-progress">{challengeIndex + 1} / {rsKeywordChallenges.length}</span>
      </header>

      <div className="wfd-game-rules">
        <span><Volume2 size={13} strokeWidth={2} />{t('rsGameRuleListen')}</span>
        <span><Keyboard size={13} strokeWidth={2} />{t('rsGameRuleKeywords')}</span>
      </div>

      <div className="wfd-game-meter" aria-hidden="true">
        <span style={{ width: `${(progress / rsKeywordChallenges.length) * 100}%` }} />
      </div>

      <button type="button" className={`rs-play-button ${played ? 'played' : ''}`} onClick={playSentence}>
        <Volume2 size={18} strokeWidth={2.2} />
        {played ? t('rsGameReplay') : t('rsGamePlay')}
      </button>

      <div className="rs-keyword-inputs">
        {keywords.map((keyword, index) => (
          <label key={index}>
            <span>{index + 1}</span>
            <input
              value={keyword}
              disabled={submitted}
              onChange={(event) => {
                const next = [...keywords];
                next[index] = event.target.value;
                setKeywords(next);
              }}
              placeholder={t('rsGameKeywordPlaceholder')}
            />
          </label>
        ))}
      </div>

      {!submitted && (
        <button type="button" className="wfd-game-primary" onClick={handleSubmit}>
          {t('rsGameSubmit')}
          <Send size={13} strokeWidth={2} />
        </button>
      )}

      <AnimatePresence mode="wait">
        {submitted && score && (
          <motion.div
            className={`wfd-game-result ${score.caughtCore ? 'correct' : 'incorrect'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p>{t(ratingTranslationKey[score.rating])}</p>
            <div className="rs-feedback-grid">
              <span className={score.caughtCore ? 'good' : 'review'}>
                {score.caughtCore ? <Check size={13} strokeWidth={2.4} /> : <Info size={13} strokeWidth={2.2} />}
                {score.caughtCore ? t('rsGameCoreCaught') : t('rsGameCoreWeak')}
              </span>
              <span className={score.missedVerb ? 'review' : 'good'}>
                {score.missedVerb ? <Info size={13} strokeWidth={2.2} /> : <Check size={13} strokeWidth={2.4} />}
                {score.missedVerb ? t('rsGameMissedVerb') : t('rsGameVerbCaught')}
              </span>
            </div>
            <div className="rs-keyword-review">
              <p>{t('rsGamePresetKeywords')}</p>
              <div className="wfd-game-tags">
                {challenge.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
              </div>
            </div>
            <div className="wfd-game-actions">
              <button type="button" className="wfd-game-secondary" onClick={() => resetRound(challengeIndex)}>
                <RotateCcw size={13} strokeWidth={2} />
                {t('rsGameTryAgain')}
              </button>
              <button type="button" className="wfd-game-primary" onClick={handleNext}>
                {challengeIndex === rsKeywordChallenges.length - 1 ? t('rsGameFinish') : t('rsGameNext')}
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
      <section className="wfd-game-entry" aria-label={t('rsGameTitle')}>
        <button type="button" className="wfd-game-start" onClick={() => setModalOpen(true)}>
          <Play size={14} strokeWidth={2.2} />
          {latestPassed ? t('rsGameStartAgain') : t('rsGameStart')}
        </button>
      </section>
      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ariaLabel={t('rsGameTitle')}
      >
        {completed ? completeView : gameView}
      </GameModal>
    </>
  );
}
