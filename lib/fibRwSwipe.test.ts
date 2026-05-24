import test from 'node:test';
import assert from 'node:assert/strict';
import { fibRwSwipeChallenges } from './fibRwSwipe.ts';

test('fibRwSwipeChallenges has at least five seed challenges', () => {
  assert.ok(fibRwSwipeChallenges.length >= 5);
});

test('every challenge id is unique', () => {
  const ids = new Set(fibRwSwipeChallenges.map((c) => c.id));
  assert.equal(ids.size, fibRwSwipeChallenges.length);
});

test('every sentence has exactly one blank marker', () => {
  for (const c of fibRwSwipeChallenges) {
    const blanks = c.sentence.match(/_/g) ?? [];
    assert.equal(blanks.length, 1, `${c.id}: expected one blank, got ${blanks.length}`);
  }
});

test('options always include the correct word', () => {
  for (const c of fibRwSwipeChallenges) {
    assert.ok(
      c.options.includes(c.correctWord),
      `${c.id}: options missing correctWord "${c.correctWord}"`,
    );
  }
});

test('options have no duplicates', () => {
  for (const c of fibRwSwipeChallenges) {
    const unique = new Set(c.options);
    assert.equal(unique.size, c.options.length, `${c.id}: duplicate options`);
  }
});

test('options offer at least one distractor', () => {
  for (const c of fibRwSwipeChallenges) {
    assert.ok(c.options.length >= 2, `${c.id}: need at least 2 options`);
  }
});

test('every challenge has a non-empty hint', () => {
  for (const c of fibRwSwipeChallenges) {
    assert.ok(c.hint.trim().length > 0, `${c.id}: hint should not be empty`);
  }
});
