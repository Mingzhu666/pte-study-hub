export interface WfdRepairToken {
  id: string;
  text: string;
}

export interface WfdRepairError {
  id: string;
  tokenIds: string[];
  answer: string;
  tags: string[];
  explanation: string;
}

export interface WfdRepairChallenge {
  id: string;
  tokens: WfdRepairToken[];
  correctedSentence: string;
  errors: WfdRepairError[];
}

export const wfdSpotRepairChallenges: WfdRepairChallenge[] = [
  {
    id: 'wfd-repair-001',
    tokens: [
      { id: 'students', text: 'Students' },
      { id: 'are', text: 'are' },
      { id: 'encourage', text: 'encourage' },
      { id: 'to', text: 'to' },
      { id: 'participate', text: 'participate' },
      { id: 'in', text: 'in' },
      { id: 'sport', text: 'sport' },
      { id: 'activity', text: 'activity.' },
    ],
    correctedSentence: 'Students are encouraged to participate in sports activities.',
    errors: [
      {
        id: 'encourage-ed',
        tokenIds: ['encourage'],
        answer: 'encouraged',
        tags: ['ed', 'tense'],
        explanation: 'After "are", WFD needs the past participle: encouraged.',
      },
      {
        id: 'sports-activities',
        tokenIds: ['sport', 'activity'],
        answer: 'sports activities',
        tags: ['s'],
        explanation: 'The natural phrase is plural: sports activities.',
      },
    ],
  },
  {
    id: 'wfd-repair-002',
    tokens: [
      { id: 'library', text: 'Library' },
      { id: 'will', text: 'will' },
      { id: 'be', text: 'be' },
      { id: 'close', text: 'close' },
      { id: 'during', text: 'during' },
      { id: 'public', text: 'public' },
      { id: 'holiday', text: 'holiday.' },
    ],
    correctedSentence: 'The library will be closed during the public holiday.',
    errors: [
      {
        id: 'library-article',
        tokenIds: ['library'],
        answer: 'The library',
        tags: ['article'],
        explanation: 'Use "The" for a specific campus or city library.',
      },
      {
        id: 'closed-ed',
        tokenIds: ['close'],
        answer: 'closed',
        tags: ['ed', 'tense'],
        explanation: 'After "will be", use the past participle: closed.',
      },
      {
        id: 'holiday-article',
        tokenIds: ['public', 'holiday'],
        answer: 'the public holiday',
        tags: ['article'],
        explanation: 'A specific public holiday usually needs "the".',
      },
    ],
  },
  {
    id: 'wfd-repair-003',
    tokens: [
      { id: 'researcher', text: 'Researcher' },
      { id: 'have', text: 'have' },
      { id: 'collect', text: 'collect' },
      { id: 'several', text: 'several' },
      { id: 'sample', text: 'sample' },
      { id: 'for', text: 'for' },
      { id: 'analysis', text: 'analysis.' },
    ],
    correctedSentence: 'Researchers have collected several samples for analysis.',
    errors: [
      {
        id: 'researchers-s',
        tokenIds: ['researcher'],
        answer: 'Researchers',
        tags: ['s'],
        explanation: '"Researchers" matches the plural action in the sentence.',
      },
      {
        id: 'collected-ed',
        tokenIds: ['collect'],
        answer: 'collected',
        tags: ['ed', 'tense'],
        explanation: 'With "have", use the past participle: collected.',
      },
      {
        id: 'samples-s',
        tokenIds: ['sample'],
        answer: 'samples',
        tags: ['s'],
        explanation: '"Several" needs a plural noun: samples.',
      },
    ],
  },
];

export function findErrorForToken(challenge: WfdRepairChallenge, tokenId: string): WfdRepairError | null {
  return challenge.errors.find((error) => error.tokenIds.includes(tokenId)) ?? null;
}

export function getSelectedErrorIds(challenge: WfdRepairChallenge, selectedTokenIds: string[]): string[] {
  const selected = new Set(selectedTokenIds);
  return challenge.errors
    .filter((error) => error.tokenIds.some((tokenId) => selected.has(tokenId)))
    .map((error) => error.id);
}

export function hasFoundEveryError(challenge: WfdRepairChallenge, selectedErrorIds: string[]): boolean {
  const selected = new Set(selectedErrorIds);
  return challenge.errors.every((error) => selected.has(error.id));
}

export function hasRepairedEveryError(challenge: WfdRepairChallenge, repairedErrorIds: string[]): boolean {
  const repaired = new Set(repairedErrorIds);
  return challenge.errors.every((error) => repaired.has(error.id));
}
