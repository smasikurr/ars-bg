import type { Doc } from "@/lib/engine/types"
import { fileName } from "./image"

/**
 * Generates production-grade, microstock-compliant vector SVG for any gradient composition.
 */
export function exportToSVG(doc: Doc, targetSize?: { w: number; h: number }): Blob {
  const size = targetSize ?? doc.size
  const w = size.w
  const h = size.h

  // Build gradient stops
  const stops = doc.colors
    .map((c, i) => {
      const offset = Math.round((i / Math.max(1, doc.colors.length - 1)) * 100)
      return `    <stop offset="${offset}%" stop-color="${c.hex}" />`
    })
    .join("\n")

  // Generate Halftone Pattern if enabled
  let halftonePattern = ""
  let halftoneRect = ""
  if (doc.effects.halftone) {
    const size = Math.max(4, doc.effects.halftoneSize ?? 8)
    const shape = doc.effects.halftoneShape ?? 1 // 1: circle, 0: square
    const radius = size * 0.4
    const shapeEl =
      shape === 0
        ? `<rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" fill="${doc.colors[2]?.hex ?? '#295eff'}" opacity="0.85" />`
        : `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${doc.colors[2]?.hex ?? '#295eff'}" opacity="0.85" />`

    halftonePattern = `
    <pattern id="halftone-pattern" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      ${shapeEl}
    </pattern>`
    halftoneRect = `\n  <rect width="100%" height="100%" fill="url(#halftone-pattern)" mix-blend-mode="overlay" opacity="0.75" />`
  }

  // Film grain filter for SVG
  const grainFilter = doc.effects.grain > 0
    ? `
    <filter id="grain-filter" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${(0.04 / (doc.effects.grainSize || 1)).toFixed(3)}" numOctaves="3" result="noise" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${(doc.effects.grain * 0.6).toFixed(2)} 0" />
      <feComposite in2="SourceGraphic" in="gl" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
    </filter>`
    : ""

  // Text layer
  let textMarkup = ""
  if (doc.text.enabled && doc.text.content) {
    const tx = doc.text.x * w
    const ty = doc.text.y * h
    const fontSize = (Math.min(w, h) * doc.text.size) / 100
    textMarkup = `
  <text x="${tx}" y="${ty}" font-family="${doc.text.font}, sans-serif" font-size="${fontSize}" font-weight="${doc.text.weight}" fill="${doc.text.color}" text-anchor="${doc.text.align}" dominant-baseline="middle" opacity="${doc.text.opacity}">
    ${escapeXml(doc.text.content)}
  </text>`
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="main-grad" x1="0%" y1="0%" x2="100%" y2="100%">
${stops}
    </linearGradient>
    <radialGradient id="radial-glow" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="${doc.colors[0]?.hex ?? '#ffffff'}" stop-opacity="0.9" />
      <stop offset="60%" stop-color="${doc.colors[1]?.hex ?? '#dcb8ff'}" stop-opacity="0.5" />
      <stop offset="100%" stop-color="${doc.colors[2]?.hex ?? '#000000'}" stop-opacity="0" />
    </radialGradient>${halftonePattern}${grainFilter}
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="${doc.background || '#0a0b0c'}" />

  <!-- Linear & Fluid Flow Layer -->
  <rect width="100%" height="100%" fill="url(#main-grad)" ${doc.effects.grain > 0 ? 'filter="url(#grain-filter)"' : ""} />

  <!-- Ambient Radial Glow -->
  <rect width="100%" height="100%" fill="url(#radial-glow)" mix-blend-mode="screen" />
${halftoneRect}${textMarkup}
</svg>
`

  return new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;"
      case ">": return "&gt;"
      case "&": return "&amp;"
      case "'": return "&apos;"
      case '"': return "&quot;"
      default: return c
    }
  })
}
