import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCoachRecommendation,
  getPracticeStatus,
  getRouteSteps,
  markPracticedToday,
  type CommandProgress,
} from './commandMapLogic.ts';

test('recommends the next uncompleted focus module for the selected target', () => {
  const progress: CommandProgress = {
    target: 'eight',
    modules: {
      rs: { practiceCount: 4, practicedDates: ['2026-05-09'], lastPracticedAt: '2026-05-09' },
      wfd: { practiceCount: 2, practicedDates: ['2026-05-09'], lastPracticedAt: '2026-05-09' },
    },
  };

  const recommendation = getCoachRecommendation(progress, '2026-05-09');

  assert.equal(recommendation.nextModuleId, 'essay');
  assert.match(recommendation.message, /Writing 85|WE/i);
});

test('marks practice only once per module per day', () => {
  const first = markPracticedToday({ target: 'seven', modules: {} }, 'rs', '2026-05-09');
  const second = markPracticedToday(first, 'rs', '2026-05-09');

  assert.equal(second.modules.rs.practiceCount, 1);
  assert.deepEqual(second.modules.rs.practicedDates, ['2026-05-09']);
});

test('derives practice status from distinct practice days and counts', () => {
  assert.equal(getPracticeStatus(undefined), 'new');
  assert.equal(
    getPracticeStatus({ practiceCount: 1, practicedDates: ['2026-05-09'], lastPracticedAt: '2026-05-09' }),
    'practicing',
  );
  assert.equal(
    getPracticeStatus({
      practiceCount: 5,
      practicedDates: ['2026-05-01', '2026-05-02'],
      lastPracticedAt: '2026-05-02',
    }),
    'stable',
  );
  assert.equal(
    getPracticeStatus({
      practiceCount: 10,
      practicedDates: ['2026-05-01', '2026-05-02', '2026-05-03'],
      lastPracticedAt: '2026-05-03',
    }),
    'mastered',
  );
});

test('builds guided route steps with done, current, and locked states', () => {
  const progress: CommandProgress = {
    target: 'seven',
    modules: {
      rs: { practiceCount: 1, practicedDates: ['2026-05-09'], lastPracticedAt: '2026-05-09' },
      wfd: { practiceCount: 1, practicedDates: ['2026-05-09'], lastPracticedAt: '2026-05-09' },
    },
  };

  const steps = getRouteSteps(progress, '2026-05-09');

  assert.deepEqual(
    steps.slice(0, 4).map((step) => ({ id: step.moduleId, state: step.state })),
    [
      { id: 'rs', state: 'done' },
      { id: 'wfd', state: 'done' },
      { id: 'essay', state: 'current' },
      { id: 'sst', state: 'locked' },
    ],
  );
});
