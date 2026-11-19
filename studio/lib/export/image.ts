import { renderToCanvas } from "@/lib/engine/renderer"
import type { Doc } from "@/lib/engine/types"
import { drawOverlay, hasOverlay } from "@/lib/overlay"
import { setDpiOnBlob } from "./dpi"
import { getExportTimestamp } from "@/lib/utils"

export type ImageFormat = "png" | "jpeg" | "webp"

export const MAX_EDGE = 8192

/** The artboard at a multiple of its size, with the text and image on top. */
export async function renderFull(
  doc: Doc,
  scale: number,
  phase: number,
  size?: { w: number; h: number }
) {
  const target = size ?? doc.size
  // A different size reflows the gradient; effects keep their pixel scale.
  const d = size ? { ...doc, size } : doc
  const W = Math.round(target.w * scale)
  const H = Math.round(target.h * scale)

  if (d.frame?.enabled && d.frame?.isolateFrame) {
    // Pure Standalone Texture / Distressed Frame Export (Decoupled from gradient)
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!
    if (d.frame.frameBackground === "white") {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, W, H)
    } else if (d.frame.frameBackground === "black") {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, W, H)
    }
    await drawOverlay(ctx, d, W, H)
    return canvas
  }

  const canvas = renderToCanvas(d, W, H, phase)
  if (hasOverlay(d)) await drawOverlay(canvas.getContext("2d")!, d, W, H)
  return canvas
}

export async function toBlob(
  c: HTMLCanvasElement,
  format: ImageFormat,
  quality = 0.92,
  dpi = 300
): Promise<Blob> {
  const rawBlob = await new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("The image was too large to encode")),
      `image/${format}`,
      format === "png" ? undefined : quality
    )
  )
  return setDpiOnBlob(rawBlob, dpi)
}

export const fileName = (doc: Doc, w: number, h: number, ext: string) => {
  const ts = getExportTimestamp()
  const cleanName = (doc.name || doc.style || "GRADIENT").toUpperCase().replace(/[^A-Z0-9]+/g, "-")
  return `ARS_BG_${cleanName}_${w}x${h}_${ts}.${ext}`
}

/** Copies a PNG. The promise goes straight into ClipboardItem for Safari. */
export async function copyImage(doc: Doc, phase: number) {
  const blob = renderFull(doc, 1, phase).then((c) => toBlob(c, "png"))
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
}
