export function routeForJob(job) {
  if (job?.status === 'reviewing') return 'findings';
  if (job?.status === 'protected') return job.requestText ? 'final-check' : 'action-choice';
  if (job?.status === 'awaiting_ai') return 'awaiting-response';
  if (job?.status === 'restored' || job?.status === 'almost_ready') return 'result';
  throw new Error('Lavoro non riprendibile');
}
