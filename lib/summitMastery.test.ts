import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  toggleStrategy,
  getModuleCompletion,
  getNextFocus,
  getRouteMastery,
  setModuleGameResult,
  getTotalMastery,
  resetMastery,
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

test('toggleStrategy adds an id under the active target route when not present', () => {
  const state = createInitialState();
  const next = toggleStrategy(state, 'rs', 'rs:abc12345');
  assert.deepEqual(next.mastery['eight:rs'].checked, ['rs:abc12345']);
});

test('toggleStrategy removes an id when already present', () => {
  const start: SummitMasteryState = {
    target: 'eight',
    mastery: { 'eight:rs': { checked: ['rs:abc12345', 'rs:def67890'] } },
  };
  const next = toggleStrategy(start, 'rs', 'rs:abc12345');
  assert.deepEqual(next.mastery['eight:rs'].checked, ['rs:def67890']);
});

test('toggleStrategy does not duplicate an id when added twice', () => {
  let state = createInitialState();
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  assert.deepEqual(state.mastery['eight:rs'].checked, ['rs:abc12345']);
});

test('getModuleCompletion returns checked / total / percent', () => {
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { 'eight:mcm': { checked: ['a', 'b'] } },
  };
  assert.deepEqual(getModuleCompletion(state, 'mcm', 4), { checked: 2, total: 4, percent: 50 });
  assert.deepEqual(getModuleCompletion(state, 'wfd', 4), { checked: 0, total: 5, percent: 0 });
  assert.deepEqual(getModuleCompletion(state, 'mcm', 0), { checked: 0, total: 0, percent: 0 });
});

test('getModuleCompletion requires the latest WFD game result to pass before WFD reaches 100%', () => {
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { 'eight:wfd': { checked: ['a', 'b'] } },
  };

  assert.deepEqual(getModuleCompletion(state, 'wfd', 2), { checked: 2, total: 3, percent: 67 });

  const passed = setModuleGameResult(state, 'wfd', true);
  assert.deepEqual(getModuleCompletion(passed, 'wfd', 2), { checked: 3, total: 3, percent: 100 });

  const failedAgain = setModuleGameResult(passed, 'wfd', false);
  assert.deepEqual(getModuleCompletion(failedAgain, 'wfd', 2), { checked: 2, total: 3, percent: 67 });
});

test('getNextFocus returns the first module in priority order whose completion < 100%', () => {
  const totals = new Map([
    ['mcm', 3],
    ['wfd', 4],
    ['essay', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      'eight:mcm': { checked: ['1', '2', '3'] },
      'eight:wfd': { checked: ['1', '2'] },
    },
  };
  const result = getNextFocus(state, ['mcm', 'wfd', 'essay'], totals);
  assert.equal(result.moduleId, 'wfd');
  assert.equal(result.remaining, 3);
});

test('getNextFocus returns null when every module is at 100%', () => {
  const totals = new Map([['mcm', 1]]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { 'eight:mcm': { checked: ['x'] } },
  };
  const result = getNextFocus(state, ['mcm'], totals);
  assert.equal(result.moduleId, null);
  assert.equal(result.remaining, 0);
});

test('getNextFocus keeps WFD active when its checklist is complete but latest game result is not passed', () => {
  const totals = new Map([['wfd', 2]]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { 'eight:wfd': { checked: ['a', 'b'] } },
  };

  assert.deepEqual(getNextFocus(state, ['wfd'], totals), { moduleId: 'wfd', remaining: 1 });
  assert.deepEqual(getNextFocus(setModuleGameResult(state, 'wfd', true), ['wfd'], totals), { moduleId: null, remaining: 0 });
});

test('getTotalMastery counts only modules in the climb id list', () => {
  const totals = new Map([
    ['mcs', 2],
    ['wfd', 2],
    ['mcm', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      'eight:mcs': { checked: ['a', 'b'] },
      'eight:wfd': { checked: ['a'] },
      'eight:mcm': { checked: ['a', 'b'] },
    },
  };
  const result = getTotalMastery(state, ['mcs', 'wfd'], totals);
  assert.deepEqual(result, {
    masteredCount: 1,
    totalModules: 2,
    pointsChecked: 3,
    pointsTotal: 5,
  });
});

test('getRouteMastery marks the summit complete when every important module is complete', () => {
  const totals = new Map([
    ['wfd', 2],
    ['mcm', 2],
    ['mcs', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      'eight:wfd': { checked: ['a', 'b'] },
      'eight:mcm': { checked: ['a', 'b'] },
    },
    gameResults: { 'eight:wfd': { passed: true } },
  };

  assert.deepEqual(getRouteMastery(state, ['wfd', 'mcm'], totals), {
    masteredCount: 2,
    totalModules: 2,
    pointsChecked: 5,
    pointsTotal: 5,
    isComplete: true,
  });
});

test('getRouteMastery ignores low-yield modules when deciding summit completion', () => {
  const totals = new Map([
    ['wfd', 2],
    ['mcm', 2],
    ['mcs', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      'eight:wfd': { checked: ['a', 'b'] },
      'eight:mcm': { checked: ['a', 'b'] },
      'eight:mcs': { checked: [] },
    },
    gameResults: { 'eight:wfd': { passed: true } },
  };

  const result = getRouteMastery(state, ['wfd', 'mcm'], totals);

  assert.equal(result.isComplete, true);
  assert.equal(result.totalModules, 2);
  assert.equal(result.pointsTotal, 5);
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

test('resetMastery clears seven and eight mastery while preserving the active target', () => {
  const state: SummitMasteryState = {
    target: 'seven',
    mastery: {
      'seven:wfd': { checked: ['a'] },
      'eight:rs': { checked: ['b'] },
    },
  };

  assert.deepEqual(resetMastery(state), { target: 'seven', mastery: {} });
});

test('getModuleCompletion clamps over-checked counts against the total', () => {
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { 'eight:mcm': { checked: ['a', 'b', 'c', 'd', 'e'] } },
  };
  assert.deepEqual(getModuleCompletion(state, 'mcm', 3), { checked: 3, total: 3, percent: 100 });
});

test('target switch keeps seven and eight mastery independent', () => {
  const eightState = toggleStrategy(createInitialState(), 'wfd', 'eight:wfd:a');
  const sevenState = toggleStrategy(setTarget(eightState, 'seven'), 'wfd', 'seven:wfd:a');

  assert.deepEqual(getModuleCompletion(eightState, 'wfd', 1), { checked: 1, total: 2, percent: 50 });
  assert.deepEqual(getModuleCompletion(setTarget(eightState, 'seven'), 'wfd', 1), { checked: 0, total: 2, percent: 0 });
  assert.deepEqual(getModuleCompletion(sevenState, 'wfd', 1), { checked: 1, total: 2, percent: 50 });
  assert.deepEqual(sevenState.mastery['eight:wfd'].checked, ['eight:wfd:a']);
  assert.deepEqual(sevenState.mastery['seven:wfd'].checked, ['seven:wfd:a']);
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
      gameResults: { 'seven:wfd': { passed: true } },
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

    fakeStore.set(STORAGE_KEY, JSON.stringify({
      target: 'eight',
      mastery: {},
      gameResults: { 'eight:wfd': { passed: true }, corrupt: { passed: 'yes' } },
    }));
    assert.deepEqual(loadState(), {
      target: 'eight',
      mastery: {},
      gameResults: { 'eight:wfd': { passed: true } },
    });
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  }
});

test('STORAGE_KEY is the versioned summit key, not the legacy command-map key', () => {
  assert.equal(STORAGE_KEY, 'pte-summit-mastery-v2');
});
