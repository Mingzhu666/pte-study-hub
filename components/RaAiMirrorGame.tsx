'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Mic, Play, RotateCcw, Sparkles, Square, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  raSentences,
  tokenize,
  type RaMirrorScore,
  type RaSentence,
} from '@/lib/raAiMirror';

const STORAGE_KEY = 'pte-ra-mirror-sentence-index';
const PASS_THRESHOLD = 60;

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

type Phase = 'idle' | 'recording' | 'scoring' | 'result' | 'error';

function readStoredIndex(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed % raSentences.length : 0;
}

function classifyToken(
  token: string,
  hits: string[],
  missed: string[],
  mispronounced: string[],
): 'hit' | 'missed' | 'mispronounced' | 'neutral' {
  if (hits.includes(token)) return 'hit';
  if (missed.includes(token)) return 'missed';
  if (mispronounced.includes(token)) return 'mispronounced';
  return 'neutral';
}

function scoreBand(score: number): 'high' | 'mid' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'mid';
  return 'low';
}

export default function RaAiMirrorGame({ latestPassed, onLatestResult }: Props) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [sentenceIndex, setSentenceIndex] = useState<number>(0);
  const [score, setScore] = useState<RaMirrorScore | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const cleanupAudioStream = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
  };

  const revokeAudioUrl = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  useEffect(() => {
    setSentenceIndex(readStoredIndex());
  }, []);

  // ESC closes the modal.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const sentence: RaSentence = raSentences[sentenceIndex] ?? raSentences[0];
  const tokens = useMemo(() => tokenize(sentence.text), [sentence.text]);

  const openModal = () => {
    revokeAudioUrl();
    setAudioUrl(null);
    setPhase('idle');
    setScore(null);
    setErrorMessage(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    mediaRecorderRef.current?.stop();
    cleanupAudioStream();
    setIsOpen(false);
  };

  const sendForScoring = async (blob: Blob) => {
    setPhase('scoring');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('original', sentence.text);
      formData.append('mimeType', blob.type || 'audio/webm');
      formData.append('language', language);

      const res = await fetch('/api/ra-mirror/score-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        setPhase('error');
        setErrorMessage(t('raMirrorAiFailed'));
        return;
      }

      const data = (await res.json()) as RaMirrorScore;
      setScore(data);
      setPhase('result');
      onLatestResult(data.score >= PASS_THRESHOLD);
    } catch {
      setPhase('error');
      setErrorMessage(t('raMirrorAiFailed'));
    }
  };

  const handleRecord = async () => {
    revokeAudioUrl();
    setAudioUrl(null);
    setScore(null);
    setErrorMessage(null);

    try {
      // Pick a real hardware mic, not a virtual one (Teams/Zoom/etc create
      // virtual audio inputs that are silent unless the source app is routing).
      let chosenDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        const isLikelyVirtual = (label: string) =>
          /virtual|teams|zoom|loopback|aggregate|cable|vb-audio|blackhole/i.test(label);
        const real = audioInputs.find((d) => d.label && !isLikelyVirtual(d.label));
        chosenDeviceId = real?.deviceId;
        console.info(
          '[ra-mirror] audio input chosen:',
          real?.label ?? '(browser default)',
        );
      } catch {
        // enumerateDevices unavailable — fall through to browser default.
      }

      const constraints: MediaStreamConstraints = chosenDeviceId
        ? { audio: { deviceId: { exact: chosenDeviceId } } }
        : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        cleanupAudioStream();
        if (blob.size === 0) {
          setPhase('error');
          setErrorMessage(t('raMirrorNoAudio'));
          return;
        }
        setAudioUrl(URL.createObjectURL(blob));
        void sendForScoring(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setPhase('recording');
    } catch (err) {
      console.error('[ra-mirror] getUserMedia / MediaRecorder failed', err);
      setPhase('error');
      setErrorMessage(t('raMirrorCannotStart'));
    }
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleResetSameSentence = () => {
    revokeAudioUrl();
    setAudioUrl(null);
    setPhase('idle');
    setScore(null);
    setErrorMessage(null);
  };

  const handleNextSentence = () => {
    const next = (sentenceIndex + 1) % raSentences.length;
    setSentenceIndex(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    }
    handleResetSameSentence();
  };

  return (
    <>
      <section className="wfd-game-entry" aria-label={t('raMirrorTitle')}>
        <button type="button" className="wfd-game-start" onClick={openModal}>
          <Play size={14} strokeWidth={2.2} />
          {latestPassed ? t('raMirrorStartAgain') : t('raMirrorStart')}
        </button>
      </section>

      {mounted && isOpen && createPortal(
        <div
          className="ra-mirror-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={t('raMirrorTitle')}
          onClick={closeModal}
        >
          <div className="ra-mirror-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ra-mirror-close"
              onClick={closeModal}
              aria-label={t('modalClose')}
            >
              <X size={18} strokeWidth={2} />
            </button>

            <header className="ra-mirror-modal-header">
              <p className="ra-mirror-modal-eyebrow">{t('raMirrorEyebrow')}</p>
              <h2 className="ra-mirror-modal-title">{t('raMirrorTitle')}</h2>
              <p className="ra-mirror-modal-hint">{t('raMirrorHint')}</p>
            </header>

            <div className="ra-mirror-modal-body">
              {phase !== 'result' && (
                <div className="ra-mirror-sentence">
                  {tokens.map((token, i) => (
                    <span key={i} className="ra-mirror-token">
                      {token}
                    </span>
                  ))}
                </div>
              )}

              {phase === 'result' && score && (
                <>
                  <div className="ra-mirror-result-row">
                    <div className="ra-mirror-sentence" style={{ flex: 1, margin: 0 }}>
                      {tokens.map((token, i) => {
                        const cls = classifyToken(
                          token,
                          score.hits,
                          score.missed,
                          score.mispronounced,
                        );
                        return (
                          <span
                            key={i}
                            className={`ra-mirror-token ra-mirror-token--${cls}`}
                          >
                            {token}
                          </span>
                        );
                      })}
                    </div>
                    <span
                      className={`ra-mirror-score ra-mirror-score--${scoreBand(score.score)}`}
                    >
                      {score.score}
                    </span>
                  </div>
                  <div className="ra-mirror-comment">
                    <Sparkles
                      size={14}
                      strokeWidth={1.8}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <span>{score.comment}</span>
                  </div>
                </>
              )}

              {(audioUrl || score?.transcript) && (
                <div className="ra-mirror-feedback-block">
                  {audioUrl && (
                    <div className="ra-mirror-playback">
                      <span className="ra-mirror-playback-label">{t('raMirrorYourRecording')}</span>
                      <audio controls src={audioUrl} style={{ width: '100%' }} />
                    </div>
                  )}
                  {score?.transcript && (
                    <p className="ra-mirror-transcript">
                      <strong>{t('raMirrorAiHeard')}</strong>
                      {score.transcript || t('raMirrorNoContent')}
                    </p>
                  )}
                </div>
              )}

              {phase === 'error' && errorMessage && (
                <p className="ra-mirror-error">{errorMessage}</p>
              )}

              {phase === 'scoring' && (
                <p className="ra-mirror-scoring">{t('raMirrorScoring')}</p>
              )}
            </div>

            <footer className="ra-mirror-modal-footer">
              {phase === 'idle' && (
                <button
                  type="button"
                  className="ra-mirror-primary"
                  onClick={handleRecord}
                >
                  <Mic size={16} strokeWidth={2} />
                  {t('raMirrorRecord')}
                </button>
              )}

              {phase === 'recording' && (
                <button
                  type="button"
                  className="ra-mirror-secondary"
                  onClick={handleStop}
                >
                  <Square size={12} strokeWidth={2.4} fill="currentColor" />
                  {t('raMirrorStop')}
                </button>
              )}

              {phase === 'result' && (
                <>
                  <button
                    type="button"
                    className="ra-mirror-secondary"
                    onClick={handleResetSameSentence}
                  >
                    <RotateCcw size={14} strokeWidth={2} />
                    {t('raMirrorStartAgain')}
                  </button>
                  <button
                    type="button"
                    className="ra-mirror-primary"
                    onClick={handleNextSentence}
                  >
                    {t('raMirrorNextSentence')}
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                </>
              )}

              {phase === 'error' && (
                <button
                  type="button"
                  className="ra-mirror-primary"
                  onClick={handleRecord}
                >
                  <Mic size={16} strokeWidth={2} />
                  {t('raMirrorRecord')}
                </button>
              )}
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
