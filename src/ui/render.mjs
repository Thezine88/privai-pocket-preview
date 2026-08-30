export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const ICONS = {
  pencil: '<path d="M4 20h4l11-11-4-4L4 16v4Zm9-13 4 4M4 20l4-1"/>',
  file: '<path d="M6 2h8l4 4v16H6zM14 2v5h5"/>',
  share: '<path d="M12 16V3m0 0L7 8m5-5 5 5M5 12H3v9h18v-9h-2"/>',
  work: '<path d="M4 8h16v12H4zM9 8V5h6v3M4 13h16M10 13v2h4v-2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6a8 8 0 0 0-1.7 1L5 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5 18l2.3-1a8 8 0 0 0 1.7 1l.5 3h5l.5-3a8 8 0 0 0 1.7-1l2.3 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1Z"/>',
  clipboard: '<path d="M9 5h6v3H9zM7 6H5v16h14V6h-2M8 12h8M8 16h8"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ''}</svg>`;
}
