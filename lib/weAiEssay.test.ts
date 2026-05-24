import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WE_PASS_THRESHOLD,
  countWords,
  splitIntoSentences,
  weTopics,
} from './weAiEssay.ts';

test('WE_PASS_THRESHOLD is the documented passing cutoff', () => {
  assert.equal(WE_PASS_THRESHOLD, 65);
});

test('weTopics has at least ten prompts with unique ids', () => {
  assert.ok(weTopics.length >= 10);
  const ids = new Set(weTopics.map((t) => t.id));
  assert.equal(ids.size, weTopics.length);
});

test('every topic prompt is non-empty', () => {
  for (const t of weTopics) {
    assert.ok(t.topic.trim().length > 0, `${t.id}: topic should not be empty`);
  }
});

test('countWords returns 0 for empty or whitespace input', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('\n\t '), 0);
});

test('countWords collapses repeated whitespace', () => {
  assert.equal(countWords('hello world'), 2);
  assert.equal(countWords('hello   world'), 2);
  assert.equal(countWords(' hello\tworld\n'), 2);
});

test('countWords handles a longer sentence', () => {
  assert.equal(
    countWords('Climate change has become a major global issue in recent years.'),
    11,
  );
});

test('splitIntoSentences splits on sentence-ending punctuation', () => {
  const sentences = splitIntoSentences(
    'Climate change is real. It affects everyone! What can we do?',
  );
  assert.deepEqual(sentences, [
    'Climate change is real.',
    'It affects everyone!',
    'What can we do?',
  ]);
});

test('splitIntoSentences returns an empty array for blank input', () => {
  assert.deepEqual(splitIntoSentences(''), []);
  assert.deepEqual(splitIntoSentences('   \n  '), []);
});

test('splitIntoSentences collapses internal whitespace before splitting', () => {
  const sentences = splitIntoSentences('First sentence.   Second sentence.');
  assert.deepEqual(sentences, ['First sentence.', 'Second sentence.']);
});

test('splitIntoSentences keeps a single sentence intact', () => {
  assert.deepEqual(splitIntoSentences('Just one sentence with no end punctuation'), [
    'Just one sentence with no end punctuation',
  ]);
});
