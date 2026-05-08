'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { targetProfiles } from '@/data/commandMap';
import type { CommandTarget } from '@/data/commandMap';

interface Props {
  onPick: (target: CommandTarget) => void;
}

export default function SummitOnboarding({ onPick }: Props) {
  const { t } = useLanguage();
  const targets: CommandTarget[] = ['seven', 'eight'];
  const titleKey: Record<CommandTarget, 'target7Title' | 'target8Title'> = {
    seven: 'target7Title',
    eight: 'target8Title',
  };
  const subtitleKey: Record<CommandTarget, 'target7Subtitle' | 'target8Subtitle'> = {
    seven: 'target7Subtitle',
    eight: 'target8Subtitle',
  };

  return (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="summit-onboarding"
    >
      <header className="summit-onboarding-head">
        <Icons.Mountain size={28} strokeWidth={1.6} color="#0071E3" />
        <h1>{t('pickTargetTitle')}</h1>
        <p>{t('pickTargetSubtitle')}</p>
      </header>

      <div className="summit-onboarding-cards">
        {targets.map((target) => {
          const profile = targetProfiles[target];
          return (
            <motion.button
              key={target}
              type="button"
              onClick={() => onPick(target)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              className="summit-target-card"
            >
              <span className="summit-target-label">{profile.label}</span>
              <span className="summit-target-title">{t(titleKey[target])}</span>
              <span className="summit-target-subtitle">{t(subtitleKey[target])}</span>
              <span className="summit-target-scores">
                {profile.scores.map((score) => (
                  <span key={score.skill} className="summit-target-score">
                    <span>{score.skill}</span>
                    <strong>{score.value}</strong>
                  </span>
                ))}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
