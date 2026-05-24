'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}

export default function GameModal({ open, onClose, ariaLabel, children }: Props) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="game-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div className="game-modal-shell" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="game-modal-close"
          onClick={onClose}
          aria-label={t('modalClose')}
          title={t('modalClose')}
        >
          <X size={18} strokeWidth={2} />
        </button>
        <div className="game-modal-content">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
