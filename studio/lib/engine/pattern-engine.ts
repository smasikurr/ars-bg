/**
 * ARS-BG-PRO: Vector Seamless Pattern Generator Engine (8K UHD Quality)
 * 
 * Features:
 * 1. 420+ Curated Open-Source SVG Patterns (Pattern Monster + Hero Patterns)
 * 2. Infinite Procedural Mathematical Pattern Generator (Truchet, Guilloche, Topographic, Islamic, Japanese, etc.)
 * 3. 8K Ultra HD (7680x4320) & 8K Square (8000x8000) pure vector resolution output
 * 4. Dual-tone color palette, rotation, scale, stroke-weight & join controls
 * 5. Microstock 300 DPI high-resolution PNG & pure W3C SVG 2.0 export
 */

import { downloadBlob, getExportTimestamp } from "@/lib/utils"
import { injectPngDpi } from "@/lib/export/dpi"
import CURATED_PATTERNS_DATA from "./curated-patterns.json"

export interface CuratedPattern {
  id: string
  title: string
  category: string
  tags: string[]
  mode: "stroke" | "fill" | "stroke-join"
  width: number
  height: number
  vHeight: number
  maxStroke: number
  paths: string[]
  source: "pattern-monster" | "hero-patterns" | "procedural"
}

export type ResolutionId = "8k-uhd" | "8k-square" | "4k-uhd" | "1080p" | "artboard"

export interface ResolutionPreset {
  id: ResolutionId
  label: string
  w: number
  h: number
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: "8k-uhd", label: "8K UHD (7680 × 4320)", w: 7680, h: 4320 },
  { id: "8k-square", label: "8K Square (8000 × 8000)", w: 8000, h: 8000 },
  { id: "4k-uhd", label: "4K UHD (3840 × 2160)", w: 3840, h: 2160 },
  { id: "1080p", label: "Full HD (1920 × 1080)", w: 1920, h: 1080 },
  { id: "artboard", label: "Current Artboard Size", w: 0, h: 0 },
]

export interface PatternState {
  preset: string
  category: string
  tileSize: number
  strokeWidth: number
  color: string
  secondaryColor: string
  backgroundColor: string
  transparentBg: boolean
  rotation: number
  opacity: number
  seed: number
  strokeJoin: "round" | "square" | "miter"
  resolution: ResolutionId
  customSvgMarkup?: string
}

export const DEFAULT_PATTERN_STATE: PatternState = {
  preset: "pm-waves-1",
  category: "all",
  tileSize: 48,
  strokeWidth: 2,
  color: "#295EFF",
  secondaryColor: "#00F0FF",
  backgroundColor: "#08080C",
  transparentBg: false,
  rotation: 0,
  opacity: 1,
  seed: 42,
  strokeJoin: "round",
  resolution: "8k-uhd",
}

// -------------------------------------------------------------
// Pseudo-Random Number Generator for Procedural Patterns
// -------------------------------------------------------------
function makePRNG(seed: number) {
  let s = Math.abs(Math.floor(seed)) % 2147483647
  if (s <= 0) s = 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// -------------------------------------------------------------
// 12 Procedural Algorithmic Pattern Generators (Infinite Seeds)
// -------------------------------------------------------------

/**
 * 1. Truchet Labyrinth (Smith Tilings)
 */
function renderProceduralTruchet(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  seed: number,
  join: string
): string {
  const rand = makePRNG(seed)
  const n = 6
  const s = size / n
  let paths = ""
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = c * s
      const y = r * s
      const flip = rand() > 0.5
      const useAccent = rand() > 0.65
      const col = useAccent ? secColor : color
      if (flip) {
        paths += `<path d="M ${x} ${y + s / 2} A ${s / 2} ${s / 2} 0 0 0 ${x + s / 2} ${y} M ${x + s} ${y + s / 2} A ${s / 2} ${s / 2} 0 0 0 ${x + s / 2} ${y + s}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="${join}" stroke-linejoin="${join}" />`
      } else {
        paths += `<path d="M ${x + s / 2} ${y} A ${s / 2} ${s / 2} 0 0 0 ${x + s} ${y + s / 2} M ${x} ${y + s / 2} A ${s / 2} ${s / 2} 0 0 0 ${x + s / 2} ${y + s}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="${join}" stroke-linejoin="${join}" />`
      }
    }
  }
  return paths
}

/**
 * 2. Banknote Guilloche Spire Rosette
 */
function renderProceduralGuilloche(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  seed: number,
  join: string
): string {
  const rand = makePRNG(seed)
  const cx = size / 2
  const cy = size / 2
  const lobes = 4 + Math.floor(rand() * 8) * 2 // 4, 6, 8, 12, 16 lobes
  const rBase = size * 0.38
  const amp = size * (0.05 + rand() * 0.1)

  let path1 = ""
  let path2 = ""
  const steps = 180

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2
    const r1 = rBase + amp * Math.cos(lobes * theta)
    const x1 = cx + r1 * Math.cos(theta)
    const y1 = cy + r1 * Math.sin(theta)
    path1 += (i === 0 ? "M " : "L ") + `${x1.toFixed(2)} ${y1.toFixed(2)} `

    const r2 = rBase * 0.65 + (amp * 0.7) * Math.sin(lobes * theta)
    const x2 = cx + r2 * Math.cos(theta)
    const y2 = cy + r2 * Math.sin(theta)
    path2 += (i === 0 ? "M " : "L ") + `${x2.toFixed(2)} ${y2.toFixed(2)} `
  }

  // Cross quadrant repeats for seamless edges
  const edgeRings = `
    <circle cx="0" cy="0" r="${size * 0.25}" fill="none" stroke="${secColor}" stroke-width="${sw * 0.8}" />
    <circle cx="${size}" cy="0" r="${size * 0.25}" fill="none" stroke="${secColor}" stroke-width="${sw * 0.8}" />
    <circle cx="0" cy="${size}" r="${size * 0.25}" fill="none" stroke="${secColor}" stroke-width="${sw * 0.8}" />
    <circle cx="${size}" cy="${size}" r="${size * 0.25}" fill="none" stroke="${secColor}" stroke-width="${sw * 0.8}" />
  `

  return `
    ${edgeRings}
    <path d="${path1} Z" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${join}" stroke-linejoin="${join}" />
    <path d="${path2} Z" fill="none" stroke="${secColor}" stroke-width="${sw * 0.85}" stroke-linecap="${join}" stroke-linejoin="${join}" />
  `
}

/**
 * 3. Topographic Elevation Contour Isolines
 */
function renderProceduralTopographic(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  seed: number,
  join: string
): string {
  const rand = makePRNG(seed)
  const freq = 1 + Math.floor(rand() * 2)
  const lines = 7
  let output = ""

  for (let i = 0; i < lines; i++) {
    const t = i / lines
    const yMid = size * t
    const amp = (size * 0.08) * (1 + 0.4 * Math.sin(i + seed))
    const col = i % 2 === 0 ? color : secColor
    const w = i % 3 === 0 ? sw * 1.4 : sw

    let d = `M 0 ${(yMid + amp * Math.sin(0)).toFixed(2)} `
    const segments = 24
    for (let s = 1; s <= segments; s++) {
      const x = (s / segments) * size
      const y = yMid + amp * Math.sin((x / size) * Math.PI * 2 * freq + i * 0.8)
      d += `L ${x.toFixed(2)} ${y.toFixed(2)} `
    }
    output += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="${join}" stroke-linejoin="${join}" />`
  }

  // Cross contour wave
  let dCross = `M 0 ${(size * 0.5).toFixed(2)} `
  for (let s = 1; s <= 24; s++) {
    const x = (s / 24) * size
    const y = size * 0.5 + (size * 0.15) * Math.cos((x / size) * Math.PI * 2 * freq)
    dCross += `L ${x.toFixed(2)} ${y.toFixed(2)} `
  }
  output += `<path d="${dCross}" fill="none" stroke="${secColor}" stroke-width="${sw * 1.2}" stroke-linecap="${join}" stroke-linejoin="${join}" />`

  return output
}

/**
 * 4. Japanese Traditional Seigaiha (Ocean Waves)
 */
function renderProceduralSeigaiha(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  _seed: number,
  join: string
): string {
  const r = size * 0.5
  const arcs = 4
  let paths = ""

  const renderFan = (cx: number, cy: number) => {
    let fan = ""
    for (let a = 1; a <= arcs; a++) {
      const currentR = (r / arcs) * a
      const col = a === arcs ? color : a % 2 === 0 ? secColor : color
      fan += `<circle cx="${cx}" cy="${cy}" r="${currentR}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="${join}" />`
    }
    return fan
  }

  // Base tier and staggered tier
  paths += renderFan(0, size * 0.5)
  paths += renderFan(size, size * 0.5)
  paths += renderFan(size * 0.5, 0)
  paths += renderFan(size * 0.5, size)

  return paths
}

/**
 * 5. Japanese Traditional Asanoha (Hemp Leaf Star)
 */
function renderProceduralAsanoha(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  _seed: number,
  join: string
): string {
  const h = size * 0.866 // equilateral triangle height
  const halfS = size * 0.5
  const cx = halfS
  const cy = h * 0.5

  return `
    <polygon points="${halfS},0 ${size},${h * 0.25} ${size},${h * 0.75} ${halfS},${h} 0,${h * 0.75} 0,${h * 0.25}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="${join}" />
    <line x1="${cx}" y1="${cy}" x2="${halfS}" y2="0" stroke="${secColor}" stroke-width="${sw * 0.8}" stroke-linecap="${join}" />
    <line x1="${cx}" y1="${cy}" x2="${size}" y2="${h * 0.25}" stroke="${secColor}" stroke-width="${sw * 0.8}" stroke-linecap="${join}" />
    <line x1="${cx}" y1="${cy}" x2="${size}" y2="${h * 0.75}" stroke="${secColor}" stroke-width="${sw * 0.8}" stroke-linecap="${join}" />
    <line x1="${cx}" y1="${cy}" x2="${halfS}" y2="${h}" stroke="${secColor}" stroke-width="${sw * 0.8}" stroke-linecap="${join}" />
    <line x1="${cx}" y1="${cy}" x2="0" y2="${h * 0.75}" stroke="${secColor}" stroke-width="${sw * 0.8}" stroke-linecap="${join}" />
    <line x1="${cx}" y1="${cy}" x2="0" y2="${h * 0.25}" stroke="${secColor}" stroke-width="${sw * 0.8}" stroke-linecap="${join}" />
  `
}

/**
 * 6. Japanese Shippo (Seven Treasures)
 */
function renderProceduralShippo(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  _seed: number,
  join: string
): string {
  const r = size * 0.5
  return `
    <circle cx="0" cy="0" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${join}" />
    <circle cx="${size}" cy="0" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${join}" />
    <circle cx="0" cy="${size}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${join}" />
    <circle cx="${size}" cy="${size}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${join}" />
    <circle cx="${r}" cy="${r}" r="${r}" fill="none" stroke="${secColor}" stroke-width="${sw * 1.2}" stroke-linecap="${join}" />
  `
}

/**
 * 7. Islamic Geometric 8-Fold Star Rosette
 */
function renderProceduralIslamic(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  _seed: number,
  join: string
): string {
  const cx = size * 0.5
  const cy = size * 0.5
  const r1 = size * 0.44
  const r2 = size * 0.24

  let starPts = ""
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8
    const r = i % 2 === 0 ? r1 : r2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    starPts += `${x.toFixed(2)},${y.toFixed(2)} `
  }

  return `
    <polygon points="${starPts.trim()}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="${join}" />
    <circle cx="${cx}" cy="${cy}" r="${r2 * 0.7}" fill="none" stroke="${secColor}" stroke-width="${sw * 0.9}" />
    <path d="M 0 0 L ${size * 0.2} ${size * 0.2} M ${size} 0 L ${size * 0.8} ${size * 0.2} M 0 ${size} L ${size * 0.2} ${size * 0.8} M ${size} ${size} L ${size * 0.8} ${size * 0.8}" stroke="${secColor}" stroke-width="${sw}" stroke-linecap="${join}" />
  `
}

/**
 * 8. 3D Tumbling Isometric Cubes
 */
function renderProceduralIsometric(
  size: number,
  _sw: number,
  color: string,
  secColor: string,
  _seed: number,
  _join: string
): string {
  const w = size
  const h = size * 0.866
  const cx = w * 0.5
  const cy = h * 0.5

  // Top Face (lighter)
  const topFace = `<polygon points="${cx},0 ${w},${h * 0.25} ${cx},${cy} 0,${h * 0.25}" fill="${color}" opacity="0.9" />`
  // Left Face (darker)
  const leftFace = `<polygon points="0,${h * 0.25} ${cx},${cy} ${cx},${h} 0,${h * 0.75}" fill="${color}" opacity="0.6" />`
  // Right Face (accent / medium)
  const rightFace = `<polygon points="${cx},${cy} ${w},${h * 0.25} ${w},${h * 0.75} ${cx},${h}" fill="${secColor}" opacity="0.8" />`

  return `${topFace}${leftFace}${rightFace}`
}

/**
 * 9. Scottish Tartan & Plaid Weave
 */
function renderProceduralTartan(
  size: number,
  _sw: number,
  color: string,
  secColor: string,
  _seed: number,
  _join: string
): string {
  const band1 = size * 0.25
  const band2 = size * 0.1
  return `
    <rect x="${size * 0.1}" y="0" width="${band1}" height="${size}" fill="${color}" opacity="0.45" />
    <rect x="0" y="${size * 0.1}" width="${size}" height="${band1}" fill="${color}" opacity="0.45" />
    <rect x="${size * 0.6}" y="0" width="${band2}" height="${size}" fill="${secColor}" opacity="0.75" />
    <rect x="0" y="${size * 0.6}" width="${size}" height="${band2}" fill="${secColor}" opacity="0.75" />
    <line x1="0" y1="${size * 0.85}" x2="${size}" y2="${size * 0.85}" stroke="${color}" stroke-width="1.5" />
    <line x1="${size * 0.85}" y1="0" x2="${size * 0.85}" y2="${size}" stroke="${color}" stroke-width="1.5" />
  `
}

/**
 * 10. Op-Art Moiré Concentric Warping
 */
function renderProceduralOpArt(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  _seed: number,
  join: string
): string {
  const cx = size * 0.5
  const cy = size * 0.5
  const count = 6
  let circles = ""
  for (let i = 1; i <= count; i++) {
    const r = (size * 0.45 / count) * i
    const col = i % 2 === 0 ? secColor : color
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="${join}" />`
  }
  return `
    ${circles}
    <path d="M 0 0 L ${size} ${size} M ${size} 0 L 0 ${size}" stroke="${secColor}" stroke-width="${sw * 0.75}" stroke-linecap="${join}" />
  `
}

/**
 * 11. Hexagonal Matrix Halftone
 */
function renderProceduralHalftone(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  seed: number,
  _join: string
): string {
  const rand = makePRNG(seed)
  const cols = 5
  const s = size / cols
  let dots = ""
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = r % 2 === 1 ? s * 0.5 : 0
      const cx = c * s + offsetX + s * 0.25
      const cy = r * s + s * 0.25
      const radius = Math.max(1, (sw * (1 + rand() * 1.8)))
      const col = rand() > 0.6 ? secColor : color
      dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="${col}" />`
    }
  }
  return dots
}

/**
 * 12. Herringbone Parquet Chevron
 */
function renderProceduralHerringbone(
  size: number,
  sw: number,
  color: string,
  secColor: string,
  _seed: number,
  join: string
): string {
  const half = size * 0.5
  return `
    <path d="M 0 ${half * 0.5} L ${half} 0 L ${size} ${half * 0.5}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${join}" stroke-linejoin="${join}" />
    <path d="M 0 ${half * 1.5} L ${half} ${half} L ${size} ${half * 1.5}" fill="none" stroke="${secColor}" stroke-width="${sw}" stroke-linecap="${join}" stroke-linejoin="${join}" />
    <path d="M 0 ${size * 1.25} L ${half} ${size * 0.75} L ${size} ${size * 1.25}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${join}" stroke-linejoin="${join}" />
  `
}

// -------------------------------------------------------------
// Procedural Master Catalog (12 Infinite Pattern Families)
// -------------------------------------------------------------
export const PROCEDURAL_PRESETS: CuratedPattern[] = [
  {
    id: "procedural-truchet",
    title: "Truchet Labyrinth (Infinite Seeds)",
    category: "procedural",
    tags: ["procedural", "labyrinth", "truchet", "generative"],
    mode: "stroke",
    width: 120,
    height: 120,
    vHeight: 0,
    maxStroke: 8,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-guilloche",
    title: "Banknote Guilloche Spire",
    category: "procedural",
    tags: ["procedural", "guilloche", "banknote", "security", "luxury"],
    mode: "stroke",
    width: 120,
    height: 120,
    vHeight: 0,
    maxStroke: 6,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-topographic",
    title: "Topographic Elevation Isolines",
    category: "procedural",
    tags: ["procedural", "topographic", "contour", "map", "waves"],
    mode: "stroke",
    width: 120,
    height: 120,
    vHeight: 0,
    maxStroke: 5,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-seigaiha",
    title: "Japanese Seigaiha Waves",
    category: "japanese",
    tags: ["procedural", "japanese", "wagara", "seigaiha", "waves"],
    mode: "stroke",
    width: 80,
    height: 80,
    vHeight: 0,
    maxStroke: 5,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-asanoha",
    title: "Japanese Asanoha Hemp Star",
    category: "japanese",
    tags: ["procedural", "japanese", "wagara", "asanoha", "star"],
    mode: "stroke",
    width: 80,
    height: 69.28,
    vHeight: 0,
    maxStroke: 4,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-shippo",
    title: "Japanese Shippo Seven Treasures",
    category: "japanese",
    tags: ["procedural", "japanese", "wagara", "shippo", "circles"],
    mode: "stroke",
    width: 80,
    height: 80,
    vHeight: 0,
    maxStroke: 5,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-islamic",
    title: "Islamic 8-Fold Star Rosette",
    category: "ethnic",
    tags: ["procedural", "islamic", "arabic", "star", "geometric"],
    mode: "stroke",
    width: 100,
    height: 100,
    vHeight: 0,
    maxStroke: 5,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-isometric",
    title: "3D Tumbling Isometric Cubes",
    category: "geometric",
    tags: ["procedural", "isometric", "3d", "cubes", "escher"],
    mode: "fill",
    width: 90,
    height: 77.94,
    vHeight: 0,
    maxStroke: 2,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-tartan",
    title: "Scottish Plaid & Tartan Weave",
    category: "lines",
    tags: ["procedural", "tartan", "plaid", "scottish", "textile"],
    mode: "fill",
    width: 100,
    height: 100,
    vHeight: 0,
    maxStroke: 4,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-opart",
    title: "Op-Art Moiré Concentric",
    category: "geometric",
    tags: ["procedural", "opart", "optical", "moire", "circles"],
    mode: "stroke",
    width: 100,
    height: 100,
    vHeight: 0,
    maxStroke: 5,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-halftone",
    title: "Hexagonal Matrix Halftone",
    category: "circles",
    tags: ["procedural", "halftone", "dots", "matrix", "stochastic"],
    mode: "fill",
    width: 80,
    height: 80,
    vHeight: 0,
    maxStroke: 3,
    paths: [],
    source: "procedural",
  },
  {
    id: "procedural-herringbone",
    title: "Herringbone Parquet Chevron",
    category: "geometric",
    tags: ["procedural", "herringbone", "chevron", "parquet", "wood"],
    mode: "stroke",
    width: 80,
    height: 80,
    vHeight: 0,
    maxStroke: 5,
    paths: [],
    source: "procedural",
  },
]

// -------------------------------------------------------------
// Combined Master Pattern Catalog (429 Total Presets)
// -------------------------------------------------------------
export const ALL_CURATED_PATTERNS: CuratedPattern[] = [
  ...PROCEDURAL_PRESETS,
  ...(CURATED_PATTERNS_DATA as CuratedPattern[]),
]

/**
 * Filter categories for UI organization
 */
export const PATTERN_CATEGORIES = [
  { id: "all", label: "All Patterns", count: ALL_CURATED_PATTERNS.length },
  { id: "procedural", label: "🎲 Procedural (Infinite Seeds)", count: PROCEDURAL_PRESETS.length },
  { id: "waves", label: "Waves & Curves", count: ALL_CURATED_PATTERNS.filter(p => p.tags.some(t => t.includes("wave") || t.includes("curve"))).length },
  { id: "geometric", label: "Geometric & Grid", count: ALL_CURATED_PATTERNS.filter(p => p.tags.some(t => t.includes("geometric") || t.includes("triangle") || t.includes("diamond") || t.includes("cube") || t.includes("square"))).length },
  { id: "architectural", label: "Architectural & Minimal", count: ALL_CURATED_PATTERNS.filter(p => p.source === "hero-patterns" || p.tags.includes("architectural")).length },
  { id: "japanese", label: "Japanese & Ethnic", count: ALL_CURATED_PATTERNS.filter(p => p.tags.some(t => t.includes("japanese") || t.includes("chinese") || t.includes("ethnic") || t.includes("tribal") || t.includes("islamic"))).length },
  { id: "circles", label: "Circles & Dots", count: ALL_CURATED_PATTERNS.filter(p => p.tags.some(t => t.includes("circle") || t.includes("dot"))).length },
  { id: "lines", label: "Lines & Stripes", count: ALL_CURATED_PATTERNS.filter(p => p.tags.some(t => t.includes("line") || t.includes("stripe") || t.includes("plaid") || t.includes("herringbone"))).length },
  { id: "organic", label: "Organic & Memphis", count: ALL_CURATED_PATTERNS.filter(p => p.tags.some(t => t.includes("flower") || t.includes("leaf") || t.includes("memphis") || t.includes("doodle"))).length },
]

/**
 * Resolves pixel width & height for given ResolutionId
 */
export function resolveDimensions(
  res: ResolutionId,
  docW: number,
  docH: number
): { width: number; height: number; label: string } {
  switch (res) {
    case "8k-uhd":
      return { width: 7680, height: 4320, label: "8K_UHD_7680x4320" }
    case "8k-square":
      return { width: 8000, height: 8000, label: "8K_SQUARE_8000x8000" }
    case "4k-uhd":
      return { width: 3840, height: 2160, label: "4K_UHD_3840x2160" }
    case "1080p":
      return { width: 1920, height: 1080, label: "FHD_1920x1080" }
    case "artboard":
    default:
      return { width: docW, height: docH, label: `${docW}x${docH}` }
  }
}

/**
 * Builds the tile content for the SVG pattern definition
 */
export function renderTileContent(config: PatternState): {
  tileW: number
  tileH: number
  content: string
} {
  const { preset, tileSize, strokeWidth, color, secondaryColor, seed, strokeJoin, customSvgMarkup } = config

  // 1. Custom SVG Upload
  if (preset === "custom" && customSvgMarkup) {
    return {
      tileW: tileSize,
      tileH: tileSize,
      content: `<g transform="scale(${tileSize / 100})">${customSvgMarkup}</g>`,
    }
  }

  // 2. Procedural Algorithmic Generators
  if (preset.startsWith("procedural-")) {
    const s = tileSize
    const sw = strokeWidth
    let content = ""
    let h = s

    switch (preset) {
      case "procedural-truchet":
        content = renderProceduralTruchet(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-guilloche":
        content = renderProceduralGuilloche(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-topographic":
        content = renderProceduralTopographic(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-seigaiha":
        content = renderProceduralSeigaiha(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-asanoha":
        h = s * 0.866
        content = renderProceduralAsanoha(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-shippo":
        content = renderProceduralShippo(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-islamic":
        content = renderProceduralIslamic(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-isometric":
        h = s * 0.866
        content = renderProceduralIsometric(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-tartan":
        content = renderProceduralTartan(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-opart":
        content = renderProceduralOpArt(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-halftone":
        content = renderProceduralHalftone(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      case "procedural-herringbone":
        content = renderProceduralHerringbone(s, sw, color, secondaryColor, seed, strokeJoin)
        break
      default:
        content = renderProceduralTruchet(s, sw, color, secondaryColor, seed, strokeJoin)
    }

    return { tileW: s, tileH: h, content }
  }

  // 3. Curated Patterns (Pattern Monster & Hero Patterns)
  const pattern = ALL_CURATED_PATTERNS.find((p) => p.id === preset) || ALL_CURATED_PATTERNS[0]
  const baseW = pattern.width || 80
  const baseH = pattern.height || 80
  const scale = tileSize / baseW
  const tileW = tileSize
  const tileH = baseH * scale

  if (pattern.source === "hero-patterns") {
    // Hero Patterns: Single unified path group
    const inner = (pattern.paths[0] || "")
      .replace(/fill="[^"]*"/g, "")
      .replace(/stroke="[^"]*"/g, "")
    const content = `
      <g transform="scale(${scale.toFixed(5)})" fill="${color}">
        ${inner}
      </g>
    `
    return { tileW, tileH, content }
  }

  // Pattern Monster: Multi-path layered system with dual-tone coloring
  let pathsMarkup = ""
  pattern.paths.forEach((pStr, idx) => {
    // Layer 0 = primary color, Layer 1+ = secondary accent color
    const layerColor = idx === 0 ? color : secondaryColor
    let styledPath = pStr

    if (pattern.mode === "stroke" || pattern.mode === "stroke-join") {
      const lineCapJoin = pattern.mode === "stroke-join"
        ? `stroke-linecap="round" stroke-linejoin="round"`
        : `stroke-linecap="${strokeJoin}" stroke-linejoin="${strokeJoin}"`
      styledPath = styledPath
        .replace(/fill="[^"]*"/g, "")
        .replace(/stroke="[^"]*"/g, "")
        .replace(/stroke-width="[^"]*"/g, "")
        .replace("<path", `<path fill="none" stroke="${layerColor}" stroke-width="${strokeWidth / scale}" ${lineCapJoin}`)
    } else {
      // Fill mode
      styledPath = styledPath
        .replace(/fill="[^"]*"/g, "")
        .replace("<path", `<path fill="${layerColor}" stroke="none"`)
    }
    pathsMarkup += styledPath
  })

  const content = `
    <g transform="scale(${scale.toFixed(5)})">
      ${pathsMarkup}
    </g>
  `
  return { tileW, tileH, content }
}

/**
 * Builds pure W3C SVG 2.0 XML string with seamless <pattern> fill
 */
export function buildPatternSVG(
  config: PatternState,
  targetWidth: number,
  targetHeight: number
): string {
  const {
    preset,
    backgroundColor,
    transparentBg,
    rotation,
    opacity,
  } = config

  const { tileW, tileH, content } = renderTileContent(config)
  const patternId = `ars-bg-pattern-${preset.replace(/[^a-zA-Z0-9_-]/g, "")}-${Math.round(tileW)}`

  const bgRect = transparentBg
    ? ""
    : `<rect width="${targetWidth}" height="${targetHeight}" fill="${backgroundColor}" />`

  const rotTransform = rotation !== 0 ? `patternTransform="rotate(${rotation})"` : ""

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${targetWidth} ${targetHeight}" width="${targetWidth}" height="${targetHeight}">
  <defs>
    <pattern id="${patternId}" width="${tileW.toFixed(3)}" height="${tileH.toFixed(3)}" patternUnits="userSpaceOnUse" ${rotTransform}>
      ${content}
    </pattern>
  </defs>
  ${bgRect}
  <rect width="${targetWidth}" height="${targetHeight}" fill="url(#${patternId})" opacity="${opacity}" />
</svg>`.trim()
}

/**
 * Downloads Pure Vector SVG at specified resolution (8K UHD, 8K Square, 4K, or Artboard)
 */
export function downloadPatternSVG(
  config: PatternState,
  docW: number,
  docH: number
): void {
  const dim = resolveDimensions(config.resolution, docW, docH)
  const svg = buildPatternSVG(config, dim.width, dim.height)
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  const ts = getExportTimestamp()
  downloadBlob(
    blob,
    `ARS_BG_PATTERN_${dim.label}_${config.preset.toUpperCase()}_${ts}.svg`
  )
}

/**
 * Downloads 300 DPI High-Resolution PNG at specified resolution (up to 8K Ultra HD)
 */
export async function downloadPatternPNG(
  config: PatternState,
  docW: number,
  docH: number
): Promise<void> {
  const dim = resolveDimensions(config.resolution, docW, docH)
  const svg = buildPatternSVG(config, dim.width, dim.height)
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = async () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement("canvas")
      canvas.width = dim.width
      canvas.height = dim.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context unavailable for rasterization"))
        return
      }

      // Draw SVG onto canvas
      ctx.drawImage(img, 0, 0, dim.width, dim.height)

      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode PNG"))
          return
        }
        const arrayBuf = await blob.arrayBuffer()
        // Inject physical 300 DPI metadata header
        const with300Dpi = injectPngDpi(new Uint8Array(arrayBuf), 300)
        const finalBlob = new Blob([with300Dpi as any], { type: "image/png" })
        const ts = getExportTimestamp()
        downloadBlob(
          finalBlob,
          `ARS_BG_PATTERN_300DPI_${dim.label}_${config.preset.toUpperCase()}_${ts}.png`
        )
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
