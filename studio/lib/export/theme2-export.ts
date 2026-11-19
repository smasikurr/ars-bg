"use client"

import { useStudio } from "@/store/studio"
import { downloadBlob, getExportTimestamp } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { setDpiOnBlob } from "./dpi"

/**
 * Captures the current live Theme 2 WebGL canvas with optional scaling and composite overlays.
 */
export async function captureTheme2Canvas(scale = 1): Promise<HTMLCanvasElement> {
  const glCanvas = document.getElementById("theme2-canvas") as HTMLCanvasElement | null
  const asciiCanvas = document.getElementById("text-canvas") as HTMLCanvasElement | null
  if (!glCanvas) {
    throw new Error("Theme 2 canvas not found. Make sure you are in Theme 2 mode.")
  }

  const baseW = glCanvas.width
  const baseH = glCanvas.height
  const targetW = Math.round(baseW * scale)
  const targetH = Math.round(baseH * scale)

  const out = document.createElement("canvas")
  out.width = targetW
  out.height = targetH
  const ctx = out.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("Could not create 2D canvas context")

  // Draw WebGL base layer
  ctx.drawImage(glCanvas, 0, 0, targetW, targetH)

  // Draw ASCII Matrix overlay if enabled
  if (asciiCanvas && asciiCanvas.style.display !== "none") {
    ctx.drawImage(asciiCanvas, 0, 0, targetW, targetH)
  }

  return out
}

/**
 * Downloads a high-resolution PNG snapshot from Theme 2.
 */
export async function downloadTheme2PNG(scale = 1): Promise<void> {
  try {
    const canvas = await captureTheme2Canvas(scale)
    const rawBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    )
    if (!rawBlob) throw new Error("Failed to generate PNG blob")
    const blob = await setDpiOnBlob(rawBlob, 300)
    const ts = getExportTimestamp()
    const filename = `ARS_BG_THEME2_${canvas.width}x${canvas.height}_${ts}.png`
    downloadBlob(blob, filename)
    toast(`Downloaded PNG (${canvas.width}×${canvas.height})`, "ok")
  } catch (err: any) {
    console.error("Theme 2 PNG export failed:", err)
    toast(err.message || "PNG export failed", "error")
  }
}

/**
 * Generates valid W3C vector SVG containing the live Theme 2 high-res render and metadata.
 */
export async function generateTheme2SVG(scale = 1): Promise<{ blob: Blob; svgString: string }> {
  const canvas = await captureTheme2Canvas(scale)
  const dataUrl = canvas.toDataURL("image/png")
  const w = canvas.width
  const h = canvas.height
  const t2 = useStudio.getState().theme2

  const stops = t2.colors
    .map((c, i) => {
      const offset = Math.round((i / Math.max(1, t2.colors.length - 1)) * 100)
      return `      <stop offset="${offset}%" stop-color="${c}" />`
    })
    .join("\n")

  let halftoneVector = ""
  if (t2.artEnable) {
    const size = Math.max(2, t2.artSize || 12)
    const dotCol = t2.artDotColor || "#295EFF"
    halftoneVector = `
    <!-- Halftone Vector Pattern -->
    <pattern id="t2-halftone" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.4}" fill="${dotCol}" opacity="0.9" />
    </pattern>`
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <title>ARS-BG PRO · Theme 2 Matrix Export</title>
  <defs>
    <linearGradient id="t2-palette" x1="0%" y1="0%" x2="100%" y2="100%">
${stops}
    </linearGradient>${halftoneVector}
  </defs>

  <!-- Theme 2 Exact High-Resolution Procedural Output -->
  <image href="${dataUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" />
</svg>`

  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
  return { blob, svgString: svgContent }
}

/**
 * Downloads Theme 2 SVG file.
 */
export async function downloadTheme2SVG(scale = 1): Promise<void> {
  try {
    const { blob } = await generateTheme2SVG(scale)
    const filename = `ars-bg-theme2-${Date.now()}.svg`
    downloadBlob(blob, filename)
    toast("Downloaded SVG file", "ok")
  } catch (err: any) {
    console.error("Theme 2 SVG download failed:", err)
    toast(err.message || "SVG export failed", "error")
  }
}

/**
 * Copies Theme 2 SVG markup directly to clipboard.
 */
export async function copyTheme2SVG(scale = 1): Promise<boolean> {
  try {
    const { svgString } = await generateTheme2SVG(scale)
    await navigator.clipboard.writeText(svgString)
    toast("SVG code copied to clipboard", "ok")
    return true
  } catch (err: any) {
    console.error("Failed to copy SVG code:", err)
    toast("Could not access clipboard", "error")
    return false
  }
}

/**
 * Records an animated MP4 / WebM clip from Theme 2 live canvas using MediaRecorder.
 */
export async function recordTheme2Video(
  durationSec = 6,
  fps = 30,
  onProgress?: (p: number) => void
): Promise<void> {
  const glCanvas = document.getElementById("theme2-canvas") as HTMLCanvasElement | null
  if (!glCanvas) throw new Error("Theme 2 canvas not found")

  // Use captureStream
  const stream = (glCanvas as any).captureStream ? (glCanvas as any).captureStream(fps) : null
  if (!stream) throw new Error("Canvas stream capture not supported in this browser")

  const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
    ? "video/mp4;codecs=avc1"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm"

  const ext = mimeType.includes("mp4") ? "mp4" : "webm"
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 })
  const chunks: Blob[] = []

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const startTime = Date.now()
  const totalMs = durationSec * 1000

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / totalMs)
      onProgress?.(progress)
      if (elapsed >= totalMs) {
        clearInterval(interval)
        recorder.stop()
      }
    }, 100)

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      const filename = `ars-bg-theme2-${Date.now()}.${ext}`
      downloadBlob(blob, filename)
      toast(`Video exported as ${ext.toUpperCase()}`, "ok")
      resolve()
    }

    recorder.onerror = (e) => {
      clearInterval(interval)
      reject(e)
    }

    recorder.start(100)
  })
}
