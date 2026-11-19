/**
 * ARS-BG-PRO: Template Variation Engine
 * 
 * Takes any base template / Doc and generates distinct, microstock-viable variations:
 * - Color Harmonies: Hue shifts, saturation pops, pastel mist, deep velvet
 * - Flow & Geometry: Point jitter, center movement, speed perturbations
 * - Deterministic seed locking with high visual distance
 */

import { hexToRgb, rgbToHex, srgbToOklab, oklabToSrgb, type Vec3 } from "@/lib/color"
import type { ColorStop, Doc } from "@/lib/engine/types"
import { uid } from "@/lib/utils"

export interface TemplateVariant {
  id: string
  name: string
  description: string
  doc: Doc
}

// Helper to shift hue in OKLab
function shiftHue(hex: string, angleDegrees: number, satMult = 1, lightMult = 1): string {
  const rgb = hexToRgb(hex)
  const [L, a, b] = srgbToOklab(rgb)
  const rad = (angleDegrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const newA = (a * cos - b * sin) * satMult
  const newB = (a * sin + b * cos) * satMult
  const newL = Math.max(0.05, Math.min(0.98, L * lightMult))
  const newRgb = oklabToSrgb([newL, newA, newB])
  return rgbToHex(newRgb)
}

export function generateTemplateVariations(baseDoc: Doc, count = 8): TemplateVariant[] {
  const variants: TemplateVariant[] = []
  const seedBase = baseDoc.seed || 0.42

  const configs: {
    name: string
    desc: string
    hueShift: number
    satMult: number
    lightMult: number
    jitter: number
  }[] = [
    {
      name: "Warm Sunset Shift",
      desc: "Warm amber & golden hour glow",
      hueShift: 35,
      satMult: 1.15,
      lightMult: 1.05,
      jitter: 0.08,
    },
    {
      name: "Cool Cyan & Indigo",
      desc: "Cyberpunk neon teal and deep blue",
      hueShift: -45,
      satMult: 1.2,
      lightMult: 0.95,
      jitter: 0.1,
    },
    {
      name: "Vibrant Chroma Pop",
      desc: "Maximum color saturation and contrast",
      hueShift: 15,
      satMult: 1.35,
      lightMult: 1.0,
      jitter: 0.05,
    },
    {
      name: "Pastel & Ethereal",
      desc: "Soft dreamscape with elevated lightness",
      hueShift: 20,
      satMult: 0.75,
      lightMult: 1.25,
      jitter: 0.07,
    },
    {
      name: "Dark Velvet Mood",
      desc: "Deep saturated tones on midnight ground",
      hueShift: -25,
      satMult: 1.25,
      lightMult: 0.7,
      jitter: 0.12,
    },
    {
      name: "High Contrast Punch",
      desc: "Bold dynamic tonal separation",
      hueShift: 55,
      satMult: 1.3,
      lightMult: 0.9,
      jitter: 0.14,
    },
    {
      name: "Turbulent Flow Drift",
      desc: "Same palette with shifted control geometry",
      hueShift: 0,
      satMult: 1.05,
      lightMult: 1.0,
      jitter: 0.22,
    },
    {
      name: "Complementary Contrast",
      desc: "Opposite hue harmony on color wheel",
      hueShift: 180,
      satMult: 1.1,
      lightMult: 1.0,
      jitter: 0.09,
    },
  ]

  for (let i = 0; i < Math.min(count, configs.length); i++) {
    const cfg = configs[i]
    const varSeed = (seedBase + (i + 1) * 0.173) % 1

    const newColors: ColorStop[] = baseDoc.colors.map((c, idx) => {
      const angle = cfg.hueShift + (idx % 2 === 0 ? 5 : -5)
      const hex = c.locked
        ? c.hex
        : shiftHue(c.hex, angle, cfg.satMult, cfg.lightMult)
      const jx = (Math.sin(varSeed * 100 + idx * 7) * cfg.jitter)
      const jy = (Math.cos(varSeed * 100 + idx * 7) * cfg.jitter)
      return {
        id: uid(),
        hex,
        x: Math.max(0.05, Math.min(0.95, c.x + jx)),
        y: Math.max(0.05, Math.min(0.95, c.y + jy)),
        locked: c.locked,
      }
    })

    const varDoc: Doc = {
      ...baseDoc,
      name: `${baseDoc.name || "Template"} - ${cfg.name}`,
      seed: varSeed,
      colors: newColors,
      center: {
        x: Math.max(0.2, Math.min(0.8, baseDoc.center.x + (Math.sin(i * 3) * 0.15))),
        y: Math.max(0.2, Math.min(0.8, baseDoc.center.y + (Math.cos(i * 3) * 0.15))),
      },
    }

    variants.push({
      id: `var-${i + 1}`,
      name: cfg.name,
      description: cfg.desc,
      doc: varDoc,
    })
  }

  return variants
}
