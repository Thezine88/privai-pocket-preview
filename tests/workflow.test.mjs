import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkflowState,
  transitionWorkflow,
  getVisiblePhase,
  containsKnownPlaceholder,
} from '../src/domain/workflow.mjs';

test('convert moves from input directly to result', () => {
  const start = createWorkflowState('convert');
  assert.deepEqual(transitionWorkflow(start, 'COMPLETE'), {
    tool: 'convert',
    phase: 'result',
  });
});

test('protect requires review before result', () => {
  const start = createWorkflowState('protect');
  const review = transitionWorkflow(start, 'REVIEW');
  assert.equal(getVisiblePhase(review), 'review');
  assert.equal(getVisiblePhase(transitionWorkflow(review, 'COMPLETE')), 'result');
});

test('edit returns to input without changing tool', () => {
  const result = { tool: 'prepare', phase: 'result' };
  assert.deepEqual(transitionWorkflow(result, 'EDIT'), {
    tool: 'prepare',
    phase: 'input',
  });
});

test('invalid transitions preserve state', () => {
  const start = createWorkflowState('restore');
  assert.deepEqual(transitionWorkflow(start, 'UNKNOWN'), start);
});

test('recognises only placeholders belonging to the current local mapping', () => {
  const mapping = { '[[PRIVAI_AB12_EMAIL_1]]': 'mario@example.com' };
  assert.equal(containsKnownPlaceholder('Ciao [[PRIVAI_AB12_EMAIL_1]]', mapping), true);
  assert.equal(containsKnownPlaceholder('Ciao [EMAIL_1]', mapping), false);
  assert.equal(containsKnownPlaceholder('', mapping), false);
});
