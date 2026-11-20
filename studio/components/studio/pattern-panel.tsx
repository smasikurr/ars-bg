"use client"

import { useMemo, useRef, useState } from "react"
import {
  Copy01Icon,
  Download04Icon,
  RefreshIcon,
  Search01Icon,
  ShuffleIcon,
  SparklesIcon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"
import {
  ALL_CURATED_PATTERNS,
  DEFAULT_PATTERN_STATE,
  PATTERN_CATEGORIES,
  RESOLUTION_PRESETS,
  buildPatternSVG,
  downloadPatternPNG,
  downloadPatternSVG,
  resolveDimensions,
  type CuratedPattern,
  type PatternState,
  type ResolutionId,
} from "@/lib/engine/pattern-engine"
import { useStudio } from "@/store/studio"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Icon } from "@/components/ui/icon"
import { SliderField } from "@/components/ui/slider-field"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { playClickSound, playSliderTickSound } from "@/lib/sound"

export function PatternPanel() {
  const doc = useStudio((s) => s.doc)
  const set = useStudio((s) => s.set)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportingSvg, setExportingSvg] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const state: PatternState = (doc as any).patternState || DEFAULT_PATTERN_STATE

  const update = (patch: Partial<PatternState>) => {
    set({
      patternState: {
        ...state,
        ...patch,
      },
    } as any)
  }

  // Filtered patterns by category and search query
  const filteredPatterns = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ALL_CURATED_PATTERNS.filter((p) => {
      // Category match
      let catMatch = true
      if (selectedCategory === "procedural") {
        catMatch = p.source === "procedural"
      } else if (selectedCategory === "waves") {
        catMatch = p.tags.some((t) => t.includes("wave") || t.includes("curve"))
      } else if (selectedCategory === "geometric") {
        catMatch = p.tags.some(
          (t) =>
            t.includes("geometric") ||
            t.includes("triangle") ||
            t.includes("diamond") ||
            t.includes("cube") ||
            t.includes("square") ||
            t.includes("hexagon")
        )
      } else if (selectedCategory === "architectural") {
        catMatch = p.source === "hero-patterns" || p.tags.includes("architectural")
      } else if (selectedCategory === "japanese") {
        catMatch = p.tags.some(
          (t) =>
            t.includes("japanese") ||
            t.includes("chinese") ||
            t.includes("ethnic") ||
            t.includes("tribal") ||
            t.includes("islamic")
        )
      } else if (selectedCategory === "circles") {
        catMatch = p.tags.some((t) => t.includes("circle") || t.includes("dot"))
      } else if (selectedCategory === "lines") {
        catMatch = p.tags.some(
          (t) =>
            t.includes("line") ||
            t.includes("stripe") ||
            t.includes("plaid") ||
            t.includes("herringbone")
        )
      } else if (selectedCategory === "organic") {
        catMatch = p.tags.some(
          (t) =>
            t.includes("flower") ||
            t.includes("leaf") ||
            t.includes("memphis") ||
            t.includes("doodle")
        )
      }

      if (!catMatch) return false
      if (!q) return true

      return (
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [selectedCategory, search])

  // Custom SVG upload handler
  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (!content) return

      // Strip outer <svg> and retain inner elements
      const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
      const innerContent = innerMatch ? innerMatch[1] : content

      update({
        preset: "custom",
        customSvgMarkup: innerContent,
      })
      toast("Custom SVG tile loaded!", "ok")
    }
    reader.readAsText(file)
  }

  // Randomize pattern
  const handleRandomize = () => {
    playClickSound()
    const pool = filteredPatterns.length > 0 ? filteredPatterns : ALL_CURATED_PATTERNS
    const picked = pool[Math.floor(Math.random() * pool.length)]
    if (picked) {
      update({
        preset: picked.id,
        seed: Math.floor(Math.random() * 10000) + 1,
      })
      toast(`Loaded: ${picked.title}`, "ok")
    }
  }

  // Copy pure SVG code
  const handleCopySVG = () => {
    try {
      const dim = resolveDimensions(state.resolution, doc.size.w, doc.size.h)
      const svg = buildPatternSVG(state, dim.width, dim.height)
      navigator.clipboard.writeText(svg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast("Pure Vector SVG code copied to clipboard!", "ok")
    } catch {
      toast("Failed to copy SVG", "error")
    }
  }

  // Download pure SVG
  const handleDownloadSVG = () => {
    setExportingSvg(true)
    try {
      downloadPatternSVG(state, doc.size.w, doc.size.h)
      toast("Pure Vector SVG downloaded!", "ok")
    } catch {
      toast("Failed to export SVG", "error")
    } finally {
      setExportingSvg(false)
    }
  }

  // Download 300 DPI PNG
  const handleDownloadPNG = async () => {
    setExporting(true)
    try {
      await downloadPatternPNG(state, doc.size.w, doc.size.h)
      toast("300 DPI High-Resolution PNG downloaded!", "ok")
    } catch (err: any) {
      toast(err.message || "PNG export failed", "error")
    } finally {
      setExporting(false)
    }
  }

  const isProcedural = state.preset.startsWith("procedural-")
  const currentDim = resolveDimensions(state.resolution, doc.size.w, doc.size.h)

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Studio Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-3.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold text-ink">
              Seamless Pattern Studio
            </span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
              8K UHD Quality
            </span>
          </div>
          <span className="text-[11px] text-ink-muted">
            420+ Open-Source SVGs & Infinite Procedural Vector Generator
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1 text-xs font-medium"
            onClick={handleRandomize}
            title="Randomize Pattern"
          >
            <Icon icon={ShuffleIcon} className="size-3.5" />
            Random
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1 text-xs font-medium"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon icon={Upload04Icon} className="size-3.5" />
            Upload
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          className="hidden"
          onChange={handleSvgUpload}
        />
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-2.5">
        <div className="relative flex items-center">
          <Icon
            icon={Search01Icon}
            className="absolute left-3 size-3.5 text-ink-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search 420+ patterns by name, tag, style..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-hairline bg-surface pr-3 pl-8 text-[12px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 text-[11px] text-ink-muted hover:text-ink cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-quiet">
          {PATTERN_CATEGORIES.map((cat) => {
            const on = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playClickSound()
                  setSelectedCategory(cat.id)
                }}
                className={cn(
                  "whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0",
                  on
                    ? "bg-ink text-surface font-semibold shadow-sm"
                    : "bg-surface-muted text-ink-secondary hover:text-ink hover:bg-ink/5"
                )}
              >
                {cat.label} ({cat.count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Pattern Grid / Scroll View */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-ink-muted">
          <span>
            Showing {filteredPatterns.length} of {ALL_CURATED_PATTERNS.length} patterns
          </span>
          {isProcedural && (
            <span className="text-accent font-semibold flex items-center gap-1">
              <Icon icon={SparklesIcon} className="size-3" />
              Procedural Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto scroll-quiet rounded-xl border border-hairline bg-surface/50 p-2">
          {filteredPatterns.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-xs text-ink-muted">
              No matching pattern found for &quot;{search}&quot;.
            </div>
          ) : (
            filteredPatterns.map((p) => {
              const on = state.preset === p.id
              const isProc = p.source === "procedural"
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    playClickSound()
                    update({
                      preset: p.id,
                      tileSize: isProc ? 64 : Math.min(64, p.width || 64),
                    })
                  }}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all cursor-pointer relative overflow-hidden",
                    on
                      ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent/30"
                      : "border-hairline bg-surface hover:border-ink/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-ink line-clamp-1">
                      {p.title}
                    </span>
                    {on && <span className="size-2 rounded-full bg-accent shrink-0" />}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[9.5px] font-semibold uppercase tracking-wider",
                        isProc
                          ? "bg-accent/20 text-accent"
                          : p.source === "hero-patterns"
                          ? "bg-purple-500/15 text-purple-400"
                          : "bg-ink/10 text-ink-secondary"
                      )}
                    >
                      {isProc ? "Procedural" : p.source === "hero-patterns" ? "Hero" : "Vector"}
                    </span>
                    <span className="text-[10.5px] text-ink-muted line-clamp-1">
                      {p.tags[0] || "geometric"}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Procedural Seed Controls (Visible if Procedural Pattern selected) */}
      {isProcedural && (
        <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon icon={SparklesIcon} className="size-3.5 text-accent" />
              <span className="text-[12px] font-semibold text-accent uppercase tracking-wider">
                Procedural Generator Engine
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 text-[11px] font-semibold h-7 px-2"
              onClick={() => {
                playClickSound()
                update({ seed: Math.floor(Math.random() * 10000) + 1 })
              }}
            >
              <Icon icon={RefreshIcon} className="size-3" />
              Roll Seed
            </Button>
          </div>

          <SliderField
            label="Random Seed (1 to 10,000)"
            value={state.seed}
            min={1}
            max={10000}
            step={1}
            unit="#"
            onChange={(v) => {
              playSliderTickSound()
              update({ seed: v })
            }}
          />
        </div>
      )}

      {/* Dimensions & Geometry */}
      <div className="flex flex-col gap-3.5 rounded-xl border border-hairline bg-surface p-3.5">
        <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
          Dimensions & Geometry
        </span>

        <SliderField
          label="Tile Scale / Spacing"
          value={state.tileSize}
          min={12}
          max={240}
          step={2}
          unit="px"
          onChange={(v) => {
            playSliderTickSound()
            update({ tileSize: v })
          }}
        />

        <SliderField
          label="Stroke Weight"
          value={state.strokeWidth}
          min={0.5}
          max={16}
          step={0.5}
          unit="px"
          onChange={(v) => {
            playSliderTickSound()
            update({ strokeWidth: v })
          }}
        />

        {/* Stroke Join Selector */}
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink font-medium">Line Cap & Join</span>
          <div className="flex items-center gap-1 bg-surface-muted p-0.5 rounded-lg border border-hairline">
            {(["round", "square", "miter"] as const).map((mode) => {
              const active = state.strokeJoin === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    playClickSound()
                    update({ strokeJoin: mode })
                  }}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize transition-all cursor-pointer",
                    active
                      ? "bg-ink text-surface font-semibold shadow-xs"
                      : "text-ink-secondary hover:text-ink"
                  )}
                >
                  {mode}
                </button>
              )
            })}
          </div>
        </div>

        <SliderField
          label="Pattern Rotation"
          value={state.rotation}
          min={0}
          max={360}
          step={5}
          unit="°"
          onChange={(v) => {
            playSliderTickSound()
            update({ rotation: v })
          }}
        />

        <SliderField
          label="Opacity"
          value={Math.round(state.opacity * 100)}
          min={5}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => {
            playSliderTickSound()
            update({ opacity: v / 100 })
          }}
        />
      </div>

      {/* Dual-Tone Palette & Ground */}
      <div className="flex flex-col gap-3.5 rounded-xl border border-hairline bg-surface p-3.5">
        <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
          Dual-Tone Palette & Ground
        </span>

        {/* Primary Color */}
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink font-medium">Primary Pattern Color</span>
          <div className="flex items-center gap-2">
            <ColorPicker
              value={state.color}
              onChange={(hex) => update({ color: hex })}
            />
            <span className="font-mono text-xs uppercase text-ink-secondary">
              {state.color}
            </span>
          </div>
        </div>

        {/* Secondary Accent Color */}
        <div className="flex items-center justify-between pt-1 border-t border-hairline/60">
          <div className="flex flex-col">
            <span className="text-[12.5px] text-ink font-medium">Secondary Accent Tone</span>
            <span className="text-[10px] text-ink-muted">Dual-tone highlights & multi-layers</span>
          </div>
          <div className="flex items-center gap-2">
            <ColorPicker
              value={state.secondaryColor}
              onChange={(hex) => update({ secondaryColor: hex })}
            />
            <span className="font-mono text-xs uppercase text-ink-secondary">
              {state.secondaryColor}
            </span>
          </div>
        </div>

        {/* Transparent Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-hairline/60">
          <span className="text-[12.5px] text-ink font-medium">Transparent Ground</span>
          <Switch
            checked={state.transparentBg}
            onChange={(checked) => update({ transparentBg: checked })}
            label="Transparent Background"
          />
        </div>

        {/* Background Color */}
        {!state.transparentBg && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[12.5px] text-ink font-medium">Background Color</span>
            <div className="flex items-center gap-2">
              <ColorPicker
                value={state.backgroundColor}
                onChange={(hex) => update({ backgroundColor: hex })}
              />
              <span className="font-mono text-xs uppercase text-ink-secondary">
                {state.backgroundColor}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Target Export Resolution Selector */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-surface p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
            Export Resolution
          </span>
          <span className="font-mono text-[11px] text-accent font-semibold">
            {currentDim.width} × {currentDim.height} px
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {RESOLUTION_PRESETS.map((res) => {
            const active = state.resolution === res.id
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => {
                  playClickSound()
                  update({ resolution: res.id })
                }}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-left transition-all cursor-pointer",
                  active
                    ? "border-accent bg-accent/10 font-semibold text-ink"
                    : "border-hairline bg-surface text-ink-muted hover:border-ink/20"
                )}
              >
                <div className="text-[11px] font-medium">{res.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-[11.5px] font-semibold text-ink-secondary uppercase tracking-wider">
          Microstock 8K & 300 DPI Export
        </span>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="w-full gap-1.5 text-xs font-medium"
            onClick={handleCopySVG}
          >
            <Icon icon={Copy01Icon} className="size-3.5" />
            {copied ? "Copied!" : "Copy SVG Code"}
          </Button>

          <Button
            variant="primary"
            className="w-full gap-1.5 text-xs font-semibold"
            disabled={exportingSvg}
            onClick={handleDownloadSVG}
          >
            <Icon icon={Download04Icon} className="size-3.5" />
            {exportingSvg ? "Exporting SVG..." : "Download 8K SVG"}
          </Button>
        </div>

        <Button
          variant="secondary"
          className="w-full gap-1.5 text-xs font-semibold mt-1 border-accent/40 text-accent hover:bg-accent/10"
          disabled={exporting}
          onClick={handleDownloadPNG}
        >
          <Icon icon={Download04Icon} className="size-3.5" />
          {exporting ? "Generating 300 DPI PNG..." : `Download 300 DPI PNG (${currentDim.width}×${currentDim.height})`}
        </Button>
      </div>
    </div>
  )
}
