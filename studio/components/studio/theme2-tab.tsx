"use client"

import {
  GridIcon,
  RefreshIcon,
  SparklesIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { useStudio } from "@/store/studio"
import { SliderField } from "@/components/ui/slider-field"
import { Switch } from "@/components/ui/switch"
import { Icon } from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { playClickSound, playPresetSound, playSliderTickSound } from "@/lib/sound"
import type { AsciiConfig } from "@/lib/engine/types"

const DEFAULT_ASCII: AsciiConfig = {
  enabled: true,
  mode: "heatmap",
  charset: "code",
  size: 20,
  radius: 140,
  decay: 0.96,
  color: "#ffffff",
}

const SHAPES = [
  { id: 0, label: "Square" },
  { id: 1, label: "Circle" },
  { id: 2, label: "Triangle" },
  { id: 3, label: "Cross +" },
  { id: 4, label: "V-Lines" },
  { id: 5, label: "H-Lines" },
]

const DITHER_TYPES = [
  { id: 0, label: "Noise" },
  { id: 1, label: "2×2 Bayer" },
  { id: 2, label: "4×4 Bayer" },
  { id: 3, label: "8×8 Bayer" },
]

const CHARSETS = [
  { id: "code", label: "Code", desc: "Procedural vector code" },
  { id: "blocks", label: "Blocks", desc: "Shaded block glyphs" },
  { id: "detailed", label: "Dense", desc: "High density ASCII" },
  { id: "binary", label: "Binary", desc: "0101 Matrix stream" },
  { id: "minimal", label: "Minimal", desc: "Minimalist dots" },
  { id: "standard", label: "Standard", desc: "Balanced charset" },
] as const

export function Theme2Tab() {
  const doc = useStudio((s) => s.doc)
  const setEffect = useStudio((s) => s.setEffect)
  const set = useStudio((s) => s.set)

  const isHalftone = doc.effects.halftone ?? false
  const halftoneType = doc.effects.halftoneType ?? 3
  const halftoneShape = doc.effects.halftoneShape ?? 1
  const halftoneSize = doc.effects.halftoneSize ?? 6
  const halftoneContrast = doc.effects.halftoneContrast ?? 30

  const ascii = { ...DEFAULT_ASCII, ...(doc.ascii ?? {}) }

  const applyTheme2Preset = (mode: "synthwave" | "matrix" | "bayer" | "heatmap" | "binary") => {
    playPresetSound()
    if (mode === "synthwave") {
      set({
        effects: {
          ...doc.effects,
          halftone: true,
          halftoneType: 1,
          halftoneShape: 3, // Cross
          halftoneSize: 8,
          halftoneContrast: 40,
        },
        ascii: {
          enabled: true,
          mode: "dynamic",
          charset: "code",
          size: 16,
          radius: 160,
          decay: 0.95,
          color: "#ffffff",
        },
      })
    } else if (mode === "matrix") {
      set({
        effects: {
          ...doc.effects,
          halftone: true,
          halftoneType: 2, // 4x4 Bayer
          halftoneShape: 0, // Square
          halftoneSize: 6,
          halftoneContrast: 35,
        },
        ascii: {
          enabled: true,
          mode: "heatmap",
          charset: "code",
          size: 18,
          radius: 150,
          decay: 0.96,
          color: "#ffffff",
        },
      })
    } else if (mode === "bayer") {
      set({
        effects: {
          ...doc.effects,
          halftone: true,
          halftoneType: 3, // 8x8 Bayer
          halftoneShape: 1, // Circle
          halftoneSize: 8,
          halftoneContrast: 50,
        },
        ascii: {
          ...ascii,
          enabled: false,
        },
      })
    } else if (mode === "heatmap") {
      set({
        effects: {
          ...doc.effects,
          halftone: false,
        },
        ascii: {
          enabled: true,
          mode: "heatmap",
          charset: "detailed",
          size: 18,
          radius: 200,
          decay: 0.97,
          color: "#ffffff",
        },
      })
    } else if (mode === "binary") {
      set({
        effects: {
          ...doc.effects,
          halftone: true,
          halftoneType: 0,
          halftoneShape: 0,
          halftoneSize: 6,
          halftoneContrast: 30,
        },
        ascii: {
          enabled: true,
          mode: "dynamic",
          charset: "binary",
          size: 16,
          radius: 180,
          decay: 0.94,
          color: "#ffffff",
        },
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 text-ink select-none pb-12">
      {/* Top Banner / Identity */}
      <div className="rounded-xl border border-accent/25 bg-accent/5 p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent/20 text-accent font-mono text-sm font-bold">
              👾
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-ink">Theme 2 Studio Engine</span>
                <span className="rounded bg-accent/20 px-1 py-0.2 text-[9px] font-mono font-semibold uppercase text-accent">
                  Dedicated
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Halftone screen dither & interactive mouse trail ASCII heatmap
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick 1-Click Theme 2 Profiles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
            ⚡ Quick Theme 2 Profiles
          </span>
          <span className="text-[10px] text-ink-muted font-mono">1-Click</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => applyTheme2Preset("synthwave")}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-surface p-2 text-left hover:border-accent/50 hover:bg-surface-lift transition-all cursor-pointer group"
          >
            <span className="text-base">🚀</span>
            <div>
              <div className="text-[12px] font-semibold text-ink group-hover:text-accent transition-colors">
                Cyber Synthwave
              </div>
              <div className="text-[10px] text-ink-muted">Cross dither + code</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => applyTheme2Preset("matrix")}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-surface p-2 text-left hover:border-accent/50 hover:bg-surface-lift transition-all cursor-pointer group"
          >
            <span className="text-base">🕶️</span>
            <div>
              <div className="text-[12px] font-semibold text-ink group-hover:text-accent transition-colors">
                After Hours Matrix
              </div>
              <div className="text-[10px] text-ink-muted">Bayer 4×4 + heatmap</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => applyTheme2Preset("heatmap")}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-surface p-2 text-left hover:border-accent/50 hover:bg-surface-lift transition-all cursor-pointer group"
          >
            <span className="text-base">🌡️</span>
            <div>
              <div className="text-[12px] font-semibold text-ink group-hover:text-accent transition-colors">
                Thermal Heatmap
              </div>
              <div className="text-[10px] text-ink-muted">Mouse trail decay</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => applyTheme2Preset("bayer")}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-surface p-2 text-left hover:border-accent/50 hover:bg-surface-lift transition-all cursor-pointer group"
          >
            <span className="text-base">📺</span>
            <div>
              <div className="text-[12px] font-semibold text-ink group-hover:text-accent transition-colors">
                8-Bit Bayer Print
              </div>
              <div className="text-[10px] text-ink-muted">High contrast dots</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => applyTheme2Preset("binary")}
            className="col-span-2 flex items-center justify-between rounded-lg border border-hairline bg-surface p-2 hover:border-accent/50 hover:bg-surface-lift transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div>
                <div className="text-[12px] font-semibold text-ink group-hover:text-accent transition-colors">
                  Binary Terminal Flow
                </div>
                <div className="text-[10px] text-ink-muted">Reactive 0101 stream + noise dither</div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-accent">Active &rarr;</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-hairline" />

      {/* Module 1: Halftone & Dither Screen */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon={GridIcon} className="size-4 text-accent" />
            <div>
              <span className="text-sm font-semibold text-ink">Halftone Screen & Dither</span>
              <p className="text-[11px] text-ink-muted">Hardware-accelerated GLSL dither</p>
            </div>
          </div>
          <Switch
            label="Enable Halftone"
            checked={Boolean(isHalftone)}
            onChange={(checked) => {
              playClickSound()
              setEffect("halftone", checked)
            }}
          />
        </div>

        {isHalftone && (
          <div className="space-y-4 rounded-xl border border-hairline bg-surface-muted/50 p-3.5">
            {/* Dither Algorithm Matrix */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-ink-secondary">Dither Pattern Matrix</label>
              <div className="grid grid-cols-4 gap-1">
                {DITHER_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      playClickSound()
                      setEffect("halftoneType", t.id)
                    }}
                    className={cn(
                      "rounded-md px-1.5 py-1 text-[11px] font-medium transition-all cursor-pointer border text-center",
                      halftoneType === t.id
                        ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm"
                        : "border-hairline bg-surface text-ink-secondary hover:text-ink hover:border-ink/20"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Geometric Vector Shape */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-ink-secondary">Halftone Particle Shape</label>
              <div className="grid grid-cols-3 gap-1">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      playClickSound()
                      setEffect("halftoneShape", s.id)
                    }}
                    className={cn(
                      "rounded-md px-1.5 py-1 text-[11px] font-medium transition-all cursor-pointer border text-center",
                      halftoneShape === s.id
                        ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm"
                        : "border-hairline bg-surface text-ink-secondary hover:text-ink hover:border-ink/20"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cell Size */}
            <SliderField
              label="Dither Size"
              value={halftoneSize}
              min={2}
              max={32}
              step={0.5}
              unit="px"
              onChange={(val) => {
                playSliderTickSound(val / 32)
                setEffect("halftoneSize", val)
              }}
            />

            {/* Contrast / Edge Sharpness */}
            <SliderField
              label="Dither Contrast"
              value={halftoneContrast}
              min={0}
              max={100}
              step={1}
              format={(v) => `${v}%`}
              onChange={(val) => {
                playSliderTickSound(val / 100)
                setEffect("halftoneContrast", val)
              }}
            />
          </div>
        )}
      </div>

      <div className="h-px bg-hairline" />

      {/* Module 2: Interactive ASCII Matrix & Heatmap */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon={SparklesIcon} className="size-4 text-accent" />
            <div>
              <span className="text-sm font-semibold text-ink">Interactive ASCII Matrix</span>
              <p className="text-[11px] text-ink-muted">Mouse-proximity trail & thermal heatmap</p>
            </div>
          </div>
          <Switch
            label="Enable Matrix"
            checked={Boolean(ascii.enabled)}
            onChange={(checked) => {
              playClickSound()
              set({ ascii: { ...ascii, enabled: checked } })
            }}
          />
        </div>

        {ascii.enabled && (
          <div className="space-y-4 rounded-xl border border-hairline bg-surface-muted/50 p-3.5">
            {/* Mode: Heatmap vs Dynamic */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-ink-secondary">Interaction Mode</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    set({ ascii: { ...ascii, mode: "heatmap" } })
                  }}
                  className={cn(
                    "flex flex-col items-center rounded-lg border p-2 text-center transition-all cursor-pointer",
                    ascii.mode === "heatmap"
                      ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm"
                      : "border-hairline bg-surface text-ink-secondary hover:border-ink/20 hover:text-ink"
                  )}
                >
                  <span className="text-xs font-semibold">🌡️ Heatmap Trail</span>
                  <span className="text-[9.5px] opacity-75">Mouse hover thermal glow</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    set({ ascii: { ...ascii, mode: "dynamic" } })
                  }}
                  className={cn(
                    "flex flex-col items-center rounded-lg border p-2 text-center transition-all cursor-pointer",
                    ascii.mode === "dynamic"
                      ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm"
                      : "border-hairline bg-surface text-ink-secondary hover:border-ink/20 hover:text-ink"
                  )}
                >
                  <span className="text-xs font-semibold">⚡ Dynamic Matrix</span>
                  <span className="text-[9.5px] opacity-75">Continuous reactive</span>
                </button>
              </div>
            </div>

            {/* Character Set */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-ink-secondary">Character Matrix Set</label>
              <div className="grid grid-cols-3 gap-1">
                {CHARSETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      playClickSound()
                      set({ ascii: { ...ascii, charset: c.id } })
                    }}
                    title={c.desc}
                    className={cn(
                      "rounded-md px-1.5 py-1 text-[11px] font-medium transition-all cursor-pointer border text-center",
                      ascii.charset === c.id
                        ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm"
                        : "border-hairline bg-surface text-ink-secondary hover:text-ink hover:border-ink/20"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proximity Radius */}
            <SliderField
              label="Mouse Proximity Radius"
              value={ascii.radius}
              min={40}
              max={400}
              step={10}
              unit="px"
              onChange={(val) => {
                playSliderTickSound(val / 400)
                set({ ascii: { ...ascii, radius: val } })
              }}
            />

            {/* Thermal Decay */}
            <SliderField
              label="Thermal Trail Decay"
              value={ascii.decay}
              min={0.85}
              max={0.99}
              step={0.01}
              onChange={(val) => {
                playSliderTickSound((val - 0.85) / 0.14)
                set({ ascii: { ...ascii, decay: val } })
              }}
            />

            {/* Cell Size */}
            <SliderField
              label="ASCII Font Size"
              value={ascii.size}
              min={10}
              max={32}
              step={1}
              unit="px"
              onChange={(val) => {
                playSliderTickSound(val / 32)
                set({ ascii: { ...ascii, size: val } })
              }}
            />
          </div>
        )}
      </div>

      <div className="h-px bg-hairline" />

      {/* Module 3: Live Movement & Quick Controls */}
      <div className="rounded-xl border border-hairline bg-surface-muted/30 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink">Live Canvas Navigation</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              playClickSound()
              set({ zoom: 1.0, center: { x: 0.5, y: 0.5 } })
            }}
            className="text-xs text-accent"
          >
            <Icon icon={RefreshIcon} className="size-3 mr-1" />
            Reset Pan & Zoom
          </Button>
        </div>
        <p className="text-[11.5px] text-ink-muted leading-relaxed">
          • <strong>Hold & Drag:</strong> Click and hold any blank area on the live canvas to pan the gradient and matrix.<br />
          • <strong>Scroll Wheel:</strong> Zoom in and out smoothly from 20% to 400%.
        </p>
      </div>
    </div>
  )
}
