export interface RsKeywordChallenge {
  id: string;
  sentence: string;
  keywords: string[];
  requiredVerb: string;
}

export interface RsKeywordScore {
  matched: string[];
  missed: string[];
  extra: string[];
  caughtCore: boolean;
  missedVerb: boolean;
  rating: 'excellent' | 'solid' | 'needs-work';
}

export const rsKeywordChallenges: RsKeywordChallenge[] = [
  {
    id: 'rs-keywords-001',
    sentence: 'The research findings were published in an international journal.',
    keywords: ['research', 'findings', 'published', 'international', 'journal'],
    requiredVerb: 'published',
  },
  {
    id: 'rs-keywords-002',
    sentence: 'Students should review the lecture notes before the final exam.',
    keywords: ['students', 'review', 'lecture', 'notes', 'exam'],
    requiredVerb: 'review',
  },
  {
    id: 'rs-keywords-003',
    sentence: 'The committee approved the proposal after a detailed discussion.',
    keywords: ['committee', 'approved', 'proposal', 'detailed', 'discussion'],
    requiredVerb: 'approved',
  },
];

export function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z'-]/g, '');
}

export function parseKeywordInput(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/[\s,;\n]+/)
    .map(normalizeKeyword)
    .filter(Boolean)
    .filter((keyword) => {
      if (seen.has(keyword)) return false;
      seen.add(keyword);
      return true;
    })
    .slice(0, 3);
}

export function scoreRsKeywords(challenge: RsKeywordChallenge, rawInput: string): RsKeywordScore {
  const input = parseKeywordInput(rawInput);
  const answerSet = new Set(challenge.keywords.map(normalizeKeyword));
  const matched = input.filter((keyword) => answerSet.has(keyword));
  const extra = input.filter((keyword) => !answerSet.has(keyword));
  const inputSet = new Set(input);
  const missed = challenge.keywords
    .map(normalizeKeyword)
    .filter((keyword) => !inputSet.has(keyword));
  const requiredVerb = normalizeKeyword(challenge.requiredVerb);
  const missedVerb = !inputSet.has(requiredVerb);
  const caughtCore = matched.length >= 3 || (matched.length >= 2 && !missedVerb);
  const rating: RsKeywordScore['rating'] = matched.length >= 3
    ? 'excellent'
    : caughtCore
      ? 'solid'
      : 'needs-work';

  return { matched, missed, extra, caughtCore, missedVerb, rating };
}
