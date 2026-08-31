export async function processIncomingContent({ item, port, decodeBase64, importBytes }) {
  try {
    if (item.kind === 'image') {
      const { text } = await port.recognize(item.cacheId);
      const cleaned = String(text ?? '').trim();
      if (!cleaned) throw new Error('Non trovo testo leggibile in questa immagine.');
      return cleaned;
    }
    const { base64 } = await port.read(item.cacheId);
    return importBytes({ name: item.name, mimeType: item.mimeType, bytes: decodeBase64(base64) });
  } finally {
    await port.discard(item.cacheId).catch(() => {});
  }
}
