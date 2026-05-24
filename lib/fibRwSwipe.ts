export interface FibRwSwipeChallenge {
  id: string;
  /** Sentence with {{blank}} marking the gap */
  sentence: string;
  /** The word that goes in the blank */
  correctWord: string;
  /** All word options shown (correct + distractors) */
  options: string[];
  /** Hint shown after a wrong attempt */
  hint: string;
}

export const fibRwSwipeChallenges: FibRwSwipeChallenge[] = [
  {
    id: 'fib-rw-001',
    sentence: 'The government is responsible _ protecting public health.',
    correctWord: 'for',
    options: ['for', 'to', 'of', 'with'],
    hint: '"Responsible for" is a fixed collocation — think "responsible for something".',
  },
  {
    id: 'fib-rw-002',
    sentence: 'Students should rely _ their own notes rather than online summaries.',
    correctWord: 'on',
    options: ['on', 'to', 'at', 'in'],
    hint: '"Rely on" is the standard collocation — rely on someone or something.',
  },
  {
    id: 'fib-rw-003',
    sentence: 'The research was funded _ a grant from the National Science Foundation.',
    correctWord: 'by',
    options: ['by', 'with', 'through', 'from'],
    hint: 'When we say an action was performed by someone, we use "by". "Funded by a grant" = the grant did the funding.',
  },
  {
    id: 'fib-rw-004',
    sentence: 'He has made a significant contribution _ the project\'s success.',
    correctWord: 'to',
    options: ['to', 'for', 'in', 'on'],
    hint: '"Contribution to" — you make a contribution to something.',
  },
  {
    id: 'fib-rw-005',
    sentence: 'The lecture focused _ the impact of climate change on agriculture.',
    correctWord: 'on',
    options: ['on', 'upon', 'in', 'at'],
    hint: '"Focused on" is the standard collocation — focus on a topic.',
  },
];
