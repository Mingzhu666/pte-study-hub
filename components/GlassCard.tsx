'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  whileHover?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  onClick,
  whileHover = false,
}: GlassCardProps) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`glass-card ${className}`}
      onClick={onClick}
      whileHover={whileHover ? { scale: 1.02 } : undefined}
      style={{
        all: 'unset',
        cursor: onClick ? 'pointer' : 'default',
        display: 'block',
      }}
    >
      {children}
    </Component>
  );
}
