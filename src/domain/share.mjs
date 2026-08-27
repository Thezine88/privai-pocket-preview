const WEB_LINK = /https?:\/\/[^\s<>"']+/giu;

export function containsWebLinks(text) {
  WEB_LINK.lastIndex = 0;
  return WEB_LINK.test(String(text ?? ''));
}

export function removeWebLinks(text) {
  return String(text ?? '')
    .replace(WEB_LINK, '')
    .replace(/[ \t]+$/gmu, '')
    .replace(/[ \t]{2,}/gu, ' ')
    .trim();
}
