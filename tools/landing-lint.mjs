import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLanding, landingAssetsPath, landingContract } from './generate-landing.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const attr = (node,name) => node.attrs?.find(item=>item.name === name)?.value;
export async function landingLint(file,source,elements) {
  const issues=[];
  const add=(rule,message)=>issues.push({index:0,rule,message});
  try {
    const html=elements.find(node=>node.tagName === 'html');
    if (!Object.values(landingContract.routing).includes(attr(html,'data-gfu-profile'))) throw new Error('Explicit LP profile required. Regenerate from audience; never fallback to workspace.');
    const config=elements.filter(node=>attr(node,'id') === 'landing-config');
    if (config.length !== 1 || attr(config[0],'type') !== 'application/json') throw new Error('One landing-config JSON block required');
    const spec=JSON.parse(config[0].childNodes.map(node=>node.value || '').join(''));
    const styles=elements.filter(node=>node.tagName === 'link' && attr(node,'rel') === 'stylesheet');
    if (styles.length !== 1 || !attr(styles[0],'href')?.endsWith('/landing.css')) throw new Error('Exactly one landing.css stylesheet required');
    const assets=landingAssetsPath(attr(styles[0],'href').slice(0,-'/landing.css'.length));
    if (source.replaceAll('\r\n','\n') !== await generateLanding(spec,assets)) throw new Error('Generated LP drift: DOM, classes, ordering, CTA, styles, scripts and config must match the canonical generator');
    for (const [name,canonical] of [['landing.css','src/landing.css'],['landing.js','src/landing.js'],['fonts/Roboto.ttf','assets/fonts/Roboto.ttf'],['fonts/NotoSansJP.ttf','assets/fonts/NotoSansJP.ttf']]) {
      const actual=await readFile(resolve(dirname(file),assets,name));
      const expected=await readFile(resolve(root,canonical));
      if (!actual.equals(expected)) add('GFU032',`LP asset override: ${name}; distribute the unmodified library`);
    }
    for (const image of elements.filter(node=>node.tagName === 'img')) {
      const data=await readFile(resolve(dirname(file),attr(image,'src')));
      if (!data.length) add('GFU033','LP media is empty');
    }
  } catch (error) { add('GFU030',error.code ? `LP asset unavailable: ${error.code}` : error.message); }
  return issues;
}
