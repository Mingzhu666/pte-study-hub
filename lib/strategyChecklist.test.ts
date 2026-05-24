import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategyList, fnv1a32 } from './strategyChecklist.ts';
import type { PTEModule } from '@/types/pte';

const baseModule: PTEModule = {
  id: 'demo',
  name: 'Demo',
  fullName: 'Demo Module',
  category: 'speaking',
  icon: 'Volume2',
  color: '#000',
  content: {
    overview: 'o',
    scoring: { marks: '1' },
    questionCount: '1',
    strategy: ['Keep rhythm steady', 'Do not stop on errors'],
    tips: ['Keep rhythm steady', 'Read in chunks'],
  },
  contentZh: {
    overview: 'o',
    scoring: { marks: '1' },
    questionCount: '1',
    strategy: ['保持节奏稳定', '错了别停'],
    tips: ['保持节奏稳定', '按意群读'],
  },
};

test('fnv1a32 produces stable 8-char hex hashes', () => {
  assert.equal(fnv1a32('hello'), fnv1a32('hello'));
  assert.notEqual(fnv1a32('hello'), fnv1a32('world'));
  assert.match(fnv1a32('anything'), /^[0-9a-f]{8}$/);
  assert.equal(fnv1a32('hello'), '4f9f2cab');
});

test('buildStrategyList combines strategy + tips and dedupes by trimmed lowercase text', () => {
  const list = buildStrategyList(baseModule, 'en');
  assert.equal(list.length, 3);
  assert.deepEqual(list.map((i) => i.text), [
    'Keep rhythm steady',
    'Do not stop on errors',
    'Read in chunks',
  ]);
});

test('buildStrategyList returns stable ids derived from English text only', () => {
  const en = buildStrategyList(baseModule, 'en');
  const zh = buildStrategyList(baseModule, 'zh');
  assert.deepEqual(en.map((i) => i.id), zh.map((i) => i.id));
  assert.ok(en[0].id.startsWith('demo:'));
  assert.equal(en[0].id, 'demo:2e2c75d6');
});

test('buildStrategyList swaps display text to zh when language is zh', () => {
  const zh = buildStrategyList(baseModule, 'zh');
  assert.equal(zh[0].text, '保持节奏稳定');
  assert.equal(zh[1].text, '错了别停');
  assert.equal(zh[2].text, '按意群读');
});

test('buildStrategyList falls back to English when contentZh is missing', () => {
  const noZh: PTEModule = { ...baseModule, contentZh: undefined };
  const zh = buildStrategyList(noZh, 'zh');
  assert.equal(zh[0].text, 'Keep rhythm steady');
});

test('buildStrategyList caps the list at 8 items', () => {
  const many: PTEModule = {
    ...baseModule,
    content: {
      ...baseModule.content,
      strategy: Array.from({ length: 6 }, (_, i) => `S${i}`),
      tips: Array.from({ length: 6 }, (_, i) => `T${i}`),
    },
    contentZh: undefined,
  };
  const list = buildStrategyList(many, 'en');
  assert.equal(list.length, 8);
  assert.deepEqual(list.slice(0, 3).map((i) => i.text), ['S0', 'S1', 'S2']);
});

test('buildStrategyList can use target-specific checklist text and ids', () => {
  const seven = buildStrategyList(baseModule, 'zh', {
    target: 'seven',
    checklist: { en: ['Band 7 specific'], zh: ['7炸专属要求'] },
  });
  const eight = buildStrategyList(baseModule, 'zh', {
    target: 'eight',
    checklist: { en: ['Band 8 specific'], zh: ['8炸专属要求'] },
  });

  assert.deepEqual(seven.map((i) => i.text), ['7炸专属要求']);
  assert.deepEqual(eight.map((i) => i.text), ['8炸专属要求']);
  assert.ok(seven[0].id.startsWith('seven:demo:'));
  assert.ok(eight[0].id.startsWith('eight:demo:'));
  assert.notEqual(seven[0].id, eight[0].id);
});

test('buildStrategyList swaps target checklist text by language', () => {
  const en = buildStrategyList(baseModule, 'en', {
    target: 'seven',
    checklist: { en: ['Drill spelling.'], zh: ['练拼写。'] },
  });
  const zh = buildStrategyList(baseModule, 'zh', {
    target: 'seven',
    checklist: { en: ['Drill spelling.'], zh: ['练拼写。'] },
  });
  assert.equal(en[0].text, 'Drill spelling.');
  assert.equal(zh[0].text, '练拼写。');
});
