export interface RaSentence {
  id: string;
  text: string;
}

export interface RaMirrorScore {
  score: number;
  hits: string[];
  missed: string[];
  mispronounced: string[];
  comment: string;
}

export function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, '')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export const raSentences: RaSentence[] = [
  {
    id: 'ra-1',
    text: 'The development of sustainable energy is essential for our future generations.',
  },
  {
    id: 'ra-2',
    text: 'Climate change has become one of the most pressing issues of our time.',
  },
  {
    id: 'ra-3',
    text: 'Many universities now offer online courses to students around the world.',
  },
  {
    id: 'ra-4',
    text: 'Scientists have discovered a new species of bird in the Amazon rainforest.',
  },
  {
    id: 'ra-5',
    text: 'The library will be closed for renovation during the entire summer break.',
  },
  {
    id: 'ra-6',
    text: 'Globalization has transformed the way businesses operate across international borders.',
  },
  {
    id: 'ra-7',
    text: 'Regular exercise can significantly improve both physical health and mental wellbeing.',
  },
  {
    id: 'ra-8',
    text: 'Artificial intelligence is reshaping industries from healthcare to finance and education.',
  },
  {
    id: 'ra-9',
    text: 'Public transportation reduces traffic congestion and lowers urban carbon emissions effectively.',
  },
  {
    id: 'ra-10',
    text: 'The committee will review the proposal at the next monthly board meeting.',
  },
];
