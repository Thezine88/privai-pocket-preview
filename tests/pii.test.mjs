import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSensitiveData, displaySensitiveType, groupFindings, maskFindings, restoreProtectedText } from '../src/domain/pii.mjs';

test('detects Italian and common structured sensitive values', () => {
  const text = [
    'Email mario.rossi@example.it',
    'telefono +39 333 123 4567',
    'CF RSSMRA85T10A562S',
    'IBAN IT60X0542811101000000123456',
    'data 12/06/1985',
  ].join(', ');
  assert.deepEqual(
    detectSensitiveData(text).map(({ type, value }) => [type, value]),
    [
      ['EMAIL', 'mario.rossi@example.it'],
      ['TELEPHONENUM', '+39 333 123 4567'],
      ['CF', 'RSSMRA85T10A562S'],
      ['IBAN', 'IT60X0542811101000000123456'],
      ['DATE', '12/06/1985'],
    ],
  );
});

test('uses friendly labels for technical sensitive-data types', () => {
  assert.equal(displaySensitiveType('TELEPHONENUM', 'it'), 'Telefono');
  assert.equal(displaySensitiveType('TELEPHONENUM', 'en'), 'Phone');
  assert.equal(displaySensitiveType('EMAIL', 'it'), 'Email');
});

test('uses a readable phone label in RestaMio placeholders', () => {
  const text = 'Chiama +39 333 123 4567';
  const masked = maskFindings(text, detectSensitiveData(text), { scope: 'A7F2' });
  assert.equal(masked.text, 'Chiama [[RESTAMIO_A7F2_PHONE_1]]');
  assert.doesNotMatch(masked.text, /TELEPHONENUM/);
});

test('rejects an invalid fiscal-code checksum', () => {
  assert.equal(detectSensitiveData('CF RSSMRA85T10A562X').some((item) => item.type === 'CF'), false);
});

test('removes nested lower-priority matches', () => {
  const findings = detectSensitiveData('Scrivi a mario.rossi@example.it');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, 'EMAIL');
});

test('masks selected findings with stable typed placeholders and a reversible map', () => {
  const text = 'Email mario@example.it, poi ancora mario@example.it, data 12/06/1985.';
  const findings = detectSensitiveData(text).map((item) => ({
    ...item,
    selected: item.type !== 'DATE',
  }));
  assert.deepEqual(maskFindings(text, findings), {
    text: 'Email [EMAIL_1], poi ancora [EMAIL_1], data 12/06/1985.',
    mapping: { '[EMAIL_1]': 'mario@example.it' },
    maskedCount: 2,
  });
});

test('uses job-scoped placeholders and restores only exact known placeholders', () => {
  const text = 'Email mario@example.it';
  const masked = maskFindings(text, detectSensitiveData(text), { scope: 'A7F2' });
  assert.equal(masked.text, 'Email [[RESTAMIO_A7F2_EMAIL_1]]');
  assert.deepEqual(restoreProtectedText('Risposta per [[RESTAMIO_A7F2_EMAIL_1]].', masked.mapping), {
    text: 'Risposta per mario@example.it.',
    restoredCount: 1,
    missingPlaceholders: [],
  });
  assert.equal(restoreProtectedText('Segnaposto [[PRIVAI_OTHER_EMAIL_1]]', masked.mapping).restoredCount, 0);
});

test('groups duplicate values by friendly category and occurrence count', () => {
  const findings = detectSensitiveData('mario@example.it e ancora mario@example.it, 333 123 4567');
  assert.deepEqual(groupFindings(findings), [
    { type: 'EMAIL', label: 'Email', occurrenceCount: 2, selectedCount: 2, values: [{ value: 'mario@example.it', occurrenceCount: 2, selectedCount: 2, findingIds: findings.slice(0, 2).map((item) => item.id), occurrences: findings.slice(0, 2).map(({ id, selected }) => ({ id, selected })) }] },
    { type: 'TELEPHONENUM', label: 'Telefono', occurrenceCount: 1, selectedCount: 1, values: [{ value: '333 123 4567', occurrenceCount: 1, selectedCount: 1, findingIds: [findings[2].id], occurrences: [{ id: findings[2].id, selected: findings[2].selected }] }] },
  ]);
});

test('restores legacy PrivAI mappings exactly', () => {
  assert.equal(restoreProtectedText('Ciao [[PRIVAI_A7F2_NAME_1]]', { '[[PRIVAI_A7F2_NAME_1]]': 'Luca' }).text, 'Ciao Luca');
});
