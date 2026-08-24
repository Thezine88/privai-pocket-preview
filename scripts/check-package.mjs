import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.mjs', '.svg', '.txt', '.xml']);
const RULES = [
  { rule: 'credential:sk-', pattern: /\bsk-[A-Za-z0-9_-]{6,}/ },
  { rule: 'credential:gsk_', pattern: /\bgsk_[A-Za-z0-9_-]{4,}/ },
  { rule: 'credential:AIza', pattern: /\bAIza[A-Za-z0-9_-]{8,}/ },
  { rule: 'remote-server-url', pattern: /"server"\s*:\s*\{[^}]*"url"\s*:/s },
];

async function listFiles(root) {
  const results = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) results.push(...await listFiles(path));
    else if (TEXT_EXTENSIONS.has(extname(entry.name))) results.push(path);
  }
  return results;
}

export async function checkPackageSafety(root) {
  const findings = [];
  for (const file of await listFiles(root)) {
    const content = await readFile(file, 'utf8');
    for (const { rule, pattern } of RULES) if (pattern.test(content)) findings.push({ file, rule });
  }
  return findings;
}
