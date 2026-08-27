import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES = ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js', 'assets', 'src', 'vendor'];

export async function buildWeb({ sourceRoot, outputRoot }) {
  const source = resolve(sourceRoot);
  const output = resolve(outputRoot);
  // Il confronto con `${source}/` falliva sempre su Windows: resolve()
  // produce backslash, non barra diritta. path.relative() è il modo
  // indipendente dalla piattaforma per verificare il contenimento.
  const rel = relative(source, output);
  const isInside = rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
  if (output === source || !isInside) throw new Error('La cartella di build deve trovarsi dentro il progetto');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const name of FILES) await cp(resolve(source, name), resolve(output, name), { recursive: true });
}

const invokedPath = process.argv[1] && resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  await buildWeb({ sourceRoot, outputRoot: resolve(sourceRoot, 'www') });
}
