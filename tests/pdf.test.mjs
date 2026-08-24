import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromPdf, PdfImportError } from '../src/domain/pdf.mjs';
import * as bundledPdfJs from '../vendor/pdf.mjs';

function pdfFile(size = 128) {
  return { name: 'documento.pdf', size, type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(size) };
}

function pdfEngine({ pages = [[{ str: 'Titolo', hasEOL: true }, { str: 'Prima riga' }]], error } = {}) {
  return {
    GlobalWorkerOptions: {},
    getDocument() {
      if (error) return { promise: Promise.reject(error) };
      return { promise: Promise.resolve({
        numPages: pages.length,
        async getPage(number) { return { getTextContent: async () => ({ items: pages[number - 1] }) }; },
        async destroy() {},
      }) };
    },
  };
}

function textPdf(text) {
  const stream = `BT /F1 18 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let source = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(source));
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(source);
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) source += `${String(offset).padStart(10, '0')} 00000 n \n`;
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = Buffer.from(source);
  return { name: 'reale.pdf', size: bytes.length, type: 'application/pdf', arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
}

test('extracts readable text and page count from a local PDF', async () => {
  const result = await extractTextFromPdf(pdfFile(), {
    pdfjs: pdfEngine({ pages: [
      [{ str: 'Titolo', hasEOL: true }, { str: 'Prima riga' }],
      [{ str: 'Seconda pagina' }],
    ] }),
  });

  assert.deepEqual(result, { text: 'Titolo\nPrima riga\n\nSeconda pagina', pages: 2 });
});

test('extracts text with the bundled offline PDF engine', async () => {
  const result = await extractTextFromPdf(textPdf('Ciao PDF locale'), { pdfjs: bundledPdfJs });
  assert.equal(result.text, 'Ciao PDF locale');
  assert.equal(result.pages, 1);
});

test('rejects image-only PDFs without charging a successful import', async () => {
  await assert.rejects(
    extractTextFromPdf(pdfFile(), { pdfjs: pdfEngine({ pages: [[]] }) }),
    (error) => error instanceof PdfImportError && error.code === 'PDF_SCAN_ONLY',
  );
});

test('rejects password-protected PDFs with a specific reason', async () => {
  const passwordError = Object.assign(new Error('Password required'), { name: 'PasswordException' });
  await assert.rejects(
    extractTextFromPdf(pdfFile(), { pdfjs: pdfEngine({ error: passwordError }) }),
    (error) => error instanceof PdfImportError && error.code === 'PDF_PASSWORD',
  );
});

test('limits PDF size and page count before extracting every page', async () => {
  await assert.rejects(
    extractTextFromPdf(pdfFile(15_000_001), { pdfjs: pdfEngine() }),
    (error) => error instanceof PdfImportError && error.code === 'PDF_TOO_LARGE',
  );
  await assert.rejects(
    extractTextFromPdf(pdfFile(), { pdfjs: pdfEngine({ pages: Array.from({ length: 51 }, () => []) }) }),
    (error) => error instanceof PdfImportError && error.code === 'PDF_TOO_MANY_PAGES',
  );
});
