import type { PTEModule } from '@/types/pte';

export type CommandTarget = 'seven' | 'eight';

export type CommandPriority = 'focus' | 'active' | 'support' | 'low';

export interface TargetProfile {
  id: CommandTarget;
  label: string;
  title: string;
  subtitle: string;
  scores: Array<{ skill: string; value: number }>;
  route: string[];
  support: string[];
}

export interface CommandNode {
  id: string;
  label: string;
  skills: PTEModule['category'][];
  priority: Record<CommandTarget, CommandPriority>;
  dailyVolume: Record<CommandTarget, string>;
  rationale: Record<CommandTarget, string>;
  failurePoints: string[];
}

export const targetProfiles: Record<CommandTarget, TargetProfile> = {
  seven: {
    id: 'seven',
    label: '7炸',
    title: 'Stable Passing Route',
    subtitle: 'Protect the high-value tasks and reduce spelling, grammar, and fluency loss.',
    scores: [
      { skill: 'L', value: 58 },
      { skill: 'R', value: 59 },
      { skill: 'W', value: 69 },
      { skill: 'S', value: 76 },
    ],
    route: ['rs', 'wfd', 'essay', 'sst', 'rw-fib', 'ra', 'di', 'rl'],
    support: ['swt', 'r-fib', 'hiw', 'lfb', 'rp'],
  },
  eight: {
    id: 'eight',
    label: '8炸',
    title: 'Superior Pressure Route',
    subtitle: 'Speaking 88 and Writing 85 are the real bottlenecks. Train the pressure chain first.',
    scores: [
      { skill: 'L', value: 69 },
      { skill: 'R', value: 70 },
      { skill: 'W', value: 85 },
      { skill: 'S', value: 88 },
    ],
    route: ['rs', 'wfd', 'essay', 'swt', 'sst', 'rw-fib', 'r-fib', 'di', 'rl', 'sgd'],
    support: ['ra', 'hiw', 'lfb', 'rp'],
  },
};

export const commandNodes: CommandNode[] = [
  {
    id: 'rs',
    label: 'RS',
    skills: ['speaking', 'listening'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: { seven: '50-100 sentences', eight: '80-120 sentences with noise pressure' },
    rationale: {
      seven: 'The fastest way to stabilize speaking and listening without overthinking grammar.',
      eight: 'A Speaking 88 pressure gate: recall enough, keep rhythm, never freeze.',
    },
    failurePoints: ['Trying to repeat every word', 'Writing initials and missing the audio', 'Long pauses after the beep'],
  },
  {
    id: 'wfd',
    label: 'WFD',
    skills: ['listening', 'writing'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: { seven: '40-70 sentences', eight: '60-100 sentences plus mistake replay' },
    rationale: {
      seven: 'The safest listening-writing anchor. Spelling and singular/plural control matter more than flair.',
      eight: 'A Writing 85 stabilizer because every spelling, article, tense, and plural leak compounds.',
    },
    failurePoints: ['Missing plural s or past tense', 'Ignoring articles and prepositions', 'Not leaving time at the end'],
  },
  {
    id: 'essay',
    label: 'WE',
    skills: ['writing'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: { seven: '1 outline or essay', eight: '1 essay with error pass' },
    rationale: {
      seven: 'Use a reliable structure and answer the prompt directly to protect Writing 69.',
      eight: 'Writing 85 needs clean structure, complete answers, and low-level error control.',
    },
    failurePoints: ['Empty template with weak content', 'Not answering both questions', 'Complex sentences with preventable errors'],
  },
  {
    id: 'swt',
    label: 'SWT',
    skills: ['writing', 'reading'],
    priority: { seven: 'active', eight: 'focus' },
    dailyVolume: { seven: '1 summary', eight: '2 summaries, one-sentence check' },
    rationale: {
      seven: 'A high-value format task when the one-sentence rule is locked.',
      eight: 'Small format mistakes are expensive when chasing Writing 85.',
    },
    failurePoints: ['Two full stops', 'Adding personal opinions', 'Over-paraphrasing into grammar errors'],
  },
  {
    id: 'sst',
    label: 'SST',
    skills: ['listening', 'writing'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: { seven: '1-2 summaries', eight: '2 summaries plus keyword spelling' },
    rationale: {
      seven: 'Template plus keywords can protect both listening and writing if grammar is clean.',
      eight: 'Often underestimated; spelling and sentence control help keep Writing 85 alive.',
    },
    failurePoints: ['Weak keyword capture', 'Messy grammar after dictation', 'Wrong word count range'],
  },
  {
    id: 'rw-fib',
    label: 'FIB-RW',
    skills: ['reading', 'writing'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: { seven: '30-45 minutes', eight: '45-60 minutes with collocation log' },
    rationale: {
      seven: 'The reading stabilizer: grammar, collocation, and logic clues matter most.',
      eight: 'A core reading-writing bridge where fixed expressions and grammar decide fine margins.',
    },
    failurePoints: ['Guessing without checking word class', 'Ignoring collocations', 'Over-spending time on one blank'],
  },
  {
    id: 'r-fib',
    label: 'FIB-R',
    skills: ['reading'],
    priority: { seven: 'active', eight: 'focus' },
    dailyVolume: { seven: '2-3 passages', eight: '4-6 passages plus error tags' },
    rationale: {
      seven: 'Useful for raising reading consistency after the big modules are protected.',
      eight: 'Reading 70 is lower than old 79, but FIB still prevents score drag.',
    },
    failurePoints: ['Memorizing answers instead of patterns', 'Missing reference words', 'Ignoring contrast and cause-effect clues'],
  },
  {
    id: 'ra',
    label: 'RA',
    skills: ['speaking', 'reading'],
    priority: { seven: 'focus', eight: 'support' },
    dailyVolume: { seven: '10-20 passages', eight: '8-12 passages for warm-up' },
    rationale: {
      seven: 'A stable opening task: chunking and rhythm help protect speaking confidence.',
      eight: 'Still useful, but do not over-invest at the cost of RS/WFD/WE.',
    },
    failurePoints: ['Reading too fast', 'Going back to repair mistakes', 'Over-pronouncing every word'],
  },
  {
    id: 'di',
    label: 'DI',
    skills: ['speaking'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: { seven: '5 images', eight: '6-8 images with varied phrasing' },
    rationale: {
      seven: 'A template fluency task that converts preparation into reliable speaking marks.',
      eight: 'Needs automatic output without sounding like a copied generic template.',
    },
    failurePoints: ['Pausing to find perfect content', 'Using a generic unrelated template', 'Speaking under 20 seconds'],
  },
  {
    id: 'rl',
    label: 'RL',
    skills: ['speaking', 'listening'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: { seven: '2-3 lectures', eight: '3-5 lectures with phrase notes' },
    rationale: {
      seven: 'Keeps listening-to-speaking transfer active without needing perfect content.',
      eight: 'Phrase capture and fluent recovery matter more than frantic note-taking.',
    },
    failurePoints: ['Writing isolated keywords only', 'Freezing when content is thin', 'Repeating identical template language'],
  },
  {
    id: 'sgd',
    label: 'SGD',
    skills: ['speaking', 'listening'],
    priority: { seven: 'support', eight: 'focus' },
    dailyVolume: { seven: '1 response', eight: '2-3 responses with natural connectors' },
    rationale: {
      seven: 'Know the frame, but keep RS/WFD first.',
      eight: 'A newer speaking task where natural flow and relevance protect high speaking targets.',
    },
    failurePoints: ['Sounding copied', 'Ignoring the discussion context', 'Stopping when unsure'],
  },
  {
    id: 'hiw',
    label: 'HIW',
    skills: ['listening', 'reading'],
    priority: { seven: 'support', eight: 'support' },
    dailyVolume: { seven: '5-8 items', eight: '8-10 items for focus control' },
    rationale: {
      seven: 'A useful listening top-up when the core chain is already moving.',
      eight: 'Do not neglect it; concentration slips can cost easy marks.',
    },
    failurePoints: ['Mouse drifting behind audio', 'Over-clicking', 'Losing focus mid-sentence'],
  },
  {
    id: 'lfb',
    label: 'FIB-L',
    skills: ['listening', 'writing'],
    priority: { seven: 'support', eight: 'support' },
    dailyVolume: { seven: '10 blanks', eight: '15 blanks with s/ed review' },
    rationale: {
      seven: 'A spelling and grammar detail task that supports the main listening score.',
      eight: 'Good for catching small listening-writing leaks after WFD.',
    },
    failurePoints: ['Missing endings', 'Choosing sound-alikes', 'Not using grammar to infer the form'],
  },
  {
    id: 'rp',
    label: 'RO Logic',
    skills: ['reading'],
    priority: { seven: 'support', eight: 'support' },
    dailyVolume: { seven: '2-3 sets', eight: '3 sets, strict timing' },
    rationale: {
      seven: 'Useful logic practice, but do not let it steal time from FIB.',
      eight: 'Keep pattern recognition warm without obsessing over every pair.',
    },
    failurePoints: ['Spending too long', 'Missing pronoun links', 'Ignoring topic sentence cues'],
  },
  {
    id: 'asq',
    label: 'ASQ',
    skills: ['speaking', 'listening'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: { seven: 'Quick review only', eight: 'Quick review only' },
    rationale: {
      seven: 'Know common answers, then return to higher-value tasks.',
      eight: 'Low yield. Keep it accurate and short without expanding.',
    },
    failurePoints: ['Over-answering', 'Long silence', 'Not knowing common academic words'],
  },
  {
    id: 'mcm',
    label: 'MCM',
    skills: ['reading'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: { seven: 'Light touch', eight: 'Light touch' },
    rationale: {
      seven: 'Be conservative; wrong choices can hurt more than heroic guessing helps.',
      eight: 'Do not over-invest. Protect time for FIB and writing accuracy.',
    },
    failurePoints: ['Over-selecting', 'Chasing every detail', 'Ignoring negative marking risk'],
  },
  {
    id: 'smw',
    label: 'SMW',
    skills: ['listening'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: { seven: 'Light touch', eight: 'Light touch' },
    rationale: {
      seven: 'Lower yield; answer efficiently and save energy.',
      eight: 'Useful to know, but it should not displace WFD/SST/RS.',
    },
    failurePoints: ['Overthinking options', 'Missing the main idea', 'Letting one question drain time'],
  },
];
