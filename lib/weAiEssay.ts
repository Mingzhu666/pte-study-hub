export interface WeTopic {
  id: string;
  topic: string;
}

export type WeSentenceLevel = 'good' | 'ok' | 'weak';

export interface WeSentenceFeedback {
  sentence: string;
  level: WeSentenceLevel;
  comment: string;
}

export interface WeEssayBreakdown {
  content: number;       // 0-3
  form: number;          // 0-2
  development: number;   // 0-2
  grammar: number;       // 0-2
  linguistic: number;    // 0-2
  vocabulary: number;    // 0-2
  spelling: number;      // 0-2
}

export interface WeEssayScore {
  total: number;          // 0-90 (PTE-style scaled)
  breakdown: WeEssayBreakdown;
  sentences: WeSentenceFeedback[];
  overall: string;
}

export const WE_PASS_THRESHOLD = 65;

export const weTopics: WeTopic[] = [
  {
    id: 'we-1',
    topic:
      'Some people believe that universities should focus more on practical job skills, while others argue that the role of universities is to develop critical thinking. Discuss both views and give your own opinion.',
  },
  {
    id: 'we-2',
    topic:
      'In many countries the proportion of older people is steadily increasing. Does this trend bring positive or negative effects on society as a whole?',
  },
  {
    id: 'we-3',
    topic:
      'Some people think that governments should ban dangerous sports such as boxing and motor racing, while others believe individuals should be free to choose. Discuss both views and give your opinion.',
  },
  {
    id: 'we-4',
    topic:
      'It is often said that the internet has made the world a smaller place. To what extent do you agree or disagree with this statement?',
  },
  {
    id: 'we-5',
    topic:
      'Many believe that artificial intelligence will eventually replace most human jobs. Discuss the possible advantages and disadvantages of this development.',
  },
  {
    id: 'we-6',
    topic:
      'Some people argue that learning a foreign language should be compulsory in primary schools. Others think it should be introduced only in secondary education. Discuss both views and state your own opinion.',
  },
  {
    id: 'we-7',
    topic:
      'Public libraries are losing relevance in the digital age. To what extent do you agree or disagree?',
  },
  {
    id: 'we-8',
    topic:
      'Some governments are introducing taxes on unhealthy food to fight obesity. Do you think this is an effective way to improve public health, or are there better alternatives?',
  },
  {
    id: 'we-9',
    topic:
      'The use of mobile phones in classrooms is a controversial issue. Should schools allow students to use smartphones during lessons, or should they be banned? Give reasons for your answer.',
  },
  {
    id: 'we-10',
    topic:
      'Working from home has become widespread in recent years. Discuss the benefits and drawbacks of this trend for both employees and employers.',
  },
];

export function splitIntoSentences(essay: string): string[] {
  return essay
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .filter((s) => s.length > 0);
}

export function countWords(essay: string): number {
  const trimmed = essay.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
