"use client"

import { RefreshIcon } from "@hugeicons/core-free-icons"
import { DEFAULT_ASCII } from "@/lib/doc"
import { DEFAULT_EFFECTS, EFFECT } from "@/lib/engine/styles"
import type { AsciiConfig, Effects } from "@/lib/engine/types"
import { useStudio } from "@/store/studio"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Row, Section } from "@/components/ui/section"
import { Select } from "@/components/ui/select"
import { SliderField } from "@/components/ui/slider-field"
import { Switch } from "@/components/ui/switch"
import { Tip } from "@/components/ui/tooltip"
import { playClickSound, playSliderTickSound } from "@/lib/sound"

const off = (v: number) => (v === 0 ? "Off" : undefined)

const GROUPS: {
  title: string
  keys: (keyof Effects)[]
  note?: string
  format?: Partial<Record<keyof Effects, (v: number) => string | undefined>>
  reset?: Partial<Effects>
}[] = [
  {
    title: "Blur",
    keys: ["blur"],
    note: "Soft diffusion blur applied to the gradient.",
    reset: { blur: 0 },
  },
  {
    title: "Fluted glass & plastic",
    keys: ["glass", "glassSize", "glassAngle"],
    note: "Reeded fluted glass and refractive surface sheen.",
    reset: { glass: 0, glassSize: 16, glassAngle: 0 },
  },
  {
    title: "Grain",
    keys: ["grain", "grainSize"],
    note: "Fine film grain texture overlay on top of all layers.",
    reset: { grain: 0, grainSize: 1 },
  },
  {
    title: "Retro & dither",
    keys: ["dither", "ditherSize", "pixelate"],
    format: { dither: off, pixelate: off },
    note: "Ordered dithering and pixel cells, sized in artboard pixels.",
  },
  {
    title: "Colour & tone",
    keys: ["brightness", "contrast", "saturation", "hue", "vignette"],
  },
]

export function EffectsTab() {
  const doc = useStudio((s) => s.doc)
  const effects = useStudio((s) => s.doc.effects)
  const setEffect = useStudio((s) => s.setEffect)
  const set = useStudio((s) => s.set)
  return (
    <>
      {GROUPS.map((g) => {
        const base = { ...DEFAULT_EFFECTS, ...g.reset }
        const changed = g.keys.some((k) => effects[k] !== base[k])
        return (
          <Section
            key={g.title}
            title={g.title}
            actions={
              changed && (
                <Tip label={`Reset ${g.title.toLowerCase()}`}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Reset ${g.title.toLowerCase()}`}
                    onClick={() =>
                      set({
                        effects: {
                          ...effects,
                          ...Object.fromEntries(
                            g.keys.map((k) => [k, base[k]])
                          ),
                        },
                      })
                    }
                  >
                    <Icon icon={RefreshIcon} className="size-[15px]" />
                  </Button>
                </Tip>
              )
            }
          >
            {g.keys.map((k) => {
              const d = EFFECT[k]
              const fmt = g.format?.[k]
              return (
                <SliderField
                  key={k}
                  label={d.label}
                  value={(effects[k] as number) ?? 0}
                  min={k === "dither" ? 0 : d.min}
                  max={d.max}
                  step={d.step}
                  unit={d.unit}
                  format={
                    fmt ? (v) => fmt(v) ?? `${v}${d.unit ?? ""}` : undefined
                  }
                  onChange={(v) => {
                    // Dithering below two levels means nothing; snap to off.
                    if (k === "dither" && v > 0 && v < 2)
                      v = effects.dither >= 2 ? 0 : 2
                    if (k === "pixelate" && v > 0 && v < 2)
                      v = effects.pixelate >= 2 ? 0 : 2
                    setEffect(k, v)
                  }}
                />
              )
            })}
            {g.note && (
              <p className="mt-1 text-[12px] leading-relaxed text-ink-tertiary">
                {g.note}
              </p>
            )}
          </Section>
        )
      })}

      {/* Halftone / Dither System */}
      <Section title="Halftone Screen & Dither">
        <Row label="Enable Halftone">
          <Switch
            label="Enable Halftone"
            checked={Boolean(effects.halftone)}
            onChange={(checked) => {
              playClickSound()
              setEffect("halftone", checked)
            }}
          />
        </Row>
        {effects.halftone && (
          <>
            <Row label="Dither Matrix">
              <Select
                label="Dither Type"
                value={String(effects.halftoneType ?? 3)}
                onChange={(v) => {
                  playClickSound()
                  setEffect("halftoneType", Number(v))
                }}
                options={[
                  { id: "3", label: "8×8 Bayer (Ordered)" },
                  { id: "2", label: "4×4 Bayer" },
                  { id: "1", label: "2×2 Bayer" },
                  { id: "0", label: "Random Noise" },
                ]}
              />
            </Row>
            <Row label="Dither Shape">
              <Select
                label="Dither Shape"
                value={String(effects.halftoneShape ?? 1)}
                onChange={(v) => {
                  playClickSound()
                  setEffect("halftoneShape", Number(v))
                }}
                options={[
                  { id: "1", label: "Circle" },
                  { id: "0", label: "Square" },
                  { id: "2", label: "Triangle" },
                  { id: "3", label: "Cross (+)" },
                  { id: "4", label: "Vertical Lines" },
                  { id: "5", label: "Horizontal Lines" },
                ]}
              />
            </Row>
            <SliderField
              label="Dither Size"
              value={effects.halftoneSize ?? 6}
              min={2}
              max={32}
              step={0.5}
              unit="px"
              onChange={(v) => {
                playSliderTickSound(v / 32)
                setEffect("halftoneSize", v)
              }}
            />
            <SliderField
              label="Dither Contrast"
              value={effects.halftoneContrast ?? 30}
              min={0}
              max={100}
              step={1}
              format={(v) => `${v}%`}
              onChange={(v) => {
                playSliderTickSound(v / 100)
                setEffect("halftoneContrast", v)
              }}
            />
          </>
        )}
      </Section>

      {/* Interactive ASCII Matrix */}
      <Section title="Interactive ASCII Matrix">
        <Row label="Enable Matrix">
          <Switch
            label="Enable Matrix"
            checked={Boolean(doc.ascii?.enabled)}
            onChange={(checked) => {
              playClickSound()
              const cur = doc.ascii ?? DEFAULT_ASCII
              set({ ascii: { ...cur, enabled: checked } })
            }}
          />
        </Row>
        {doc.ascii?.enabled && (
          <>
            <Row label="Mode">
              <Select
                label="Mode"
                value={doc.ascii.mode ?? "heatmap"}
                onChange={(v) => {
                  playClickSound()
                  const cur = doc.ascii ?? DEFAULT_ASCII
                  set({ ascii: { ...cur, mode: v as "heatmap" | "dynamic" } })
                }}
                options={[
                  { id: "heatmap", label: "Heatmap Decay (Mouse Trail)" },
                  { id: "dynamic", label: "Dynamic Background" },
                ]}
              />
            </Row>
            <Row label="Character Set">
              <Select
                label="Character Set"
                value={doc.ascii.charset ?? "code"}
                onChange={(v) => {
                  playClickSound()
                  const cur = doc.ascii ?? DEFAULT_ASCII
                  set({ ascii: { ...cur, charset: v as any } })
                }}
                options={[
                  { id: "code", label: "Code Snippet" },
                  { id: "standard", label: "Standard (@%#*+)" },
                  { id: "blocks", label: "Blocks (██▓▒░)" },
                  { id: "detailed", label: "Detailed ($@B%8)" },
                  { id: "minimal", label: "Minimal (·■)" },
                  { id: "binary", label: "Binary (01)" },
                ]}
              />
            </Row>
            <SliderField
              label="Cell Size"
              value={doc.ascii.size ?? 20}
              min={12}
              max={36}
              step={1}
              unit="px"
              onChange={(v) => {
                playSliderTickSound(v / 36)
                const cur = doc.ascii ?? DEFAULT_ASCII
                set({ ascii: { ...cur, size: v } })
              }}
            />
            <SliderField
              label="Mouse Radius"
              value={doc.ascii.radius ?? 120}
              min={40}
              max={240}
              step={5}
              unit="px"
              onChange={(v) => {
                playSliderTickSound(v / 240)
                const cur = doc.ascii ?? DEFAULT_ASCII
                set({ ascii: { ...cur, radius: v } })
              }}
            />
            <SliderField
              label="Thermal Decay"
              value={Math.round((doc.ascii.decay ?? 0.92) * 100)}
              min={50}
              max={98}
              step={1}
              format={(v) => `${v}%`}
              onChange={(v) => {
                playSliderTickSound(v / 100)
                const cur = doc.ascii ?? DEFAULT_ASCII
                set({ ascii: { ...cur, decay: v / 100 } })
              }}
            />
          </>
        )}
      </Section>
    </>
  )
}
