import fs from 'node:fs';
import path from 'node:path';

function rgbToHex(r, g, b) {
  const toH = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

function extractColors(str, base) {
  const colors = new Set();
  if (base && base.startsWith('#') && base.length >= 7) {
    colors.add(base.slice(0, 7).toLowerCase());
  }
  
  // Match #hex
  const hexMatches = str.match(/#[0-9a-fA-F]{6}/g);
  if (hexMatches) {
    hexMatches.forEach((h) => colors.add(h.toLowerCase()));
  }

  // Match rgb(r, g, b) or rgba(r, g, b, a)
  const rgbRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d\.]+)?\s*\)/g;
  let match;
  while ((match = rgbRegex.exec(str)) !== null) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    // Ignore pure black transparent
    if (r === 0 && g === 0 && b === 0) continue;
    // Ignore pure white
    if (r === 255 && g === 255 && b === 255 && colors.size > 2) continue;
    colors.add(rgbToHex(r, g, b));
  }

  const result = Array.from(colors);
  // Ensure between 3 and 6 colors
  if (result.length < 3) {
    result.push('#1e1b4b', '#3b82f6', '#06b6d4');
  }
  return result.slice(0, 6);
}

function main() {
  const auraPath = 'C:/MY-TOOLS/ARS-BG-PRO/reference-aura/lib/gradients.ts';
  const raw = fs.readFileSync(auraPath, 'utf8');

  // Extract each object block
  const blockRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*category:\s*"([^"]+)",[\s\S]*?layers:\s*\[([\s\S]*?)\]\s*,?\s*\}?,?\s*(?=\{|\/\/|\/\*|\];)/g;

  const presets = [];
  let m;

  const styleMap = {
    aura: 'mesh',
    mesh: 'mesh',
    nebula: 'orbs',
    prism: 'conic',
    lattice: 'waves',
    grain: 'fluid',
    glass: 'waves',
    flux: 'fluid',
  };

  while ((m = blockRegex.exec(raw)) !== null) {
    const id = m[1];
    const name = m[2];
    const category = m[3];
    const fullBlock = m[0];
    
    // Extract base
    const baseMatch = fullBlock.match(/base:\s*"([^"]+)"/);
    const base = baseMatch ? baseMatch[1] : '#0a0a0a';

    const colors = extractColors(fullBlock, base);
    const style = styleMap[category] || 'mesh';

    // Generate balanced point locations for mesh
    const points = colors.map((_, i) => {
      const angle = (i / colors.length) * Math.PI * 2 + 0.3;
      const rad = 0.28 + (i % 2 === 0 ? 0.08 : -0.06);
      return [
        Number((0.5 + Math.cos(angle) * rad).toFixed(2)),
        Number((0.5 + Math.sin(angle) * rad).toFixed(2)),
      ];
    });

    presets.push({
      id: `aura_${id}`,
      name,
      category,
      style,
      colors,
      points: style === 'mesh' ? points : undefined,
      params: style === 'mesh' ? { sharpness: 2.6, warp: 0.3, turbulence: 1.4 } :
              style === 'fluid' ? { scale: 1.1, warp: 2.2, detail: 4, contrast: 1.3 } :
              style === 'waves' ? { frequency: 1.3, amplitude: 0.8, bands: 1.1, angle: 25 } :
              style === 'orbs' ? { size: 0.8, blur: 0.75, variance: 0.45 } :
              { twist: 0.7, warp: 0.15, turbulence: 1.4 },
      effects: { grain: 0.08 },
      seed: Number((Math.random() * 0.9 + 0.05).toFixed(3)),
    });
  }

  console.log(`Parsed ${presets.length} presets from Aura!`);

  const outPath = 'C:/MY-TOOLS/ARS-BG-PRO/studio/lib/mega-presets.ts';
  const fileContent = `/**
 * ARS-BG-PRO Mega Presets Library (${presets.length}+ Curated Atmospheric Presets)
 * Extracted from CristianOlivera1/Aura and enhanced with WebGL OKLab shader parameters.
 */

import type { DocSeed } from './doc';

export interface MegaPreset extends DocSeed {
  id: string;
  name: string;
  category: string;
}

export const MEGA_PRESETS: MegaPreset[] = ${JSON.stringify(presets, null, 2)};
`;

  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log(`Wrote ${outPath} successfully!`);
}

main();
