import test from 'node:test';
import assert from 'node:assert/strict';
import { sstSummaryPickChallenges } from './sstSummaryPick.ts';

test('sstSummaryPickChallenges has exactly three challenges', () => {
  assert.equal(sstSummaryPickChallenges.length, 3);
});

test('each challenge has two summaries with distinct ids a and b', () => {
  for (const challenge of sstSummaryPickChallenges) {
    assert.equal(challenge.summaries.length, 2);
    const ids = challenge.summaries.map((s) => s.id).sort();
    assert.deepEqual(ids, ['a', 'b']);
  }
});

test('each challenge correctSummaryId matches one of its summary ids', () => {
  for (const challenge of sstSummaryPickChallenges) {
    const ids = challenge.summaries.map((s) => s.id);
    assert.ok(ids.includes(challenge.correctSummaryId), `${challenge.id} correct id mismatch`);
  }
});

test('each summary wordCount matches its text length', () => {
  for (const challenge of sstSummaryPickChallenges) {
    for (const s of challenge.summaries) {
      const actual = s.text.trim().split(/\s+/).filter(Boolean).length;
      assert.equal(s.wordCount, actual, `${challenge.id} ${s.id} wordCount mismatch`);
    }
  }
});

test('each challenge has lecture text and bilingual explanation', () => {
  for (const challenge of sstSummaryPickChallenges) {
    assert.ok(challenge.lectureText.trim().length > 0, `${challenge.id} missing lecture text`);
    assert.ok(challenge.explanation.en.trim().length > 0, `${challenge.id} missing en explanation`);
    assert.ok(challenge.explanation.zh.trim().length > 0, `${challenge.id} missing zh explanation`);
  }
});
