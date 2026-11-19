"use client"

import { useState } from "react"
import {
  Copy01Icon,
  Download04Icon,
  SparklesIcon,
  ShuffleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import {
  DEFAULT_FRAME_CONFIG,
  FRAME_PRESETS,
  generateDistressedFrame,
  type FrameConfig,
  type FramePresetId,
} from "@/lib/engine/texture-frame-engine"
import { downloadBlob } from "@/lib/utils"
import { useStudio } from "@/store/studio"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Segmented } from "@/components/ui/segmented"
import { SliderField } from "@/components/ui/slider-field"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

export function TexturesTab() {
  const frame = useStudio((s) => s.doc.frame || DEFAULT_FRAME_CONFIG)
  const size = useStudio((s) => s.doc.size)
  const set = useStudio((s) => s.set)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const updateFrame = (patch: Partial<FrameConfig>) => {
    set({
      frame: {
        ...frame,
        ...patch,
      },
    })
  }

  const applyPreset = (presetId: FramePresetId) => {
    const found = FRAME_PRESETS.find((p) => p.id === presetId)
    if (!found) return
    updateFrame({
      enabled: true,
      preset: presetId,
      ...found.config,
    })
    toast(`Applied "${found.name}"`, "info")
  }

  const randomizeSeed = () => {
    const nextSeed = Math.floor(Math.random() * 900000) + 100000
    updateFrame({ seed: nextSeed })
    toast(`Seed randomized: #${nextSeed}`, "info")
  }

  const handleDownloadSVG = () => {
    try {
      const generated = generateDistressedFrame(frame, size.w, size.h)
      const blob = new Blob([generated.svgMarkup], { type: "image/svg+xml" })
      downloadBlob(blob, `distressed-frame-${frame.preset}-${size.w}x${size.h}.svg`)
      toast("SVG Vector Frame downloaded!", "ok")
    } catch (err) {
      toast("Failed to export SVG", "error")
    }
  }

  const handleDownloadEPS = () => {
    try {
      const generated = generateDistressedFrame(frame, size.w, size.h)
      const blob = new Blob([generated.epsMarkup], { type: "application/postscript" })
      downloadBlob(blob, `distressed-frame-${frame.preset}-${size.w}x${size.h}.eps`)
      toast("EPS 10 Vector (Stock Ready) downloaded!", "ok")
    } catch (err) {
      toast("Failed to export EPS", "error")
    }
  }

  const handleDownloadPNG = async () => {
    setExporting(true)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = size.w
      canvas.height = size.h
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas context unavailable")

      const generated = generateDistressedFrame(frame, size.w, size.h)
      const path2d = new Path2D(generated.pathData)
      ctx.fillStyle = frame.color
      ctx.globalAlpha = frame.opacity
      ctx.fill(path2d, "evenodd")

      canvas.toBlob((blob) => {
        if (!blob) throw new Error("PNG encoding failed")
        downloadBlob(blob, `distressed-frame-${frame.preset}-${size.w}x${size.h}.png`)
        toast("4K Transparent PNG downloaded!", "ok")
        setExporting(false)
      }, "image/png")
    } catch (err) {
      toast("Failed to export PNG", "error")
      setExporting(false)
    }
  }

  const handleCopySVG = () => {
    try {
      const generated = generateDistressedFrame(frame, size.w, size.h)
      navigator.clipboard.writeText(generated.svgMarkup)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast("SVG markup copied to clipboard!", "ok")
    } catch (err) {
      toast("Failed to copy SVG", "error")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Enable Overlay Switch */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-medium text-ink">
              Distressed Frame & Texture
            </span>
            <span className="text-[11.5px] text-ink-muted">
              Photocopy xerox edge erosion, ink splatter, and vector frames
            </span>
          </div>
          <Switch
            checked={frame.enabled}
            onChange={(checked) => updateFrame({ enabled: checked })}
            label="Enable Distressed Frame"
          />
        </div>

        {frame.enabled && (
          <div className="flex flex-col gap-2 pt-2 border-t border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-ink">
                Standalone Mode (Decouple from Gradient)
              </span>
              <Switch
                checked={Boolean(frame.isolateFrame)}
                onChange={(isolate) => updateFrame({ isolateFrame: isolate })}
                label="Standalone Texture Mode"
              />
            </div>
            {frame.isolateFrame && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11.5px] text-ink-secondary">Canvas Ground</span>
                <Segmented
                  label="Canvas Ground"
                  value={frame.frameBackground || "transparent"}
                  onChange={(bg) => updateFrame({ frameBackground: bg as any })}
                  options={[
                    { id: "transparent", label: "Transparent" },
                    { id: "white", label: "White" },
                    { id: "black", label: "Black" },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preset Cards Grid */}
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
          Curated Frame Presets
        </span>
        <div className="grid grid-cols-2 gap-2">
          {FRAME_PRESETS.map((p) => {
            const active = frame.preset === p.id && frame.enabled
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all duration-150 ${
                  active
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-line bg-surface/50 hover:border-line-lift hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-ink leading-tight">
                    {p.name}
                  </span>
                  {active && (
                    <span className="size-2 rounded-full bg-accent" />
                  )}
                </div>
                <span className="text-[10.5px] text-ink-muted line-clamp-2 leading-snug">
                  {p.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Geometry & Noise Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface/40 p-4">
        <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
          Procedural Geometry & Noise
        </span>

        <SliderField
          label="Border Margin"
          value={frame.margin}
          min={4}
          max={35}
          step={1}
          unit="%"
          onChange={(margin) => updateFrame({ margin })}
        />

        <SliderField
          label="Border Thickness"
          value={frame.thickness}
          min={2}
          max={20}
          step={1}
          unit="%"
          onChange={(thickness) => updateFrame({ thickness })}
        />

        <SliderField
          label="Erosion Roughness (fBm)"
          value={Math.round(frame.roughness * 100)}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(val) => updateFrame({ roughness: val / 100 })}
        />

        <SliderField
          label="Splatter Flecks & Chipping"
          value={Math.round(frame.splatter * 100)}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(val) => updateFrame({ splatter: val / 100 })}
        />

        <SliderField
          label="Frame Opacity"
          value={Math.round(frame.opacity * 100)}
          min={10}
          max={100}
          step={1}
          unit="%"
          onChange={(val) => updateFrame({ opacity: val / 100 })}
        />
      </div>

      {/* Color, Blend & Seed */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface/40 p-4">
        <span className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wider">
          Style & Deterministic Seed
        </span>

        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-secondary">Frame Color</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateFrame({ color: "#000000" })}
              className={`size-6 rounded-md border ${
                frame.color === "#000000" ? "border-accent ring-2 ring-accent/30" : "border-line"
              } bg-black`}
              title="Black"
            />
            <button
              type="button"
              onClick={() => updateFrame({ color: "#ffffff" })}
              className={`size-6 rounded-md border ${
                frame.color === "#ffffff" ? "border-accent ring-2 ring-accent/30" : "border-line"
              } bg-white`}
              title="White"
            />
            <input
              type="color"
              value={frame.color}
              onChange={(e) => updateFrame({ color: e.target.value })}
              className="size-7 cursor-pointer rounded border border-line bg-transparent p-0.5"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-ink-secondary">Blend Mode</span>
          <Segmented
            label="Blend Mode"
            value={frame.blend}
            onChange={(b) => updateFrame({ blend: b as FrameConfig["blend"] })}
            options={[
              { id: "normal", label: "Normal" },
              { id: "multiply", label: "Multiply" },
              { id: "screen", label: "Screen" },
              { id: "overlay", label: "Overlay" },
              { id: "difference", label: "Diff" },
            ]}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[12.5px] text-ink-secondary">Seed Lock</span>
            <span className="text-[11px] text-ink-muted">#{frame.seed}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={randomizeSeed}>
            <Icon icon={ShuffleIcon} className="mr-1.5 size-3.5" />
            Randomize Seed
          </Button>
        </div>
      </div>

      {/* Vector & Asset Export Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center gap-2">
          <Icon icon={SparklesIcon} className="size-4 text-accent" />
          <span className="text-[12.5px] font-semibold text-ink">
            Vector & Stock Export
          </span>
        </div>
        <p className="text-[11.5px] text-ink-muted leading-relaxed">
          Export this distressed frame as pure resolution-independent vector paths (<code className="text-accent">&lt;path fill-rule="evenodd"&gt;</code>) or native EPS 10 formatted for Adobe Stock &amp; Shutterstock.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="secondary" onClick={handleDownloadSVG}>
            <Icon icon={Download04Icon} className="mr-1.5 size-3.5" />
            Download SVG
          </Button>
          <Button variant="primary" onClick={handleDownloadEPS}>
            <Icon icon={Download04Icon} className="mr-1.5 size-3.5" />
            Download EPS 10
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={handleDownloadPNG} disabled={exporting}>
            <Icon icon={Download04Icon} className="mr-1.5 size-3.5" />
            {exporting ? "Rendering..." : "4K PNG Overlay"}
          </Button>
          <Button variant="ghost" onClick={handleCopySVG}>
            <Icon icon={copied ? Tick02Icon : Copy01Icon} className="mr-1.5 size-3.5" />
            {copied ? "Copied!" : "Copy SVG"}
          </Button>
        </div>
      </div>
    </div>
  )
}
