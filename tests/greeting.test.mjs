import test from 'node:test';
import assert from 'node:assert/strict';
import { greetingForHour } from '../src/domain/greeting.mjs';

test('selects the mobile greeting from the local hour', () => {
  assert.equal(greetingForHour(5), '👋 Buongiorno');
  assert.equal(greetingForHour(10), '👋 Hey!');
  assert.equal(greetingForHour(12), '👋 Diamoci dentro');
  assert.equal(greetingForHour(15), '💪 Sono pronto');
  assert.equal(greetingForHour(18), '🚀 Mettimi alla prova');
  assert.equal(greetingForHour(21), '🌕 Buonasera');
  assert.equal(greetingForHour(2), '🌕 Buonasera');
});

test('rejects hours outside the clock range', () => {
  assert.throws(() => greetingForHour(-1), /Ora non valida/);
  assert.throws(() => greetingForHour(24), /Ora non valida/);
});

test('returns equivalent English greetings for the English interface', () => {
  assert.equal(greetingForHour(5, 'en'), '👋 Good morning');
  assert.equal(greetingForHour(12, 'en'), '👋 Let’s get to work');
  assert.equal(greetingForHour(18, 'en'), '🚀 Put me to the test');
  assert.equal(greetingForHour(22, 'en'), '🌕 Good evening');
});
