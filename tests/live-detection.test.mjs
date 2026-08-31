import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveDetection, inputDetectionState } from '../src/application/live-detection.mjs';
import { detectSensitiveData } from '../src/domain/pii.mjs';

test('live detection waits for the latest edit before analysing locally', () => {
  const queued = [];
  const cancelled = [];
  const results = [];
  const detection = createLiveDetection({
    detect: detectSensitiveData,
    delay: 350,
    schedule: (callback, delay) => { queued.push({ callback, delay }); return queued.length; },
    cancel: (id) => cancelled.push(id),
    onResult: (result) => results.push(result),
  });

  detection.update('mario@');
  detection.update('mario@example.it');

  assert.deepEqual(cancelled, [1]);
  assert.equal(queued[1].delay, 350);
  assert.deepEqual(results, []);
  queued[1].callback();
  assert.equal(results.length, 1);
  assert.equal(results[0].text, 'mario@example.it');
  assert.equal(results[0].findings.length, 1);
});

test('clearing the editor immediately clears stale findings', () => {
  const results = [];
  const detection = createLiveDetection({
    detect: detectSensitiveData,
    schedule: () => 1,
    cancel: () => {},
    onResult: (result) => results.push(result),
  });

  detection.update('mario@example.it');
  detection.update('   ');

  assert.deepEqual(results, [{ text: '', findings: [] }]);
});

test('input state enables the CTA immediately and updates the detected count', () => {
  assert.deepEqual(inputDetectionState('', [], false), {
    ctaDisabled: true,
    label: '0 dati trovati',
  });
  assert.deepEqual(inputDetectionState('mario@example.it', [{ type: 'EMAIL' }], false), {
    ctaDisabled: false,
    label: '1 dato trovato',
  });
  assert.deepEqual(inputDetectionState('testo in modifica', [], true), {
    ctaDisabled: false,
    label: 'Controllo in corso…',
  });
});

test('live detection preserves leading whitespace so finding offsets stay valid', () => {
  let callback;
  let result;
  const detection = createLiveDetection({
    detect: detectSensitiveData,
    schedule: (task) => { callback = task; return 1; },
    cancel: () => {},
    onResult: (value) => { result = value; },
  });

  detection.update('  mario@example.it');
  callback();

  assert.equal(result.text, '  mario@example.it');
  assert.equal(result.findings[0].start, 2);
});
