import { icon } from '../render.mjs';

const STEPS = [
  {
    title: 'Ciao, sono Willy',
    body: 'Ti aiuto a usare l’AI senza condividere dati sensibili.',
    visual: '<img class="onboarding-character onboarding-character--wave" src="assets/willy-wave.png" alt="">',
    cta: 'Continua',
  },
  {
    title: 'Tu condividi.<br>Ai dati penso io.',
    body: 'Nascondo nomi, email e altri dati prima che arrivino all’AI.',
    visual: '<img class="onboarding-character onboarding-character--shield" src="assets/willy-shield.png" alt="">',
    cta: 'Continua',
  },
  {
    title: 'I dati tornano<br>al loro posto',
    body: 'Gli originali restano sempre sul tuo telefono.',
    visual: `<div class="restore-demo" aria-label="RestaMio sostituisce i segnaposto con i dati originali conservati sul telefono.">
      <div class="restore-demo__state restore-demo__state--protected"><span class="restore-demo__label">Testo protetto</span><p>Ciao <mark>[NOME_1]</mark>, ti confermo il preventivo.<br>Scrivimi a <mark>[EMAIL_1]</mark></p></div>
      <div class="restore-demo__state restore-demo__state--restored" aria-hidden="true"><span class="restore-demo__label">Testo ripristinato</span><p>Ciao <mark>Luca</mark>, ti confermo il preventivo.<br>Scrivimi a <mark>luca@email.it</mark></p></div>
    </div>`,
    cta: 'Iniziamo',
  },
];

export function renderOnboarding(step) {
  if (!Number.isInteger(step) || !STEPS[step]) throw new RangeError('Passaggio onboarding non valido');
  const item = STEPS[step];
  const dots = STEPS.map((_, index) => `<span class="${index === step ? 'is-active' : ''}"></span>`).join('');
  return `<section class="screen onboarding" data-onboarding-step="${step}">
    <header class="onboarding__header">
      ${step ? `<button class="onboarding__back" data-action="onboarding-back" aria-label="Passaggio precedente">${icon('chevron')}</button>` : '<span class="onboarding__spacer"></span>'}
      <div class="wordmark" aria-label="RestaMio"><span>Resta</span><span>Mio</span></div>
      ${step < 2 ? '<button class="onboarding__skip" data-action="finish-onboarding">Salta</button>' : '<span class="onboarding__spacer"></span>'}
    </header>
    <div class="onboarding__content">
      <div class="onboarding__visual">${item.visual}</div>
      <h1>${item.title}</h1><p>${item.body}</p>
    </div>
    <footer class="onboarding__footer">
      <div class="onboarding__progress" role="status" aria-label="Passaggio ${step + 1} di 3">${dots}<span class="visually-hidden">Passaggio ${step + 1} di 3</span></div>
      <button class="button button--primary onboarding__cta" data-action="${step === 2 ? 'finish-onboarding' : 'onboarding-next'}">${item.cta}</button>
    </footer>
  </section>`;
}
