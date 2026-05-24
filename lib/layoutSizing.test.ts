import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SPLIT_PERCENT,
  MAX_SPLIT_PERCENT,
  MIN_SPLIT_PERCENT,
  clampSplitPercent,
  splitPercentFromPointer,
} from './layoutSizing.ts';

test('clampSplitPercent keeps the split pane inside usable bounds', () => {
  assert.equal(clampSplitPercent(12), MIN_SPLIT_PERCENT);
  assert.equal(clampSplitPercent(88), MAX_SPLIT_PERCENT);
  assert.equal(clampSplitPercent(61), 61);
});

test('clampSplitPercent falls back to the default split for invalid values', () => {
  assert.equal(clampSplitPercent(Number.NaN), DEFAULT_SPLIT_PERCENT);
  assert.equal(clampSplitPercent(Number.POSITIVE_INFINITY), DEFAULT_SPLIT_PERCENT);
});

test('splitPercentFromPointer converts pointer position to a clamped pane width percent', () => {
  const rect = { left: 100, width: 1000 };

  assert.equal(splitPercentFromPointer(700, rect), 60);
  assert.equal(splitPercentFromPointer(120, rect), MIN_SPLIT_PERCENT);
  assert.equal(splitPercentFromPointer(1080, rect), MAX_SPLIT_PERCENT);
});
