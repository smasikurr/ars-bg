"use client"

import { clamp, cn } from "@/lib/utils"
import { useStudio } from "@/store/studio"
import { playClickSound, playSliderTickSound } from "@/lib/sound"

export function ZoomHUD({ className }: { className?: string }) {
  const zoom = useStudio((s) => s.doc.zoom ?? 1.0)
  const center = useStudio((s) => s.doc.center)
  const isPanned = Math.abs(center.x - 0.5) > 0.001 || Math.abs(center.y - 0.5) > 0.001
  const isZoomed = Math.abs(zoom - 1.0) > 0.01

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 shadow-float backdrop-blur-md border border-hairline transition-all text-ink select-none",
        className
      )}
    >
      <button
        type="button"
        aria-label="Zoom Out"
        title="Zoom out (or scroll wheel down)"
        onClick={() => {
          const next = clamp(Math.round((zoom - 0.1) * 100) / 100, 0.2, 4.0)
          useStudio.getState().set({ zoom: next })
          playSliderTickSound(next / 4.0)
        }}
        className="flex size-6 items-center justify-center rounded-full text-ink-secondary hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer"
      >
        <span className="text-sm font-bold leading-none">−</span>
      </button>
      <button
        type="button"
        aria-label="Reset Zoom"
        title="Click to reset zoom to 100%"
        onClick={() => {
          useStudio.getState().set({ zoom: 1.0 })
          playClickSound()
        }}
        className="px-1 text-[11px] font-mono font-medium text-ink tabular-nums hover:text-accent transition-colors cursor-pointer"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom In"
        title="Zoom in (or scroll wheel up)"
        onClick={() => {
          const next = clamp(Math.round((zoom + 0.1) * 100) / 100, 0.2, 4.0)
          useStudio.getState().set({ zoom: next })
          playSliderTickSound(next / 4.0)
        }}
        className="flex size-6 items-center justify-center rounded-full text-ink-secondary hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer"
      >
        <span className="text-sm font-bold leading-none">+</span>
      </button>

      {(isZoomed || isPanned) && (
        <>
          <span className="h-3 w-px bg-hairline mx-0.5" />
          <button
            type="button"
            aria-label="Reset View"
            title="Reset pan position & zoom to default"
            onClick={() => {
              useStudio.getState().set({ zoom: 1.0, center: { x: 0.5, y: 0.5 } })
              playClickSound()
            }}
            className="px-2 py-0.5 text-[10.5px] font-medium text-accent hover:underline transition-all cursor-pointer"
          >
            Reset
          </button>
        </>
      )}
    </div>
  )
}
