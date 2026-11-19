"use client"

import { useState, useRef } from "react"
import {
  Download04Icon,
  PlayIcon,
  StopIcon,
  Tick02Icon,
  SparklesIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons"
import { useStudio } from "@/store/studio"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Segmented } from "@/components/ui/segmented"
import { toast } from "@/components/ui/toast"
import { downloadBlob } from "@/lib/utils"
import { executeBulkExport } from "@/lib/export/bulk-unique-engine"

export function AutoGeneratorTab() {
  const doc = useStudio((s) => s.doc)
  const [count, setCount] = useState<number>(50)
  const [res, setRes] = useState<"4k" | "stock24" | "square25" | "fhd">("4k")
  const [mode, setMode] = useState<"all_styles_mix" | "current_style">("all_styles_mix")
  const [progress, setProgress] = useState<{ done: number; total: number; msg: string } | null>(null)
  const [previewThumbs, setPreviewThumbs] = useState<{ id: number; dataUrl: string }[]>([])
  const abort = useRef<AbortController | null>(null)

  const resMap = {
    "4k": { w: 3840, h: 2160, label: "4K UHD (3840×2160, 8.3 MP)" },
    "stock24": { w: 6000, h: 4000, label: "Adobe Stock 24MP (6000×4000)" },
    "square25": { w: 5000, h: 5000, label: "Square Master 25MP (5000×5000)" },
    "fhd": { w: 1920, h: 1080, label: "Full HD (1920×1080, 2.1 MP)" },
  }

  const { w, h } = resMap[res]

  const handleStart = async () => {
    abort.current = new AbortController()
    setProgress({ done: 0, total: count, msg: "Initializing Randomization Engine..." })
    setPreviewThumbs([])

    try {
      const blob = await executeBulkExport(doc, {
        count,
        width: w,
        height: h,
        quality: 0.98,
        mode,
        onProgress: (d, t, m) => {
          setProgress({ done: d, total: t, msg: m })
        },
        signal: abort.current.signal,
      })

      downloadBlob(
        blob,
        `ARS-BG-PRO-AUTO-BULK-${count}-ASSETS-${w}x${h}.zip`
      )
      toast(`Success! ${count} 100% Unique Backgrounds + SEO CSV downloaded!`)
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast(e instanceof Error ? e.message : "Auto generation failed", "error")
      }
    }
    setProgress(null)
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Header Banner */}
      <div className="rounded-[12px] bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-blue-500/10 p-3.5 border border-hairline shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="grid size-5 place-items-center rounded-full bg-amber-500 text-black text-xs font-bold">⚡</span>
          <span className="text-[13px] font-semibold text-ink">Autonomous Zero-Duplicate Engine</span>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-secondary">
          Generates completely random, non-repeating backgrounds. No fixed presets or static templates. Every asset uses procedural OKLCH color harmonies, randomized wave frequencies, and dynamic warp physics.
        </p>
      </div>

      {/* Batch Quantity */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-medium text-ink flex items-center justify-between">
          <span>Batch Quantity</span>
          <span className="text-[11px] text-amber-500 font-mono">100-200 User Safe</span>
        </label>
        <Segmented
          label="Batch Quantity"
          value={String(count)}
          onChange={(v) => setCount(Number(v))}
          options={[
            { id: "20", label: "20" },
            { id: "50", label: "50" },
            { id: "100", label: "100" },
            { id: "150", label: "150" },
            { id: "200", label: "200" },
          ]}
        />
      </div>

      {/* Style Randomization Mode */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-medium text-ink">Randomization Diversity</label>
        <Segmented
          label="Randomization Diversity"
          size="sm"
          value={mode}
          onChange={(v) => setMode(v as "all_styles_mix" | "current_style")}
          options={[
            { id: "all_styles_mix", label: "Full Procedural Chaos (Mix All Styles)" },
            { id: "current_style", label: "Active Style Only" },
          ]}
        />
        <span className="text-[11px] text-ink-tertiary">
          {mode === "all_styles_mix" 
            ? "Rotates dynamically across Mesh, Fluid, Waves, Orbs, Linear, Radial, and Conic with unique color physics."
            : "Maintains current canvas style archetype while randomizing color harmonics, points, and warp parameters."}
        </span>
      </div>

      {/* Resolution */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-medium text-ink">Canvas Resolution & Subsampling</label>
        <Segmented
          label="Canvas Resolution"
          size="sm"
          value={res}
          onChange={(v) => setRes(v as "4k" | "stock24" | "square25" | "fhd")}
          options={[
            { id: "4k", label: "4K UHD" },
            { id: "stock24", label: "Stock 24MP" },
            { id: "square25", label: "Square 25MP" },
            { id: "fhd", label: "1080p FHD" },
          ]}
        />
        <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
          <span>{resMap[res].label}</span>
          <span className="font-mono text-emerald-500">4:4:4 High-Chroma sRGB</span>
        </div>
      </div>

      {/* Action / Progress Box */}
      {progress !== null ? (
        <div className="flex flex-col gap-2.5 rounded-[12px] bg-surface-muted p-4 border border-hairline">
          <div className="flex items-center justify-between text-[12px] text-ink font-medium">
            <span className="truncate pr-2">{progress.msg}</span>
            <span className="font-mono tabular-nums text-amber-500">
              {progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-base border border-hairline">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-150"
              style={{
                width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-ink-tertiary pt-1">
            <span>Rendered: {progress.done} / {progress.total} assets</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => abort.current?.abort()}
            >
              <Icon icon={StopIcon} className="size-3 text-red-400" />
              Cancel Batch
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          <Button
            variant="primary"
            size="default"
            className="w-full justify-center bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-black font-semibold hover:opacity-95 shadow-md py-3 text-[13.5px]"
            onClick={handleStart}
          >
            <Icon icon={SparklesIcon} className="size-4" />
            Start Auto Generation ({count} Assets)
          </Button>
          <p className="text-center text-[11px] text-ink-tertiary">
            Includes 50-Keyword Adobe Stock / Shutterstock metadata CSV.
          </p>
        </div>
      )}

      {/* Technical Specifications Checklist */}
      <div className="flex flex-col gap-2 rounded-[10px] bg-surface-muted/50 p-3 border border-hairline">
        <span className="text-[11.5px] font-semibold text-ink uppercase tracking-wider">Stock Compliance Assurances</span>
        <ul className="flex flex-col gap-1.5 text-[11.5px] text-ink-secondary">
          <li className="flex items-center gap-1.5">
            <Icon icon={Tick02Icon} className="size-3.5 text-emerald-500 shrink-0" />
            <span>Anti-Banding: 16-bit to 8-bit Blue Noise Triangular Dither</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Icon icon={Tick02Icon} className="size-3.5 text-emerald-500 shrink-0" />
            <span>Uniqueness: Minimum OKLCH &Delta;E &ge; 25% Perceptual Distance</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Icon icon={Tick02Icon} className="size-3.5 text-emerald-500 shrink-0" />
            <span>Multi-User Safe: Persistent cryptographically distinct seed ledger</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Icon icon={Tick02Icon} className="size-3.5 text-emerald-500 shrink-0" />
            <span>Metadata: 50 Algorithmic Stock Keywords in packaged CSV</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
