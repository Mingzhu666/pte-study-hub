'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PTEModule, Category as CategoryType } from '@/types/pte';
import { categories } from '@/data/pteModules';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/data/translations';
import * as Icons from 'lucide-react';
import SummitClimb from '@/components/SummitClimb';

type ViewState =
  | { type: 'empty' }
  | { type: 'category'; category: CategoryType }
  | { type: 'module'; module: PTEModule };

const categoryColors: Record<string, string> = {
  speaking: '#FF375F',
  writing: '#0071E3',
  reading: '#30D158',
  listening: '#BF5AF2',
};

const priorityColors: Record<string, string> = {
  high: '#FF375F',
  medium: '#FF9F0A',
  low: '#30D158',
};

const smooth = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

const priorityTranslationKeys: Record<PTEModule['priority'], TranslationKey> = {
  high: 'highPriority',
  medium: 'mediumPriority',
  low: 'lowPriority',
};

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>({ type: 'empty' });
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['speaking', 'writing', 'reading', 'listening']);
  const { language, setLanguage, t } = useLanguage();
  const allModules = categories.flatMap((category) => category.modules);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const handleCategoryClick = (category: CategoryType) => {
    toggleCategory(category.id);
    setViewState({ type: 'category', category });
  };

  const handleModuleClick = (module: PTEModule) => {
    setViewState({ type: 'module', module });
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
      Volume2: Icons.Volume2,
      Repeat: Icons.Repeat,
      Image: Icons.Image,
      Mic: Icons.Mic,
      HelpCircle: Icons.HelpCircle,
      Users: Icons.Users,
      MessageSquare: Icons.MessageSquare,
      FileText: Icons.FileText,
      Pencil: Icons.Pencil,
      Shuffle: Icons.Shuffle,
      Clipboard: Icons.Clipboard,
      CheckSquare: Icons.CheckSquare,
      CircleDot: Icons.CircleDot,
      BookOpen: Icons.BookOpen,
      Headphones: Icons.Headphones,
      PenTool: Icons.PenTool,
      GraduationCap: Icons.GraduationCap,
      Home: Icons.Home,
      AlertTriangle: Icons.AlertTriangle,
    };
    return icons[iconName] || Icons.HelpCircle;
  };

  const getCategoryName = (categoryId: string) => {
    const names: Record<string, string> = {
      speaking: t('speaking'),
      writing: t('writing'),
      reading: t('reading'),
      listening: t('listening'),
    };
    return names[categoryId] || categoryId;
  };

  const getModuleContent = (module: PTEModule) => {
    if (language === 'zh' && module.contentZh) {
      return module.contentZh;
    }
    return module.content;
  };

  const getCategoryIcon = (id: string) => {
    if (id === 'speaking') return Icons.Mic;
    if (id === 'writing') return Icons.PenTool;
    if (id === 'reading') return Icons.BookOpen;
    return Icons.Headphones;
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#FBFBFD' }}>
      {/* Sidebar */}
      <aside
        className="sidebar-wrap w-[272px] h-screen sticky top-0 flex flex-col"
      >
        {/* Logo */}
        <div className="p-5 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0071E3, #BF5AF2)' }}
              >
                <Icons.GraduationCap size={20} color="white" strokeWidth={1.8} />
              </div>
              <div>
                <h1 style={{ color: '#1D1D1F', fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em' }}>PTE Study Hub</h1>
                <p style={{ color: '#A1A1A6', fontSize: '11px', fontWeight: 500 }}>2025 Latest Updates</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{
                color: '#6E6E73',
                background: 'rgba(0,0,0,0.03)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
            >
              <Icons.Globe size={14} strokeWidth={1.8} />
              {language === 'en' ? '中' : 'EN'}
            </motion.button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 pt-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewState({ type: 'empty' })}
            className="w-full flex items-center gap-3 p-2.5 rounded-[10px] mb-3"
            style={{
              background: viewState.type === 'empty' ? 'rgba(0,113,227,0.06)' : 'transparent',
              color: viewState.type === 'empty' ? '#0071E3' : '#6E6E73',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (viewState.type !== 'empty') e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
            onMouseLeave={e => { if (viewState.type !== 'empty') e.currentTarget.style.background = 'transparent'; }}
          >
            <Icons.Home size={18} strokeWidth={1.8} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{t('allModules')}</span>
          </motion.button>

          <p className="section-title">{t('categories')}</p>

          {categories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const isActive = viewState.type === 'category' && viewState.category.id === category.id;
            const IconComponent = getCategoryIcon(category.id);

            return (
              <div key={category.id} className="mb-1">
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`category-btn ${isExpanded ? 'expanded' : ''} ${isActive ? 'active' : ''}`}
                  style={{
                    background: isActive ? 'rgba(0,113,227,0.06)' : 'transparent',
                    color: isActive ? '#0071E3' : '#1D1D1F'
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center"
                    style={{ background: `${categoryColors[category.id]}10` }}
                  >
                    <IconComponent size={15} color={categoryColors[category.id]} strokeWidth={1.8} />
                  </div>
                  <span style={{ fontWeight: 500, flex: 1, fontSize: '14px' }}>{getCategoryName(category.id)}</span>
                  <span style={{ color: '#A1A1A6', fontSize: '12px' }}>{category.modules.length}</span>
                  <Icons.ChevronRight size={14} className="chevron" style={{ color: '#A1A1A6' }} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 mt-0.5 space-y-px">
                        {category.modules.map((module) => {
                          const ModuleIcon = getIcon(module.icon);
                          const isSelected = viewState.type === 'module' && viewState.module.id === module.id;

                          return (
                            <button
                              key={module.id}
                              onClick={() => handleModuleClick(module)}
                              className={`module-item ${isSelected ? 'active' : ''}`}
                            >
                              <ModuleIcon size={14} color={isSelected ? '#0071E3' : '#A1A1A6'} strokeWidth={1.8} />
                              <span className="flex-1">{module.name}</span>
                              <span
                                className="priority-dot"
                                style={{ background: priorityColors[module.priority] }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <AnimatePresence mode="wait">
          {/* Empty State */}
          {viewState.type === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={smooth}
              className="command-map-view"
            >
              <SummitClimb modules={allModules} onOpenModule={handleModuleClick} />
            </motion.div>
          )}

          {/* Category View */}
          {viewState.type === 'category' && (
            <motion.div
              key={viewState.category.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={smooth}
              className="p-10 max-w-5xl mx-auto"
            >
              <div className="flex items-center gap-5 mb-10">
                <div
                  className="w-14 h-14 rounded-[16px] flex items-center justify-center"
                  style={{ background: `${categoryColors[viewState.category.id]}10` }}
                >
                  {(() => {
                    const IconComponent = getCategoryIcon(viewState.category.id);
                    return <IconComponent size={28} color={categoryColors[viewState.category.id]} strokeWidth={1.6} />;
                  })()}
                </div>
                <div>
                  <h1 style={{ color: '#1D1D1F', fontSize: '30px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '4px' }}>
                    {getCategoryName(viewState.category.id)}
                  </h1>
                  <p style={{ color: '#A1A1A6', fontSize: '15px' }}>
                    {viewState.category.modules.length} {t('modulesCount')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {viewState.category.modules.map((module, index) => {
                  const IconComponent = getIcon(module.icon);
                  const content = getModuleContent(module);

                  return (
                    <motion.button
                      key={module.id}
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05, ...smooth }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleModuleClick(module)}
                      className="module-grid-card text-left"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                          style={{ background: `${module.color}12` }}
                        >
                          <IconComponent size={18} color={module.color} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 style={{ color: '#1D1D1F', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{module.name}</h3>
                          <span
                            className="badge"
                            style={{
                              background: `${priorityColors[module.priority]}14`,
                              color: priorityColors[module.priority]
                            }}
                          >
                            {t(priorityTranslationKeys[module.priority])}
                          </span>
                        </div>
                      </div>
                      <p className="line-clamp-2" style={{ color: '#6E6E73', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                        {content.overview}
                      </p>
                      <div className="flex items-center gap-3" style={{ color: '#A1A1A6', fontSize: '12px' }}>
                        <span>{content.questionCount}</span>
                        {content.timeLimit && (
                          <>
                            <span style={{ opacity: 0.4 }}>/</span>
                            <span>{content.timeLimit}</span>
                          </>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Module Detail View */}
          {viewState.type === 'module' && (
            (() => {
              const content = getModuleContent(viewState.module);
              return (
                <motion.div
                  key={viewState.module.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={smooth}
                  className="p-10 max-w-4xl mx-auto"
                >
                  {/* Header */}
                  <div className="flex items-start gap-5 mb-10">
                    <div
                      className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
                      style={{ background: `${viewState.module.color}10` }}
                    >
                      {(() => {
                        const IconComponent = getIcon(viewState.module.icon);
                        return <IconComponent size={24} color={viewState.module.color} strokeWidth={1.6} />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h1 style={{ color: '#1D1D1F', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '10px' }}>
                        {viewState.module.name}
                      </h1>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className="badge"
                          style={{
                            background: `${priorityColors[viewState.module.priority]}14`,
                            color: priorityColors[viewState.module.priority]
                          }}
                        >
                          {t(priorityTranslationKeys[viewState.module.priority])}
                        </span>
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.03)', color: '#6E6E73' }}>
                          {content.questionCount}
                        </span>
                        {content.timeLimit && (
                          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.03)', color: '#6E6E73' }}>
                            {content.timeLimit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div>
                    {/* Overview */}
                    <div className="content-card">
                      <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#A1A1A6', marginBottom: '16px' }}>
                        {t('overview')}
                      </h3>
                      <p className="overview-text">{content.overview}</p>
                    </div>

                    {/* Scoring */}
                    <div className="content-card">
                      <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#A1A1A6', marginBottom: '16px' }}>
                        {t('scoring')}
                      </h3>
                      <div className="flex gap-4 flex-wrap">
                        <div className="quick-stat">
                          <p className="stat-label">{t('totalMarks')}</p>
                          <p className="stat-value">{content.scoring.marks}</p>
                        </div>
                        {content.scoring.components && (
                          <div className="quick-stat" style={{ flex: 2 }}>
                            <p className="stat-label">{t('components')}</p>
                            <p style={{ color: '#6E6E73', fontSize: '14px', lineHeight: 1.6 }}>{content.scoring.components}</p>
                          </div>
                        )}
                        <div className="quick-stat">
                          <p className="stat-label">{t('weight')}</p>
                          <p
                            className="stat-value"
                            style={{ color: priorityColors[content.scoring.weight] }}
                          >
                            {content.scoring.weight.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Strategies */}
                    {content.strategy && content.strategy.length > 0 && (
                      <div className="content-card">
                        <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#A1A1A6', marginBottom: '16px' }}>
                          {t('keyStrategies')}
                        </h3>
                        <div>
                          {content.strategy.map((item, index) => (
                            <div key={index} className="strategy-item">
                              <span className="strategy-number">{index + 1}</span>
                              <p style={{ color: '#6E6E73', lineHeight: 1.7, fontSize: '14px' }}>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pro Tips */}
                    {content.tips && content.tips.length > 0 && (
                      <div className="content-card">
                        <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#A1A1A6', marginBottom: '16px' }}>
                          {t('proTips')}
                        </h3>
                        <div>
                          {content.tips.map((tip, index) => (
                            <div key={index} className="tip-item">
                              <span className="tip-icon">&#10003;</span>
                              <p>{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Template */}
                    {viewState.module.content.template && viewState.module.content.template.length > 0 && (
                      <div className="content-card">
                        <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#A1A1A6', marginBottom: '16px' }}>
                          Template / Structure
                        </h3>
                        <div className="template-box">
                          {viewState.module.content.template.map((line, index) => {
                            const isSectionHeader = line.startsWith('---');
                            const isStructureLabel = line.startsWith('Structure') || line.startsWith('Method') || line.startsWith('FANBOYS') || line.startsWith('Subordinating') || line.startsWith('If under');
                            return (
                              <p
                                key={index}
                                style={{
                                  color: isSectionHeader ? '#0071E3' : isStructureLabel ? '#1D1D1F' : '#6E6E73',
                                  fontWeight: isSectionHeader ? 600 : isStructureLabel ? 600 : 400,
                                  marginTop: isSectionHeader ? (index > 0 ? '20px' : '0') : '0',
                                  marginBottom: isSectionHeader ? '8px' : '4px',
                                  fontSize: isSectionHeader ? '13px' : '13.5px',
                                  letterSpacing: isSectionHeader ? '0.02em' : 'normal',
                                }}
                              >
                                {isSectionHeader ? line.replace(/---/g, '').trim() : line}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Common Mistakes */}
                    {content.commonMistakes && content.commonMistakes.length > 0 && (
                      <div className="content-card">
                        <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#A1A1A6', marginBottom: '16px' }}>
                          {t('commonMistakes')}
                        </h3>
                        <div>
                          {content.commonMistakes.map((mistake, index) => (
                            <div key={index} className="mistake-item">
                              <span className="mistake-icon">&#10005;</span>
                              <p>{mistake}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="h-10" />
                  </div>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
