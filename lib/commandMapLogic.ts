export type CommandTarget = 'seven' | 'eight';
export type PracticeStatus = 'new' | 'practicing' | 'stable' | 'mastered';

export interface ModulePractice {
  practiceCount: number;
  practicedDates: string[];
  lastPracticedAt?: string;
}

export interface CommandProgress {
  target: CommandTarget;
  modules: Record<string, ModulePractice>;
}

export interface CoachRecommendation {
  nextModuleId: string;
  message: string;
}

export type RouteStepState = 'done' | 'current' | 'locked';

export interface RouteStep {
  moduleId: string;
  index: number;
  state: RouteStepState;
}

export const focusRoutes: Record<CommandTarget, string[]> = {
  seven: ['rs', 'wfd', 'essay', 'sst', 'rw-fib', 'ra', 'di', 'rl'],
  eight: ['rs', 'wfd', 'essay', 'swt', 'sst', 'rw-fib', 'r-fib', 'di', 'rl', 'sgd'],
};

const coachMessages: Record<CommandTarget, Record<string, string>> = {
  seven: {
    rs: 'Start with RS. 7炸 needs stable speaking output before anything else.',
    wfd: 'Move to WFD. This is the safest way to protect listening and writing together.',
    essay: 'Work on WE next. Keep structure simple and eliminate grammar and spelling leaks.',
    sst: 'SST is your writing-and-listening bridge. Capture keywords, then check grammar.',
    'rw-fib': 'FIB is the reading stabilizer. Use grammar, collocation, and logic clues.',
    ra: 'RA keeps your口语开局 stable. Read in chunks and never go back to repair mistakes.',
    di: 'DI is a template fluency drill. Pick three points and keep moving.',
    rl: 'RL keeps listening-to-speaking transfer warm. Short phrases beat silent panic.',
  },
  eight: {
    rs: 'Open with RS. Speaking 88 needs fluent recall even under exam noise.',
    wfd: 'Lock WFD next. It protects both listening and Writing 85 through spelling accuracy.',
    essay: 'WE is the Writing 85 pressure point. Answer the prompt, stay accurate, type cleanly.',
    swt: 'SWT must stay one sentence. Connect core ideas without creating grammar risk.',
    sst: 'SST is easy to undertrain. Keywords plus clean grammar keep Writing 85 alive.',
    'rw-fib': 'FIB-RW is the reading-writing bridge. Grammar and collocation decide the gap.',
    'r-fib': 'FIB-R is pure reading control. Build题感 through context, not answer memorization.',
    di: 'DI should sound automatic. Relevant content plus no awkward pauses wins here.',
    rl: 'RL needs calm phrase capture. Do not over-write notes; speak what you truly caught.',
    sgd: 'SGD rewards natural response flow. Use a skeleton, but do not sound copied.',
  },
};

export function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getPracticeStatus(modulePractice?: ModulePractice): PracticeStatus {
  if (!modulePractice || modulePractice.practiceCount <= 0) {
    return 'new';
  }

  const distinctDays = new Set(modulePractice.practicedDates).size;

  if (distinctDays >= 7 || modulePractice.practiceCount >= 10) {
    return 'mastered';
  }

  if (distinctDays >= 3 || modulePractice.practiceCount >= 5) {
    return 'stable';
  }

  return 'practicing';
}

export function hasPracticedToday(modulePractice: ModulePractice | undefined, today: string): boolean {
  return Boolean(modulePractice?.practicedDates.includes(today));
}

export function markPracticedToday(
  progress: CommandProgress,
  moduleId: string,
  today = getTodayKey(),
): CommandProgress {
  const current = progress.modules[moduleId] ?? { practiceCount: 0, practicedDates: [] };

  if (hasPracticedToday(current, today)) {
    return progress;
  }

  return {
    ...progress,
    modules: {
      ...progress.modules,
      [moduleId]: {
        practiceCount: current.practiceCount + 1,
        practicedDates: [...current.practicedDates, today],
        lastPracticedAt: today,
      },
    },
  };
}

export function getCoachRecommendation(progress: CommandProgress, today = getTodayKey()): CoachRecommendation {
  const route = focusRoutes[progress.target];
  const nextModuleId = route.find((moduleId) => !hasPracticedToday(progress.modules[moduleId], today)) ?? route[0];

  return {
    nextModuleId,
    message: coachMessages[progress.target][nextModuleId],
  };
}

export function getFocusCompletion(progress: CommandProgress, today = getTodayKey()): { completed: number; total: number } {
  const route = focusRoutes[progress.target];
  return {
    completed: route.filter((moduleId) => hasPracticedToday(progress.modules[moduleId], today)).length,
    total: route.length,
  };
}

export function getRouteSteps(progress: CommandProgress, today = getTodayKey()): RouteStep[] {
  const route = focusRoutes[progress.target];
  const firstIncompleteIndex = route.findIndex((moduleId) => !hasPracticedToday(progress.modules[moduleId], today));
  const currentIndex = firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex;

  return route.map((moduleId, index) => {
    if (hasPracticedToday(progress.modules[moduleId], today)) {
      return { moduleId, index, state: 'done' };
    }

    return {
      moduleId,
      index,
      state: index === currentIndex ? 'current' : 'locked',
    };
  });
}

export function getCoreChainStability(progress: CommandProgress): number {
  const route = focusRoutes[progress.target];
  const score = route.reduce((total, moduleId) => {
    const status = getPracticeStatus(progress.modules[moduleId]);
    if (status === 'mastered') return total + 1;
    if (status === 'stable') return total + 0.72;
    if (status === 'practicing') return total + 0.36;
    return total;
  }, 0);

  return Math.round((score / route.length) * 100);
}
