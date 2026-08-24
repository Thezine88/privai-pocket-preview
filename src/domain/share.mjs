const WEB_LINK = /https?:\/\/[^\s<>"']+/giu;

export function containsWebLinks(text) {
  WEB_LINK.lastIndex = 0;
  return WEB_LINK.test(text);
}

export function removeWebLinks(text) {
  return text
    .replace(WEB_LINK, '')
    .replace(/[ \t]+$/gmu, '')
    .replace(/[ \t]{2,}/gu, ' ')
    .trim();
}
