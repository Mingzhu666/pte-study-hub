export interface FibReadChallenge {
  id: string;
  /** Passage with {{blank}} as the placeholder for each gap */
  passage: string;
  /** Correct words for each blank, in order */
  answers: string[];
  /** All words shown in the bank (answers + distractors), shown shuffled */
  wordBank: string[];
  /** Feedback shown on a wrong attempt */
  hint: string;
}

export const fibReadChallenges: FibReadChallenge[] = [
  {
    id: 'fib-read-001',
    passage:
      'Climate change has become a major {{blank}} issue in recent years. Many countries are trying to {{blank}} carbon emissions through new policies.',
    answers: ['global', 'reduce'],
    wordBank: ['global', 'reduce', 'technology', 'available'],
    hint: 'Look at the meaning and collocation of each word.',
  },
  {
    id: 'fib-read-002',
    passage:
      'The {{blank}} of the internet has changed the way people communicate. It allows instant {{blank}} across the globe.',
    answers: ['technology', 'messages'],
    wordBank: ['technology', 'messages', 'global', 'reduce'],
    hint: 'Think about what noun goes before "of" and what noun follows the adjective.',
  },
  {
    id: 'fib-read-003',
    passage:
      'Urban {{blank}} is a growing concern as more people move to cities. Effective {{blank}} requires careful planning.',
    answers: ['growth', 'planning'],
    wordBank: ['growth', 'planning', 'available', 'messages'],
    hint: 'The first blank needs a noun describing the trend; the second needs a noun related to city management.',
  },
];
