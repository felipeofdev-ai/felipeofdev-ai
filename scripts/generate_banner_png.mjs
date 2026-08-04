#!/usr/bin/env node
/** Generate banner-professional.png from SVG for GitHub profile README. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'assets', 'banner-professional.svg');
const outPath = join(root, 'assets', 'banner-professional.png');

const svg = readFileSync(svgPath, 'utf8');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    loadSystemFonts: true,
    defaultFontFamily: 'Consolas',
  },
});
const png = resvg.render().asPng();
writeFileSync(outPath, png);
console.log(`Wrote ${outPath} (${png.length} bytes)`);
