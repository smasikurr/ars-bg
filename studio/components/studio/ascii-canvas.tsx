"use client"

import { useEffect, useRef } from "react"
import type { AsciiConfig } from "@/lib/engine/types"

const CHARSETS: Record<string, string> = {
  code: "import{ARS_BG}from'@engine';const_fx=newARS_BG.VectorEngine();if(pointer.active){renderHalftone();}",
  standard: "@%#*+=-:. ",
  blocks: "██▓▒░ ",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`. ",
  minimal: "·■ ",
  binary: "01",
}

interface Cell {
  x: number
  y: number
  char: string
  heat: number
}

export function AsciiCanvas({
  width,
  height,
  config,
  artRef,
}: {
  width: number
  height: number
  config?: AsciiConfig
  artRef: React.RefObject<HTMLDivElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cellsRef = useRef<Cell[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000, active: false })

  // Rebuild grid when dimensions or cell size change
  useEffect(() => {
    if (!config?.enabled || !width || !height) return
    const cellSize = Math.max(12, config.size || 20)
    const rawChars = CHARSETS[config.charset] || CHARSETS.code
    const chars = rawChars.length ? rawChars : "@%#* "
    const cols = Math.ceil(width / cellSize) + 1
    const rows = Math.ceil(height / cellSize) + 1

    const cells: Cell[] = []
    let charIdx = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          x: c * cellSize + cellSize / 2,
          y: r * cellSize + cellSize / 2,
          char: chars[charIdx % chars.length],
          heat: 0,
        })
        charIdx++
      }
    }
    cellsRef.current = cells
  }, [width, height, config?.enabled, config?.size, config?.charset])

  // Track mouse coordinates over the artboard
  useEffect(() => {
    const art = artRef.current
    if (!art || !config?.enabled) return

    const onPointerMove = (e: PointerEvent) => {
      const rect = art.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * (width / rect.width),
        y: (e.clientY - rect.top) * (height / rect.height),
        active: true,
      }
    }

    const onPointerLeave = () => {
      mouseRef.current.active = false
      mouseRef.current.x = -1000
      mouseRef.current.y = -1000
    }

    art.addEventListener("pointermove", onPointerMove)
    art.addEventListener("pointerleave", onPointerLeave)
    return () => {
      art.removeEventListener("pointermove", onPointerMove)
      art.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [artRef, config?.enabled, width, height])

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (!config?.enabled) {
      ctx.clearRect(0, 0, width, height)
      return
    }

    let raf = 0
    const decay = config.decay ?? 0.92
    const radius = config.radius ?? 120
    const fontSize = Math.max(10, (config.size ?? 20) * 0.75)
    const isHeatmap = config.mode === "heatmap"

    const loop = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const m = mouseRef.current
      const cells = cellsRef.current

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (m.active && m.x >= 0 && m.y >= 0) {
          const d = Math.hypot(cell.x - m.x, cell.y - m.y)
          if (d < radius) {
            const add = (1.0 - d / radius) * 0.35
            cell.heat = Math.min(1.0, cell.heat + add)
          }
        }

        cell.heat *= decay

        if (isHeatmap) {
          if (cell.heat > 0.02) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, cell.heat * 1.2).toFixed(3)})`
            ctx.fillText(cell.char, cell.x, cell.y)
          }
        } else {
          // Dynamic Background: always subtle base, glowing on heat
          const alpha = 0.18 + cell.heat * 0.75
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`
          ctx.fillText(cell.char, cell.x, cell.y)
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [config, width, height])

  if (!config?.enabled) return null

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 block size-full z-10"
      style={{ mixBlendMode: "overlay" }}
    />
  )
}
