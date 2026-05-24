import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findErrorForToken,
  getSelectedErrorIds,
  hasFoundEveryError,
  hasRepairedEveryError,
  wfdSpotRepairChallenges,
} from './wfdSpotRepair.ts';

test('WFD Spot & Repair starts with three seed challenges', () => {
  assert.equal(wfdSpotRepairChallenges.length, 3);
  assert.equal(wfdSpotRepairChallenges[0].correctedSentence, 'Students are encouraged to participate in sports activities.');
});

test('findErrorForToken returns the matching repair error for a wrong token', () => {
  const challenge = wfdSpotRepairChallenges[0];
  assert.equal(findErrorForToken(challenge, 'encourage')?.answer, 'encouraged');
  assert.equal(findErrorForToken(challenge, 'sport')?.answer, 'sports activities');
  assert.equal(findErrorForToken(challenge, 'students'), null);
});

test('getSelectedErrorIds treats one token in a phrase error as selecting that whole repair', () => {
  const challenge = wfdSpotRepairChallenges[0];
  assert.deepEqual(getSelectedErrorIds(challenge, ['sport']), ['sports-activities']);
  assert.deepEqual(getSelectedErrorIds(challenge, ['encourage', 'activity']), ['encourage-ed', 'sports-activities']);
});

test('hasFoundEveryError and hasRepairedEveryError require all challenge errors', () => {
  const challenge = wfdSpotRepairChallenges[2];
  assert.equal(hasFoundEveryError(challenge, ['researchers-s', 'samples-s']), false);
  assert.equal(hasFoundEveryError(challenge, ['researchers-s', 'collected-ed', 'samples-s']), true);
  assert.equal(hasRepairedEveryError(challenge, ['researchers-s', 'samples-s']), false);
  assert.equal(hasRepairedEveryError(challenge, ['researchers-s', 'collected-ed', 'samples-s']), true);
});
