// Rasterize the same approved vector used in the app with `npm run icons:generate`.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/components/SwiftWakalaMark.jsx'), 'utf8');
const wings = [...source.matchAll(/'(M[^']+)'/g)].map(match => `<path d="${match[1]}"/>`).join('');
if (wings.length === 0) throw new Error('Swift mark paths are missing');

async function icon(filename, size, background) {
  // The adaptive foreground stays inside Android's central 66/108 safe circle.
  const x = (1024 - size) / 2;
  const y = (1024 - size * .8) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${background ? '<rect width="1024" height="1024" fill="#FFFFFF"/>' : ''}<g fill="#16191D" transform="translate(${x} ${y}) scale(${size / 100})">${wings}</g></svg>`;
  const rendered = sharp(Buffer.from(svg));
  if (background) rendered.removeAlpha();
  await rendered.png().toFile(path.join(root, 'assets/images', filename));
}
Promise.all([
  icon('swift-wakala-icon.png', 600, true),
  icon('swift-wakala-adaptive.png', 440, false),
]).catch(error => { console.error(error); process.exitCode = 1; });
