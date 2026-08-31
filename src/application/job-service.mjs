import { createJob, transitionJob } from '../domain/job.mjs';
import { detectSensitiveData, maskFindings, restoreProtectedText } from '../domain/pii.mjs';

const ACTION_PROMPTS = {
  email: 'Scrivi un’email usando questo testo:',
  summary: 'Riassumi questo testo:',
  cv: 'Migliora questo CV:',
  translate: 'Traduci questo testo nella lingua indicata nel contesto, mantenendo significato e tono:',
  checklist: 'Trasforma questo testo in una lista chiara e operativa:',
  clarify: 'Rendi questo testo più chiaro senza cambiarne il significato:',
};

const MANUAL_TYPES = new Set(['NAME', 'EMAIL', 'TELEPHONENUM', 'CF', 'IBAN', 'DATE', 'URL']);

function scopeFrom(id) {
  const cleaned = String(id).replace(/[^a-z0-9]/giu, '').toUpperCase();
  return cleaned.slice(-4) || 'JOB1';
}

function suspiciousPlaceholders(text) {
  return String(text ?? '').match(/\[\[(?:RESTAMIO|PRIVAI)_[A-Z0-9_]+\]\]/giu) ?? [];
}

export function createJobService(store, {
  now = () => new Date().toISOString(),
  createId = () => `job-${crypto.randomUUID()}`,
} = {}) {
  const requireJob = async (id) => {
    const job = await store.open(id);
    if (!job) throw new Error('Lavoro non trovato');
    return job;
  };
  const save = async (job) => { await store.save(job); return job; };

  return {
    open: (id) => store.open(id),
    listIds: () => store.listIds(),

    async createTextJob(text, { title = 'Nuovo testo', findings } = {}) {
      const originalText = String(text ?? '');
      if (!originalText.trim()) throw new TypeError('Inserisci un testo');
      const stamp = now();
      const draft = createJob({ id: createId(), title, now: stamp });
      return save({
        ...transitionJob(draft, 'reviewing', { now: stamp }),
        originalText,
        findings: Array.isArray(findings) ? findings : detectSensitiveData(originalText),
      });
    },

    async setFindingSelection(id, findingId, selected) {
      const job = await requireJob(id);
      if (job.status !== 'reviewing') throw new Error('Il lavoro non è in revisione');
      return save({ ...job, findings: job.findings.map((item) => item.id === findingId ? { ...item, selected: Boolean(selected) } : item), updatedAt: now() });
    },

    async addManualFinding(id, { start, end, type } = {}) {
      const job = await requireJob(id);
      if (job.status !== 'reviewing') throw new Error('Il lavoro non è in revisione');
      if (!MANUAL_TYPES.has(type)) throw new TypeError('Scegli un tipo di dato');
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > job.originalText.length || start >= end || !job.originalText.slice(start, end).trim()) {
        throw new TypeError('Seleziona una parte del testo');
      }
      if (job.findings.some((finding) => start < finding.end && end > finding.start)) throw new Error('Questo dato è già rilevato');
      const finding = { id: `${type}-${start}-${end - start}-manual`, type, value: job.originalText.slice(start, end), start, end, selected: true, manual: true };
      return save({ ...job, findings: [...job.findings, finding].sort((a, b) => a.start - b.start), updatedAt: now() });
    },

    async protect(id) {
      const job = await requireJob(id);
      const result = maskFindings(job.originalText, job.findings, { scope: scopeFrom(job.id) });
      return save({
        ...transitionJob(job, 'protected', { now: now() }),
        protectedText: result.text,
        mapping: result.mapping,
        protectedCount: result.maskedCount,
      });
    },

    async prepareRequest(id, { action, customPrompt = '', context = {} } = {}) {
      const job = await requireJob(id);
      if (job.status !== 'protected') throw new Error('Proteggi prima il testo');
      const instruction = action === 'custom' ? String(customPrompt).trim() : ACTION_PROMPTS[action];
      if (!instruction) throw new TypeError('Scegli cosa vuoi fare');
      const details = Object.values(context).filter(Boolean).join(' · ');
      const requestText = `${instruction}${details ? `\nContesto: ${details}` : ''}\n\n${job.protectedText}`;
      return save({ ...job, action, actionContext: context, requestText, updatedAt: now() });
    },

    async updateRequest(id, requestText) {
      const job = await requireJob(id);
      return save({ ...job, requestText: String(requestText ?? ''), updatedAt: now() });
    },

    async markAwaiting(id, requestText) {
      const job = await requireJob(id);
      const updated = { ...job, requestText: String(requestText ?? job.requestText ?? '') };
      if (job.status === 'awaiting_ai') return save({ ...updated, updatedAt: now() });
      return save(transitionJob(updated, 'awaiting_ai', { now: now() }));
    },

    async restore(id, responseText) {
      const job = await requireJob(id);
      if (job.status !== 'awaiting_ai' && job.status !== 'almost_ready') throw new Error('Il lavoro non attende una risposta');
      const response = String(responseText ?? '');
      if (!response.trim()) throw new TypeError('Incolla la risposta dell’AI');
      const restored = restoreProtectedText(response, job.mapping);
      const unresolved = suspiciousPlaceholders(restored.text);
      const next = unresolved.length ? 'almost_ready' : 'restored';
      return save({
        ...transitionJob(job, next, { now: now() }),
        responseText: response,
        resultText: restored.text,
        restoredCount: restored.restoredCount,
        unresolvedCount: unresolved.length,
        unresolvedPlaceholders: unresolved,
      });
    },
  };
}
