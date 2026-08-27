import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addManualFindings,
  GUIDED_STEPS,
  buildGuidedPrompt,
  getRecipeQuestions,
  listGuidedRecipes,
  transitionGuidedWorkflow,
} from '../src/domain/guided-workflow.mjs';

test('opens the purpose directly while keeping privacy review available', () => {
  const initial = { step: 'input', hasContent: true, findingCount: 1 };
  assert.equal(transitionGuidedWorkflow(initial, 'CONTINUE').step, 'purpose');
  assert.deepEqual(transitionGuidedWorkflow(initial, 'OPEN_REVIEW'), {
    ...initial,
    step: 'review',
    returnStep: 'input',
  });
  assert.equal(transitionGuidedWorkflow({ ...initial, hasContent: false }, 'CONTINUE').step, 'input');
});

test('returns from privacy review to the step that opened it', () => {
  const reviewing = { step: 'review', returnStep: 'questions', hasContent: true, findingCount: 2 };
  const resumed = transitionGuidedWorkflow(reviewing, 'CLOSE_REVIEW');
  assert.equal(resumed.step, 'questions');
  assert.equal('returnStep' in resumed, false);
});

test('exposes the five approved guided steps', () => {
  assert.deepEqual(GUIDED_STEPS, ['input', 'review', 'purpose', 'questions', 'result']);
});

test('every guided recipe has two to four questions and distinct local output', () => {
  const recipeIds = ['reply', 'email', 'checklist', 'summary', 'explain', 'dispute', 'quote', 'minutes', 'questions', 'post', 'markdown', 'letter'];
  assert.deepEqual(listGuidedRecipes('it').map(({ id }) => id), recipeIds);
  const outputs = new Set();
  for (const recipeId of recipeIds) {
    const questions = getRecipeQuestions(recipeId, 'it');
    assert.ok(questions.length >= 2 && questions.length <= 4, recipeId);
    assert.ok(questions.every(({ options }) => options.length >= 2), recipeId);
    const output = buildGuidedPrompt({ recipeId, answers: {}, content: 'Contenuto originale', locale: 'it' });
    assert.match(output, /Contenuto originale/);
    outputs.add(output.split('\n')[0]);
  }
  assert.equal(outputs.size, recipeIds.length);
});

test('guided copy is localized and unknown recipes are rejected', () => {
  assert.equal(listGuidedRecipes('en')[0].label, 'Reply to this');
  assert.throws(() => getRecipeQuestions('missing', 'it'), /Unknown recipe/);
  assert.throws(() => buildGuidedPrompt({ recipeId: 'missing', answers: {}, content: 'x', locale: 'it' }), /Unknown recipe/);
});

test('manual privacy review selects every exact non-overlapping occurrence', () => {
  const existing = [{ start: 0, end: 5, type: 'EMAIL', value: 'Mario', selected: true }];
  assert.deepEqual(addManualFindings('Mario e Mario e Mario', 'Mario', existing).slice(1), [
    { id: 'CUSTOM-8-5', type: 'CUSTOM', value: 'Mario', start: 8, end: 13, selected: true },
    { id: 'CUSTOM-16-5', type: 'CUSTOM', value: 'Mario', start: 16, end: 21, selected: true },
  ]);
  assert.deepEqual(addManualFindings('testo', ' ', []), []);
});
