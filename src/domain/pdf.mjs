const MAX_PDF_BYTES = 15_000_000;
const MAX_PDF_PAGES = 50;

export class PdfImportError extends Error {
  constructor(code, cause) {
    super(code, { cause });
    this.name = 'PdfImportError';
    this.code = code;
  }
}

async function loadBundledPdfJs() {
  const pdfjs = await import('../../vendor/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.mjs', import.meta.url).href;
  return pdfjs;
}

function pageText(items) {
  let text = '';
  for (const item of items) {
    if (!item || typeof item.str !== 'string') continue;
    text += item.str;
    if (item.hasEOL) text += '\n';
    else text += ' ';
  }
  return text.replace(/[ \t]+\n/g, '\n').trim();
}

export async function extractTextFromPdf(file, { pdfjs, maxBytes = MAX_PDF_BYTES, maxPages = MAX_PDF_PAGES, onProgress } = {}) {
  if (!file || file.size > maxBytes) throw new PdfImportError('PDF_TOO_LARGE');
  const engine = pdfjs ?? await loadBundledPdfJs();
  let document;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    document = await engine.getDocument({ data, useSystemFonts: true }).promise;
  } catch (error) {
    if (error?.name === 'PasswordException') throw new PdfImportError('PDF_PASSWORD', error);
    throw new PdfImportError('PDF_INVALID', error);
  }
  try {
    if (document.numPages > maxPages) throw new PdfImportError('PDF_TOO_MANY_PAGES');
    const pages = [];
    for (let number = 1; number <= document.numPages; number += 1) {
      onProgress?.({ current: number, total: document.numPages });
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push(pageText(content.items));
    }
    const text = pages.filter(Boolean).join('\n\n').trim();
    if (!text) throw new PdfImportError('PDF_SCAN_ONLY');
    return { text, pages: document.numPages };
  } finally {
    await document.destroy?.();
  }
}

export function isPdfFile(file) {
  return file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');
}
