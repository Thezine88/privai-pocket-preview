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
    titleFirst: true,
    visual: `<div class="restore-demo restore-demo--reveal" aria-label="RestaMio sostituisce i segnaposto con i dati originali conservati sul telefono.">
      <div class="restore-demo__state restore-demo__state--protected" data-reveal-phase="1"><span class="restore-demo__label"><svg class="restore-demo__icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.8 8 11 4.6-2.2 8-6 8-11V5l-8-3Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10.5 10V8.8a1.5 1.5 0 0 1 3 0V10"/></svg>Testo protetto</span><p>Ciao <mark>[NOME_1]</mark>, ti confermo il preventivo.<br>Scrivimi a <mark>[EMAIL_1]</mark></p></div>
      <svg class="restore-demo__arrow" data-reveal-phase="2" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v16m0 0-5-5m5 5 5-5"/></svg>
      <div class="restore-demo__state restore-demo__state--restored" data-reveal-phase="3"><span class="restore-demo__label"><svg class="restore-demo__icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.8 8 11 4.6-2.2 8-6 8-11V5l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>Testo ripristinato</span><p>Ciao <mark>Luca</mark>, ti confermo il preventivo.<br>Scrivimi a <mark>luca@email.it</mark></p></div>
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
      ${item.titleFirst ? `<h1 class="screen-title">${item.title}</h1><div class="onboarding__visual">${item.visual}</div>` : `<div class="onboarding__visual">${item.visual}</div><h1 class="screen-title">${item.title}</h1>`}<p>${item.body}</p>
    </div>
    <footer class="onboarding__footer">
      <div class="onboarding__progress" role="status" aria-label="Passaggio ${step + 1} di 3">${dots}<span class="visually-hidden">Passaggio ${step + 1} di 3</span></div>
      <button class="button button--primary onboarding__cta" data-action="${step === 2 ? 'finish-onboarding' : 'onboarding-next'}">${item.cta}</button>
    </footer>
  </section>`;
}
