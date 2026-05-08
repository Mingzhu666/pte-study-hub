'use client';

import { PTEModule } from '@/types/pte';
import { detailVariants, overlayVariants, staggerContainer, fadeInUp } from '@/lib/animations';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import GlassCard from './GlassCard';

interface ModuleDetailProps {
  module: PTEModule | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModuleDetail({ module, isOpen, onClose }: ModuleDetailProps) {
  if (!module) return null;

  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[module.icon] || Icons.HelpCircle;

  const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Detail Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full md:w-[600px] lg:w-[700px] z-50 overflow-hidden"
            variants={detailVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="h-full bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
              {/* Header */}
              <div
                className="sticky top-0 z-10 p-6 border-b border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${module.color}15, transparent)`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${module.color}30` }}
                    >
                      <IconComponent size={28} color={module.color} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{module.name}</h2>
                      <p className="text-gray-400 text-sm mt-1">{module.fullName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Icons.X size={20} color="white" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-3 mt-4">
                  <span
                    className="px-3 py-1 text-sm font-medium rounded-full"
                    style={{
                      backgroundColor: `${priorityColors[module.priority]}20`,
                      color: priorityColors[module.priority],
                    }}
                  >
                    {module.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/10 text-white">
                    {module.content.questionCount}
                  </span>
                  {module.content.timeLimit && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/10 text-white">
                      {module.content.timeLimit}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* Overview */}
                <motion.section variants={fadeInUp}>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icons.Eye size={18} color={module.color} />
                    Overview
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {module.content.overview}
                  </p>
                </motion.section>

                {/* Scoring */}
                <motion.section variants={fadeInUp}>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icons.Scale size={18} color={module.color} />
                    Scoring Criteria
                  </h3>
                  <GlassCard className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Marks</span>
                        <span className="text-white font-medium">{module.content.scoring.marks}</span>
                      </div>
                      {module.content.scoring.components && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Components</span>
                          <span className="text-gray-300 text-sm">{module.content.scoring.components}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Weight</span>
                        <span
                          className="font-medium"
                          style={{ color: priorityColors[module.content.scoring.weight] }}
                        >
                          {module.content.scoring.weight.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.section>

                {/* Strategy */}
                {module.content.strategy && module.content.strategy.length > 0 && (
                  <motion.section variants={fadeInUp}>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Icons.Lightbulb size={18} color={module.color} />
                      Key Strategies
                    </h3>
                    <motion.ul
                      className="space-y-3"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {module.content.strategy.map((item, index) => (
                        <motion.li key={index} variants={fadeInUp}>
                          <GlassCard className="p-4">
                            <div className="flex gap-3">
                              <span
                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: `${module.color}30`, color: module.color }}
                              >
                                {index + 1}
                              </span>
                              <p className="text-gray-300 text-sm leading-relaxed">{item}</p>
                            </div>
                          </GlassCard>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.section>
                )}

                {/* Tips */}
                {module.content.tips && module.content.tips.length > 0 && (
                  <motion.section variants={fadeInUp}>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Icons.Star size={18} color={module.color} />
                      Pro Tips
                    </h3>
                    <div className="space-y-2">
                      {module.content.tips.map((tip, index) => (
                        <GlassCard key={index} className="p-3">
                          <p className="text-gray-300 text-sm flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            {tip}
                          </p>
                        </GlassCard>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Template */}
                {module.content.template && module.content.template.length > 0 && (
                  <motion.section variants={fadeInUp}>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Icons.FileCode size={18} color={module.color} />
                      Template / Structure
                    </h3>
                    <GlassCard className="p-4">
                      <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-2">
                        {module.content.template.map((line, index) => (
                          <p key={index} className="text-gray-300">
                            {line.includes('Method') ? (
                              <span className="text-blue-400 font-bold">{line}</span>
                            ) : (
                              line
                            )}
                          </p>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.section>
                )}

                {/* Common Mistakes */}
                {module.content.commonMistakes && module.content.commonMistakes.length > 0 && (
                  <motion.section variants={fadeInUp}>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Icons.AlertTriangle size={18} color={module.color} />
                      Common Mistakes to Avoid
                    </h3>
                    <div className="space-y-2">
                      {module.content.commonMistakes.map((mistake, index) => (
                        <GlassCard key={index} className="p-3">
                          <p className="text-gray-300 text-sm flex items-start gap-2">
                            <span className="text-red-400">✗</span>
                            {mistake}
                          </p>
                        </GlassCard>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Bottom Padding */}
                <div className="h-8" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
