import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  toggleStrategy,
  getModuleCompletion,
  getNextFocus,
  getTotalMastery,
  setTarget,
  loadState,
  saveState,
  STORAGE_KEY,
  type SummitMasteryState,
} from './summitMastery.ts';

test('createInitialState returns an empty mastery map and a default target', () => {
  const state = createInitialState();
  assert.equal(state.target, 'eight');
  assert.deepEqual(state.mastery, {});
});

test('toggleStrategy adds an id when not present', () => {
  const state = createInitialState();
  const next = toggleStrategy(state, 'rs', 'rs:abc12345');
  assert.deepEqual(next.mastery['rs'].checked, ['rs:abc12345']);
});

test('toggleStrategy removes an id when already present', () => {
  const start: SummitMasteryState = {
    target: 'eight',
    mastery: { rs: { checked: ['rs:abc12345', 'rs:def67890'] } },
  };
  const next = toggleStrategy(start, 'rs', 'rs:abc12345');
  assert.deepEqual(next.mastery['rs'].checked, ['rs:def67890']);
});

test('toggleStrategy does not duplicate an id when added twice', () => {
  let state = createInitialState();
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  assert.deepEqual(state.mastery['rs'].checked, ['rs:abc12345']);
});

test('getModuleCompletion returns checked / total / percent', () => {
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { rs: { checked: ['a', 'b'] } },
  };
  assert.deepEqual(getModuleCompletion(state, 'rs', 4), { checked: 2, total: 4, percent: 50 });
  assert.deepEqual(getModuleCompletion(state, 'wfd', 4), { checked: 0, total: 4, percent: 0 });
  assert.deepEqual(getModuleCompletion(state, 'rs', 0), { checked: 0, total: 0, percent: 0 });
});

test('getNextFocus returns the first module in priority order whose completion < 100%', () => {
  const totals = new Map([
    ['rs', 3],
    ['wfd', 4],
    ['essay', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      rs: { checked: ['1', '2', '3'] },
      wfd: { checked: ['1', '2'] },
    },
  };
  const result = getNextFocus(state, ['rs', 'wfd', 'essay'], totals);
  assert.equal(result.moduleId, 'wfd');
  assert.equal(result.remaining, 2);
});

test('getNextFocus returns null when every module is at 100%', () => {
  const totals = new Map([['rs', 1]]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { rs: { checked: ['x'] } },
  };
  const result = getNextFocus(state, ['rs'], totals);
  assert.equal(result.moduleId, null);
  assert.equal(result.remaining, 0);
});

test('getTotalMastery counts only modules in the climb id list', () => {
  const totals = new Map([
    ['rs', 2],
    ['wfd', 2],
    ['mcm', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      rs: { checked: ['a', 'b'] },
      wfd: { checked: ['a'] },
      mcm: { checked: ['a', 'b'] },
    },
  };
  const result = getTotalMastery(state, ['rs', 'wfd'], totals);
  assert.deepEqual(result, {
    masteredCount: 1,
    totalModules: 2,
    pointsChecked: 3,
    pointsTotal: 4,
  });
});

test('setTarget returns the same reference when target is unchanged', () => {
  const state = createInitialState();
  const next = setTarget(state, state.target);
  assert.equal(next, state);
});

test('setTarget returns a new state object when target changes', () => {
  const state = createInitialState();
  const next = setTarget(state, 'seven');
  assert.notEqual(next, state);
  assert.equal(next.target, 'seven');
  assert.equal(state.target, 'eight');
});

test('getModuleCompletion clamps over-checked counts against the total', () => {
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { rs: { checked: ['a', 'b', 'c', 'd', 'e'] } },
  };
  assert.deepEqual(getModuleCompletion(state, 'rs', 3), { checked: 3, total: 3, percent: 100 });
});

test('loadState round-trips through saveState and survives a corrupt mastery field', () => {
  const fakeStore = new Map<string, string>();
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => fakeStore.get(key) ?? null,
      setItem: (key: string, value: string) => { fakeStore.set(key, value); },
      removeItem: (key: string) => { fakeStore.delete(key); },
    },
  };

  try {
    const start: SummitMasteryState = {
      target: 'seven',
      mastery: { rs: { checked: ['a', 'b'] } },
    };
    saveState(start);
    const loaded = loadState();
    assert.deepEqual(loaded, start);

    fakeStore.set(STORAGE_KEY, JSON.stringify({ target: 'eight', mastery: 'corrupt' }));
    assert.deepEqual(loadState(), { target: 'eight', mastery: {} });

    fakeStore.set(STORAGE_KEY, JSON.stringify({
      target: 'eight',
      mastery: { rs: { checked: 'not-an-array' }, wfd: { checked: ['ok', 7, true] } },
    }));
    assert.deepEqual(loadState(), { target: 'eight', mastery: { wfd: { checked: ['ok'] } } });
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  }
});

test('STORAGE_KEY is the versioned summit key, not the legacy command-map key', () => {
  assert.equal(STORAGE_KEY, 'pte-summit-mastery-v1');
});
