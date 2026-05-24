'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Props {
  id: string;
  text: string;
  checked: boolean;
  onToggle: (id: string) => void;
}

export default function StrategyChecklistItem({ id, text, checked, onToggle }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(id)}
      whileTap={{ scale: 0.985 }}
      className={`strategy-row ${checked ? 'checked' : ''}`}
      aria-pressed={checked}
    >
      <span className="strategy-box" aria-hidden="true">
        {checked && <Check size={12} strokeWidth={2.4} />}
      </span>
      <span className="strategy-text">{text}</span>
    </motion.button>
  );
}
