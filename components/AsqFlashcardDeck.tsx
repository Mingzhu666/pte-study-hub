'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Layers, Lightbulb, MousePointerClick, Shuffle } from 'lucide-react';
import { asqFlashcards } from '@/lib/asqFlashcards';
import { useLanguage } from '@/context/LanguageContext';
import GameModal from './GameModal';

function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export default function AsqFlashcardDeck() {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: asqFlashcards.length }, (_, i) => i));
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = useMemo(() => asqFlashcards[order[position]], [order, position]);

  const handleNext = () => {
    setFlipped(false);
    setPosition((p) => (p + 1) % asqFlashcards.length);
  };

  const handleShuffle = () => {
    setOrder(shuffleIndices(asqFlashcards.length));
    setPosition(0);
    setFlipped(false);
  };

  const handleFlip = () => setFlipped((f) => !f);

  const gameView = (
    <section className="wfd-game-card asq-deck-card" aria-label={t('asqDeckTitle')}>
      <header className="wfd-game-header">
        <div>
          <p>{t('asqDeckEyebrow')}</p>
          <h3>{t('asqDeckTitle')}</h3>
        </div>
        <span className="wfd-game-progress">{position + 1} / {asqFlashcards.length}</span>
      </header>

      <div className="wfd-game-rules">
        <span><MousePointerClick size={13} strokeWidth={2} />{t('asqDeckRuleFlip')}</span>
      </div>

      <div
        className={`asq-flashcard ${flipped ? 'is-flipped' : ''}`}
        role="button"
        tabIndex={0}
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFlip();
          }
        }}
        aria-pressed={flipped}
      >
        <motion.div
          className="asq-flashcard-inner"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="asq-flashcard-face asq-flashcard-front">
            <span className="asq-flashcard-corner-icon" aria-hidden="true">
              <HelpCircle size={18} strokeWidth={2} />
            </span>
            <span className="asq-flashcard-side">{t('asqDeckQuestionLabel')}</span>
            <p className="asq-flashcard-text">{card.question}</p>
            <div className="asq-flashcard-foot">
              <span className="asq-flashcard-index">{String(position + 1).padStart(2, '0')} / {String(asqFlashcards.length).padStart(2, '0')}</span>
              <span className="asq-flashcard-hint">{t('asqDeckTapToFlip')}</span>
            </div>
            <span className="asq-flashcard-shine" aria-hidden="true" />
          </div>
          <div className="asq-flashcard-face asq-flashcard-back">
            <span className="asq-flashcard-corner-icon" aria-hidden="true">
              <Lightbulb size={18} strokeWidth={2} />
            </span>
            <span className="asq-flashcard-side">{t('asqDeckAnswerLabel')}</span>
            <p className="asq-flashcard-text">{card.answer}</p>
            <div className="asq-flashcard-foot">
              <span className="asq-flashcard-index">{String(position + 1).padStart(2, '0')} / {String(asqFlashcards.length).padStart(2, '0')}</span>
              <span className="asq-flashcard-hint">{t('asqDeckTapToFlipBack')}</span>
            </div>
            <span className="asq-flashcard-shine" aria-hidden="true" />
          </div>
        </motion.div>
      </div>

      <div className="wfd-game-actions">
        <button type="button" className="wfd-game-secondary" onClick={handleShuffle}>
          <Shuffle size={13} strokeWidth={2} />
          {t('asqDeckShuffle')}
        </button>
        <button type="button" className="wfd-game-primary" onClick={handleNext}>
          {t('asqDeckNext')}
          <ArrowRight size={13} strokeWidth={2} />
        </button>
      </div>
    </section>
  );

  return (
    <>
      <section className="wfd-game-entry" aria-label={t('asqDeckTitle')}>
        <button type="button" className="wfd-game-start" onClick={() => setModalOpen(true)}>
          <Layers size={14} strokeWidth={2.2} />
          {t('asqDeckStart')}
        </button>
      </section>
      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ariaLabel={t('asqDeckTitle')}
      >
        {gameView}
      </GameModal>
    </>
  );
}
