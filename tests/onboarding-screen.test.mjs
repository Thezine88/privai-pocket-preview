import test from 'node:test';
import assert from 'node:assert/strict';
import { renderOnboarding } from '../src/ui/screens/onboarding.mjs';

test('onboarding explains the value in exactly three steps', () => {
  const first = renderOnboarding(0);
  const second = renderOnboarding(1);
  const third = renderOnboarding(2);
  assert.match(first, /Ciao, sono Willy/);
  assert.match(first, /assets\/willy-wave\.png/);
  assert.match(second, /Tu condividi[\s\S]*Ai dati penso io/);
  assert.match(second, /assets\/willy-shield\.png/);
  assert.match(third, /I dati tornano[\s\S]*al loro posto/);
  assert.match(third, /\[NOME_1\][\s\S]*\[EMAIL_1\]/);
  assert.match(third, /Luca[\s\S]*luca@email\.it/);
  assert.equal((third.match(/class="restore-demo__state /g) ?? []).length, 2);
  assert.match(third, /restore-demo--reveal/);
  assert.match(third, /restore-demo__state--protected[^>]*data-reveal-phase="1"/);
  assert.match(third, /restore-demo__arrow[^>]*data-reveal-phase="2"/);
  assert.match(third, /restore-demo__state--restored[^>]*data-reveal-phase="3"/);
  assert.match(third, /restore-demo__arrow/);
  assert.match(third, /restore-demo__icon/);
  assert.match(first, /Passaggio 1 di 3/);
  assert.match(second, /Passaggio 2 di 3/);
  assert.match(third, /Passaggio 3 di 3/);
});

test('programmatic onboarding title focus is marked separately from interactive focus', () => {
  const html = renderOnboarding(0);
  assert.match(html, /<h1 class="screen-title"/);
});

test('each onboarding step has one lower primary action and no app navigation', () => {
  for (let step = 0; step < 3; step += 1) {
    const html = renderOnboarding(step);
    assert.equal((html.match(/<button class="(?=[^"]*onboarding__cta)(?=[^"]*button--primary)[^"]*"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /bottom-nav/);
    assert.doesNotMatch(html, />Indietro</);
  }
});

test('onboarding rejects steps outside the sequence', () => {
  assert.throws(() => renderOnboarding(3), /Passaggio onboarding non valido/);
});
