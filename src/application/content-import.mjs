import { extractTextFromPdf, isPdfFile } from '../domain/pdf.mjs';

export async function readImportedContent(file, { extractPdf = extractTextFromPdf } = {}) {
  if (isPdfFile(file)) return (await extractPdf(file)).text;
  const name = String(file?.name ?? '').toLowerCase();
  if (!file || (!file.type?.startsWith('text/') && !name.endsWith('.txt') && !name.endsWith('.md'))) {
    throw new TypeError('FORMATO_NON_SUPPORTATO');
  }
  const text = await file.text();
  if (!text.trim()) throw new TypeError('FILE_SENZA_TESTO');
  return text;
}
