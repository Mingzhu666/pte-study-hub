export const translations = {
  en: {
    // Navigation
    allModules: 'All Modules',
    categories: 'Categories',

    // Category Names
    speaking: 'Speaking',
    writing: 'Writing',
    reading: 'Reading',
    listening: 'Listening',

    // Module Detail Labels
    overview: 'Overview',
    scoring: 'Scoring',
    keyStrategies: 'Key Strategies',
    proTips: 'Pro Tips',
    template: 'Template / Structure',
    commonMistakes: 'Common Mistakes to Avoid',
    totalMarks: 'Total Marks',
    components: 'Components',
    weight: 'Weight',
    priority: 'Priority',
    questionCount: 'Questions',
    timeLimit: 'Time Limit',

    // Badges
    highPriority: 'High Priority',
    mediumPriority: 'Medium Priority',
    lowPriority: 'Low Priority',

    // Empty State
    welcomeTitle: 'Welcome to PTE Study Hub',
    welcomeSubtitle: 'Select a category from the sidebar to explore modules, or choose a specific module to view detailed strategies.',

    // Home Cards
    modulesCount: 'modules',

    // Quick Stats
    marks: 'marks',
  },
  zh: {
    // Navigation
    allModules: '所有模块',
    categories: '分类',

    // Category Names
    speaking: '口语',
    writing: '写作',
    reading: '阅读',
    listening: '听力',

    // Module Detail Labels
    overview: '概述',
    scoring: '评分标准',
    keyStrategies: '核心策略',
    proTips: '备考建议',
    template: '模板 / 结构',
    commonMistakes: '常见错误',
    totalMarks: '总分',
    components: '评分项',
    weight: '权重',
    priority: '优先级',
    questionCount: '题目数量',
    timeLimit: '时间限制',

    // Badges
    highPriority: '高优先级',
    mediumPriority: '中优先级',
    lowPriority: '低优先级',

    // Empty State
    welcomeTitle: 'PTE 学习中心',
    welcomeSubtitle: '从侧边栏选择一个分类查看模块，或选择特定模块查看详细策略。',

    // Home Cards
    modulesCount: '个模块',

    // Quick Stats
    marks: '分',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
