"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import {
  Cancel01Icon,
  ShuffleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { makeDoc } from "@/lib/doc"
import { thumbnail } from "@/lib/engine/renderer"
import { STYLES } from "@/lib/engine/styles"
import {
  COLOR_HUNT_CATEGORIES,
  COLOR_HUNT_PALETTES,
} from "@/lib/color-hunt-palettes"
import {
  DEFAULT_FRAME_CONFIG,
  FRAME_PRESETS,
  type FramePresetId,
} from "@/lib/engine/texture-frame-engine"
import {
  generateTemplateVariations,
  type TemplateVariant,
} from "@/lib/engine/template-variations"
import { PRESETS } from "@/lib/presets"
import { SITE } from "@/lib/site"
import { cn } from "@/lib/utils"
import { useStudio } from "@/store/studio"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Kbd } from "@/components/ui/kbd"
import { Segmented } from "@/components/ui/segmented"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { playClickSound, playPresetSound } from "@/lib/sound"
import { ThemeSwitch } from "./theme-switch"

/* Preset thumbnails, drawn once by the real shader, a few per idle slice. */
const thumbs = new Map<string, string>()
const listeners = new Set<() => void>()
let started = false

function startThumbs() {
  if (started || typeof window === "undefined") return
  started = true
  const queue = [...PRESETS]
  const size = { w: 1920, h: 1200 }
  const next = () => {
    const batch = queue.splice(0, 3)
    for (const p of batch) {
      try {
        const d = { ...makeDoc(p), size }
        thumbs.set(p.id, thumbnail(d, 288, 180, 0.9))
      } catch {}
    }
    listeners.forEach((l) => l())
    if (queue.length) setTimeout(next, 16)
  }
  setTimeout(next, 120)
}

function useThumb(id: string) {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => thumbs.get(id) ?? null,
    () => null
  )
}

function Tile({
  id,
  name,
  active,
  onPick,
}: {
  id: string
  name: string
  active: boolean
  onPick: () => void
}) {
  const src = useThumb(id)
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex min-w-0 flex-col gap-1.5 text-left"
    >
      <span
        className={cn(
          "relative block aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-surface-muted shadow-card transition-[box-shadow,scale] duration-200 ease-out group-hover:shadow-float group-active:scale-[0.96]",
          active &&
            "shadow-[0_0_0_2px_var(--color-ink)] group-hover:shadow-[0_0_0_2px_var(--color-ink)]"
        )}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        )}
      </span>
      <span
        className={cn(
          "truncate px-0.5 text-[12px] text-ink-secondary group-hover:text-ink",
          active && "text-ink"
        )}
      >
        {name}
      </span>
    </button>
  )
}

function Presets() {
  const presetId = useStudio((s) => s.presetId)
  const apply = useStudio((s) => s.applyPreset)
  useEffect(startThumbs, [])
  return (
    <div className="flex flex-col gap-5">
      {STYLES.map((st) => {
        const list = PRESETS.filter((p) => p.style === st.id)
        if (!list.length) return null
        return (
          <section key={st.id}>
            <h3 className="mb-2 px-0.5 text-[12px] font-medium text-ink-tertiary">
              {st.name}
            </h3>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
              {list.map((p) => (
                <Tile
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  active={presetId === p.id}
                  onPick={() => {
                    playPresetSound()
                    apply(p.id)
                  }}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function VariationsView() {
  const doc = useStudio((s) => s.doc)
  const replace = useStudio((s) => s.replace)
  const [rerollCount, setRerollCount] = useState(0)
  const [variants, setVariants] = useState<TemplateVariant[]>([])

  useEffect(() => {
    const list = generateTemplateVariations(doc, 8)
    setVariants(list)
  }, [doc.name, doc.style, doc.seed, rerollCount])

  const handleReroll = () => {
    setRerollCount((c) => c + 1)
    toast("Generated fresh variations", "info")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl border border-line bg-surface/50 p-2.5">
        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-ink truncate max-w-[150px]">
            {doc.name || "Active Template"}
          </span>
          <span className="text-[10.5px] text-ink-muted">
            8 Algorithmic Variations
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleReroll}>
          <Icon icon={ShuffleIcon} className="mr-1 size-3" />
          Re-roll
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
        {variants.map((v) => (
          <VariationTile
            key={v.id}
            v={v}
            onPick={() => {
              replace(v.doc)
              toast(`Applied "${v.name}"`, "ok")
            }}
          />
        ))}
      </div>
    </div>
  )
}

function VariationTile({
  v,
  onPick,
}: {
  v: TemplateVariant
  onPick: () => void
}) {
  const [thumb, setThumb] = useState<string | null>(null)

  useEffect(() => {
    try {
      const src = thumbnail(v.doc, 288, 180, 0.9)
      setThumb(src)
    } catch {}
  }, [v.doc])

  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex min-w-0 flex-col gap-1.5 text-left"
    >
      <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-surface-muted shadow-card transition-all duration-150 group-hover:shadow-float group-active:scale-[0.96]">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        )}
      </span>
      <div className="flex flex-col px-0.5">
        <span className="truncate text-[11.5px] font-medium text-ink-secondary group-hover:text-ink">
          {v.name}
        </span>
        <span className="truncate text-[10px] text-ink-muted">
          {v.description}
        </span>
      </div>
    </button>
  )
}

function TexturesSection() {
  const frame = useStudio((s) => s.doc.frame || DEFAULT_FRAME_CONFIG)
  const set = useStudio((s) => s.set)

  const updateFrame = (patch: Partial<typeof frame>) => {
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
    toast(`Applied "${found.name}"`, "ok")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Standalone Isolate Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12.5px] font-medium text-ink">
            Standalone Texture Mode
          </span>
          <span className="text-[10.5px] text-ink-muted">
            Hide gradient &amp; edit pure vector frame
          </span>
        </div>
        <Switch
          checked={Boolean(frame.enabled && frame.isolateFrame)}
          onChange={(isolated) =>
            updateFrame({ enabled: true, isolateFrame: isolated })
          }
          label="Standalone Texture Mode"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] font-semibold text-ink-tertiary uppercase tracking-wider">
          Curated Vector Presets
        </span>
        <div className="flex flex-col gap-2">
          {FRAME_PRESETS.map((p) => {
            const active = frame.preset === p.id && frame.enabled
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`flex flex-col gap-0.5 rounded-xl border p-2.5 text-left transition-all duration-150 ${
                  active
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-line bg-surface/50 hover:border-line-lift hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-ink">
                    {p.name}
                  </span>
                  {active && <span className="size-2 rounded-full bg-accent" />}
                </div>
                <span className="text-[10.5px] text-ink-muted line-clamp-1">
                  {p.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ColorHuntSection() {
  const [cat, setCat] = useState<string>("all")
  const applyPalette = useStudio((s) => s.applyColorHuntPalette)

  const list =
    cat === "all"
      ? COLOR_HUNT_PALETTES
      : COLOR_HUNT_PALETTES.filter((p) => p.category === cat)

  return (
    <div className="flex flex-col gap-3">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1 pb-1">
        {COLOR_HUNT_CATEGORIES.map((c) => {
          const active = cat === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                playClickSound()
                setCat(c.id)
              }}
              className={`rounded-lg px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                active
                  ? "bg-ink text-background shadow-sm"
                  : "bg-surface-muted text-ink-secondary hover:bg-surface hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Palette List */}
      <div className="flex flex-col gap-2.5">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              playClickSound()
              applyPalette(p.id)
              toast(`Applied "${p.name}" (${p.category})`, "ok")
            }}
            className="group flex flex-col gap-1.5 rounded-xl border border-line bg-surface/50 p-2 text-left transition-all duration-150 hover:border-line-lift hover:bg-surface hover:shadow-card"
          >
            {/* Color Hunt Swatch Bars */}
            <div className="flex h-9 w-full overflow-hidden rounded-[7px] shadow-sm">
              {p.colors.map((hex, idx) => (
                <div
                  key={idx}
                  className="h-full flex-1 transition-transform group-hover:scale-y-105"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
            <div className="flex items-center justify-between px-0.5">
              <span className="truncate text-[11.5px] font-medium text-ink">
                {p.name}
              </span>
              <span className="text-[10px] text-ink-muted capitalize">
                {p.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Library() {
  const saved = useStudio((s) => s.saved)
  const replace = useStudio((s) => s.replace)
  const unsave = useStudio((s) => s.unsave)
  if (!saved.length)
    return (
      <div className="flex flex-col items-center gap-2 rounded-[14px] px-4 py-10 text-center">
        <p className="text-[13px] font-medium text-ink">Nothing saved yet</p>
        <p className="text-[12.5px] text-ink-secondary">
          Keep the gradient you&rsquo;re on with{" "}
          <Kbd keys="mod+s" className="text-ink-secondary" />. It stays in this
          browser.
        </p>
      </div>
    )
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
      {saved.map((s) => (
        <div
          key={s.id}
          className="group relative flex min-w-0 flex-col gap-1.5"
        >
          <button
            type="button"
            onClick={() => replace(s.doc)}
            className="block aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-surface-muted shadow-card transition-[box-shadow,scale] duration-200 hover:shadow-float active:scale-[0.96]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.thumb}
              alt=""
              draggable={false}
              className="size-full object-cover"
            />
          </button>
          <span className="truncate px-0.5 text-[12px] text-ink-secondary">
            {s.doc.name || "Untitled"}
          </span>
          <button
            type="button"
            aria-label={`Remove ${s.doc.name || "gradient"} from library`}
            onClick={() => unsave(s.id)}
            className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full plaque opacity-0 transition-opacity duration-150 group-hover:opacity-100 before:absolute before:-inset-2 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Icon icon={Cancel01Icon} className="size-3" strokeWidth={2.2} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function PresetsPanel({ footer = true }: { footer?: boolean }) {
  const [tab, setTab] = useState<
    "presets" | "palettes" | "variations" | "saved"
  >("presets")
  const count = useStudio((s) => s.saved.length)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="overflow-x-auto scroll-quiet px-2.5 pt-1 pb-2.5">
        <div className="flex min-w-max items-center gap-1 rounded-[11px] bg-surface-muted p-[3px] shadow-[inset_0_0_0_1px_var(--color-hairline)]">
          {[
            { id: "presets", label: "Presets" },
            { id: "palettes", label: "🎨 Palettes" },
            { id: "variations", label: "⚡ Variations" },
            {
              id: "saved",
              label: (
                <span className="flex items-center gap-1.5">
                  📁 Saved Library
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                      count > 0 ? "bg-accent text-white" : "bg-ink/10 text-ink-tertiary"
                    )}
                  >
                    {count}
                  </span>
                </span>
              ),
            },
          ].map((item) => {
            const on = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playClickSound()
                  setTab(item.id as any)
                }}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 rounded-[8px] px-3 py-1 font-medium whitespace-nowrap text-[12.5px] transition-all cursor-pointer",
                  on
                    ? "bg-surface text-ink font-semibold shadow-sm"
                    : "text-ink-secondary hover:text-ink hover:bg-ink/[0.04]"
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1 scroll-quiet overflow-y-auto px-4 pb-4">
        {tab === "presets" && <Presets />}
        {tab === "palettes" && <ColorHuntSection />}
        {tab === "variations" && <VariationsView />}
        {tab === "saved" && <Library />}
      </div>
      {footer && (
        <footer className="flex items-center justify-between gap-2 border-t border-hairline px-4 py-3">
          <ThemeSwitch />
        </footer>
      )}
    </div>
  )
}
