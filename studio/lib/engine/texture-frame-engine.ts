/**
 * ARS-BG-PRO: Procedural Distressed Frame & Texture Vector Engine
 * 
 * Generates:
 * 1. High-contrast Photocopy / Xerox Eroded Border Frames (Reference Image 1 & 2)
 * 2. Splattered Ink-Bleed & Halftone Borders
 * 3. Textures.js & Patternfills Vector Patterns
 * 4. Dual Vector Export: Pure SVG (<path fill-rule="evenodd">) & Native EPS 10 (PostScript)
 * 5. High-Resolution Canvas Rendering for WebGL Stage & 4K/Video Compositing
 */

export type FramePresetId =
  | "photocopy-poster-1"
  | "xerox-decay-2"
  | "ink-bleed-frame"
  | "halftone-decay"
  | "acid-wash-border"
  | "clean-minimal-frame"
  | "textures-hatch"
  | "patternfills-stipple"

export interface FrameConfig {
  enabled: boolean
  preset: FramePresetId
  margin: number // 5 to 35 (%)
  roughness: number // 0 to 1 (fBm fractal distortion)
  splatter: number // 0 to 1 (ink flecks and chips)
  thickness: number // 2 to 20 (%)
  seed: number
  color: string // Hex '#000000', '#ffffff', etc.
  opacity: number // 0 to 1
  blend: "normal" | "multiply" | "screen" | "overlay" | "difference"
  invert: boolean // Invert frame mask
  isolateFrame?: boolean // When true, hides gradient background for standalone texture editing
  frameBackground?: "transparent" | "white" | "black"
}

export const DEFAULT_FRAME_CONFIG: FrameConfig = {
  enabled: false,
  preset: "photocopy-poster-1",
  margin: 12,
  roughness: 0.65,
  splatter: 0.55,
  thickness: 6,
  seed: 1337,
  color: "#000000",
  opacity: 0.95,
  blend: "normal",
  invert: false,
  isolateFrame: false,
  frameBackground: "transparent",
}

export const FRAME_PRESETS: {
  id: FramePresetId
  name: string
  description: string
  config: Partial<FrameConfig>
}[] = [
  {
    id: "photocopy-poster-1",
    name: "Photocopy Poster Frame (Ref 1)",
    description: "Heavy distressed photocopy border with deep edge decay and spatter flecks.",
    config: {
      margin: 12,
      roughness: 0.72,
      splatter: 0.65,
      thickness: 6,
      opacity: 0.95,
    },
  },
  {
    id: "xerox-decay-2",
    name: "Square Xerox Grunge (Ref 2)",
    description: "High-contrast eroded square/poster frame with ink creep and chipped notches.",
    config: {
      margin: 14,
      roughness: 0.85,
      splatter: 0.75,
      thickness: 8,
      opacity: 1.0,
    },
  },
  {
    id: "ink-bleed-frame",
    name: "Ink Bleed & Toner Burn",
    description: "Fluid letterpress ink spread with micro splatter droplets and ragged boundaries.",
    config: {
      margin: 10,
      roughness: 0.50,
      splatter: 0.85,
      thickness: 5,
      opacity: 0.9,
    },
  },
  {
    id: "halftone-decay",
    name: "Halftone Stipple Border",
    description: "Stochastic micro-dot clusters and decaying risograph edge effect.",
    config: {
      margin: 15,
      roughness: 0.40,
      splatter: 0.90,
      thickness: 7,
      opacity: 0.85,
    },
  },
  {
    id: "acid-wash-border",
    name: "Acid Wash & Cracked Frame",
    description: "Fine jagged fissures and acid-etched distressed metallic perimeter.",
    config: {
      margin: 8,
      roughness: 0.95,
      splatter: 0.35,
      thickness: 4,
      opacity: 0.95,
    },
  },
  {
    id: "textures-hatch",
    name: "Textures.js Diagonal Hatch",
    description: "Architectural 45-degree vector hatching inspired by riccardoscalco/textures.",
    config: {
      margin: 10,
      roughness: 0.1,
      splatter: 0.2,
      thickness: 5,
      opacity: 0.8,
    },
  },
  {
    id: "patternfills-stipple",
    name: "Patternfills Dot Grid",
    description: "Algorithmic dot field overlay inspired by iros/patternfills.",
    config: {
      margin: 12,
      roughness: 0.2,
      splatter: 0.7,
      thickness: 6,
      opacity: 0.8,
    },
  },
  {
    id: "clean-minimal-frame",
    name: "Clean Precision Passepartout",
    description: "Architectural clean border frame with zero decay for modern typography.",
    config: {
      margin: 8,
      roughness: 0.0,
      splatter: 0.0,
      thickness: 4,
      opacity: 1.0,
    },
  },
]

// --- Fast Seedable PRNG & Noise Helpers ---

function createRNG(seed: number) {
  let s = Math.floor(Math.abs(seed)) || 1
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function simplex1D(x: number, rand: () => number) {
  const i0 = Math.floor(x)
  const i1 = i0 + 1
  const f = x - i0
  // Hermite smoothstep
  const u = f * f * (3 - 2 * f)
  // Pseudo-random gradient at lattice points
  const g0 = Math.sin((i0 + 137.5) * 12.9898) * 43758.5453
  const g1 = Math.sin((i1 + 137.5) * 12.9898) * 43758.5453
  const v0 = (g0 - Math.floor(g0)) * 2 - 1
  const v1 = (g1 - Math.floor(g1)) * 2 - 1
  return v0 * (1 - u) + v1 * u
}

function fbm1D(x: number, octaves: number, rand: () => number): number {
  let val = 0
  let amp = 0.5
  let freq = 1
  for (let i = 0; i < octaves; i++) {
    val += amp * simplex1D(x * freq, rand)
    freq *= 2.15
    amp *= 0.5
  }
  return val
}

export interface GeneratedVectorFrame {
  outerRect: { x: number; y: number; w: number; h: number }
  innerPoints: { x: number; y: number }[]
  splatters: { x: number; y: number; r: number; points: { x: number; y: number }[] }[]
  pathData: string
  svgMarkup: string
  epsMarkup: string
}

/**
 * Procedurally generates the distressed frame geometry and vector paths.
 */
export function generateDistressedFrame(
  cfg: FrameConfig,
  W: number,
  H: number
): GeneratedVectorFrame {
  const rand = createRNG(cfg.seed)
  const marginPx = Math.min(W, H) * (cfg.margin / 100)
  const thicknessPx = Math.min(W, H) * (cfg.thickness / 100)

  // Inner nominal window boundaries
  const xMin = marginPx + thicknessPx
  const xMax = W - (marginPx + thicknessPx)
  const yMin = marginPx + thicknessPx
  const yMax = H - (marginPx + thicknessPx)

  const innerW = Math.max(10, xMax - xMin)
  const innerH = Math.max(10, yMax - yMin)
  const perimeter = 2 * (innerW + innerH)

  // Number of points sampled along the inner boundary
  const numPoints = Math.max(120, Math.min(600, Math.round(perimeter / 6)))
  const innerPoints: { x: number; y: number }[] = []

  // Sample perimeter with fBm displacement and Worley notches
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints
    const s = t * perimeter

    let xNom = 0
    let yNom = 0
    let nx = 0
    let ny = 0

    if (s < innerW) {
      // Top edge (left to right)
      xNom = xMin + s
      yNom = yMin
      nx = 0
      ny = -1 // points towards outer margin
    } else if (s < innerW + innerH) {
      // Right edge (top to bottom)
      const ds = s - innerW
      xNom = xMax
      yNom = yMin + ds
      nx = 1
      ny = 0
    } else if (s < 2 * innerW + innerH) {
      // Bottom edge (right to left)
      const ds = s - (innerW + innerH)
      xNom = xMax - ds
      yNom = yMax
      nx = 0
      ny = 1
    } else {
      // Left edge (bottom to top)
      const ds = s - (2 * innerW + innerH)
      xNom = xMin
      yNom = yMax - ds
      nx = -1
      ny = 0
    }

    if (cfg.roughness <= 0.01) {
      innerPoints.push({ x: xNom, y: yNom })
      continue
    }

    // Multi-frequency noise displacement
    const noiseVal = fbm1D(t * 18 + cfg.seed * 0.1, 4, rand)
    const microJitter = (rand() - 0.5) * 0.4

    // Worley-style chipped notches (infrequent deep bites)
    const notchPhase = Math.sin(t * Math.PI * 8 + cfg.seed)
    const notch = notchPhase > 0.85 ? Math.pow((notchPhase - 0.85) / 0.15, 2) * 1.5 : 0

    const dispMagnitude =
      thicknessPx * (cfg.roughness * 0.6 * noiseVal + microJitter * cfg.roughness + notch * 0.8)

    const xFinal = Math.max(marginPx, Math.min(W - marginPx, xNom + nx * dispMagnitude))
    const yFinal = Math.max(marginPx, Math.min(H - marginPx, yNom + ny * dispMagnitude))

    innerPoints.push({ x: xFinal, y: yFinal })
  }

  // --- Generate Splatter & Ink Fleck Droplets in Margin Zone ---
  const splatters: {
    x: number
    y: number
    r: number
    points: { x: number; y: number }[]
  }[] = []

  if (cfg.splatter > 0.05) {
    const numSplatters = Math.round(cfg.splatter * 120)
    for (let k = 0; k < numSplatters; k++) {
      // Pick random side: 0=top, 1=right, 2=bottom, 3=left
      const side = Math.floor(rand() * 4)
      let sx = 0
      let sy = 0
      const jitterDist = (rand() * 0.9 + 0.1) * (thicknessPx + marginPx * 0.8)

      if (side === 0) {
        sx = marginPx + rand() * (W - 2 * marginPx)
        sy = yMin - (rand() * 0.8 - 0.2) * thicknessPx
      } else if (side === 1) {
        sx = xMax + (rand() * 0.8 - 0.2) * thicknessPx
        sy = marginPx + rand() * (H - 2 * marginPx)
      } else if (side === 2) {
        sx = marginPx + rand() * (W - 2 * marginPx)
        sy = yMax + (rand() * 0.8 - 0.2) * thicknessPx
      } else {
        sx = xMin - (rand() * 0.8 - 0.2) * thicknessPx
        sy = marginPx + rand() * (H - 2 * marginPx)
      }

      // Radius of ink particle
      const r = Math.max(0.75, rand() * 4.5 * cfg.splatter)
      const numVerts = Math.floor(rand() * 3) + 5
      const sPts: { x: number; y: number }[] = []

      for (let v = 0; v < numVerts; v++) {
        const theta = (v / numVerts) * Math.PI * 2
        const rVar = r * (0.65 + rand() * 0.7)
        sPts.push({
          x: sx + Math.cos(theta) * rVar,
          y: sy + Math.sin(theta) * rVar,
        })
      }

      splatters.push({ x: sx, y: sy, r, points: sPts })
    }
  }

  // --- Build SVG Compound Path String (evenodd fill rule) ---
  // Outer rectangle: (marginPx, marginPx) to (W - marginPx, H - marginPx)
  const ox = marginPx
  const oy = marginPx
  const ow = W - 2 * marginPx
  const oh = H - 2 * marginPx

  let pathData = `M ${ox.toFixed(2)} ${oy.toFixed(2)} L ${(ox + ow).toFixed(2)} ${oy.toFixed(2)} L ${(ox + ow).toFixed(2)} ${(oy + oh).toFixed(2)} L ${ox.toFixed(2)} ${(oy + oh).toFixed(2)} Z `

  // Inner eroded hole
  if (innerPoints.length > 0) {
    pathData += `M ${innerPoints[0].x.toFixed(2)} ${innerPoints[0].y.toFixed(2)} `
    for (let p = 1; p < innerPoints.length; p++) {
      pathData += `L ${innerPoints[p].x.toFixed(2)} ${innerPoints[p].y.toFixed(2)} `
    }
    pathData += `Z `
  }

  // Splatter islands
  for (const sp of splatters) {
    if (sp.points.length > 0) {
      pathData += `M ${sp.points[0].x.toFixed(2)} ${sp.points[0].y.toFixed(2)} `
      for (let p = 1; p < sp.points.length; p++) {
        pathData += `L ${sp.points[p].x.toFixed(2)} ${sp.points[p].y.toFixed(2)} `
      }
      pathData += `Z `
    }
  }

  // Build Full SVG Markup
  const svgMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <title>ARS-BG-PRO Distressed Vector Frame (${cfg.preset})</title>
  <path fill="${cfg.color}" fill-rule="evenodd" opacity="${cfg.opacity}" d="${pathData.trim()}" />
</svg>`

  // Build Pure PostScript EPS 10 Markup
  const epsMarkup = svgPathToEPS10(pathData, W, H, cfg.color, `ARS-BG-PRO Distressed Frame (${cfg.preset})`)

  return {
    outerRect: { x: ox, y: oy, w: ow, h: oh },
    innerPoints,
    splatters,
    pathData,
    svgMarkup,
    epsMarkup,
  }
}

/**
 * Pure TypeScript SVG Path to Adobe Illustrator EPS 10 Serializer.
 * Inverts Y coordinate from SVG top-left origin to PostScript bottom-left origin.
 */
export function svgPathToEPS10(
  pathData: string,
  width: number,
  height: number,
  colorHex = "#000000",
  title = "ARS-BG-PRO Distressed Vector Asset"
): string {
  // Convert colorHex to RGB normalized [0..1]
  const cleanHex = colorHex.replace("#", "")
  const r = parseInt(cleanHex.substring(0, 2) || "00", 16) / 255
  const g = parseInt(cleanHex.substring(2, 4) || "00", 16) / 255
  const b = parseInt(cleanHex.substring(4, 6) || "00", 16) / 255

  let eps = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: ARS-BG-PRO Vector Studio
%%Title: ${title}
%%BoundingBox: 0 0 ${width} ${height}
%%HiResBoundingBox: 0.0 0.0 ${width}.0 ${height}.0
%%Pages: 1
%%LanguageLevel: 2
%%EndComments
%%BeginProlog
/m {moveto} bind def
/l {lineto} bind def
/c {curveto} bind def
/h {closepath} bind def
/f {eofill} bind def
%%EndProlog
%%Page: 1 1
gsave
${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} setrgbcolor
newpath
`

  // Tokenize SVG path
  const tokens = pathData.match(/([a-df-z]|[-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)/gi) || []
  let i = 0
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === "M") {
      const x = parseFloat(tokens[i++])
      const y = height - parseFloat(tokens[i++])
      eps += `${x.toFixed(2)} ${y.toFixed(2)} m\n`
    } else if (cmd === "L") {
      const x = parseFloat(tokens[i++])
      const y = height - parseFloat(tokens[i++])
      eps += `${x.toFixed(2)} ${y.toFixed(2)} l\n`
    } else if (cmd === "C") {
      const x1 = parseFloat(tokens[i++])
      const y1 = height - parseFloat(tokens[i++])
      const x2 = parseFloat(tokens[i++])
      const y2 = height - parseFloat(tokens[i++])
      const x3 = parseFloat(tokens[i++])
      const y3 = height - parseFloat(tokens[i++])
      eps += `${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} ${x3.toFixed(2)} ${y3.toFixed(2)} c\n`
    } else if (cmd === "Z" || cmd === "z") {
      eps += `h\n`
    }
  }

  eps += `f
grestore
showpage
%%EOF
`
  return eps
}

/**
 * Draws the distressed frame directly onto a 2D canvas context.
 */
export function drawDistressedFrame(
  ctx: CanvasRenderingContext2D,
  cfg: FrameConfig,
  width: number,
  height: number
) {
  if (!cfg.enabled) return

  const frame = generateDistressedFrame(cfg, width, height)
  const path2d = new Path2D(frame.pathData)

  ctx.save()
  ctx.globalAlpha = cfg.opacity
  ctx.globalCompositeOperation =
    cfg.blend === "normal"
      ? "source-over"
      : (cfg.blend as GlobalCompositeOperation)
  ctx.fillStyle = cfg.color
  ctx.fill(path2d, "evenodd")
  ctx.restore()
}
