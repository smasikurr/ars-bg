"use client"

import { useRef, useState } from "react"
import {
  Add01Icon,
  ColorPickerIcon,
  Copy01Icon,
  Download04Icon,
  Image01Icon,
  RefreshIcon,
  SparklesIcon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"
import {
  PATTERN_PRESETS,
  DEFAULT_PATTERN_STATE,
  buildPatternSVG,
  downloadPatternPNG,
  downloadPatternSVG,
  type PatternState,
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

  const handleCopySVG = () => {
    try {
      const svg = buildPatternSVG(state, doc.size.w, doc.size.h)
      navigator.clipboard.writeText(svg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast("Pure Vector SVG code copied to clipboard!", "ok")
    } catch {
      toast("Failed to copy SVG", "error")
    }
  }

  const handleDownloadSVG = () => {
    try {
      downloadPatternSVG(state, doc.size.w, doc.size.h)
      toast("Pure Vector SVG downloaded!", "ok")
    } catch {
      toast("Failed to export SVG", "error")
    }
  }

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

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Pattern Library Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-bold text-ink">
            Seamless Pattern Studio
          </span>
          <span className="text-[11.5px] text-ink-muted">
            Vector geometric tiles & custom SVG repeat generator
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 text-xs font-medium"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon icon={Upload04Icon} className="size-3.5" />
          Upload SVG
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          className="hidden"
          onChange={handleSvgUpload}
        />
      </div>

      {/* Preset Cards */}
      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] font-semibold text-ink-secondary uppercase tracking-wider">
          Pattern Library
        </span>
        <div className="grid grid-cols-2 gap-2">
          {PATTERN_PRESETS.map((p) => {
            const on = state.preset === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  playClickSound()
                  update({
                    preset: p.id,
                    tileSize: p.defaultTileSize,
                    strokeWidth: p.defaultStrokeWidth,
                  })
                }}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                  on
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-hairline bg-surface hover:border-ink/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-ink">
                    {p.name}
                  </span>
                  {on && <span className="size-2 rounded-full bg-accent" />}
                </div>
                <span className="text-[11px] text-ink-muted line-clamp-1">
                  {p.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pattern Controls */}
      <div className="flex flex-col gap-3.5 rounded-xl border border-hairline bg-surface p-3.5">
        <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
          Dimensions & Geometry
        </span>

        <SliderField
          label="Tile Size / Scale"
          value={state.tileSize}
          min={8}
          max={160}
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
          max={12}
          step={0.5}
          unit="px"
          onChange={(v) => {
            playSliderTickSound()
            update({ strokeWidth: v })
          }}
        />

        <SliderField
          label="Rotation"
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

      {/* Color Palette & Ground */}
      <div className="flex flex-col gap-3.5 rounded-xl border border-hairline bg-surface p-3.5">
        <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
          Palette & Ground
        </span>

        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink font-medium">Pattern Color</span>
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

        <div className="flex items-center justify-between pt-1 border-t border-hairline/60">
          <span className="text-[12.5px] text-ink font-medium">Transparent Background</span>
          <Switch
            checked={state.transparentBg}
            onChange={(checked) => update({ transparentBg: checked })}
            label="Transparent Background"
          />
        </div>

        {!state.transparentBg && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[12.5px] text-ink font-medium">Background Ground</span>
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

      {/* Actions / Export Bar */}
      <div className="flex flex-col gap-2 pt-2">
        <span className="text-[11.5px] font-semibold text-ink-secondary uppercase tracking-wider">
          Vector & 300 DPI Export
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
            onClick={handleDownloadSVG}
          >
            <Icon icon={Download04Icon} className="size-3.5" />
            Download SVG
          </Button>
        </div>

        <Button
          variant="secondary"
          className="w-full gap-1.5 text-xs font-medium mt-1"
          disabled={exporting}
          onClick={handleDownloadPNG}
        >
          <Icon icon={Download04Icon} className="size-3.5" />
          {exporting ? "Generating 300 DPI PNG..." : "Download 300 DPI PNG"}
        </Button>
      </div>
    </div>
  )
}
