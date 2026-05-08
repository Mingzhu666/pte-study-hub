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

    // Summit Climb
    summitTitle: 'Your Climb',
    pickTargetTitle: 'Pick your target',
    pickTargetSubtitle: "We'll plot the route for you.",
    target7Title: '7炸 · Stable Passing',
    target7Subtitle: 'Protect the big modules; reduce low-level loss.',
    target8Title: '8炸 · Superior Pressure',
    target8Subtitle: 'Speaking 88 and Writing 85 are the bottlenecks.',
    nextFocus: 'Next focus',
    strategiesRemaining: 'strategies remaining',
    routeMastered: 'Route mastered. Maintain or revisit any module.',
    mastered: 'Mastered',
    focusTier: 'Focus',
    activeTier: 'Active',
    supportTier: 'Support',
    lowYieldTier: 'Low Yield · Skip-friendly',
    strategyChecklist: 'Strategy Checklist',
    failurePoints: 'Failure points',
    openFullStrategy: 'Open full strategy',
    baseCampMastered: 'mastered',
    baseCampPoints: 'strategy points',
    dailyVolume: 'Daily volume',
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

    // Summit Climb
    summitTitle: '你的登顶图',
    pickTargetTitle: '选择目标',
    pickTargetSubtitle: '我们帮你规划路线。',
    target7Title: '7炸 · 稳健通过',
    target7Subtitle: '抓住高价值题型,减少低级失分。',
    target8Title: '8炸 · 高压冲刺',
    target8Subtitle: '口语 88、写作 85 是真正的瓶颈。',
    nextFocus: '下一重点',
    strategiesRemaining: '条策略待完成',
    routeMastered: '全部攻略完成。继续保持或回顾任意模块。',
    mastered: '已掌握',
    focusTier: '核心',
    activeTier: '主练',
    supportTier: '辅助',
    lowYieldTier: '低产 · 可略过',
    strategyChecklist: '攻略清单',
    failurePoints: '失分陷阱',
    openFullStrategy: '打开完整攻略',
    baseCampMastered: '已掌握',
    baseCampPoints: '条攻略已勾选',
    dailyVolume: '每日量',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
