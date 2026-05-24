import test from 'node:test';
import assert from 'node:assert/strict';
import { asqFlashcards } from './asqFlashcards.ts';

test('asqFlashcards has exactly thirty cards', () => {
  assert.equal(asqFlashcards.length, 30);
});

test('every card has non-empty question and answer', () => {
  for (const card of asqFlashcards) {
    assert.ok(card.question.trim().length > 0, `${card.id} missing question`);
    assert.ok(card.answer.trim().length > 0, `${card.id} missing answer`);
  }
});

test('every card id is unique', () => {
  const ids = new Set(asqFlashcards.map((c) => c.id));
  assert.equal(ids.size, asqFlashcards.length);
});

test('every question ends with a question mark', () => {
  for (const card of asqFlashcards) {
    assert.ok(card.question.trim().endsWith('?'), `${card.id} question should end with ?`);
  }
});
