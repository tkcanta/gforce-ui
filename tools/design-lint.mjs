import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(process.cwd());
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['examples'];
const files = [];

async function collect(path) {
  const absolute = resolve(root, path);
  const info = await stat(absolute);
  if (info.isDirectory()) {
    for (const entry of await readdir(absolute)) await collect(join(path, entry));
  } else if (extname(absolute).toLowerCase() === '.html') {
    files.push(absolute);
  }
}

for (const target of targets) await collect(target);

const failures = [];
const add = (file, source, index, rule, message) => {
  const line = source.slice(0, index).split('\n').length;
  failures.push({ file: file.replace(`${root}/`, ''), line, rule, message });
};

const forbiddenClassRules = [
  ['GFU001', /(?:^|\s)(?:bg|text|border|ring|fill|stroke)-\[#?[0-9a-fA-F]/g, 'Raw color / arbitrary color classは禁止'],
  ['GFU002', /(?:^|\s)(?:font-bold|font-extrabold|font-black)(?:\s|$)/g, 'UIで700以上のFont weightは禁止'],
  ['GFU003', /(?:^|\s)shadow-(?:lg|xl|2xl)(?:\s|$)/g, '大きいTailwind shadowは禁止'],
  ['GFU004', /(?:^|\s)rounded-(?:2xl|3xl|\[[^\]]+\])(?:\s|$)/g, '任意または過大なRadiusは禁止'],
  ['GFU005', /(?:^|\s)(?:bg-gradient[^\s]*|from-[^\s]+|via-[^\s]+|to-[^\s]+)(?:\s|$)/g, 'Skeleton以外のGradient utilityは禁止'],
  ['GFU006', /(?:^|\s)backdrop-blur[^\s]*(?:\s|$)/g, 'Glassmorphismは禁止'],
  ['GFU007', /(?:^|\s)(?:animate-bounce|animate-ping)(?:\s|$)/g, '装飾Loop animationは禁止'],
  ['GFU008', /(?:^|\s)(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-\[[^\]]+\](?:\s|$)/g, 'Arbitrary spacingは禁止']
];

for (const file of files) {
  const source = await readFile(file, 'utf8');

  // Markup-level forbidden patterns.
  for (const match of source.matchAll(/\sstyle\s*=\s*["']/gi)) add(file, source, match.index, 'GFU009', 'Product HTMLのinline styleは禁止');
  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\s*\(|hsla?\s*\(/g)) add(file, source, match.index, 'GFU010', 'Product HTMLのRaw colorは禁止');
  for (const match of source.matchAll(/\sonclick\s*=|role\s*=\s*["']button["']/gi)) add(file, source, match.index, 'GFU011', 'Native buttonを使う。onclick属性またはrole=buttonは禁止');

  // Class-specific checks.
  for (const classMatch of source.matchAll(/class\s*=\s*["']([^"']*)["']/gi)) {
    const classText = ` ${classMatch[1]} `;
    for (const [rule, pattern, message] of forbiddenClassRules) {
      pattern.lastIndex = 0;
      if (pattern.test(classText)) add(file, source, classMatch.index, rule, message);
    }
  }

  // Floating surfaces own their visibility and motion; utility overrides bypass that contract.
  for (const tag of source.matchAll(/<[a-z][a-z0-9-]*\b[^>]*>/gi)) {
    const classes = tag[0].match(/\sclass\s*=\s*["']([^"']*)["']/i)?.[1].split(/\s+/) || [];
    if (!classes.some((name) => ['gfu-menu', 'gfu-popover'].includes(name))) continue;
    if (classes.some((name) => /(?:^|:)!?hidden!?$/.test(name))) {
      add(file, source, tag.index, 'GFU018', 'Menu/Popoverのhiddenクラスは禁止。data-openとライブラリの開閉処理を使う');
    }
    if (classes.some((name) => !name.includes('motion-reduce:') && /(?:^|:)!?(?:transition-none|animate-none|duration-0)!?$/.test(name))) {
      add(file, source, tag.index, 'GFU019', 'Menu/Popoverの標準motionを無効化しない。軽減はprefers-reduced-motionで行う');
    }
  }

  // All buttons must declare type.
  for (const buttonMatch of source.matchAll(/<button\b([^>]*)>/gi)) {
    const attrs = buttonMatch[1];
    if (!/\btype\s*=\s*["'](?:button|submit|reset)["']/i.test(attrs)) {
      add(file, source, buttonMatch.index, 'GFU012', '<button>にはtype属性が必須');
    }
    if (/class\s*=\s*["'][^"']*\bgfu-icon-button\b/i.test(attrs) && !/\baria-label\s*=\s*["'][^"']+["']/i.test(attrs)) {
      add(file, source, buttonMatch.index, 'GFU013', 'gfu-icon-buttonにはaria-labelが必須');
    }
  }

  // Images require alt. Empty alt is allowed for decorative images.
  for (const imageMatch of source.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(imageMatch[1])) add(file, source, imageMatch.index, 'GFU014', '<img>にはalt属性が必須');
  }

  // Action groups allow one Filled primary.
  for (const groupMatch of source.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*data-gfu-action-group[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const filledCount = [...groupMatch[2].matchAll(/data-variant\s*=\s*["']filled["']/gi)].length;
    if (filledCount > 1) add(file, source, groupMatch.index, 'GFU015', `Action Group内のFilled Buttonは1個まで。検出: ${filledCount}`);
    const dangerCount = [...groupMatch[2].matchAll(/data-variant\s*=\s*["']danger["']/gi)].length;
    if (filledCount > 0 && dangerCount > 0) add(file, source, groupMatch.index, 'GFU016', '同一Action GroupへFilledとDanger Filledを併置しない');
  }

  // Search fields need a programmatic name.
  for (const searchMatch of source.matchAll(/<label\b[^>]*class\s*=\s*["'][^"']*\bgfu-search\b[^"']*["'][^>]*>([\s\S]*?)<\/label>/gi)) {
    const content = searchMatch[1];
    if (!/(gfu-visually-hidden|aria-label\s*=)/i.test(content)) add(file, source, searchMatch.index, 'GFU017', 'Searchには視覚非表示Labelまたはaria-labelが必須');
  }
}

if (failures.length) {
  console.error(`G-Force design lint failed: ${failures.length} issue(s)\n`);
  for (const failure of failures) console.error(`${failure.file}:${failure.line} ${failure.rule} ${failure.message}`);
  process.exit(1);
}

console.log(`G-Force design lint passed: ${files.length} HTML file(s), 0 issue(s).`);
