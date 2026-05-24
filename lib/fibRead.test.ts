import test from 'node:test';
import assert from 'node:assert/strict';
import { fibReadChallenges } from './fibRead.ts';

test('fibReadChallenges has at least three seed challenges', () => {
  assert.ok(fibReadChallenges.length >= 3);
});

test('every challenge id is unique', () => {
  const ids = new Set(fibReadChallenges.map((c) => c.id));
  assert.equal(ids.size, fibReadChallenges.length);
});

test('blank count in passage matches answers length', () => {
  for (const c of fibReadChallenges) {
    const blanks = c.passage.match(/\{\{blank\}\}/g) ?? [];
    assert.equal(
      blanks.length,
      c.answers.length,
      `${c.id}: passage has ${blanks.length} blanks but ${c.answers.length} answers`,
    );
  }
});

test('wordBank contains every answer', () => {
  for (const c of fibReadChallenges) {
    for (const ans of c.answers) {
      assert.ok(
        c.wordBank.includes(ans),
        `${c.id}: wordBank missing answer "${ans}"`,
      );
    }
  }
});

test('wordBank has at least one distractor beyond the answers', () => {
  for (const c of fibReadChallenges) {
    assert.ok(
      c.wordBank.length > c.answers.length,
      `${c.id}: wordBank should include distractors`,
    );
  }
});

test('every challenge has a non-empty hint', () => {
  for (const c of fibReadChallenges) {
    assert.ok(c.hint.trim().length > 0, `${c.id}: hint should not be empty`);
  }
});
