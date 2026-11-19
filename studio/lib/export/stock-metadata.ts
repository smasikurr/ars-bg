/**
 * ARS-BG-PRO: Microstock SEO & 50-Keyword Auto-Generator
 * Compliant with Adobe Stock, Shutterstock, and Freepik contributor upload guidelines.
 */

import type { Doc } from '../engine/types';

export interface StockMetadata {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
}

const BASE_STOCK_KEYWORDS = [
  'abstract',
  'background',
  'gradient',
  'mesh gradient',
  'wallpaper',
  'texture',
  'modern',
  'fluid',
  'smooth',
  'motion background',
  'copyspace',
  'vibrant',
  '4k background',
  'digital art',
  'design element',
  'futuristic',
  'minimalist',
  'creative',
  'backdrop',
  'presentation',
  'graphic design',
  'hero banner',
  'web backdrop',
  'flowing waves',
  'luxurious',
  'aesthetic',
  'soft light',
  'colorful',
  'trendy',
  'looping animation',
];

const STYLE_KEYWORDS: Record<string, string[]> = {
  mesh: ['mesh gradient', 'color blur', 'aurora', 'soft glow', 'diffused light', 'organic shape', 'multi-color', 'ambient'],
  fluid: ['fluid art', 'liquid marble', 'domain warp', 'marbled waves', 'psychedelic', 'viscous fluid', 'swirling colors', 'liquid silk'],
  waves: ['silk ribbon', 'neon waves', 'linear waves', 'flowing lines', 'spectral bands', 'harmonic wave', 'soundwave effect', 'flow field'],
  orbs: ['luminous orbs', 'atmospheric glow', 'floating spheres', 'minimalist bokeh', 'abstract lights', 'cosmic orbs', 'soft bubbles'],
  linear: ['linear gradient', 'prismatic angle', 'clean blend', 'geometric slope', 'subtle gradation', 'modern slide'],
  radial: ['radial glow', 'concentric burst', 'halo light', 'sunburst aura', 'center focus', 'vignette spotlight'],
  conic: ['conic sweep', 'chromatic circle', 'polar coordinates', 'prismatic sweep', 'vinyl reflection', 'angle gradient'],
};

export function generateStockMetadata(doc: Doc, index: number, total: number, filename: string): StockMetadata {
  const styleName = doc.style.charAt(0).toUpperCase() + doc.style.slice(1);
  const colorCount = doc.colors.length;
  
  const title = `Abstract ${styleName} Fluid Gradient Background with Smooth Color Transition and Copy Space #${index + 1}`;
  const description = `High-resolution abstract ${styleName.toLowerCase()} gradient background featuring smooth vibrant color transitions, soft organic curves, and ample copy space for graphic design, web backdrops, branding, and presentations.`;

  const dynamicKeywords = new Set<string>(BASE_STOCK_KEYWORDS);

  // Add style specific keywords
  const specific = STYLE_KEYWORDS[doc.style] || [];
  specific.forEach((k) => dynamicKeywords.add(k));

  // Add color and feature keywords
  if (colorCount >= 4) {
    dynamicKeywords.add('multicolor');
    dynamicKeywords.add('rainbow palette');
  } else {
    dynamicKeywords.add('minimal color');
    dynamicKeywords.add('duotone');
  }

  if (doc.effects.grain > 0.05) {
    dynamicKeywords.add('film grain');
    dynamicKeywords.add('retro texture');
    dynamicKeywords.add('analog aesthetic');
  }

  if (doc.effects.glass > 0.05) {
    dynamicKeywords.add('glassmorphism');
    dynamicKeywords.add('liquid glass');
    dynamicKeywords.add('refraction effect');
  }

  dynamicKeywords.add(`gradient ${index + 1}`);
  dynamicKeywords.add('stock asset');
  dynamicKeywords.add('commercial use');
  dynamicKeywords.add('high resolution');
  dynamicKeywords.add('vector style');

  // Fill up to exactly 50 keywords
  const finalKeywords = Array.from(dynamicKeywords).slice(0, 50);

  return {
    filename,
    title,
    description,
    keywords: finalKeywords,
    category: 'Abstract / Backgrounds',
  };
}

/**
 * Compiles a CSV string formatted for Adobe Stock Contributor CSV Bulk Upload
 */
export function buildAdobeStockCsv(records: StockMetadata[]): string {
  const headers = ['Filename', 'Title', 'Keywords', 'Category'];
  const rows = records.map((r) => {
    const safeFilename = `"${r.filename.replace(/"/g, '""')}"`;
    const safeTitle = `"${r.title.replace(/"/g, '""')}"`;
    const safeKeywords = `"${r.keywords.join(', ').replace(/"/g, '""')}"`;
    const safeCategory = `"${r.category.replace(/"/g, '""')}"`;
    return [safeFilename, safeTitle, safeKeywords, safeCategory].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}
