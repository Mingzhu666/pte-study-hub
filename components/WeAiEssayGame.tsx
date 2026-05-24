'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Clock, Loader2, Play, RefreshCw, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  WE_PASS_THRESHOLD,
  countWords,
  weTopics,
  type WeEssayScore,
  type WeSentenceLevel,
  type WeTopic,
} from '@/lib/weAiEssay';

const STORAGE_KEY = 'pte-we-essay-topic-index';
const TIMER_SECONDS = 20 * 60;

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

type Phase = 'idle' | 'writing' | 'scoring' | 'result' | 'error';

function readStoredIndex(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed % weTopics.length : 0;
}

function scoreBand(score: number): 'high' | 'mid' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 60) return 'mid';
  return 'low';
}

function levelColor(level: WeSentenceLevel): string {
  if (level === 'good') return '#30D158';
  if (level === 'ok') return '#FF9F0A';
  return '#FF453A';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function WeAiEssayGame({ latestPassed, onLatestResult }: Props) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [topicIndex, setTopicIndex] = useState<number>(0);
  const [essay, setEssay] = useState('');
  const [score, setScore] = useState<WeEssayScore | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMER_SECONDS);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const submitRef = useRef<() => void>(() => {});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopicIndex(readStoredIndex());
  }, []);

  const topic: WeTopic = weTopics[topicIndex] ?? weTopics[0];
  const wordCount = countWords(essay);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ESC closes the modal (except while scoring).
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'scoring') closeModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, phase, closeModal]);

  // Body scroll lock.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const submitEssay = useCallback(async (essayText: string) => {
    setPhase('scoring');
    setErrorMessage(null);
    try {
      const res = await fetch('/api/we-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.topic, essay: essayText, language }),
      });
      if (!res.ok) {
        setPhase('error');
        setErrorMessage(t('weEssayErrorScoreFailed'));
        return;
      }
      const data = (await res.json()) as WeEssayScore;
      setScore(data);
      setPhase('result');
      onLatestResult(data.total >= WE_PASS_THRESHOLD);
    } catch {
      setPhase('error');
      setErrorMessage(t('weEssayErrorNetwork'));
    }
  }, [topic.topic, onLatestResult, language, t]);

  const handleSubmit = useCallback(() => {
    const trimmed = essay.trim();
    if (trimmed.length < 50) {
      setErrorMessage(t('weEssayErrorTooShort'));
      return;
    }
    void submitEssay(trimmed);
  }, [essay, submitEssay, t]);

  // Keep the latest handleSubmit in a ref so the timer effect doesn't need it
  // as a dependency (which would cause it to re-create every keystroke).
  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

  // 20-minute countdown — runs while writing; auto-submit at 0.
  useEffect(() => {
    if (phase !== 'writing') return;
    if (secondsLeft <= 0) {
      submitRef.current();
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, secondsLeft]);

  const openModal = () => {
    setEssay('');
    setScore(null);
    setErrorMessage(null);
    setSecondsLeft(TIMER_SECONDS);
    setPhase('idle');
    setIsOpen(true);
  };

  const beginWriting = () => {
    setSecondsLeft(TIMER_SECONDS);
    setPhase('writing');
    // Focus textarea after render.
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleRetrySameTopic = () => {
    setEssay('');
    setScore(null);
    setErrorMessage(null);
    setSecondsLeft(TIMER_SECONDS);
    setPhase('idle');
  };

  const handleNextTopic = () => {
    const next = (topicIndex + 1) % weTopics.length;
    setTopicIndex(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    }
    handleRetrySameTopic();
  };

  const lowTime = secondsLeft <= 60;
  const wordOk = wordCount >= 200 && wordCount <= 300;

  return (
    <>
      <section className="wfd-game-entry" aria-label={t('weEssayAriaLabel')}>
        <button type="button" className="wfd-game-start" onClick={openModal}>
          <Play size={14} strokeWidth={2.2} />
          {latestPassed ? t('weEssayStartAgainButton') : t('weEssayStartButton')}
        </button>
      </section>

      {mounted && isOpen && createPortal(
        <div
          className="we-essay-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={t('weEssayAriaLabel')}
          onClick={phase !== 'scoring' ? closeModal : undefined}
        >
          <div className="we-essay-modal" onClick={(e) => e.stopPropagation()}>
            {phase !== 'scoring' && (
              <button
                type="button"
                className="we-essay-close"
                onClick={closeModal}
                aria-label={t('modalClose')}
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}

            <header className="we-essay-modal-header">
              <p className="we-essay-modal-eyebrow">{t('weEssayEyebrow')}</p>
              <h2 className="we-essay-modal-title">{t('weEssayTitle')}</h2>
              <p className="we-essay-modal-hint">{t('weEssayHint')}</p>
            </header>

            <div className="we-essay-modal-body">
              <div className="we-essay-topic">
                <span className="we-essay-topic-label">{t('weEssayTopicLabel')}</span>
                <p>{topic.topic}</p>
              </div>

              {phase === 'idle' && (
                <p className="we-essay-idle-hint">
                  {t('weEssayIdleHint')}
                </p>
              )}

              {(phase === 'writing' || phase === 'error') && (
                <>
                  <div className="we-essay-meta-row">
                    <span
                      className={`we-essay-timer ${lowTime ? 'we-essay-timer--low' : ''}`}
                    >
                      <Clock size={13} strokeWidth={2} />
                      {formatTime(secondsLeft)}
                    </span>
                    <span
                      className={`we-essay-wordcount ${wordOk ? 'we-essay-wordcount--ok' : ''}`}
                    >
                      {wordCount} {t('weEssayWordTarget')}
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    className="we-essay-textarea"
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder={t('weEssayTextareaPlaceholder')}
                    spellCheck
                  />
                </>
              )}

              {phase === 'scoring' && (
                <p className="we-essay-scoring">
                  <Loader2 size={16} className="we-essay-spin" strokeWidth={2} />
                  {t('weEssayScoring')}
                </p>
              )}

              {phase === 'result' && score && (
                <div className="we-essay-result">
                  <div className="we-essay-score-row">
                    <span
                      className={`we-essay-total we-essay-total--${scoreBand(score.total)}`}
                    >
                      {score.total}
                      <small>/90</small>
                    </span>
                    <div className="we-essay-breakdown">
                      <BreakdownChip label={t('weEssayBreakdownContent')} value={score.breakdown.content} max={3} />
                      <BreakdownChip label={t('weEssayBreakdownForm')} value={score.breakdown.form} max={2} />
                      <BreakdownChip label={t('weEssayBreakdownDevelopment')} value={score.breakdown.development} max={2} />
                      <BreakdownChip label={t('weEssayBreakdownGrammar')} value={score.breakdown.grammar} max={2} />
                      <BreakdownChip label={t('weEssayBreakdownLinguistic')} value={score.breakdown.linguistic} max={2} />
                      <BreakdownChip label={t('weEssayBreakdownVocabulary')} value={score.breakdown.vocabulary} max={2} />
                      <BreakdownChip label={t('weEssayBreakdownSpelling')} value={score.breakdown.spelling} max={2} />
                    </div>
                  </div>

                  <div className="we-essay-overall">
                    <Sparkles size={14} strokeWidth={1.8} />
                    <p>{score.overall}</p>
                  </div>

                  <div className="we-essay-sentences">
                    <h3 className="we-essay-sentences-title">{t('weEssaySentencesTitle')}</h3>
                    <ol>
                      {score.sentences.map((s, i) => (
                        <li
                          key={i}
                          className="we-essay-sentence-item"
                          style={{ borderLeftColor: levelColor(s.level) }}
                        >
                          <p className="we-essay-sentence-text">{s.sentence}</p>
                          <p
                            className="we-essay-sentence-comment"
                            style={{ color: levelColor(s.level) }}
                          >
                            → {s.comment}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {phase === 'error' && errorMessage && (
                <p className="we-essay-error">{errorMessage}</p>
              )}
            </div>

            <footer className="we-essay-modal-footer">
              {phase === 'idle' && (
                <button
                  type="button"
                  className="we-essay-primary"
                  onClick={beginWriting}
                >
                  <Play size={14} strokeWidth={2} />
                  {t('weEssayStartWriting')}
                </button>
              )}

              {phase === 'writing' && (
                <button
                  type="button"
                  className="we-essay-primary"
                  onClick={handleSubmit}
                >
                  <Send size={14} strokeWidth={2} />
                  {t('weEssaySubmit')}
                </button>
              )}

              {phase === 'error' && (
                <button
                  type="button"
                  className="we-essay-primary"
                  onClick={() => void submitEssay(essay.trim())}
                >
                  <RefreshCw size={14} strokeWidth={2} />
                  {t('weEssayResubmit')}
                </button>
              )}

              {phase === 'result' && (
                <>
                  <button
                    type="button"
                    className="we-essay-secondary"
                    onClick={handleRetrySameTopic}
                  >
                    <RotateCcw size={14} strokeWidth={2} />
                    {t('weEssayRetrySameTopic')}
                  </button>
                  <button
                    type="button"
                    className="we-essay-primary"
                    onClick={handleNextTopic}
                  >
                    {t('weEssayNextTopic')}
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function BreakdownChip({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = value / max;
  const color = pct >= 0.8 ? '#30D158' : pct >= 0.5 ? '#FF9F0A' : '#FF453A';
  return (
    <span className="we-essay-chip" style={{ borderColor: color, color }}>
      <span className="we-essay-chip-label">{label}</span>
      <span className="we-essay-chip-value">
        {value}<small>/{max}</small>
      </span>
    </span>
  );
}
