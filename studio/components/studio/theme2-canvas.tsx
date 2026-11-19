"use client"

import { useEffect, useRef, useState } from "react"
import { useStudio } from "@/store/studio"
import { AsciiCanvas } from "./ascii-canvas"
import { THEME2_FRAGMENT_SHADER, THEME2_VERTEX_SHADER } from "@/lib/engine/theme2-shader"
import { clamp, cn } from "@/lib/utils"

export function Theme2Canvas({ width, height }: { width: number; height: number }) {
  const theme2 = useStudio((s) => s.theme2)
  const setTheme2 = useStudio((s) => s.setTheme2)
  const doc = useStudio((s) => s.doc)
  const playing = useStudio((s) => s.playing)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const [panning, setPanning] = useState(false)
  const [noiseUrl, setNoiseUrl] = useState<string>("")

  // Generate procedural noise pattern for film grain overlay
  useEffect(() => {
    if (typeof window === "undefined") return
    const nc = document.createElement("canvas")
    nc.width = 128
    nc.height = 128
    const nctx = nc.getContext("2d")
    if (!nctx) return
    const img = nctx.createImageData(128, 128)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    nctx.putImageData(img, 0, 0)
    setNoiseUrl(`url(${nc.toDataURL()})`)
  }, [])

  // WebGL Pipeline Shader Execution
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext("webgl", { preserveDrawingBuffer: true, powerPreference: "high-performance" }) ||
      (canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true }) as WebGLRenderingContext | null)

    if (!gl) {
      console.error("WebGL not supported for Theme 2")
      return
    }

    function createShader(type: number, src: string) {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, src)
      gl!.compileShader(s)
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl!.getShaderInfoLog(s))
      }
      return s
    }

    const vs = createShader(gl.VERTEX_SHADER, THEME2_VERTEX_SHADER)
    const fs = createShader(gl.FRAGMENT_SHADER, THEME2_FRAGMENT_SHADER)
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Fullscreen quad buffer
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const pos = gl.getAttribLocation(program, "position")
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pos)

    // Background texture
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255])
    )

    const loc = (n: string) => gl.getUniformLocation(program, n)

    let raf = 0
    let lastTime = performance.now()
    let accumTime = 0

    const render = (now: number) => {
      raf = requestAnimationFrame(render)

      const state = useStudio.getState()
      const t2 = state.theme2
      const isPlay = state.playing

      const dt = Math.min(0.1, (now - lastTime) / 1000)
      lastTime = now

      if (isPlay) {
        accumTime += dt
      }

      const dpr = Math.max(1.5, Math.min(window.devicePixelRatio || 1, 2.5))
      const targetW = Math.round(canvas.clientWidth * dpr)
      const targetH = Math.round(canvas.clientHeight * dpr)

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
      }

      gl.viewport(0, 0, canvas.width, canvas.height)

      gl.uniform2f(loc("u_resolution"), canvas.width, canvas.height)
      gl.uniform1f(loc("u_ref_height"), canvas.height)
      gl.uniform1f(loc("u_time"), accumTime)
      gl.uniform1i(loc("u_colorCount"), t2.colors.length)

      // Convert colors to Float32Array RGB (0..1)
      const cd = new Float32Array(8 * 3)
      t2.colors.slice(0, 8).forEach((hex, i) => {
        const clean = hex.replace("#", "")
        cd[i * 3] = parseInt(clean.slice(0, 2), 16) / 255
        cd[i * 3 + 1] = parseInt(clean.slice(2, 4), 16) / 255
        cd[i * 3 + 2] = parseInt(clean.slice(4, 6), 16) / 255
      })
      gl.uniform3fv(loc("u_colors"), cd)

      gl.uniform1f(loc("u_flow_type"), t2.flowType)
      gl.uniform1f(loc("u_zoom"), t2.zoom * 0.028 + 0.2)
      gl.uniform2f(loc("u_pan"), t2.panX, t2.panY)
      gl.uniform1f(loc("u_flow_speed"), t2.speed * 0.02)
      gl.uniform1f(loc("u_liquid_str"), t2.liquid * 0.02)
      gl.uniform1f(loc("u_morph"), (t2.morph / 100.0) * 3.0)
      gl.uniform1f(loc("u_rotation"), t2.rotation * (Math.PI / 180.0))

      gl.uniform1i(loc("u_enable_art"), t2.artEnable ? 1 : 0)
      gl.uniform1f(loc("u_art_type"), t2.artType)
      gl.uniform1f(loc("u_art_size"), t2.artSize)
      gl.uniform1f(loc("u_art_shape"), t2.artShape)
      gl.uniform1f(loc("u_art_contrast"), t2.artContrast)

      const parseHex = (hex: string) => {
        const clean = (hex || "#000000").replace("#", "")
        return [
          (parseInt(clean.slice(0, 2), 16) || 0) / 255,
          (parseInt(clean.slice(2, 4), 16) || 0) / 255,
          (parseInt(clean.slice(4, 6), 16) || 0) / 255,
        ]
      }
      const dotCol = parseHex(t2.artDotColor || "#295EFF")
      const bgCol = parseHex(t2.artBgColor || "#050508")
      gl.uniform3f(loc("u_art_dot_color"), dotCol[0], dotCol[1], dotCol[2])
      gl.uniform3f(loc("u_art_bg_color"), bgCol[0], bgCol[1], bgCol[2])
      gl.uniform1i(loc("u_art_bg_mode"), t2.artBgMode ?? 0)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(loc("u_bg_texture"), 0)
      gl.uniform1i(loc("u_has_bg_texture"), t2.hasBgTexture ? 1 : 0)
      gl.uniform1i(loc("u_color_mode"), t2.colorMode)
      gl.uniform1f(loc("u_blend_bias"), t2.blendBias / 100.0)
      gl.uniform1f(loc("u_blend_sharp"), t2.blendSharp / 100.0)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [])

  // Canvas Mouse Drag Panning
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    setPanning(true)
    const el = e.currentTarget as HTMLElement
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}

    const startX = e.clientX
    const startY = e.clientY
    const startPanX = theme2.panX
    const startPanY = theme2.panY

    const onPointerMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const aspect = rect.width / rect.height
      const dx = (ev.clientX - startX) / rect.width
      const dy = (ev.clientY - startY) / rect.height
      // Match GradLab pan math: dx * aspect, dy
      const nextX = startPanX - dx * aspect * 1.5
      const nextY = startPanY + dy * 1.5
      setTheme2({ panX: nextX, panY: nextY })
    }

    const onPointerUp = () => {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {}
      setPanning(false)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }

  // Smooth Mouse Wheel Zooming
  useEffect(() => {
    const el = artRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY < 0 ? 3 : -3
      const current = useStudio.getState().theme2.zoom
      const next = clamp(current + delta, 5, 100)
      useStudio.getState().setTheme2({ zoom: next })
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <div
      ref={artRef}
      onPointerDown={onPointerDown}
      className="relative isolate size-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
      style={{ borderRadius: "inherit" }}
    >
      {/* WebGL Procedural Shader Canvas */}
      <canvas
        ref={canvasRef}
        id="theme2-canvas"
        className="absolute inset-0 block size-full"
      />

      {/* ASCII Matrix Overlay */}
      <AsciiCanvas
        width={width}
        height={height}
        config={doc.ascii}
        artRef={artRef}
      />

      {/* Film Grain Texture Overlay */}
      {theme2.grain > 0 && noiseUrl && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage: noiseUrl,
            backgroundSize: "128px 128px",
            mixBlendMode: theme2.grainBlend as any,
            opacity: (theme2.grain / 100) * 0.6,
          }}
        />
      )}

      {/* Live Pan Coordinates HUD */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-3 left-3 z-30 rounded-md bg-black/85 px-2.5 py-1 font-mono text-[11px] text-white/95 backdrop-blur-md border border-white/10 shadow-lg transition-opacity duration-300",
          panning || Math.abs(theme2.panX) > 0.01 || Math.abs(theme2.panY) > 0.01 ? "opacity-100" : "opacity-0"
        )}
      >
        X {theme2.panX.toFixed(3)} &nbsp; Y {theme2.panY.toFixed(3)}
      </div>
    </div>
  )
}
