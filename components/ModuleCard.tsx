'use client';

import { PTEModule } from '@/types/pte';
import { cardVariants } from '@/lib/animations';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import GlassCard from './GlassCard';

interface ModuleCardProps {
  module: PTEModule;
  onClick: () => void;
  index: number;
}

export default function ModuleCard({ module, onClick, index }: ModuleCardProps) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[module.icon] || Icons.HelpCircle;

  const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  return (
    <motion.div variants={cardVariants} custom={index}>
      <GlassCard onClick={onClick} whileHover className="module-card">
        <div className="flex items-center gap-3 p-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${module.color}20` }}
          >
            <IconComponent size={24} color={module.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-lg truncate">
                {module.name}
              </h3>
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${priorityColors[module.priority]}20`,
                  color: priorityColors[module.priority],
                }}
              >
                {module.priority}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5 truncate">
              {module.content.questionCount}
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </GlassCard>
    </motion.div>
  );
}
