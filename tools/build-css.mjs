import { createRequire } from 'node:module';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { compile } = require('tailwindcss');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'src', 'gforce.css');
const outputPath = join(root, 'assets', 'gforce.css');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function extractCandidates(content) {
  const candidates = new Set();
  const patterns = [
    /class\s*=\s*["']([^"']+)["']/g,
    /className\s*=\s*["']([^"']+)["']/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) {
      match[1].split(/\s+/).filter(Boolean).forEach((candidate) => candidates.add(candidate));
    }
  }
  return candidates;
}

const source = await readFile(sourcePath, 'utf8');
const files = (await walk(root)).filter((file) => ['.html', '.js', '.md'].includes(extname(file)) && !file.includes('node_modules'));
const candidates = new Set();
for (const file of files) {
  const content = await readFile(file, 'utf8');
  extractCandidates(content).forEach((candidate) => candidates.add(candidate));
}

// Classes added dynamically or used in generated snippets.
[
  'hidden', 'block', 'inline-flex', 'grid', 'flex', 'items-center', 'items-start',
  'justify-between', 'justify-center', 'flex-1', 'shrink-0', 'w-full', 'text-left',
  'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'mt-1', 'mt-2', 'mt-3',
  'mt-4', 'mt-6', 'mt-8', 'mb-3', 'mb-4', 'p-5', 'md:hidden', 'sm:grid-cols-2',
  'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:col-span-2'
].forEach((candidate) => candidates.add(candidate));

const compiler = await compile(source, { from: sourcePath });
const css = compiler.build([...candidates].sort());
await writeFile(outputPath, css, 'utf8');
console.log(`Built ${outputPath}`);
console.log(`Scanned ${files.length} files; supplied ${candidates.size} class candidates.`);
