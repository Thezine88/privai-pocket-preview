import { icon } from '../render.mjs';
import { renderBottomNav } from './home.mjs';

export function renderSettings() {
  return `<div class="screen settings-screen"><header class="settings-header"><h1>Impostazioni</h1></header><main class="settings-content"><button class="settings-row" data-action="open-quick-actions"><span>${icon('sliders')}<span><strong>Azioni rapide</strong><small>Scegli cosa trovare nella schermata di lavoro</small></span></span>${icon('chevron', 'chevron')}</button></main>${renderBottomNav('settings')}</div>`;
}
