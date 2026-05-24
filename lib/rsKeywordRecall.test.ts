import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeKeyword,
  parseKeywordInput,
  rsKeywordChallenges,
  scoreRsKeywords,
} from './rsKeywordRecall.ts';

test('RS keyword recall starts with three seed challenges', () => {
  assert.equal(rsKeywordChallenges.length, 3);
  assert.equal(rsKeywordChallenges[0].sentence, 'The research findings were published in an international journal.');
});

test('normalizeKeyword trims, lowercases, and removes punctuation', () => {
  assert.equal(normalizeKeyword(' Journal. '), 'journal');
  assert.equal(normalizeKeyword('Published!'), 'published');
});

test('parseKeywordInput dedupes and caps input at three keywords', () => {
  assert.deepEqual(parseKeywordInput('research, international journal research findings'), [
    'research',
    'international',
    'journal',
  ]);
});

test('scoreRsKeywords matches remembered keywords and flags a missed verb', () => {
  const score = scoreRsKeywords(rsKeywordChallenges[0], 'research international journal');
  assert.deepEqual(score.matched, ['research', 'international', 'journal']);
  assert.equal(score.caughtCore, true);
  assert.equal(score.missedVerb, true);
  assert.equal(score.rating, 'excellent');
  assert.ok(score.missed.includes('published'));
});

test('scoreRsKeywords marks weak recall when too few core words are captured', () => {
  const score = scoreRsKeywords(rsKeywordChallenges[1], 'students classroom');
  assert.deepEqual(score.matched, ['students']);
  assert.deepEqual(score.extra, ['classroom']);
  assert.equal(score.caughtCore, false);
  assert.equal(score.missedVerb, true);
  assert.equal(score.rating, 'needs-work');
});
