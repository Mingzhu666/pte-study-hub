import test from 'node:test';
import assert from 'node:assert/strict';
import { raSentences, tokenize } from './raAiMirror.ts';

test('tokenize lowercases and splits on whitespace', () => {
  assert.deepEqual(tokenize('Hello World'), ['hello', 'world']);
});

test('tokenize strips punctuation but keeps apostrophes', () => {
  assert.deepEqual(tokenize('Hello, world!'), ['hello', 'world']);
  assert.deepEqual(tokenize("It's a test."), ["it's", 'a', 'test']);
});

test('tokenize collapses multiple spaces and ignores empty tokens', () => {
  assert.deepEqual(tokenize('  one   two  '), ['one', 'two']);
});

test('raSentences has at least 8 entries', () => {
  assert.ok(raSentences.length >= 8, `expected >= 8 sentences, got ${raSentences.length}`);
});

test('every sentence has 10-20 words after tokenize', () => {
  for (const s of raSentences) {
    const len = tokenize(s.text).length;
    assert.ok(len >= 10 && len <= 20, `${s.id}: ${len} words (${s.text})`);
  }
});

test('every sentence id is unique and matches /^ra-\\d+$/', () => {
  const ids = raSentences.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
  for (const id of ids) {
    assert.match(id, /^ra-\d+$/);
  }
});
