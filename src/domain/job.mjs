const STATUSES = new Set(['draft', 'reviewing', 'protected', 'awaiting_ai', 'restored', 'almost_ready']);

const TRANSITIONS = {
  draft: new Set(['reviewing']),
  reviewing: new Set(['draft', 'protected']),
  protected: new Set(['reviewing', 'awaiting_ai']),
  awaiting_ai: new Set(['restored', 'almost_ready']),
  almost_ready: new Set(['awaiting_ai', 'restored']),
  restored: new Set(),
};

function isValid(job) {
  return job?.version === 1
    && typeof job.id === 'string' && Boolean(job.id.trim())
    && typeof job.title === 'string' && Boolean(job.title.trim())
    && STATUSES.has(job.status)
    && typeof job.createdAt === 'string'
    && typeof job.updatedAt === 'string';
}

export function createJob({ id, title, now = new Date().toISOString() }) {
  const job = { version: 1, id, title, status: 'draft', createdAt: now, updatedAt: now };
  if (!isValid(job)) throw new TypeError('Lavoro non valido');
  return job;
}

export function transitionJob(job, nextStatus, { now = new Date().toISOString() } = {}) {
  if (!isValid(job) || !TRANSITIONS[job.status]?.has(nextStatus)) {
    throw new Error(`Transizione lavoro non valida: ${job?.status} -> ${nextStatus}`);
  }
  return { ...job, status: nextStatus, updatedAt: now };
}

export function serializeJob(job) {
  if (!isValid(job)) throw new TypeError('Lavoro non valido');
  return JSON.stringify(job);
}

export function parseJob(serialized) {
  let job;
  try {
    job = JSON.parse(serialized);
  } catch {
    throw new TypeError('Lavoro non valido');
  }
  if (job?.version !== 1) throw new Error(`Versione lavoro non supportata: ${job?.version}`);
  if (!isValid(job)) throw new TypeError('Lavoro non valido');
  return job;
}
