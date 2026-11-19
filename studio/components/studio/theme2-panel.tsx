"use client"

import { useRef, useState } from "react"
import {
  Add01Icon,
  ColorPickerIcon,
  Delete02Icon,
  Download04Icon,
  Image01Icon,
  RefreshIcon,
  SparklesIcon,
  Upload04Icon,
  Video01Icon,
  CodeCircleIcon,
  Settings02Icon,
  PlayIcon,
  PauseIcon,
  Copy01Icon,
  FileExportIcon,
} from "@hugeicons/core-free-icons"
import { useStudio } from "@/store/studio"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Icon } from "@/components/ui/icon"
import { SliderField } from "@/components/ui/slider-field"
import { Switch } from "@/components/ui/switch"
import { cn, uid } from "@/lib/utils"
import { playClickSound, playPresetSound, playSliderTickSound } from "@/lib/sound"
import { THEME2_FRAGMENT_SHADER, THEME2_VERTEX_SHADER } from "@/lib/engine/theme2-shader"
import {
  downloadTheme2PNG,
  recordTheme2Video,
} from "@/lib/export/theme2-export"

// All 12 algorithms from GradLab categorized into 4 optgroups
export const THEME2_ALGORITHMS = [
  { group: "Fluid Dynamics (Chaos)", options: [
    { value: "0", label: "Sin/Cos (Classic)" },
    { value: "1", label: "Smooth Noise" },
    { value: "2", label: "Fractal (FBM)" },
    { value: "3", label: "Domain Warp (Marble)" },
    { value: "4", label: "Curl Noise (Vortex)" },
    { value: "5", label: "Polar Vortex (Cosmic)" },
  ]},
  { group: "Structured Mapping (Order)", options: [
    { value: "6", label: "Linear Stratified (Vertical)" },
    { value: "7", label: "Radial Topography (Rings)" },
    { value: "8", label: "Conic Sweep (Angular)" },
  ]},
  { group: "Diffusion Gradient (Organic)", options: [
    { value: "9", label: "Diffusion Fluid (Image)" },
    { value: "10", label: "Diffusion Fluid (Procedural SDF)" },
  ]},
  { group: "SDF Topology", options: [
    { value: "11", label: "Nested SDF Shape (Core Glow)" },
    { value: "12", label: "3D Liquid Depth" },
  ]},
] as const

const GRAIN_BLENDS = [
  { value: "overlay", label: "Overlay" },
  { value: "screen", label: "Screen" },
  { value: "soft-light", label: "Soft Light" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "luminosity", label: "Luminosity" },
]

const DITHER_TYPES = [
  { value: "0", label: "Random" },
  { value: "1", label: "2×2" },
  { value: "2", label: "4×4" },
  { value: "3", label: "8×8" },
]

const DITHER_SHAPES = [
  { value: "0", label: "Square" },
  { value: "1", label: "Circle" },
  { value: "2", label: "Triangle" },
  { value: "3", label: "Cross (+)" },
  { value: "4", label: "Vertical Lines" },
  { value: "5", label: "Horizontal Lines" },
]

const ASCII_MODES = [
  { value: "0", label: "Dynamic Background" },
  { value: "1", label: "Heatmap Decay" },
]

const ASCII_DITHERS = [
  { value: "none", label: "Smooth Wave" },
  { value: "bayer", label: "Bayer (Ordered)" },
  { value: "fs", label: "Floyd-Steinberg" },
  { value: "atkinson", label: "Atkinson" },
]

const ASCII_CHARSETS = [
  { value: "code", label: "Code Snippet" },
  { value: "standard", label: "Standard (@%#*+)" },
  { value: "blocks", label: "Blocks (██▓▒░)" },
  { value: "detailed", label: "Detailed ($@B%8)" },
  { value: "minimal", label: "Minimal (·■)" },
  { value: "binary", label: "Binary (01)" },
  { value: "custom", label: "Custom Text" },
]

const ASCII_BLENDS = [
  { value: "source-over", label: "Normal" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "lighter", label: "Lighter" },
]

const COLOR_SPACES = [
  { id: "oklab", value: 2, label: "OKLAB" },
  { id: "oklch", value: 1, label: "OKLCH" },
  { id: "rgb", value: 0, label: "RGB" },
]

const THEME2_CURATED_PALETTES = [
  { name: "Theme 2 Default", colors: ["#FFFFFF", "#DCB8FF", "#295EFF", "#FF666E"] },
  { name: "After Hours", colors: ["#1B1035", "#FF2A85", "#00F0FF", "#DCB8FF"] },
  { name: "Deep Matrix", colors: ["#020804", "#00FF66", "#1A3300", "#CCFF00"] },
  { name: "Tokyo Neon", colors: ["#080410", "#FF007A", "#7928CA", "#00F5D4"] },
  { name: "Ultraviolet", colors: ["#0A0017", "#9D4EDD", "#00B4D8", "#E0AAFF"] },
  { name: "Solar Flare", colors: ["#160424", "#FF5E7E", "#FFAA00", "#00D2FF"] },
]

export function Theme2Panel() {
  const theme2 = useStudio((s) => s.theme2)
  const setTheme2 = useStudio((s) => s.setTheme2)
  const doc = useStudio((s) => s.doc)
  const set = useStudio((s) => s.set)
  const setSize = useStudio((s) => s.setSize)
  const setUI = useStudio((s) => s.setUI)
  const playing = useStudio((s) => s.playing)
  const togglePlay = useStudio((s) => s.togglePlay)

  const [matrixAdvancedOpen, setMatrixAdvancedOpen] = useState<boolean>(false)
  const [customText, setCustomText] = useState<string>("Matrix")
  const [exportScale, setExportScale] = useState<string>("1")
  const [loopPingpong, setLoopPingpong] = useState<boolean>(true)

  const imgInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)

  const ascii = doc.ascii ?? {
    enabled: true,
    mode: "heatmap",
    charset: "code",
    size: 22,
    radius: 140,
    decay: 0.94,
    color: "#ffffff",
  }

  // Handle Algorithm Select
  const handleAlgorithmChange = (val: string) => {
    playClickSound()
    const flowType = parseInt(val)
    setTheme2({ flowType })
  }

  // Handle Background Texture Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    playClickSound()
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      if (src) {
        setTheme2({ hasBgTexture: true, bgTextureUrl: src })
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Palette Image Upload
  const handlePaletteImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    playClickSound()
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (ev) => {
      img.src = ev.target?.result as string
      img.onload = () => {
        const c = document.createElement("canvas")
        c.width = 100
        c.height = 100
        const ctx = c.getContext("2d")
        if (!ctx) return
        ctx.drawImage(img, 0, 0, 100, 100)
        const d1 = ctx.getImageData(20, 20, 1, 1).data
        const d2 = ctx.getImageData(50, 50, 1, 1).data
        const d3 = ctx.getImageData(80, 80, 1, 1).data
        const d4 = ctx.getImageData(90, 30, 1, 1).data
        const toHex = (r: number, g: number, b: number) =>
          "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
        const extracted = [
          toHex(d1[0], d1[1], d1[2]),
          toHex(d2[0], d2[1], d2[2]),
          toHex(d3[0], d3[1], d3[2]),
          toHex(d4[0], d4[1], d4[2]),
        ]
        setTheme2({ colors: extracted })
      }
    }
    reader.readAsDataURL(file)
  }

  // Shuffle Colors
  const handleShuffleColors = () => {
    playClickSound()
    const current = [...theme2.colors]
    for (let i = current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tempHex = current[i]
      current[i] = current[j]
      current[j] = tempHex
    }
    setTheme2({ colors: current })
  }

  // Random Colors
  const handleRandomColors = () => {
    playPresetSound()
    const randomHex = () =>
      "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
    const updated = theme2.colors.map(() => randomHex())
    setTheme2({ colors: updated })
  }

  // Add Color Stop
  const handleAddColor = () => {
    if (theme2.colors.length >= 8) return
    playClickSound()
    const last = theme2.colors[theme2.colors.length - 1] ?? "#00F0FF"
    setTheme2({ colors: [...theme2.colors, last] })
  }

  // Remove Color Stop
  const handleRemoveColor = (idx: number) => {
    if (theme2.colors.length <= 2) return
    playClickSound()
    const updated = theme2.colors.filter((_, i) => i !== idx)
    setTheme2({ colors: updated })
  }

  // Update specific color
  const handleUpdateColor = (idx: number, hex: string) => {
    const updated = [...theme2.colors]
    updated[idx] = hex
    setTheme2({ colors: updated })
  }

  // Export Standalone HTML Code
  const handleExportCode = () => {
    playClickSound()
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ARS-BG PRO · Theme 2 Procedural Matrix Export</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  canvas { display: block; width: 100%; height: 100%; }
  .noise-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-size: 128px 128px; pointer-events: none; z-index: 10;
    mix-blend-mode: ${theme2.grainBlend}; opacity: ${(theme2.grain / 100) * 0.6};
  }
</style>
</head>
<body>
<div style="position:relative; width:100%; height:100%;">
  <canvas id="glCanvas"></canvas>
  <div class="noise-overlay" id="noiseOverlay"></div>
</div>
<script id="vertex-shader" type="x-shader/x-vertex">
${THEME2_VERTEX_SHADER}
</script>
<script id="fragment-shader" type="x-shader/x-fragment">
${THEME2_FRAGMENT_SHADER}
</script>
<script>
(function() {
  const COLORS = ${JSON.stringify(theme2.colors)};
  const FLOW_TYPE = ${theme2.flowType};
  const ZOOM = ${theme2.zoom} * 0.028 + 0.2;
  const FLOW_SPEED = ${theme2.speed} * 0.02;
  const LIQUID_STR = ${theme2.liquid} * 0.02;
  const MORPH = ${(theme2.morph / 100.0) * 3.0};
  const ROTATION = ${theme2.rotation * (Math.PI / 180.0)};
  const ART_ENABLE = ${theme2.artEnable ? 1 : 0};
  const ART_TYPE = ${theme2.artType};
  const ART_SIZE = ${theme2.artSize};
  const ART_SHAPE = ${theme2.artShape};
  const ART_CONTRAST = ${theme2.artContrast};

  const canvas = document.getElementById('glCanvas');
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  function createShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, document.getElementById('vertex-shader').textContent));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, document.getElementById('fragment-shader').textContent));
  gl.linkProgram(program); gl.useProgram(program);

  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'position');
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(pos);

  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));

  const loc = (n) => gl.getUniformLocation(program, n);
  function resize() {
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize); resize();

  function render(time) {
    time *= 0.001;
    gl.uniform2f(loc('u_resolution'), canvas.width, canvas.height);
    gl.uniform1f(loc('u_ref_height'), canvas.height);
    gl.uniform1f(loc('u_time'), time);
    gl.uniform1i(loc('u_colorCount'), COLORS.length);
    const cd = new Float32Array(8 * 3);
    COLORS.forEach((hex, i) => {
      cd[i*3]   = parseInt(hex.slice(1,3),16)/255;
      cd[i*3+1] = parseInt(hex.slice(3,5),16)/255;
      cd[i*3+2] = parseInt(hex.slice(5,7),16)/255;
    });
    gl.uniform3fv(loc('u_colors'), cd);
    gl.uniform1f(loc('u_flow_type'), FLOW_TYPE);
    gl.uniform1f(loc('u_zoom'), ZOOM);
    gl.uniform2f(loc('u_pan'), ${theme2.panX}, ${theme2.panY});
    gl.uniform1f(loc('u_flow_speed'), FLOW_SPEED);
    gl.uniform1f(loc('u_liquid_str'), LIQUID_STR);
    gl.uniform1f(loc('u_morph'), MORPH);
    gl.uniform1f(loc('u_rotation'), ROTATION);
    gl.uniform1i(loc('u_enable_art'), ART_ENABLE);
    gl.uniform1f(loc('u_art_type'), ART_TYPE);
    gl.uniform1f(loc('u_art_size'), ART_SIZE);
    gl.uniform1f(loc('u_art_shape'), ART_SHAPE);
    gl.uniform1f(loc('u_art_contrast'), ART_CONTRAST);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc('u_bg_texture'), 0);
    gl.uniform1i(loc('u_has_bg_texture'), 0);
    gl.uniform1i(loc('u_color_mode'), ${theme2.colorMode});
    gl.uniform1f(loc('u_blend_bias'), ${theme2.blendBias / 100});
    gl.uniform1f(loc('u_blend_sharp'), ${theme2.blendSharp / 100});
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
</script>
</body>
</html>`

    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ars-bg-theme2-algorithm-${theme2.flowType}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-y-auto overflow-x-hidden rounded-[20px] border border-hairline bg-surface/95 backdrop-blur-md p-4 space-y-4 scroll-quiet select-none box-border shadow-card">
      {/* Title & Reset Row */}
      <div className="w-full min-w-0 flex items-center justify-between border-b border-hairline pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent font-mono text-sm font-bold">
            👾
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink truncate flex items-center gap-1.5">
              Theme 2 Matrix Engine
              <span className="rounded bg-accent/20 px-1 py-0.2 text-[9px] font-mono font-bold text-accent uppercase shrink-0">
                Active
              </span>
            </h2>
            <p className="text-[11px] text-ink-muted truncate">Pure Procedural GPU Shader Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              playClickSound()
              togglePlay()
            }}
            className={cn("text-xs h-7 px-2", playing ? "text-accent" : "text-ink-muted")}
            title={playing ? "Pause animation" : "Play animation"}
          >
            <Icon icon={playing ? PauseIcon : PlayIcon} className="size-3.5 mr-1" />
            {playing ? "Playing" : "Paused"}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              playPresetSound()
              setTheme2({
                colors: ["#FFFFFF", "#DCB8FF", "#295EFF", "#FF666E"],
                flowType: 7,
                zoom: 52,
                speed: 70,
                liquid: 100,
                morph: 12,
                rotation: 194,
                grain: 25,
                grainBlend: "screen",
                colorMode: 2,
                blendBias: 87,
                blendSharp: 0,
                artEnable: false,
                artType: 3,
                artSize: 12,
                artShape: 0,
                artContrast: 20,
                artDotColor: "#295EFF",
                artBgColor: "#050508",
                artBgMode: 0,
                panX: 0.548,
                panY: 0.468,
              })
            }}
            className="text-xs text-accent shrink-0"
          >
            <Icon icon={RefreshIcon} className="size-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* SECTION 1: CANVAS SIZE */}
      <div className="w-full min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-accent">●</span> Canvas Size
          </span>
          <span className="text-[10px] text-ink-muted font-mono">Min 100px</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center rounded-lg border border-hairline bg-surface px-2.5 py-1.5">
            <span className="text-[11px] font-mono font-bold text-ink-muted mr-2">W</span>
            <input
              type="number"
              min={100}
              max={3840}
              value={doc.size.w}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 640
                setSize(val, doc.size.h)
              }}
              className="w-full bg-transparent font-mono text-xs text-ink focus:outline-none"
            />
          </div>
          <div className="flex items-center rounded-lg border border-hairline bg-surface px-2.5 py-1.5">
            <span className="text-[11px] font-mono font-bold text-ink-muted mr-2">H</span>
            <input
              type="number"
              min={100}
              max={2160}
              value={doc.size.h}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 360
                setSize(doc.size.w, val)
              }}
              className="w-full bg-transparent font-mono text-xs text-ink focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Size Presets */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {[
            { label: "16:9", w: 640, h: 360 },
            { label: "1:1", w: 480, h: 480 },
            { label: "9:16", w: 360, h: 640 },
            { label: "4K", w: 3840, h: 2160 },
          ].map((sz) => {
            const on = doc.size.w === sz.w && doc.size.h === sz.h
            return (
              <button
                key={sz.label}
                type="button"
                onClick={() => {
                  playClickSound()
                  setSize(sz.w, sz.h)
                }}
                className={cn(
                  "rounded-md border py-1 text-center font-mono text-[10.5px] transition-colors cursor-pointer",
                  on
                    ? "border-accent bg-accent/20 text-accent font-bold"
                    : "border-hairline bg-surface text-ink-secondary hover:text-ink hover:border-ink/20"
                )}
              >
                {sz.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-hairline" />

      {/* SECTION 2: PALETTE & COLOR SPACE (At the Top as Requested) */}
      <div className="w-full min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-accent">●</span> Palette &amp; Color Space
          </span>
          <div className="flex rounded-md border border-hairline p-0.5 bg-surface text-[10px]">
            {COLOR_SPACES.map((cs) => (
              <button
                key={cs.id}
                type="button"
                onClick={() => {
                  playClickSound()
                  setTheme2({ colorMode: cs.value })
                }}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-colors cursor-pointer",
                  theme2.colorMode === cs.value
                    ? "bg-accent/20 text-accent font-semibold"
                    : "text-ink-secondary hover:text-ink"
                )}
              >
                {cs.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Image Dropzone */}
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePaletteImageUpload}
        />
        <button
          type="button"
          onClick={() => {
            playClickSound()
            imgInputRef.current?.click()
          }}
          className="w-full flex items-center gap-3 rounded-xl border border-dashed border-hairline bg-surface-muted/30 p-2.5 text-left hover:border-accent/40 hover:bg-surface-muted/50 transition-all cursor-pointer group"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-hairline text-ink-muted group-hover:text-accent">
            <Icon icon={Image01Icon} className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-ink group-hover:text-accent">Upload Image / Extract Colors</div>
            <div className="text-[10px] text-ink-muted truncate">Extract palette or restore saved settings</div>
          </div>
        </button>

        {/* Color Stops List */}
        <div className="space-y-1.5 rounded-xl border border-hairline bg-surface-muted/40 p-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-semibold text-ink-secondary">Theme Color Stops ({theme2.colors.length}/8)</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Shuffle color order"
                onClick={handleShuffleColors}
                className="rounded p-1 text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              >
                <Icon icon={SparklesIcon} className="size-3.5" />
              </button>
              <button
                type="button"
                title="Random colors"
                onClick={handleRandomColors}
                className="rounded p-1 text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              >
                <Icon icon={RefreshIcon} className="size-3.5" />
              </button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleAddColor}
                disabled={theme2.colors.length >= 8}
                className="text-[11px] text-accent h-6 px-1.5 ml-1"
              >
                <Icon icon={Add01Icon} className="size-3 mr-1" />
                Add Color
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto scroll-quiet pr-1">
            {theme2.colors.map((hex, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg bg-surface border border-hairline px-2.5 py-1">
                <ColorPicker
                  value={hex}
                  onChange={(newHex) => handleUpdateColor(idx, newHex)}
                />
                <input
                  type="text"
                  value={hex.toUpperCase()}
                  maxLength={7}
                  onChange={(e) => {
                    let val = e.target.value.trim()
                    if (!val.startsWith("#")) val = "#" + val
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      handleUpdateColor(idx, val)
                    }
                  }}
                  className="w-20 font-mono text-xs text-ink bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-ink-muted ml-auto font-mono">#{idx + 1}</span>
                {theme2.colors.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(idx)}
                    className="text-ink-muted hover:text-red-400 transition-colors p-0.5 cursor-pointer ml-1"
                  >
                    <Icon icon={Delete02Icon} className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Curated Theme 2 Swatches */}
          <div className="pt-2">
            <span className="text-[10px] font-medium text-ink-muted block pb-1.5">Curated Color Sets</span>
            <div className="grid grid-cols-3 gap-1.5">
              {THEME2_CURATED_PALETTES.map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => {
                    playPresetSound()
                    setTheme2({ colors: pal.colors })
                  }}
                  className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface p-1.5 text-left hover:border-accent/40 transition-all cursor-pointer group"
                >
                  <div className="flex h-3.5 w-full rounded overflow-hidden">
                    {pal.colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-ink-secondary truncate group-hover:text-accent">
                    {pal.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Blend Bias & Sharpness */}
          <div className="pt-2 space-y-2 border-t border-hairline">
            <SliderField
              label="Blend Bias"
              value={theme2.blendBias}
              min={1}
              max={100}
              step={1}
              unit="%"
              onChange={(val) => {
                playSliderTickSound(val / 100)
                setTheme2({ blendBias: val })
              }}
            />
            <SliderField
              label="Blend Sharpness"
              value={theme2.blendSharp}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val) => {
                playSliderTickSound(val / 100)
                setTheme2({ blendSharp: val })
              }}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-hairline" />

      {/* SECTION 3: SHAPE & FLOW (All 12 Algorithms as Exact Dropdown) */}
      <div className="w-full min-w-0 space-y-3">
        <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-accent">●</span> Shape &amp; Flow
        </span>

        {/* Algorithm Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-ink-secondary">Algorithm</label>
          <select
            value={String(theme2.flowType)}
            onChange={(e) => handleAlgorithmChange(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
          >
            {THEME2_ALGORITHMS.map((grp) => (
              <optgroup key={grp.group} label={grp.group}>
                {grp.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Upload Background Dropzone */}
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBgUpload}
        />
        <button
          type="button"
          onClick={() => {
            playClickSound()
            bgInputRef.current?.click()
          }}
          className="w-full flex items-center gap-3 rounded-xl border border-dashed border-hairline bg-surface-muted/30 p-2.5 text-left hover:border-accent/40 hover:bg-surface-muted/50 transition-all cursor-pointer group"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-hairline text-ink-muted group-hover:text-accent">
            <Icon icon={Upload04Icon} className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-ink group-hover:text-accent">Upload Background</div>
            <div className="text-[10px] text-ink-muted truncate">Diffuse custom image into the procedural gradient</div>
          </div>
        </button>

        {/* Flow Sliders */}
        <div className="space-y-2.5 rounded-xl border border-hairline bg-surface-muted/40 p-3">
          <SliderField
            label="Zoom Scale"
            value={theme2.zoom}
            min={10}
            max={100}
            step={1}
            onChange={(val) => {
              playSliderTickSound(val / 100)
              setTheme2({ zoom: val })
            }}
          />
          <SliderField
            label="Flow Speed"
            value={theme2.speed}
            min={0}
            max={100}
            step={1}
            onChange={(val) => {
              playSliderTickSound(val / 100)
              setTheme2({ speed: val })
            }}
          />
          <SliderField
            label="Liquefy Distort"
            value={theme2.liquid}
            min={0}
            max={100}
            step={1}
            onChange={(val) => {
              playSliderTickSound(val / 100)
              setTheme2({ liquid: val })
            }}
          />
          <SliderField
            label="Shape Morph"
            value={theme2.morph}
            min={0}
            max={100}
            step={1}
            onChange={(val) => {
              playSliderTickSound(val / 100)
              setTheme2({ morph: val })
            }}
          />
          <SliderField
            label="Rotation Angle"
            value={theme2.rotation}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(val) => {
              playSliderTickSound(val / 360)
              setTheme2({ rotation: val })
            }}
          />
        </div>
      </div>

      <div className="h-px bg-hairline" />

      {/* SECTION 4: POST-PROCESSING */}
      <div className="w-full min-w-0 space-y-3">
        <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-accent">●</span> Post-Processing
        </span>

        <div className="space-y-2.5 rounded-xl border border-hairline bg-surface-muted/40 p-3">
          <SliderField
            label="Pixel Grain"
            value={theme2.grain}
            min={0}
            max={100}
            step={1}
            onChange={(val) => {
              playSliderTickSound(val / 100)
              setTheme2({ grain: val })
            }}
          />

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-ink-secondary">Grain Blend</label>
            <select
              value={theme2.grainBlend}
              onChange={(e) => {
                playClickSound()
                setTheme2({ grainBlend: e.target.value })
              }}
              className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
            >
              {GRAIN_BLENDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="h-px bg-hairline" />

      {/* SECTION 5: HALFTONE EFFECT (Exact Selects) */}
      <div className="w-full min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-accent">●</span> Halftone Effect
          </span>
          <Switch
            label="Halftone Effect"
            checked={theme2.artEnable}
            onChange={(checked) => {
              playClickSound()
              setTheme2({ artEnable: checked })
            }}
          />
        </div>

        {theme2.artEnable && (
          <div className="space-y-3 rounded-xl border border-hairline bg-surface-muted/40 p-3">
            {/* Dither Type Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-ink-secondary">Dither Type</label>
              <select
                value={String(theme2.artType)}
                onChange={(e) => {
                  playClickSound()
                  setTheme2({ artType: parseInt(e.target.value) })
                }}
                className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
              >
                {DITHER_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <SliderField
              label="Dither Size"
              value={theme2.artSize}
              min={1}
              max={100}
              step={0.5}
              unit="px"
              onChange={(val) => {
                playSliderTickSound(val / 100)
                setTheme2({ artSize: val })
              }}
            />

            {/* Dot / Shape Color */}
            <div className="flex items-center justify-between rounded-lg bg-surface border border-hairline px-3 py-1.5">
              <span className="text-[11px] font-medium text-ink-secondary">Dot / Shape Color</span>
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={theme2.artDotColor || "#295EFF"}
                  onChange={(hex) => setTheme2({ artDotColor: hex })}
                />
                <span className="font-mono text-xs uppercase text-ink">{theme2.artDotColor || "#295EFF"}</span>
              </div>
            </div>

            {/* Background Mode & Color */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-ink-secondary">Background Mode</label>
                <div className="flex rounded-md border border-hairline p-0.5 bg-surface text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTheme2({ artBgMode: 0 })}
                    className={cn(
                      "px-2 py-0.5 rounded font-medium transition-colors cursor-pointer",
                      (theme2.artBgMode ?? 0) === 0
                        ? "bg-accent/20 text-accent font-semibold"
                        : "text-ink-secondary hover:text-ink"
                    )}
                  >
                    Flowing Gradient
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme2({ artBgMode: 1 })}
                    className={cn(
                      "px-2 py-0.5 rounded font-medium transition-colors cursor-pointer",
                      theme2.artBgMode === 1
                        ? "bg-accent/20 text-accent font-semibold"
                        : "text-ink-secondary hover:text-ink"
                    )}
                  >
                    Solid Color
                  </button>
                </div>
              </div>

              {theme2.artBgMode === 1 && (
                <div className="flex items-center justify-between rounded-lg bg-surface border border-hairline px-3 py-1.5">
                  <span className="text-[11px] font-medium text-ink-secondary">Background Color</span>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      value={theme2.artBgColor || "#050508"}
                      onChange={(hex) => setTheme2({ artBgColor: hex })}
                    />
                    <span className="font-mono text-xs uppercase text-ink">{theme2.artBgColor || "#050508"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Dither Shape Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-ink-secondary">Dither Shape</label>
              <select
                value={String(theme2.artShape)}
                onChange={(e) => {
                  playClickSound()
                  setTheme2({ artShape: parseInt(e.target.value) })
                }}
                className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
              >
                {DITHER_SHAPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <SliderField
              label="Dither Contrast"
              value={theme2.artContrast}
              min={0}
              max={100}
              step={1}
              onChange={(val) => {
                playSliderTickSound(val / 100)
                setTheme2({ artContrast: val })
              }}
            />
          </div>
        )}
      </div>

      <div className="h-px bg-hairline" />

      {/* SECTION 6: INTERACTIVE MATRIX (Exact Selects + Collapsible Advanced) */}
      <div className="w-full min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-accent">●</span> Interactive Matrix
          </span>
          <Switch
            label="Interactive Matrix"
            checked={Boolean(ascii.enabled)}
            onChange={(checked) => {
              playClickSound()
              set({ ascii: { ...ascii, enabled: checked } })
            }}
          />
        </div>

        {ascii.enabled && (
          <div className="space-y-3 rounded-xl border border-hairline bg-surface-muted/40 p-3">
            {/* Mode Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-ink-secondary">Mode</label>
              <select
                value={ascii.mode === "dynamic" ? "0" : "1"}
                onChange={(e) => {
                  playClickSound()
                  set({ ascii: { ...ascii, mode: e.target.value === "0" ? "dynamic" : "heatmap" } })
                }}
                className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
              >
                {ASCII_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dither Algorithm Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-ink-secondary">Dither Algorithm</label>
              <select
                defaultValue="none"
                onChange={() => playClickSound()}
                className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
              >
                {ASCII_DITHERS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Character Set Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-ink-secondary">Character Set</label>
              <select
                value={ascii.charset}
                onChange={(e) => {
                  playClickSound()
                  set({ ascii: { ...ascii, charset: e.target.value as any } })
                }}
                className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
              >
                {ASCII_CHARSETS.map((cs) => (
                  <option key={cs.value} value={cs.value}>
                    {cs.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Text input if charset === custom */}
            {ascii.charset === "custom" && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-ink-secondary">Custom Text Stream</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value)
                    set({ ascii: { ...ascii, customText: e.target.value } })
                  }}
                  className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
                  placeholder="Enter characters…"
                />
              </div>
            )}

            {/* Collapsible Advanced Matrix Settings */}
            <div className="pt-1 border-t border-hairline">
              <button
                type="button"
                onClick={() => {
                  playClickSound()
                  setMatrixAdvancedOpen(!matrixAdvancedOpen)
                }}
                className="w-full flex items-center justify-between py-1 text-xs font-medium text-ink-secondary hover:text-ink cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Icon icon={Settings02Icon} className="size-3.5" />
                  Advanced Matrix Settings
                </span>
                <span className={cn("text-xs transition-transform duration-200", matrixAdvancedOpen && "rotate-90")}>
                  ▸
                </span>
              </button>

              {matrixAdvancedOpen && (
                <div className="space-y-2.5 pt-2">
                  <SliderField
                    label="Grid Size"
                    value={ascii.size}
                    min={10}
                    max={60}
                    step={1}
                    unit="px"
                    onChange={(val) => {
                      playSliderTickSound(val / 60)
                      set({ ascii: { ...ascii, size: val } })
                    }}
                  />
                  <SliderField
                    label="Char Size"
                    value={Math.round(ascii.size * 0.65)}
                    min={5}
                    max={60}
                    step={1}
                    unit="px"
                    onChange={(val) => {
                      playSliderTickSound(val / 60)
                    }}
                  />
                  <SliderField
                    label="Char Spacing"
                    value={1.0}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    onChange={(val) => {
                      playSliderTickSound(val / 2.0)
                    }}
                  />

                  {/* Base Color Pill */}
                  <div className="flex items-center justify-between rounded-lg bg-surface border border-hairline px-3 py-1.5">
                    <span className="text-[11px] font-medium text-ink-secondary">Base Color</span>
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        value={ascii.color}
                        onChange={(hex) => set({ ascii: { ...ascii, color: hex } })}
                      />
                      <span className="font-mono text-xs uppercase text-ink">{ascii.color}</span>
                    </div>
                  </div>

                  {/* Blend Mode Select */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-ink-secondary">Blend Mode</label>
                    <select
                      defaultValue="overlay"
                      onChange={() => playClickSound()}
                      className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none cursor-pointer"
                    >
                      {ASCII_BLENDS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <SliderField
                    label="Field Radius"
                    value={ascii.radius}
                    min={50}
                    max={500}
                    step={5}
                    unit="px"
                    onChange={(val) => {
                      playSliderTickSound(val / 500)
                      set({ ascii: { ...ascii, radius: val } })
                    }}
                  />
                  <SliderField
                    label="Pointer Smooth"
                    value={50}
                    min={0}
                    max={99}
                    step={1}
                    onChange={(val) => {
                      playSliderTickSound(val / 99)
                    }}
                  />
                  <SliderField
                    label="Thermal Decay"
                    value={Math.round(ascii.decay * 100)}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(val) => {
                      playSliderTickSound(val / 100)
                      set({ ascii: { ...ascii, decay: val / 100 } })
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-hairline" />

      {/* SECTION 7: EXPORT ACTIONS */}
      <div className="w-full min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-ink uppercase tracking-wider">Export Scale</label>
          <select
            value={exportScale}
            onChange={(e) => {
              playClickSound()
              setExportScale(e.target.value)
            }}
            className="rounded-md border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink focus:border-accent focus:outline-none cursor-pointer"
          >
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="3">3×</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={async () => {
            playPresetSound()
            await downloadTheme2PNG(Number(exportScale))
          }}
          className="w-full h-9 text-xs font-semibold shadow-sm"
        >
          <Icon icon={Download04Icon} className="size-4 mr-1.5" />
          Download PNG
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              playClickSound()
              await recordTheme2Video(6, 30)
            }}
            className="w-full h-8 text-xs font-medium"
            title="Record 6s animated MP4 loop"
          >
            <Icon icon={Video01Icon} className="size-3.5 mr-1" />
            Record MP4
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCode}
            className="w-full h-8 text-xs font-medium"
            title="Export standalone HTML/GLSL file"
          >
            <Icon icon={CodeCircleIcon} className="size-3.5 mr-1" />
            Export Code
          </Button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-ink-muted">Loop (Pingpong)</span>
          <Switch
            label="Loop Pingpong"
            checked={loopPingpong}
            onChange={(checked) => {
              playClickSound()
              setLoopPingpong(checked)
            }}
          />
        </div>
      </div>

      {/* Live Navigation Guidance */}
      <div className="rounded-xl border border-hairline bg-surface-muted/30 p-2.5 space-y-1">
        <div className="text-xs font-semibold text-ink">Live Canvas Navigation</div>
        <p className="text-[11px] text-ink-muted leading-relaxed">
          • <strong>Hold &amp; Drag:</strong> Click anywhere on canvas to pan viewport.<br />
          • <strong>Mouse Wheel:</strong> Smooth zoom in/out with live coordinate HUD.
        </p>
      </div>
    </div>
  )
}
