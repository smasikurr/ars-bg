/**
 * ARS-BG-PRO: Vector Seamless Pattern Generator Engine
 * 
 * Features:
 * 1. Mathematically pure W3C SVG 2.0 repeating patterns (<pattern> tags).
 * 2. Curated geometric vector patterns (dots, stripes, crosshatch, waves, chevron, houndstooth, etc.).
 * 3. Custom SVG file upload with automatic tiling and viewbox normalization.
 * 4. Microstock 300 DPI High-Resolution PNG & Pure Vector SVG export.
 */

import { downloadBlob } from "@/lib/utils"
import { injectPngDpi } from "@/lib/export/dpi"

export interface PatternPreset {
  id: string
  name: string
  description: string
  defaultTileSize: number
  defaultStrokeWidth: number
  renderTile: (size: number, strokeWidth: number, color: string) => string
}

export const PATTERN_PRESETS: PatternPreset[] = [
  {
    id: "dots",
    name: "Polka Dots",
    description: "Evenly spaced circular dot matrix grid",
    defaultTileSize: 24,
    defaultStrokeWidth: 2,
    renderTile: (s, sw, c) => {
      const r = Math.max(1, (sw * s) / 24)
      return `<circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="${c}" />`
    },
  },
  {
    id: "dots-staggered",
    name: "Staggered Dots",
    description: "Offset halftone dot array",
    defaultTileSize: 32,
    defaultStrokeWidth: 2.5,
    renderTile: (s, sw, c) => {
      const r = Math.max(1, (sw * s) / 32)
      return `
        <circle cx="0" cy="0" r="${r}" fill="${c}" />
        <circle cx="${s}" cy="0" r="${r}" fill="${c}" />
        <circle cx="0" cy="${s}" r="${r}" fill="${c}" />
        <circle cx="${s}" cy="${s}" r="${r}" fill="${c}" />
        <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="${c}" />
      `
    },
  },
  {
    id: "diagonal-stripes",
    name: "Diagonal Stripes",
    description: "Clean 45-degree angled vector bands",
    defaultTileSize: 20,
    defaultStrokeWidth: 3,
    renderTile: (s, sw, c) => `
      <path d="M-1,1 l2,-2 M0,${s} l${s},-${s} M${s - 1},${s + 1} l2,-2" stroke="${c}" stroke-width="${sw}" stroke-linecap="square" />
    `,
  },
  {
    id: "horizontal-stripes",
    name: "Horizontal Stripes",
    description: "Precision horizontal parallel line bars",
    defaultTileSize: 16,
    defaultStrokeWidth: 2,
    renderTile: (s, sw, c) => `
      <line x1="0" y1="${s / 2}" x2="${s}" y2="${s / 2}" stroke="${c}" stroke-width="${sw}" />
    `,
  },
  {
    id: "vertical-stripes",
    name: "Vertical Pinstripes",
    description: "Architectural vertical pinstripes",
    defaultTileSize: 16,
    defaultStrokeWidth: 2,
    renderTile: (s, sw, c) => `
      <line x1="${s / 2}" y1="0" x2="${s / 2}" y2="${s}" stroke="${c}" stroke-width="${sw}" />
    `,
  },
  {
    id: "crosshatch",
    name: "Crosshatch Mesh",
    description: "Woven fine diamond crosshatch lines",
    defaultTileSize: 20,
    defaultStrokeWidth: 1.5,
    renderTile: (s, sw, c) => `
      <path d="M0 0 L${s} ${s} M${s} 0 L0 ${s}" stroke="${c}" stroke-width="${sw}" />
    `,
  },
  {
    id: "grid",
    name: "Blueprint Grid",
    description: "Orthogonal coordinate graph grid",
    defaultTileSize: 24,
    defaultStrokeWidth: 1,
    renderTile: (s, sw, c) => `
      <path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${c}" stroke-width="${sw}" />
    `,
  },
  {
    id: "concentric-circles",
    name: "Concentric Circles",
    description: "Target ripple geometric circles",
    defaultTileSize: 36,
    defaultStrokeWidth: 1.5,
    renderTile: (s, sw, c) => `
      <circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.45}" fill="none" stroke="${c}" stroke-width="${sw}" />
      <circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.25}" fill="none" stroke="${c}" stroke-width="${sw}" />
    `,
  },
  {
    id: "waves",
    name: "Harmonic Waves",
    description: "Flowing sine curves pattern",
    defaultTileSize: 32,
    defaultStrokeWidth: 2,
    renderTile: (s, sw, c) => `
      <path d="M 0 ${s / 2} Q ${s / 4} 0, ${s / 2} ${s / 2} T ${s} ${s / 2}" fill="none" stroke="${c}" stroke-width="${sw}" />
    `,
  },
  {
    id: "chevron",
    name: "Chevron Herringbone",
    description: "Nordic zigzag vector herringbone",
    defaultTileSize: 24,
    defaultStrokeWidth: 2,
    renderTile: (s, sw, c) => `
      <path d="M0 ${s * 0.75} L${s / 2} ${s * 0.25} L${s} ${s * 0.75}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" />
    `,
  },
  {
    id: "hexagons",
    name: "Honeycomb Hexagons",
    description: "Tessellated geometric honeycomb mesh",
    defaultTileSize: 28,
    defaultStrokeWidth: 1.5,
    renderTile: (s, sw, c) => {
      const h = s * 0.866
      return `
        <polygon points="${s * 0.5},0 ${s},${h * 0.25} ${s},${h * 0.75} ${s * 0.5},${h} 0,${h * 0.75} 0,${h * 0.25}" fill="none" stroke="${c}" stroke-width="${sw}" />
      `
    },
  },
  {
    id: "houndstooth",
    name: "Houndstooth",
    description: "Classic textile tessellation",
    defaultTileSize: 32,
    defaultStrokeWidth: 2,
    renderTile: (s, sw, c) => `
      <polygon points="0,0 ${s * 0.5},0 0,${s * 0.5}" fill="${c}" />
      <polygon points="${s * 0.5},${s * 0.5} ${s},${s * 0.5} ${s * 0.5},${s}" fill="${c}" />
      <rect x="${s * 0.5}" y="0" width="${s * 0.5}" height="${s * 0.5}" fill="${c}" />
      <path d="M0 ${s * 0.5} L${s * 0.5} 0 M${s * 0.5} ${s} L${s} ${s * 0.5}" stroke="${c}" stroke-width="${sw}" />
    `,
  },
]

export interface PatternState {
  preset: string
  tileSize: number
  strokeWidth: number
  color: string
  backgroundColor: string
  transparentBg: boolean
  rotation: number
  opacity: number
  customSvgMarkup?: string
}

export const DEFAULT_PATTERN_STATE: PatternState = {
  preset: "dots",
  tileSize: 24,
  strokeWidth: 2,
  color: "#295EFF",
  backgroundColor: "#08080C",
  transparentBg: false,
  rotation: 0,
  opacity: 1,
}

/**
 * Builds pure W3C SVG 2.0 XML string with <pattern> fill
 */
export function buildPatternSVG(
  config: PatternState,
  width: number,
  height: number
): string {
  const {
    preset,
    tileSize,
    strokeWidth,
    color,
    backgroundColor,
    transparentBg,
    rotation,
    opacity,
    customSvgMarkup,
  } = config

  const patternId = `ars-pattern-${preset}-${Math.round(tileSize)}`

  let tileContent = ""
  if (preset === "custom" && customSvgMarkup) {
    // Inject custom SVG tile
    tileContent = `
      <g transform="scale(${tileSize / 100})">
        ${customSvgMarkup}
      </g>
    `
  } else {
    const found = PATTERN_PRESETS.find((p) => p.id === preset) || PATTERN_PRESETS[0]
    tileContent = found.renderTile(tileSize, strokeWidth, color)
  }

  const bgRect = transparentBg
    ? ""
    : `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`

  const rotTransform = rotation !== 0 ? `patternTransform="rotate(${rotation})"` : ""

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <pattern id="${patternId}" width="${tileSize}" height="${tileSize}" patternUnits="userSpaceOnUse" ${rotTransform}>
      ${tileContent}
    </pattern>
  </defs>
  ${bgRect}
  <rect width="${width}" height="${height}" fill="url(#${patternId})" opacity="${opacity}" />
</svg>`.trim()
}

/**
 * Downloads Pure Vector SVG
 */
export function downloadPatternSVG(
  config: PatternState,
  width: number,
  height: number
) {
  const svg = buildPatternSVG(config, width, height)
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  downloadBlob(blob, `ars-pattern-${config.preset}-${width}x${height}.svg`)
}

/**
 * Downloads 300 DPI High-Resolution PNG
 */
export async function downloadPatternPNG(
  config: PatternState,
  width: number,
  height: number
): Promise<void> {
  const svg = buildPatternSVG(config, width, height)
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = async () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context unavailable"))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode PNG"))
          return
        }
        const arrayBuf = await blob.arrayBuffer()
        const with300Dpi = injectPngDpi(new Uint8Array(arrayBuf), 300)
        const finalBlob = new Blob([with300Dpi as any], { type: "image/png" })
        downloadBlob(finalBlob, `ars-pattern-${config.preset}-${width}x${height}-300dpi.png`)
        resolve()
      }, "image/png")
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load SVG for rasterization"))
    }
    img.src = url
  })
}
