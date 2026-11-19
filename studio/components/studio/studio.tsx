"use client"

import { useLayoutEffect } from "react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { clock } from "@/lib/engine/clock"
import { decodeDoc } from "@/lib/share"
import { cn } from "@/lib/utils"
import { useDesktop } from "@/hooks/use-media"
import { persist, restore, useStudio, type Panel } from "@/store/studio"
import { Icon } from "@/components/ui/icon"
import { Segmented } from "@/components/ui/segmented"
import { Toaster, toast } from "@/components/ui/toast"
import { TipProvider } from "@/components/ui/tooltip"
import { EffectsTab } from "./effects-tab"
import { ExportDialog } from "./export-dialog"
import { GradientTab } from "./gradient-tab"
import { LayersTab } from "./layers-tab"
import { PresetsPanel } from "./presets-panel"
import { AutoGeneratorTab } from "./auto-generator-tab"
import { TexturesTab } from "./textures-tab"
import { Theme2Tab } from "./theme2-tab"
import { Theme2Panel } from "./theme2-panel"
import { PatternPanel } from "./pattern-panel"
import { ShortcutsDialog, useShortcuts } from "./shortcuts"
import { SizePicker } from "./size-picker"
import { Stage } from "./stage"
import { Toolbar } from "./toolbar"
import { TopBar } from "./top-bar"
import { ZoomHUD } from "./zoom-hud"

const TABS = [
  { id: "gradient", label: "Gradient" },
  { id: "effects", label: "Effects" },
  { id: "layers", label: "Layers" },
  { id: "patterns", label: "▦ Patterns" },
  { id: "auto", label: "⚡ Auto Generator" },
] as const

function TabBody({ panel }: { panel: Panel }) {
  if (panel === "presets") return <PresetsPanel footer={false} />
  if (panel === "effects") return <EffectsTab />
  if (panel === "theme2") return <Theme2Tab />
  if (panel === "layers") return <LayersTab />
  if (panel === "patterns" || panel === "textures") return <PatternPanel />
  if (panel === "auto") return <AutoGeneratorTab />
  return <GradientTab />
}

function Inspector() {
  const panel = useStudio((s) => s.panel)
  const setUI = useStudio((s) => s.setUI)
  const tab = panel === "presets" ? "gradient" : panel
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 pt-1 pb-1">
        <Segmented
          label="Inspector"
          value={tab}
          onChange={(p) => setUI({ panel: p })}
          options={TABS}
        />
      </div>
      <div className="min-h-0 flex-1 scroll-quiet overflow-y-auto">
        <TabBody panel={tab} />
      </div>
    </div>
  )
}

function useBoot() {
  // Before first paint: the shared link, or what you had open last time.
  useLayoutEffect(() => {
    restore()
    const m = location.hash.match(/#g=([\w-]+)/)
    if (m) {
      const shared = decodeDoc(m[1])
      if (shared) {
        useStudio.getState().replace(shared.doc)
        clock.phase = shared.phase
        history.replaceState(null, "", location.pathname)
        setTimeout(
          () =>
            toast(`Opened “${shared.doc.name || "a shared gradient"}”`, "info"),
          300
        )
      }
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      useStudio.setState({ playing: false })
    if (process.env.NODE_ENV === "development")
      import("@/lib/export/dev").then((m) => m.expose())
    return persist()
  }, [])
}

export function Studio() {
  useBoot()
  useShortcuts()
  const desktop = useDesktop()
  const zen = useStudio((s) => s.zen)
  const panel = useStudio((s) => s.panel)
  const studioMode = useStudio((s) => s.studioMode)
  const setUI = useStudio((s) => s.setUI)

  return (
    <TipProvider>
      <div className="flex h-dvh flex-col bg-background text-ink">
        {!zen && <TopBar compact={!desktop} />}

        {desktop ? (
          <div className="flex min-h-0 flex-1">
            {!zen && studioMode !== "theme2" && (
              <aside
                aria-label="Presets"
                className="flex w-[264px] shrink-0 flex-col"
              >
                <PresetsPanel />
              </aside>
            )}
            <main className={cn("relative min-w-0 flex-1", !zen && "pb-3")}>
              <div
                className={cn(
                  "relative h-full overflow-hidden",
                  !zen && "rounded-[20px] shadow-card"
                )}
              >
                <Stage inset={{ top: 64, bottom: 84, x: 48 }} />
                {!zen && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-3.5 z-30 flex items-center justify-between px-4">
                      <div className="pointer-events-auto">
                        <SizePicker />
                      </div>
                      <div className="pointer-events-auto">
                        <ZoomHUD />
                      </div>
                    </div>
                    {studioMode !== "theme2" && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                        <div className="pointer-events-auto">
                          <Toolbar />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
            {!zen && (
              <aside
                aria-label="Inspector"
                className={cn("flex shrink-0 flex-col min-h-0", (studioMode === "theme2" || studioMode === "patterns") ? "w-[390px] pr-3 pb-3" : "w-[320px]")}
              >
                {studioMode === "theme2" ? (
                  <Theme2Panel />
                ) : studioMode === "patterns" ? (
                  <PatternPanel />
                ) : (
                  <Inspector />
                )}
              </aside>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <main
              className={cn(
                "relative min-h-0 flex-1",
                !zen && "mx-2 overflow-hidden rounded-[18px] shadow-card"
              )}
            >
              <Stage inset={{ top: 52, bottom: 64, x: 14 }} />
              {!zen && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-2.5 z-30 flex items-center justify-between px-3">
                    <div className="pointer-events-auto">
                      <SizePicker />
                    </div>
                    <div className="pointer-events-auto">
                      <ZoomHUD />
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center">
                    <div className="pointer-events-auto">
                      <Toolbar compact />
                    </div>
                  </div>
                </>
              )}
            </main>
            {!zen && (
              <section
                aria-label="Controls"
                className="flex h-[46dvh] shrink-0 flex-col pt-2.5 pb-[env(safe-area-inset-bottom)]"
              >
                {studioMode === "theme2" ? (
                  <div className="min-h-0 flex-1 scroll-quiet overflow-y-auto">
                    <Theme2Panel />
                  </div>
                ) : studioMode === "patterns" ? (
                  <div className="min-h-0 flex-1 scroll-quiet overflow-y-auto">
                    <PatternPanel />
                  </div>
                ) : (
                  <>
                    <div className="px-3 pb-1">
                      <Segmented
                        label="Panel"
                        value={panel}
                        onChange={(p) => setUI({ panel: p })}
                        options={[{ id: "presets", label: "Presets" }, ...TABS]}
                      />
                    </div>
                    <div className="min-h-0 flex-1 scroll-quiet overflow-y-auto">
                      {panel === "presets" ? (
                        <div className="h-full pt-2">
                          <PresetsPanel footer={false} />
                        </div>
                      ) : (
                        <TabBody panel={panel} />
                      )}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        )}

        {zen && (
          <button
            type="button"
            onClick={() => setUI({ zen: false })}
            className="fixed top-4 right-4 z-40 flex h-8 items-center gap-1.5 rounded-[10px] plaque pr-3 pl-2 text-[12.5px] font-medium opacity-60 transition-opacity hover:opacity-100"
          >
            <Icon icon={Cancel01Icon} className="size-3.5" />
            Exit focus
          </button>
        )}
      </div>
      <ExportDialog />
      <ShortcutsDialog />
      <Toaster />
    </TipProvider>
  )
}
